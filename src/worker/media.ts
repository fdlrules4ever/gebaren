/**
 * Video and poster proxy for fixed source hosts.
 *
 * Signbank ignores byte ranges, and iOS Safari needs them to play video. So we fetch the whole (small) file once,
 * keep it in Cloudflare's edge cache (no storage quota), and answer Range requests with 206 ourselves.
 * The upstream URL is always built from a fixed host plus a path from our own index or a numeric id, never from user text.
 */
import { parseRange } from './range.ts';
import { BASE_HEADERS, plain } from './http.ts';

const MAX_BYTES = 25 * 1024 * 1024;
const BROWSER_TTL = 7 * 24 * 3600;
const EDGE_TTL = 30 * 24 * 3600;

export interface MediaSource {
  /** Stable cache key path on our own domain, e.g. /video/sb/1954.mp4 */
  cachePath: string;
  upstream: string;
  /** Content type we serve (upstream types like video/x-m4v are not played by every browser). */
  type: 'video/mp4' | 'image/png' | 'image/jpeg';
  etag: string;
}

function headersFor(src: MediaSource, size: number): Headers {
  return new Headers({
    ...BASE_HEADERS,
    'content-type': src.type,
    'content-length': String(size),
    'accept-ranges': 'bytes',
    'cache-control': `public, max-age=${BROWSER_TTL}, s-maxage=${EDGE_TTL}`,
    etag: src.etag,
  });
}

function slice(full: ArrayBuffer, src: MediaSource, request: Request): Response {
  const range = parseRange(request.headers.get('range'), full.byteLength);
  const head = request.method === 'HEAD';
  if (range.kind === 'unsatisfiable') {
    return new Response(null, { status: 416, headers: { ...BASE_HEADERS, 'content-range': `bytes */${full.byteLength}` } });
  }
  if (range.kind === 'ok') {
    const length = range.end - range.start + 1;
    const headers = headersFor(src, length);
    headers.set('content-range', `bytes ${range.start}-${range.end}/${full.byteLength}`);
    return new Response(head ? null : new Uint8Array(full, range.start, length), { status: 206, headers });
  }
  return new Response(head ? null : full, { status: 200, headers: headersFor(src, full.byteLength) });
}

export async function serveMedia(request: Request, ctx: ExecutionContext, src: MediaSource): Promise<Response> {
  if (request.headers.get('if-none-match') === src.etag) {
    return new Response(null, { status: 304, headers: { ...BASE_HEADERS, etag: src.etag } });
  }
  const cache = caches.default;
  const key = new URL(src.cachePath, request.url).toString();
  const rangeHeader = request.headers.get('range');

  // Cache hit: the edge cache answers Range requests with 206 by itself.
  const hit = await cache.match(new Request(key, rangeHeader ? { headers: { range: rangeHeader } } : {}));
  if (hit) return request.method === 'HEAD' ? new Response(null, { status: hit.status, headers: hit.headers }) : hit;

  let upstream: Response;
  try {
    upstream = await fetch(src.upstream, {
      headers: { 'user-agent': 'gebaren.franklippes.com (video proxy)', accept: src.type.startsWith('video') ? 'video/*' : 'image/*' },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    return plain(timedOut ? 504 : 502, timedOut ? 'De bron van de video reageert te traag.' : 'De bron van de video is niet bereikbaar.');
  }
  if (upstream.status === 404) return plain(404, 'Deze video bestaat niet (meer) bij de bron.');
  if (!upstream.ok) return plain(502, 'De bron van de video gaf een fout.');
  const declared = Number(upstream.headers.get('content-length') ?? '0');
  if (declared > MAX_BYTES) return plain(502, 'Deze video is te groot.');
  const upstreamType = upstream.headers.get('content-type') ?? '';
  if (!/^(video|image)\//u.test(upstreamType)) return plain(502, 'De bron gaf geen video terug.');

  const full = await upstream.arrayBuffer();
  if (full.byteLength === 0 || full.byteLength > MAX_BYTES) return plain(502, 'De video van de bron is niet bruikbaar.');
  ctx.waitUntil(cache.put(key, new Response(full.slice(0), { status: 200, headers: headersFor(src, full.byteLength) })));
  return slice(full, src, request);
}

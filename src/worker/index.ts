/**
 * Gebaren Worker: the API and the media proxy. Everything else is the Svelte app, served as static assets.
 *
 *   GET /api/sign?q=<word>     → JSON with signs for the word (404 with suggestions when there are none)
 *   GET /video/sb/<id>.mp4     → NGT Signbank video (edge cached, byte ranges)
 *   GET /poster/sb/<id>        → NGT Signbank still image
 *   GET /video/lg/<id>.mp4     → lerengebaren.nl video (only when the fallback is on)
 */
import { catalogue, index } from './data.ts';
import { lookup, notFoundHelp } from './lookup.ts';
import { checkQuery } from './validate.ts';
import { apiError, clientIp, json } from './http.ts';
import { serveMedia, type MediaSource } from './media.ts';
import { LG, lookupLerengebaren } from './lerengebaren.ts';
import { SIGNBANK } from '../shared/signbank-index.ts';
import type { SignResponse } from '../shared/types.ts';

const API_BROWSER_TTL = 300;
const API_EDGE_TTL_FOUND = 24 * 3600;
const API_EDGE_TTL_MISSING = 3600;

async function limited(limiter: RateLimit, request: Request, scope: string): Promise<boolean> {
  try {
    const { success } = await limiter.limit({ key: `${scope}:${clientIp(request)}` });
    return !success;
  } catch (err) {
    console.error('rate limiter failed, allowing request', err);
    return false; // fail open: a broken limiter must not take the site down
  }
}

/** Tiny stable hash for ETags. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

const encodePath = (p: string): string => p.split('/').map(encodeURIComponent).join('/');

async function handleSign(request: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response> {
  if (await limited(env.API_LIMIT, request, 'api')) return apiError('rate_limited', 429, {}, { 'retry-after': '60' });

  const check = checkQuery(url.searchParams.get('q'));
  if (!check.ok) return json({ error: 'invalid_query', message: check.message }, 400);
  const { query, key } = check;

  // Edge cache per normalised key (the index version is part of the key, so a deploy with new data starts fresh).
  const cacheKey = `${url.origin}/__cache/api/${hash(index.generatedAt + env.LERENGEBAREN_FALLBACK)}/${encodeURIComponent(key)}`;
  const cached = await caches.default.match(cacheKey);
  if (cached) {
    const body = { ...(await cached.json<Record<string, unknown>>()), query };
    return json(body, cached.status, { 'cache-control': `public, max-age=${API_BROWSER_TTL}` });
  }

  const store = (body: Record<string, unknown>, status: number): Response => {
    const ttl = status === 200 ? API_EDGE_TTL_FOUND : API_EDGE_TTL_MISSING;
    ctx.waitUntil(caches.default.put(cacheKey, new Response(JSON.stringify(body), {
      status, headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${ttl}` },
    })));
    return json(body, status, { 'cache-control': `public, max-age=${API_BROWSER_TTL}` });
  };

  const found = lookup(catalogue, key);
  if (found) {
    const body: SignResponse = { query, normalized: found.key, results: found.results, suggestions: [], parts: [] };
    return store({ ...body }, 200);
  }

  const help = notFoundHelp(catalogue, key);
  if (env.LERENGEBAREN_FALLBACK === 'on') {
    const lg = await lookupLerengebaren(key, url.origin, ctx);
    if (lg.kind === 'found') {
      const body: SignResponse = { query, normalized: key, results: [lg.result], suggestions: [], parts: [] };
      return store({ ...body }, 200);
    }
    // Not cached: the next try may work.
    if (lg.kind === 'timeout') return apiError('timeout', 504, { query, normalized: key, results: [], ...help });
    if (lg.kind === 'unavailable') return apiError('source_unavailable', 502, { query, normalized: key, results: [], ...help });
  }
  return store({ error: 'not_found', message: 'We hebben geen gebaar voor dit woord.', query, normalized: key, results: [], ...help }, 404);
}

function signbankMedia(kind: 'video' | 'poster', id: string): MediaSource | null {
  const gloss = index.glosses[id];
  const path = gloss ? (kind === 'video' ? gloss[2] : gloss[3]) : '';
  if (!path) return null;
  const type = kind === 'video' ? 'video/mp4' : path.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return {
    cachePath: kind === 'video' ? `/video/sb/${id}.mp4` : `/poster/sb/${id}`,
    upstream: SIGNBANK.mediaBase + encodePath(path),
    type,
    etag: `"sb-${kind}-${id}-${hash(path)}"`,
  };
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const isApi = pathname.startsWith('/api/');
    const isMedia = pathname.startsWith('/video/') || pathname.startsWith('/poster/');
    if (!isApi && !isMedia) return env.ASSETS.fetch(request);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json({ error: 'method_not_allowed', message: 'Alleen GET en HEAD.' }, 405, { allow: 'GET, HEAD' });
    }

    try {
      if (pathname === '/api/sign') return await handleSign(request, env, ctx, url);
      if (pathname === '/api/health') return json({ ok: true, signs: Object.keys(index.glosses).length, index: index.generatedAt });
      if (isApi) return json({ error: 'not_found', message: 'Deze API-route bestaat niet.' }, 404);

      if (await limited(env.MEDIA_LIMIT, request, 'media')) {
        return new Response('Te veel verzoeken. Wacht een minuut.', { status: 429, headers: { 'retry-after': '60' } });
      }
      let m = /^\/video\/sb\/(\d{1,7})\.mp4$/u.exec(pathname);
      if (m?.[1]) {
        const src = signbankMedia('video', m[1]);
        return src ? await serveMedia(request, ctx, src) : new Response('Onbekende video.', { status: 404 });
      }
      m = /^\/poster\/sb\/(\d{1,7})$/u.exec(pathname);
      if (m?.[1]) {
        const src = signbankMedia('poster', m[1]);
        return src ? await serveMedia(request, ctx, src) : new Response('Onbekende afbeelding.', { status: 404 });
      }
      m = /^\/video\/lg\/(\d{1,7})\.mp4$/u.exec(pathname);
      if (m?.[1] && env.LERENGEBAREN_FALLBACK === 'on') {
        return await serveMedia(request, ctx, {
          cachePath: `/video/lg/${m[1]}.mp4`, upstream: LG.video(m[1]), type: 'video/mp4', etag: `"lg-video-${m[1]}"`,
        });
      }
      return new Response('Niet gevonden.', { status: 404 });
    } catch (err) {
      console.error('unhandled error', pathname, err);
      return isApi ? apiError('internal', 500) : new Response('Er ging iets mis.', { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

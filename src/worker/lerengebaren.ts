/**
 * Optional fallback: the old lerengebaren.nl dictionary (CC BY-SA 4.0), for words Signbank does not have.
 * Parsed with HTMLRewriter. The site plans to move, so this degrades to "not found" when the page changes.
 */
import { toKey } from '../shared/normalize.ts';
import type { SignResult } from '../shared/types.ts';

export const LG = {
  name: 'LerenGebaren.nl',
  licence: 'CC BY-SA 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/deed.nl',
  page: (key: string): string => `https://www.lerengebaren.nl/gebarenwoordenboek/${encodeURIComponent(key)}`,
  video: (id: string): string => `https://www.lerengebaren.nl/gebaren/${id}.m4v`,
} as const;

const VIDEO_SRC = /^https:\/\/www\.lerengebaren\.nl\/gebaren\/(\d{1,7})\.m4v$/u;
const FOUND_TTL = 7 * 24 * 3600;
const MISSING_TTL = 24 * 3600;

export interface LgParsed { videoId: string; word: string }

/** Reads the word and the video id from a dictionary page. Returns null when the page has no valid video for `key`. */
export async function parseLerengebaren(page: Response, key: string): Promise<LgParsed | null> {
  let src: string | null = null;
  let header = '';
  const rewriter = new HTMLRewriter()
    .on('#myvideo source', { element(el) { src ??= el.getAttribute('src'); } })
    .on('#woord_header', { text(t) { header += t.text; } });
  await rewriter.transform(page).arrayBuffer();
  const id = src ? VIDEO_SRC.exec(src)?.[1] : undefined;
  const word = header.replace(/\s+/gu, ' ').trim();
  if (!id || !word || toKey(word) !== key) return null;
  return { videoId: id, word };
}

export function lgResult(parsed: LgParsed, key: string): SignResult {
  return {
    word: parsed.word.toLowerCase(),
    videoUrl: `/video/lg/${parsed.videoId}.mp4`,
    kind: 'mp4',
    sourceName: LG.name,
    sourcePageUrl: LG.page(key),
    licence: LG.licence,
    licenceUrl: LG.licenceUrl,
    senses: [[parsed.word.toLowerCase()]],
    sourceId: parsed.videoId,
  };
}

export type LgOutcome = { kind: 'found'; result: SignResult } | { kind: 'missing' } | { kind: 'timeout' } | { kind: 'unavailable' };

/** Looks a key up on lerengebaren.nl, with the parsed outcome kept in the edge cache. */
export async function lookupLerengebaren(key: string, origin: string, ctx: ExecutionContext): Promise<LgOutcome> {
  const cache = caches.default;
  const cacheKey = `${origin}/__cache/lg/v1/${encodeURIComponent(key)}`;
  const cached = await cache.match(cacheKey);
  if (cached) {
    const data = await cached.json<LgParsed | null>();
    return data ? { kind: 'found', result: lgResult(data, key) } : { kind: 'missing' };
  }

  let page: Response;
  try {
    page = await fetch(LG.page(key), {
      headers: { 'user-agent': 'gebaren.franklippes.com (woordenboek-zoeker)', accept: 'text/html' },
      signal: AbortSignal.timeout(3_000),
    });
  } catch (err) {
    return err instanceof Error && err.name === 'TimeoutError' ? { kind: 'timeout' } : { kind: 'unavailable' };
  }
  if (page.status >= 500) return { kind: 'unavailable' };
  const parsed = page.ok ? await parseLerengebaren(page, key) : null;
  const ttl = parsed ? FOUND_TTL : MISSING_TTL;
  ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(parsed), {
    headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${ttl}` },
  })));
  return parsed ? { kind: 'found', result: lgResult(parsed, key) } : { kind: 'missing' };
}

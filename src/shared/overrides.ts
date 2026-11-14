/**
 * Own overrides from data/overrides.json. Validated strictly: a bad file fails the build (scripts/build-words.ts)
 * instead of breaking the site at runtime.
 */
import { toKey } from './normalize.ts';
import type { SignResult } from './types.ts';

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/u;
/** mp4 overrides may only point at our own public/media/ folder (the CSP allows video from our own domain only). */
const MP4_URL = /^\/media\/[\w.-]+\.mp4$/u;
const HTTPS_URL = /^https:\/\/[^\s"'<>]+$/u;

interface RawOverride {
  kind?: unknown; videoId?: unknown; url?: unknown; meaning?: unknown;
  sourceName?: unknown; sourcePageUrl?: unknown; licence?: unknown; licenceUrl?: unknown;
}

function text(v: unknown, field: string, word: string): string {
  if (typeof v !== 'string' || v.trim() === '' || v.length > 200) throw new Error(`Override "${word}": ${field} must be a short text.`);
  return v.trim();
}

function httpsUrl(v: unknown, field: string, word: string): string {
  const s = text(v, field, word);
  if (!HTTPS_URL.test(s)) throw new Error(`Override "${word}": ${field} must be an https URL.`);
  return s;
}

/** Parses the overrides file. Returns lookup key → results. Throws with a clear message on any mistake. */
export function parseOverrides(json: unknown): Map<string, SignResult[]> {
  const words = (json as { words?: unknown } | null)?.words;
  if (!words || typeof words !== 'object' || Array.isArray(words)) throw new Error('overrides.json needs a "words" object.');
  const out = new Map<string, SignResult[]>();
  for (const [word, list] of Object.entries(words as Record<string, unknown>)) {
    const key = toKey(word);
    if (!key) throw new Error(`Override key "${word}" is not a word.`);
    if (!Array.isArray(list) || list.length === 0) throw new Error(`Override "${word}" needs a list with at least one video.`);
    const results = list.map((item: RawOverride): SignResult => {
      const meaning = Array.isArray(item.meaning) && item.meaning.every((m) => typeof m === 'string' && m.trim())
        ? (item.meaning as string[]).map((m) => m.trim()) : [word];
      const common = {
        word,
        sourceName: text(item.sourceName, 'sourceName', word),
        sourcePageUrl: httpsUrl(item.sourcePageUrl, 'sourcePageUrl', word),
        licence: text(item.licence, 'licence', word),
        licenceUrl: httpsUrl(item.licenceUrl, 'licenceUrl', word),
        senses: [meaning],
      };
      if (item.kind === 'youtube') {
        if (typeof item.videoId !== 'string' || !YOUTUBE_ID.test(item.videoId)) throw new Error(`Override "${word}": videoId is not a YouTube id.`);
        return { ...common, kind: 'youtube', videoUrl: `https://www.youtube-nocookie.com/embed/${item.videoId}`,
          posterUrl: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`, sourceId: item.videoId };
      }
      if (item.kind === 'mp4') {
        if (typeof item.url !== 'string' || !MP4_URL.test(item.url)) throw new Error(`Override "${word}": url must be /media/<file>.mp4 (a file in public/media).`);
        return { ...common, kind: 'mp4', videoUrl: item.url };
      }
      throw new Error(`Override "${word}": kind must be "youtube" or "mp4".`);
    });
    out.set(key, [...(out.get(key) ?? []), ...results]);
  }
  return out;
}

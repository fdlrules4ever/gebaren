/**
 * Turns the public NGT Signbank package (glosses.json, video_urls.json, image_urls.json) into our compact index.
 * Pure function, so it can be unit-tested with small fixtures.
 */
import { compactKey, toKey } from '../../src/shared/normalize.ts';
import type { SignbankIndex } from '../../src/shared/signbank-index.ts';

export type { SignbankIndex };

export interface RawGloss {
  'Annotation ID Gloss: Dutch'?: string;
  'Senses: Dutch'?: Record<string, string>;
  Video?: string;
  Link?: string;
}

const MEDIA_PATH = /^gloss(?:video|image)\/NGT\/[^/?#\\]+\/[^/?#\\]+\.(?:mp4|png|jpe?g)$/u;

/** "https://signbank.cls.ru.nl//dictionary/protected_media/glossvideo/NGT/HU/X.mp4" → "glossvideo/NGT/HU/X.mp4" */
export function mediaPath(url: string | undefined): string | null {
  if (!url) return null;
  const at = url.indexOf('/protected_media/');
  if (at < 0) return null;
  const path = url.slice(at + '/protected_media/'.length).split('?')[0] ?? '';
  if (path.includes('..') || !MEDIA_PATH.test(path)) return null;
  return path;
}

/** "huis, huisje (klein), hok" → ["huis", "huisje", "hok"]; drops notes in brackets and very long entries. */
export function splitSenses(line: string): string[] {
  return line
    .split(',')
    .map((w) => w.replace(/\([^)]*\)?/gu, ' ').replace(/\s+/gu, ' ').trim())
    .filter((w) => w.length > 0 && w.length <= 40 && w.split(' ').length <= 5);
}

/** "HUIS-A" → "huis", "HAND-SCHUDDEN-B" → "hand schudden" */
export function glossBaseKey(name: string): string {
  return toKey(name.replace(/-[A-Z]$/u, ''));
}

export function buildIndex(
  glosses: Record<string, RawGloss>,
  videoUrls: Record<string, string>,
  imageUrls: Record<string, string>,
  packageLastModified: string | null,
  now = new Date(),
): SignbankIndex {
  const out: SignbankIndex = {
    v: 1, generatedAt: now.toISOString(), packageLastModified, glosses: {}, words: {}, display: {}, aliases: {},
  };
  const entries = new Map<string, Array<{ id: number; name: string; exact: boolean; rank: number }>>();

  for (const [idText, g] of Object.entries(glosses)) {
    const id = Number(idText);
    const name = g['Annotation ID Gloss: Dutch']?.trim();
    if (!Number.isInteger(id) || id <= 0 || !name) continue;
    const video = mediaPath(g.Video) ?? mediaPath(videoUrls[`${name}-${id}`]);
    if (!video) continue; // no video, nothing to show
    const image = mediaPath(imageUrls[`${name}-${id}`]) ?? '';
    const senses = Object.keys(g['Senses: Dutch'] ?? {})
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => splitSenses(g['Senses: Dutch']![k]!))
      .filter((group) => group.length > 0);
    if (senses.length === 0) continue; // no Dutch word to find it by
    out.glosses[id] = [name, senses, video, image];

    const base = glossBaseKey(name);
    senses.forEach((group, gi) => group.forEach((word, wi) => {
      const key = toKey(word);
      if (!key) return;
      // Keep the spelling with accents or capitals for display ("cafe" → "café").
      if (word !== key && !(key in out.display)) out.display[key] = word;
      const list = entries.get(key) ?? [];
      if (!list.some((e) => e.id === id)) list.push({ id, name, exact: base === key, rank: gi * 100 + wi });
      entries.set(key, list);
    }));
  }

  for (const key of [...entries.keys()].sort((a, b) => a.localeCompare(b, 'nl'))) {
    out.words[key] = entries.get(key)!
      .sort((a, b) => Number(b.exact) - Number(a.exact) || a.rank - b.rank || a.name.localeCompare(b.name, 'en') || a.id - b.id)
      .map((e) => e.id);
  }
  for (const key of Object.keys(out.words)) {
    const compact = compactKey(key);
    if (compact !== key && !(compact in out.words) && !(compact in out.aliases)) out.aliases[compact] = key;
  }
  return out;
}

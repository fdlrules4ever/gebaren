/**
 * Word lookup: own overrides first, then NGT Signbank. Pure functions (no Workers APIs), so they are unit-tested in Node.
 */
import { compactKey } from '../shared/normalize.ts';
import { closest } from '../shared/fuzzy.ts';
import { SIGNBANK, type SignbankIndex } from '../shared/signbank-index.ts';
import type { SignResult } from '../shared/types.ts';

export interface Catalogue {
  index: SignbankIndex;
  overrides: Map<string, SignResult[]>;
  /** All primary lookup keys (Signbank and overrides), for typo suggestions. */
  keys: string[];
}

export function createCatalogue(index: SignbankIndex, overrides: Map<string, SignResult[]>): Catalogue {
  const keys = new Set(Object.keys(index.words));
  for (const k of overrides.keys()) keys.add(k);
  return { index, overrides, keys: [...keys] };
}

/** The lookup key we know for this key (also via "dankje" → "dank je"), or null. */
export function resolveKey(cat: Catalogue, key: string): string | null {
  if (cat.overrides.has(key) || key in cat.index.words) return key;
  const alias = cat.index.aliases[compactKey(key)];
  return alias ?? null;
}

export function displayFor(cat: Catalogue, key: string): string {
  return cat.index.display[key] ?? cat.overrides.get(key)?.[0]?.word ?? key;
}

export function signbankResult(cat: Catalogue, id: number, word: string): SignResult | null {
  const g = cat.index.glosses[id];
  if (!g) return null;
  const [, senses, , image] = g;
  return {
    word,
    videoUrl: `/video/sb/${id}.mp4`,
    kind: 'mp4',
    sourceName: SIGNBANK.name,
    sourcePageUrl: SIGNBANK.glossPage(id),
    licence: SIGNBANK.licence,
    licenceUrl: SIGNBANK.licenceUrl,
    senses,
    ...(image ? { posterUrl: `/poster/sb/${id}` } : {}),
    sourceId: String(id),
  };
}

const ARTICLE = /^(?:de|het|een|'t) (.+)$/u;

export interface Found {
  /** The key that matched (may differ from the query, e.g. "het huis" → "huis"). */
  key: string;
  word: string;
  results: SignResult[];
}

/** Results for a lookup key, or null. Tries the key, its compact form, and the key without an article. */
export function lookup(cat: Catalogue, queryKey: string): Found | null {
  const candidates = [queryKey];
  const article = ARTICLE.exec(queryKey);
  if (article?.[1]) candidates.push(article[1]);
  for (const candidate of candidates) {
    const key = resolveKey(cat, candidate);
    if (!key) continue;
    const word = displayFor(cat, key);
    const results = [
      ...(cat.overrides.get(key) ?? []),
      ...(cat.index.words[key] ?? []).map((id) => signbankResult(cat, id, word)).filter((r): r is SignResult => r !== null),
    ];
    if (results.length) return { key, word, results };
  }
  return null;
}

const LINKS = ['', 's', 'e', 'en', 'er'];

/** Splits a Dutch compound into two known words: huisdier → [huis, dier], kinderopvang → [kind, opvang]. */
export function compoundParts(cat: Catalogue, key: string): string[] {
  const word = compactKey(key);
  if (word.length < 6) return [];
  let best: { left: string; right: string; score: number } | null = null;
  for (let i = 3; i <= word.length - 3; i++) {
    const left = word.slice(0, i);
    const leftKey = resolveKey(cat, left);
    if (!leftKey) continue;
    for (const link of LINKS) {
      const rest = word.slice(i);
      if (!rest.startsWith(link)) continue;
      const right = rest.slice(link.length);
      if (right.length < 3) continue;
      const rightKey = resolveKey(cat, right);
      if (!rightKey) continue;
      const score = Math.min(left.length, right.length) * 10 - link.length;
      if (!best || score > best.score) best = { left: leftKey, right: rightKey, score };
    }
  }
  return best ? [displayFor(cat, best.left), displayFor(cat, best.right)] : [];
}

/** Simple Dutch word forms to try: plural, diminutive, possessive. */
function stems(key: string): string[] {
  const out: string[] = [];
  for (const end of ["'s", 's', 'en', 'n', 'tje', 'pje', 'je']) {
    if (key.length - end.length >= 3 && key.endsWith(end)) out.push(key.slice(0, -end.length));
  }
  return out;
}

/** "Did you mean …?" for a key without results: other word forms first, then words with a small typo. */
export function suggestionsFor(cat: Catalogue, key: string, limit = 5): string[] {
  const out: string[] = [];
  const add = (k: string | null): void => {
    if (!k) return;
    const d = displayFor(cat, k);
    if (!out.includes(d)) out.push(d);
  };
  for (const s of stems(key)) add(resolveKey(cat, s));
  for (const k of closest(key, cat.keys, limit)) add(k);
  return out.slice(0, limit);
}

/** Used by the API when nothing was found at all. */
export function notFoundHelp(cat: Catalogue, key: string): { suggestions: string[]; parts: string[] } {
  return { suggestions: suggestionsFor(cat, key), parts: compoundParts(cat, key) };
}

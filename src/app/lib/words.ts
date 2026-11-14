/** Suggestions while typing, from /words.json (about 8,000 words, loaded once on first use). */
import { compactKey, toKey } from '../../shared/normalize.ts';
import { closest, maxTypos } from '../../shared/fuzzy.ts';
import type { WordList } from '../../shared/types.ts';

interface Entry { word: string; key: string; compact: string }

let entries: Entry[] = [];
let byKey = new Map<string, Entry>();
let loading: Promise<boolean> | null = null;

/** Loads the list once. Resolves to false when it could not be loaded (suggestions are then simply empty). */
export function loadWords(): Promise<boolean> {
  loading ??= fetch('/words.json')
    .then((r) => (r.ok ? (r.json() as Promise<WordList>) : Promise.reject(new Error(String(r.status)))))
    .then((list) => {
      entries = list.words.map((word) => { const key = toKey(word); return { word, key, compact: compactKey(key) }; });
      byKey = new Map(entries.map((e) => [e.key, e]));
      return true;
    })
    .catch(() => { loading = null; return false; });
  return loading;
}

/** Words that start with what was typed (shortest first); if there are few, also words with a small typo. */
export function suggest(input: string, limit = 7): string[] {
  const key = toKey(input);
  if (!key || entries.length === 0) return [];
  const compact = compactKey(key);
  const prefix = entries
    .filter((e) => e.key.startsWith(key) || e.compact.startsWith(compact))
    .sort((a, b) => Number(b.key === key) - Number(a.key === key) || a.key.length - b.key.length || a.key.localeCompare(b.key, 'nl'))
    .slice(0, limit)
    .map((e) => e.word);
  if (prefix.length >= limit || maxTypos(key.length) === 0) return prefix;
  const near = closest(key, byKey.keys(), limit)
    .map((k) => byKey.get(k)?.word)
    .filter((w): w is string => !!w && !prefix.includes(w));
  return [...prefix, ...near].slice(0, limit);
}

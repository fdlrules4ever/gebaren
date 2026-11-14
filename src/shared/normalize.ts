/**
 * Query normalisation, shared by the Worker, the app and the scripts.
 *
 * - `cleanQuery` tidies what the user typed (for display and validation).
 * - `toKey` turns any word into a lookup key: lower case, no diacritics, one kind of apostrophe,
 *   hyphens and dots become spaces, single spaces. "Café" → "cafe", "Dank-je " → "dank je".
 * - `compactKey` removes the spaces, so "dankje" also finds "dank je".
 */

export const MAX_QUERY_LENGTH = 60;

/** Letters (any script), combining marks, digits, spaces, apostrophes, dots and hyphens. */
const ALLOWED = /^[\p{L}\p{M}\p{N} '’‘`´.\-]+$/u;

/** NFC, trimmed, whitespace collapsed. Does not change case or accents. */
export function cleanQuery(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

export type QueryProblem = 'empty' | 'too_long' | 'bad_characters';

/** Returns why a cleaned query is not acceptable, or null when it is fine. */
export function queryProblem(q: string): QueryProblem | null {
  if (q.length === 0) return 'empty';
  if (q.length > MAX_QUERY_LENGTH) return 'too_long';
  if (!ALLOWED.test(q) || toKey(q).length === 0) return 'bad_characters';
  return null;
}

export function toKey(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[’‘`´]/gu, "'")
    .replace(/[.\-_/]+/gu, ' ')
    .replace(/[^\p{L}\p{N}' ]+/gu, ' ')
    .replace(/'+/gu, "'")
    .replace(/\s+/gu, ' ')
    .replace(/^'|'$/gu, '')
    .trim();
}

export function compactKey(key: string): string {
  return key.replace(/ /gu, '');
}

/**
 * Small-typo tolerance without dependencies: optimal string alignment distance
 * (Levenshtein plus swapping two neighbouring letters), with an early stop.
 */

/** How many typos we tolerate for a word of this length. */
export function maxTypos(length: number): number {
  if (length <= 3) return 0;
  if (length <= 5) return 1;
  return 2;
}

/** Distance between a and b, or max + 1 as soon as it is clear the distance is larger than max. */
export function typoDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const n = b.length;
  let prev2 = new Array<number>(n + 1).fill(0);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let cur = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = i;
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const bj = b.charCodeAt(j - 1);
      const cost = ai === bj ? 0 : 1;
      let v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
      if (i > 1 && j > 1 && ai === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === bj) {
        v = Math.min(v, prev2[j - 2]! + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    [prev2, prev, cur] = [prev, cur, prev2];
  }
  return prev[n]!;
}

/**
 * The closest keys to `key` within the typo budget, best first.
 * Ties are broken by preferring the same first letter, then shorter keys, then alphabetical order.
 */
export function closest(key: string, keys: Iterable<string>, limit = 5): string[] {
  const budget = maxTypos(key.length);
  if (budget === 0) return [];
  const hits: Array<{ k: string; d: number }> = [];
  for (const k of keys) {
    if (k === key) continue;
    const d = typoDistance(key, k, budget);
    if (d <= budget) hits.push({ k, d });
  }
  hits.sort((x, y) =>
    x.d - y.d ||
    Number(y.k[0] === key[0]) - Number(x.k[0] === key[0]) ||
    Math.abs(x.k.length - key.length) - Math.abs(y.k.length - key.length) ||
    x.k.localeCompare(y.k, 'nl'),
  );
  return hits.slice(0, limit).map((h) => h.k);
}

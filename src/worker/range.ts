/** Parses a single HTTP byte range. Multiple ranges are not supported (we answer those with the whole file). */

export type RangeResult =
  | { kind: 'none' }
  | { kind: 'ok'; start: number; end: number }
  | { kind: 'unsatisfiable' };

export function parseRange(header: string | null, size: number): RangeResult {
  if (!header) return { kind: 'none' };
  const m = /^bytes=(\d*)-(\d*)$/u.exec(header.trim());
  if (!m) return { kind: 'none' };
  const [, a = '', b = ''] = m;
  if (a === '' && b === '') return { kind: 'none' };
  let start: number;
  let end: number;
  if (a === '') {
    const suffix = Number(b);
    if (suffix === 0) return { kind: 'unsatisfiable' };
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(a);
    end = b === '' ? size - 1 : Math.min(Number(b), size - 1);
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end) return { kind: 'unsatisfiable' };
  return { kind: 'ok', start, end };
}

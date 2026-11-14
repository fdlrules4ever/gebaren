/**
 * Recent searches, favourites and player preferences, kept only on this device (localStorage).
 * Storage can be missing or throw (private mode, blocked site data): the app then works without remembering.
 */
import { toKey } from '../../shared/normalize.ts';

const KEY = 'gebaren:v1';
const MAX_RECENT = 12;
const MAX_FAVOURITES = 100;

export type Speed = 1 | 0.75 | 0.5;
interface Saved {
  recent: string[];
  favourites: string[];
  prefs: { speed: Speed; mirror: boolean; shortcuts: boolean };
}

const fresh = (): Saved => ({ recent: [], favourites: [], prefs: { speed: 1, mirror: false, shortcuts: true } });

const words = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.filter((w): w is string => typeof w === 'string' && w.length > 0 && w.length <= 60).slice(0, max) : [];

function load(): Saved {
  const base = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Saved> | null;
    if (!raw || typeof raw !== 'object') return base;
    const p = (raw.prefs ?? {}) as Partial<Saved['prefs']>;
    return {
      recent: words(raw.recent, MAX_RECENT),
      favourites: words(raw.favourites, MAX_FAVOURITES),
      prefs: {
        speed: p.speed === 0.75 || p.speed === 0.5 ? p.speed : 1,
        mirror: p.mirror === true,
        shortcuts: p.shortcuts !== false,
      },
    };
  } catch {
    return base;
  }
}

export const saved = $state<Saved>(load());

function persist(): void {
  try { localStorage.setItem(KEY, JSON.stringify($state.snapshot(saved))); } catch { /* not available: fine */ }
}

const same = (a: string, b: string): boolean => toKey(a) === toKey(b);

export function addRecent(word: string): void {
  saved.recent = [word, ...saved.recent.filter((w) => !same(w, word))].slice(0, MAX_RECENT);
  persist();
}

export function clearRecent(): void {
  saved.recent = [];
  persist();
}

export function isFavourite(word: string): boolean {
  return saved.favourites.some((w) => same(w, word));
}

/** Returns true when the word is now a favourite. */
export function toggleFavourite(word: string): boolean {
  const on = !isFavourite(word);
  saved.favourites = on ? [word, ...saved.favourites].slice(0, MAX_FAVOURITES) : saved.favourites.filter((w) => !same(w, word));
  persist();
  return on;
}

export function setPref<K extends keyof Saved['prefs']>(key: K, value: Saved['prefs'][K]): void {
  saved.prefs[key] = value;
  persist();
}

// Keep tabs in step: a favourite added in one tab shows up in the other.
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  const next = load();
  saved.recent = next.recent;
  saved.favourites = next.favourites;
  saved.prefs = next.prefs;
});

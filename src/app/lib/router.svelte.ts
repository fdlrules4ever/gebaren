/** Tiny History API router: "/" start, "/<word>" a sign, "/over-deze-site" about. The back button just works. */
import { tick } from 'svelte';

export type Route = { name: 'start' } | { name: 'word'; word: string } | { name: 'about' };

export const ABOUT_PATH = '/over-deze-site';

function parse(pathname: string): Route {
  const path = pathname.replace(/\/+$/u, '') || '/';
  if (path === '/') return { name: 'start' };
  if (path === ABOUT_PATH) return { name: 'about' };
  let word: string;
  try { word = decodeURIComponent(path.slice(1)); } catch { return { name: 'start' }; }
  word = word.replace(/\s+/gu, ' ').trim();
  return word && !word.includes('/') ? { name: 'word', word } : { name: 'start' };
}

export const router = $state<{ route: Route; byUser: boolean }>({ route: parse(location.pathname), byUser: false });

/** Path of the current route; a change of only the #hash (in-page link) is not a new route. */
let currentPath = location.pathname;

export function wordPath(word: string): string {
  return `/${encodeURIComponent(word.trim())}`;
}

async function scrollToHash(hash: string): Promise<void> {
  await tick();
  if (hash.length > 1) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  else window.scrollTo(0, 0);
}

/** Navigate inside the app. */
export function go(href: string, replace = false): void {
  const url = new URL(href, location.href);
  if (url.pathname + url.hash !== location.pathname + location.hash) {
    history[replace ? 'replaceState' : 'pushState'](null, '', url.pathname + url.hash);
  }
  currentPath = url.pathname;
  router.byUser = true;
  router.route = parse(url.pathname);
  void scrollToHash(url.hash);
}

/** Lets normal <a href="/..."> links inside the app navigate without a page load. */
export function interceptLinks(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const a = (event.target as Element | null)?.closest('a');
  if (!a || a.target || a.hasAttribute('download') || a.origin !== location.origin) return;
  if (a.pathname === location.pathname && a.hash) return; // in-page anchor: let the browser scroll
  if (a.pathname.startsWith('/api/') || a.pathname.startsWith('/fonts/') || a.pathname.includes('.')) return;
  event.preventDefault();
  go(a.pathname + a.hash);
}

window.addEventListener('popstate', () => {
  if (location.pathname === currentPath) return;
  currentPath = location.pathname;
  router.byUser = true;
  router.route = parse(location.pathname);
});

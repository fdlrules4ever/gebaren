/*
 * Gebaren service worker: an app-shell offline fallback.
 * - Pages: network first; offline you get the cached app, which then says you are offline.
 * - Built files, fonts and icons: from the cache once seen (their names change with every build).
 * - API, video and posters: always from the network.
 * Change VERSION to drop old caches.
 */
const VERSION = 'v1';
const SHELL = `gebaren-shell-${VERSION}`;
const RUNTIME = `gebaren-runtime-${VERSION}`;
const PRECACHE = ['/', '/words.json', '/manifest.webmanifest', '/icons/icon.svg', '/fonts/atkinson-hyperlegible-next-latin.woff2'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function cacheCopy(cacheName, request, response) {
  if (response.ok && response.type === 'basic') {
    const copy = response.clone();
    caches.open(cacheName).then((cache) => cache.put(request, copy)).catch(() => {});
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/^\/(api|video|poster)\//.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => cacheCopy(SHELL, new Request('/'), response))
        .catch(() => caches.match('/', { cacheName: SHELL }).then((hit) => hit || Response.error())),
    );
    return;
  }

  if (/^\/(assets|fonts|icons)\//.test(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((r) => cacheCopy(RUNTIME, request, r))));
    return;
  }

  if (url.pathname === '/words.json') {
    event.respondWith(
      caches.match(request).then((hit) => {
        const fresh = fetch(request).then((r) => cacheCopy(SHELL, request, r)).catch(() => hit);
        return hit || fresh;
      }),
    );
  }
});

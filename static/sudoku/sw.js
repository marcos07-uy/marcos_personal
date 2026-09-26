const CACHE = 'claudia-sudoku-shell-v2';
const SHELL = ['/sudoku/', '/sudoku/app.js', '/sudoku/sudoku-core.js'];

self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('claudia-sudoku-shell-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put('/sudoku/', copy)); return response; }).catch(() => caches.match('/sudoku/')));
    return;
  }
  if (!url.pathname.startsWith('/sudoku/')) return;
  event.respondWith(caches.match(request, { ignoreSearch: true }).then((cached) => cached || fetch(request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(request, copy)); return response; })));
});

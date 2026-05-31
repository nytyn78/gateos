/* GateOS service worker */
const CACHE = 'gateos-v1';
const SHELL = ['./', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Only handle same-origin GET. Let Firebase / fonts / all cross-origin pass straight to network.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // App shell: network-first so updates show when online, cached copy when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return r;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }

  // Other same-origin assets (icons, manifest): cache-first.
  e.respondWith(caches.match(req).then((c) => c || fetch(req)));
});

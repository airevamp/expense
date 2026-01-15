// Minimal service worker: cache app shell for offline + enable install on iOS
const CACHE = "app-shell-v1";
const APP_SHELL = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Cache-first for same-origin GETs; fall back to network
  if (req.method === "GET" && new URL(req.url).origin === location.origin) {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
  }
});

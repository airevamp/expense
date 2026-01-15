// This is a tiny service worker for PWA install + offline shell of the app shell only.
self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches
      .open("app-shell-v1")
      .then((cache) => cache.addAll(["/", "/index.html"]))
  );
});
self.addEventListener("fetch", (event: any) => {
  const req = event.request;
  if (req.method === "GET" && new URL(req.url).origin === location.origin) {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
  }
});

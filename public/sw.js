const VERSION = "v1"; // bump if you change caching logic
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

// OPTIONAL: cache core shell files during install (keep minimal)
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([
        "/", // your SPA entry
        "/index.html",
        "/manifest.webmanifest",
        // add icons if you want
      ]),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean old caches automatically
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Allow the page to tell SW to activate immediately
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // 1) ✅ HTML / navigation requests: NETWORK FIRST (prevents stale index.html)
  if (
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html")
  ) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(RUNTIME_CACHE);
          return (await cache.match(req)) || (await cache.match("/index.html"));
        }
      })(),
    );
    return;
  }

  // 2) ✅ Hashed build assets (/assets/*): CACHE FIRST (fast + safe)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;

        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      })(),
    );
    return;
  }

  // 3) Everything else: default network
});

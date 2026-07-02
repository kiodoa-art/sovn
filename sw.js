const CACHE_VERSION = "nattero-v2.2.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=2.2.0",
  "./app.js?v=2.2.0",
  "./manifest.webmanifest",
  "./assets/favicon.svg",
  "./assets/favicon-16.png",
  "./assets/favicon-32.png",
  "./assets/favicon-64.png",
  "./assets/apple-touch-icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/audio/et-minde.mp3",
  "./assets/audio/kampen-mod-soevnen.mp3",
  "./assets/audio/rolig-vejrtraekning.mp3",
  "./assets/audio/kroppen-mod-madrassen.mp3"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });
    })
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

/* Cache limité à Dérive Lab, sans toucher aux autres applications du domaine. */
const CACHE_NAME = "derive-lab-bafc3a2a6ee5f8b6";
const CACHE_PREFIX = "derive-lab-";
const FILES = ["./", "./index.html", "./app.js?v=58fa37cd0766", "./styles.css?v=af46dad8ad6e", "./math-fonts.css?v=0f43c492102c", "./bootstrap.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable.png", "./apple-touch-icon.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES.map(url => new Request(url, {cache:"reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener("fetch", event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(async response => {
      if (!response.ok) throw new Error("Navigation indisponible");
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
      return response;
    }).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(request, {ignoreSearch:true})) || (await cache.match("./index.html"));
    }));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && url.origin === self.location.origin) await cache.put(request, response.clone());
    return response;
  })());
});


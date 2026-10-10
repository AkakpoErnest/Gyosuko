const CACHE = 'gyosoku-shell-v36';
const SHELL = ["/src/harbor-motion.js", "/src/harbor-motion.css", "/", "/index.html", "/app/", "/app/index.html", "/fisherman/", "/fisherman/index.html", "/src/fisherman.css", "/src/fisherman.js", "/src/backend.js", "/src/home.css", "/src/home.js", "/src/app.js", "/src/data.js", "/src/i18n.js", "/src/styles.css", "/manifest.webmanifest", "/public/logo.png", "/public/bg-harbor.jpg", "/public/icons/icon-192.png", "/public/icons/icon-512.png", "/predictions/", "/predictions/index.html", "/src/predictions.js", "/src/predictions.css", "/public/skipjack-real.png", "/src/guide-logo-motion.js", "/public/gyosoku-guide.gif", "/src/guide-ai.js", "/src/track.js", "/src/sea-brief.js", "/src/sea-extra.js", "/src/guide-lite.js", "/src/guide-lite.css", "/src/tracesource-link.js", "/src/tracesource-link.css", "/src/partners.css", "/public/partners/ckash.png", "/public/partners/kesenmemento-logo.svg", "/src/field-conditions.js", "/src/field-conditions.css", "/src/field-test.js", "/field-test/", "/field-test/index.html", "/feedback/", "/feedback/index.html", "/src/feedback.js", "/src/feedback.css", "/src/processor-motion.js", "/src/processor-motion.css"];
// Two-phase precache: the small set the phone app needs installs first (and must succeed); everything else is best-effort,
// so one slow or missing file on a weak connection can no longer stop offline support from installing.
const CORE = ['/fisherman/', '/fisherman/index.html', '/src/fisherman.css', '/src/fisherman.js', '/src/backend.js', '/src/guide-ai.js', '/src/guide-logo-motion.js', '/manifest.webmanifest', '/public/logo.png', '/public/bg-harbor.jpg', '/public/icons/icon-192.png', '/public/icons/icon-180.png', '/public/icons/icon-512.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    await cache.addAll(CORE);
    await Promise.allSettled(SHELL.filter((u) => !CORE.includes(u)).map((u) => cache.add(u)));
  }));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('gyosoku-shell-') && key !== CACHE).map((key) => caches.delete(key)))));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    if (event.request.mode === 'navigate') {
      const pathname = new URL(event.request.url).pathname;
      return caches.match(pathname.startsWith('/fisherman/') ? '/fisherman/index.html' : pathname.startsWith('/app/') ? '/app/index.html' : '/index.html');
    }
    return Response.error();
  }));
});

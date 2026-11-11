// Service worker: lets the app open without internet.
// Network first (so updates show up), saved copy as backup.
// Change the number in CACHE (v2 -> v3) to force every phone to refresh.
const CACHE = 'fatal-links-v5';
const FILES = [
  './', './index.html', './styles.css', './app.js', './data.js', './i18n.js',
  './firebase.js', './qr.js', './admin.js', './manifest.json', './logo.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  // Save files one by one so a single missing file cannot break the whole install.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => null))))
      .then(() => self.skipWaiting())
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
  if (req.method !== 'GET') return;
  // Firebase SDK files: keep a copy so sign-in code also loads offline.
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
        return res;
      }))
    );
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match('./index.html') || caches.match('./'))
      )
  );
});

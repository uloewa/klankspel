// Service worker — houdt de app op het toestel zodat ze ook zonder wifi opent.
// Verhoog CACHE bij elke wijziging, anders blijft de oude versie hangen.
const CACHE = 'klankspel-v9';

const SCHIL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './stijl.css',
  './ouder.html',
  './js/opslag.js',
  './js/zeg.js',
  './js/lijst.js',
  './data/klanken.json',
  './data/woorden.json',
  './data/aanmoedigingen.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './fonts/Andika-Regular.woff2',
  './fonts/Andika-Bold.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SCHIL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Cache-first: wat in het geheugen zit gaat voor. Zo opent de app ook zonder verbinding.
// Navigaties vallen bij een mislukte fetch terug op index.html.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then((gecached) => {
      if (gecached) return gecached;
      return fetch(req)
        .then((res) => {
          if (res.ok) {
            const kopie = res.clone();
            caches.open(CACHE).then((c) => c.put(req, kopie));
          }
          return res;
        })
        .catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});

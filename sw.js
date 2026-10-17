// Service worker — houdt de app op het toestel zodat ze ook zonder wifi opent.
// Verhoog CACHE bij elke wijziging, anders blijft de oude versie hangen.
const CACHE = 'klankspel-v22';

const SCHIL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './stijl.css',
  './ouder.html',
  './js/opslag.js',
  './js/zeg.js',
  './js/lijst.js',
  './js/log.js',
  './js/motor.js',
  './js/figuren.js',
  './js/familie.js',
  './js/schrijf.js',
  './js/naam.js',
  './js/cijfers.js',
  './js/kleur.js',
  './data/klanken.json',
  './data/woorden.json',
  './data/aanmoedigingen.json',
  './data/motor.json',
  './data/figuren.json',
  './data/schrijven.json',
  './data/cijfers.json',
  './data/tekenen.json',
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
/* Op localhost NOOIT uit het geheugen serveren. Tijdens het bouwen kostte dit al drie keer
   een verkeerde diagnose: je wijzigt een bestand, de service worker geeft de oude terug, en
   je gaat een fout zoeken die je net hebt opgelost. Op het echte adres verandert er niets —
   daar is cache-first juist wat de app offline laat werken. */
const LOKAAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (LOKAAL) return;
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

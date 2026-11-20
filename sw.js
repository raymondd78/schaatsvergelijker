/*
  Service worker van de Schaatsvergelijker (vanaf v63) – maakt de app installeerbaar en offline te openen.

  Wat er gecachet wordt:
    - de app zelf (index.html), het manifest, de iconen en Chart.js van cdnjs;
  Wat NIET via deze cache loopt:
    - de API van SpeedskatingResults.com: de app bewaart tijden zelf in localStorage (6 uur, met oude
      cache als noodoplossing), dus die verzoeken gaan hier ongewijzigd door.

  Strategie:
    - pagina (navigatie): eerst netwerk, zodat een nieuwe versie direct binnenkomt; offline uit de cache;
    - overige bestanden uit APP_FILES: eerst cache, anders netwerk.

  Bij een nieuwe versie: verhoog CACHE (gelijk aan het versienummer van de app). De nieuwe service
  worker neemt het direct over (skipWaiting) en ruimt de oude cache op. Omdat de pagina netwerk-eerst
  wordt geladen, zie je een nieuwe versie bij de eerstvolgende keer openen.
*/
const CACHE = 'schaatsvergelijker-v67';
const CHART_JS = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

/* Installatie: alle app-bestanden in de cache zetten; Chart.js los, zodat een haperende CDN de
   installatie niet blokkeert (dan komt Chart.js bij het eerste gebruik alsnog in de cache) */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        c
          .addAll(APP_FILES.map((u) => new Request(u, { cache: 'reload' })))
          .then(() => c.add(CHART_JS).catch(() => {})),
      )
      .then(() => self.skipWaiting()),
  );
});

/* Activeren: oude caches van eerdere versies verwijderen en direct de open pagina's overnemen */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith('schaatsvergelijker-') && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/* Verzoeken afhandelen */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // pagina: netwerk eerst (verse versie), bij geen verbinding de opgeslagen pagina
  if (req.mode === 'navigate' && url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))),
    );
    return;
  }

  // eigen bestanden en Chart.js: cache eerst
  if (url.origin === self.location.origin || req.url === CHART_JS) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(
        (r) =>
          r ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
  // al het andere (o.a. de API van SpeedskatingResults.com) gaat ongewijzigd naar het netwerk
});

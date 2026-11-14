/* Service worker — CRM OlyLife WLHT
   À chaque nouvelle version de index.html : incrémenter VERSION ci-dessous
   (sinon les téléphones gardent l'ancienne version en cache). */
var VERSION = 'crm-olylife-v3.47';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './qr.js', './aide/index.html', './aide/tutos.json'];

self.addEventListener('install', function (e) {
  // v3.30.6 — le shell est toujours pris sur le réseau (cache HTTP ignoré) : plus de version en retard après une mise à jour
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return fetch(new Request(u, { cache: 'no-store' })).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

/* v3.47 — captures des tutoriels : rangées en cache en arrière-plan (sans retarder l'installation),
   pour que l'aide reste lisible hors ligne. La liste vient de aide/tutos.json. */
function warmAide() {
  return fetch(new Request('./aide/tutos.json', { cache: 'no-store' })).then(function (r) { return r.json(); }).then(function (d) {
    var imgs = [];
    (d.tutos || []).forEach(function (t) { (t.etapes || []).forEach(function (s) { if (s.img) imgs.push(new URL('./aide/img/' + s.img, self.location).href); }); });
    return caches.open(VERSION).then(function (c) {
      return imgs.reduce(function (p, u) {
        return p.then(function () { return c.match(u); }).then(function (hit) { if (hit) return; return fetch(u).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {}); });
      }, Promise.resolve());
    });
  }).catch(function () {});
}

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
  e.waitUntil(warmAide());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // Le serveur Apps Script et les polices : toujours réseau (jamais mis en cache ici)
  if (url.origin !== self.location.origin) return;
  // v3.47 — Aide & tutoriels (dossier aide/). Traité AVANT la règle des pages : sinon la page d'aide
  // serait rangée à la place de index.html dans le cache. Clé de cache sans ?role=… ni #slug.
  if (url.pathname.indexOf('/aide/') >= 0) {
    var key = url.origin + url.pathname.replace(/\/$/, '/index.html');
    var keep = function (res) { if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(key, copy); }); } return res; };
    if (/\.(jpe?g|png|webp)$/i.test(url.pathname)) {
      // Captures : cache d'abord (elles ne changent qu'avec une nouvelle version)
      e.respondWith(caches.match(key).then(function (hit) { return hit || fetch(req).then(keep); }));
    } else {
      // Page et tutos.json : réseau d'abord, copie gardée pour le hors-ligne
      e.respondWith(fetch(new Request(key, { cache: 'no-store' })).then(keep).catch(function () { return caches.match(key); }));
    }
    return;
  }
  // Pages : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(new Request(req.url, { cache: 'no-store', credentials: 'same-origin' })).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put('./index.html', copy); }); }
        return res;
      }).catch(function () { return caches.match('./index.html'); })
    );
    return;
  }
  // Icônes, manifeste : cache d'abord
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});

self.addEventListener('message', function (e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

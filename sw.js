/* Service worker — CRM OlyLife WLHT
   À chaque nouvelle version de index.html : incrémenter VERSION ci-dessous
   (sinon les téléphones gardent l'ancienne version en cache). */
var VERSION = 'crm-olylife-v3.33.1';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './qr.js'];

self.addEventListener('install', function (e) {
  // v3.30.6 — le shell est toujours pris sur le réseau (cache HTTP ignoré) : plus de version en retard après une mise à jour
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return fetch(new Request(u, { cache: 'no-store' })).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // Le serveur Apps Script et les polices : toujours réseau (jamais mis en cache ici)
  if (url.origin !== self.location.origin) return;
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

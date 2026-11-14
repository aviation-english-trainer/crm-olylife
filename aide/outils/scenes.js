/* Scènes des captures — une scène = un téléphone neuf, un petit scénario, une ou plusieurs images.
   Nom de fichier : <slug du tuto>-<n° d'étape>.png. Parcours 0 « Bien démarrer ». */
'use strict';
var UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
var PIN_1234 = 'p' + (function (p) { var h = 5381; for (var i = 0; i < p.length; i++) h = ((h << 5) + h + p.charCodeAt(i)) | 0; return (h >>> 0).toString(36); })('1234') + '_4';

async function profil(page) { await page.evaluate(function () { oProfOpen(); }); await page.waitForTimeout(700); }
async function voir(page, sel) { await page.evaluate(function (s) { var e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'center' }); }, sel); await page.waitForTimeout(250); }

module.exports = [
  /* 1 — Se connecter avec son code d'accès */
  { nom: 'se-connecter', opt: { connecte: false }, jouer: async function (page, t) {
    await t.marquer(page, '#ol-code', '1'); await t.photo(page, 'se-connecter-1'); await t.demarquer(page);
    await page.fill('#ol-code', 'A7K2MN');
    await t.marquer(page, '#ologin .ob.bgold', '2'); await t.photo(page, 'se-connecter-2'); await t.demarquer(page);
    await page.click('#ologin .ob.bgold'); await page.waitForTimeout(1600);
    await t.photo(page, 'se-connecter-3');
  } },

  /* 2 — Installer le CRM sur son téléphone */
  { nom: 'installer-android', opt: { installe: false }, jouer: async function (page, t) {
    await page.waitForTimeout(600);
    await t.marquer(page, '#oinst-android .ob.bgold', '1'); await t.photo(page, 'installer-1'); await t.demarquer(page);
  } },
  { nom: 'installer-iphone', opt: { installe: false, ua: UA_IPHONE }, jouer: async function (page, t) {
    await page.waitForTimeout(600);
    await t.photo(page, 'installer-2');
  } },

  /* 3 — Protéger l'app : code PIN, empreinte ou schéma */
  { nom: 'proteger-reglage', opt: {}, jouer: async function (page, t) {
    await profil(page); await voir(page, '#oprof-pin-row');
    await t.marquer(page, '#oprof-pin-row', '1'); await t.photo(page, 'proteger-1'); await t.demarquer(page);
    await page.evaluate(function () { oProfClose(); oPinSet(); }); await page.waitForTimeout(600);
    await t.photo(page, 'proteger-2');
    await page.evaluate(function () { document.getElementById('olock').classList.remove('on'); oProfOpen(); }); await page.waitForTimeout(600);
    await voir(page, '#oprof-bio-row');
    await t.marquer(page, '#oprof-bio-row', '3'); await t.photo(page, 'proteger-3'); await t.demarquer(page);
  } },
  { nom: 'proteger-verrou', opt: { storage: { owlht2_pin: PIN_1234 } }, jouer: async function (page, t) {
    await page.waitForTimeout(500); await t.photo(page, 'proteger-4');
  } },

  /* 4 — Activer les notifications */
  { nom: 'notifications', opt: {}, jouer: async function (page, t) {
    // Le service de notifications est simulé : rien n'est demandé au vrai serveur d'envoi.
    await page.evaluate(function () {
      CFG.params = CFG.params || {}; CFG.params.liens = CFG.params.liens || {}; CFG.params.liens.onesignalAppId = 'demo';
      window.__sub = false;
      try { Object.defineProperty(Notification, 'permission', { get: function () { return 'granted'; } }); } catch (e) {}
      window.OneSignal = { Notifications: { get permission() { return window.__sub; } }, User: { PushSubscription: { get optedIn() { return window.__sub; } } } };
      PUSH_READY = true;
    });
    await profil(page); await voir(page, '#oprof-push');
    await t.marquer(page, 'label:has(#oprof-push)', '1'); await t.photo(page, 'notifications-1'); await t.demarquer(page);
    await page.evaluate(function () { window.__sub = true; pushProfSt(); }); await page.waitForTimeout(300);
    await t.marquer(page, '#oprof-push-st', '2'); await t.photo(page, 'notifications-2'); await t.demarquer(page);
  } },

  /* 5 — Remplir « Mon profil » */
  { nom: 'profil', opt: {}, jouer: async function (page, t) {
    await page.evaluate(function () { oDrawerOpen(); }); await page.waitForTimeout(600);
    await t.marquer(page, '#odrawer .odr-user', '1'); await t.photo(page, 'profil-1'); await t.demarquer(page);
    await page.evaluate(function () { oDrawerClose(); });
    await profil(page);
    await t.photo(page, 'profil-2');
    await page.fill('#oprof-cal', 'https://calendly.com/camille-martin/rdv-olylife');
    await page.fill('#oprof-zoom', 'https://us05web.zoom.us/j/0000000000');
    await page.fill('#oprof-ea', 'EA000000'); await page.selectOption('#oprof-rang', { index: 2 });
    await voir(page, '#oprof-zoom');
    await t.photo(page, 'profil-3');
    await voir(page, '#oprof .ob.bgold.bfull');
    await t.marquer(page, '#oprof .ob.bgold.bfull', '4'); await t.photo(page, 'profil-4'); await t.demarquer(page);
  } },

  /* 6 — Comprendre l'écran d'accueil et « Ma journée » */
  { nom: 'accueil', opt: {}, jouer: async function (page, t) {
    await t.marquer(page, '#d-kpis', '1'); await t.photo(page, 'accueil-1'); await t.demarquer(page);
    await voir(page, '#d-day');
    await t.marquer(page, '#d-day', '2'); await t.photo(page, 'accueil-2'); await t.demarquer(page);
    await page.evaluate(function () { window.scrollTo(0, 0); document.querySelectorAll('.ov.on,#omain,main').forEach(function (e) { e.scrollTop = 0; }); });
    await voir(page, '#d-hello-t');
    await t.marquer(page, '#onav', '3'); await t.photo(page, 'accueil-3'); await t.demarquer(page);
  } },

  /* 7 — Travailler sans réseau et synchroniser */
  { nom: 'hors-ligne', opt: {}, jouer: async function (page, t) {
    await t.marquer(page, '#osync-dot', '1'); await t.photo(page, 'hors-ligne-1'); await t.demarquer(page);
    // Le réseau « tombe » : une note saisie est gardée sur l'appareil
    t.etat.horsLigne = true;
    await page.evaluate(function () { var c = OC.find(function (x) { return x.id === 'c_demo_1'; }); jrnAdd(c, 'note', 'Souhaite être rappelée en fin de semaine.'); oPush([c]); });
    await page.waitForTimeout(1200);
    await page.evaluate(function () { oSw('dashboard'); }); await voir(page, '#ob-banner');
    await t.marquer(page, '#ob-banner', '2'); await t.photo(page, 'hors-ligne-2'); await t.demarquer(page);
    // Le réseau revient : envoi automatique, ou bouton de synchronisation
    t.etat.horsLigne = false;
    await page.evaluate(function () { obFlush(); }); await page.waitForTimeout(1500);
    await t.marquer(page, '#otop .otop-btn[title="Synchroniser"]', '3'); await t.photo(page, 'hors-ligne-3'); await t.demarquer(page);
  } },

  /* 8 — Les encouragements et le compteur du jour */
  { nom: 'encouragements', opt: {}, jouer: async function (page, t) {
    await page.evaluate(function () { localStorage.setItem('owlht2_cel', JSON.stringify({ d: todayYMD(), n: 3, streak: 2, best: 6 })); celebrate(); });
    await page.waitForTimeout(900);
    await t.photo(page, 'encouragements-1');
    await page.waitForTimeout(3200);
    await profil(page); await voir(page, '#oprof-cel');
    await t.marquer(page, 'label:has(#oprof-cel)', '2'); await t.photo(page, 'encouragements-2'); await t.demarquer(page);
  } }
];

/* Scènes des captures — une scène = un téléphone neuf, un petit scénario, une ou plusieurs images.
   Nom de fichier : <slug du tuto>-<n° d'étape>.png. Parcours 0 « Bien démarrer », 1 « Référent », 2 « Gestionnaire : la fiche et le suivi ». */
'use strict';
var UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
var PIN_1234 = 'p' + (function (p) { var h = 5381; for (var i = 0; i < p.length; i++) h = ((h << 5) + h + p.charCodeAt(i)) | 0; return (h >>> 0).toString(36); })('1234') + '_4';

async function profil(page) { await page.evaluate(function () { oProfOpen(); }); await page.waitForTimeout(700); }
async function voir(page, sel) { await page.evaluate(function (s) { var e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'center' }); }, sel); await page.waitForTimeout(250); }

/* Repère un élément par son texte (le plus petit élément de `dans` dont le texte correspond) et lui donne l'id #tuto-cible. */
async function cible(page, dans, motif, remonter) {
  var ok = await page.evaluate(function (a) {
    var old = document.getElementById('tuto-cible'); if (old) old.removeAttribute('id');
    var re = new RegExp(a.motif, 'i'), best = null;
    document.querySelectorAll(a.dans + ' *').forEach(function (e) {
      if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') return;
      var t = (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
      if (re.test(t) && (!best || t.length <= best.t.length)) best = { e: e, t: t };
    });
    if (!best) return false;
    var e = best.e; for (var i = 0; i < (a.remonter || 0); i++) e = e.parentElement || e;
    e.id = 'tuto-cible'; e.scrollIntoView({ block: 'center' }); return true;
  }, { dans: dans, motif: motif, remonter: remonter || 0 });
  if (!ok) throw new Error('cible introuvable : ' + motif);
  await page.waitForTimeout(300);
}
async function champ(page, dans, libelle, valeur) {
  await page.evaluate(function (a) {
    var re = new RegExp('^' + a.libelle, 'i');
    var lab = [].slice.call(document.querySelectorAll(a.dans + ' label')).filter(function (l) { return l.offsetParent && re.test(l.textContent.trim()); })[0];
    if (!lab) throw new Error('champ introuvable : ' + a.libelle);
    var inp = lab.parentElement.querySelector('input,textarea,select'); inp.value = a.valeur; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, { dans: dans, libelle: libelle, valeur: valeur });
}
/* Les exemples grisés des champs (adresse, n° de commande…) sont retirés : aucune donnée d'apparence réelle dans une capture. */
async function neutre(page) { await page.evaluate(function () { document.querySelectorAll('#ov-nouvelle input, #ov-nouvelle textarea').forEach(function (i) { if (/\d/.test(i.placeholder || '')) i.placeholder = ''; }); }); }
async function rubrique(page, motif) {
  await page.evaluate(function (m) { var re = new RegExp(m, 'i'); var e = [].slice.call(document.querySelectorAll('#omo *')).filter(function (x) { return x.onclick && re.test((x.innerText || '').trim()); })[0]; if (e) { e.click(); e.scrollIntoView({ block: 'start' }); } }, motif);
  await page.waitForTimeout(450);
}
async function fiche(page, id) { await page.evaluate(function (i) { oOpenF(i); }, id); await page.waitForTimeout(800); }
async function fermerTout(page) { await page.evaluate(function () { ['ozoom', 'osend', 'odupc'].forEach(function (i) { var e = document.getElementById(i); if (e) e.remove(); }); document.querySelectorAll('body > div').forEach(function (d) { if (+d.style.zIndex >= 2000 && !d.id) d.remove(); }); }); }
function jour(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

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
,
  /* ═════════ Parcours 1 — Référent ═════════ */

  /* 9 — Ajouter un contact */
  { nom: 'ajouter-contact', opt: { role: 'referent' }, jouer: async function (page, t) {
    await t.marquer(page, '#ofab', '1'); await t.photo(page, 'ajouter-contact-1'); await t.demarquer(page);
    await page.evaluate(function () { oNew(); }); await page.waitForTimeout(600); await neutre(page);
    await champ(page, '#ov-nouvelle', 'Nom', 'MOREAU'); await champ(page, '#ov-nouvelle', 'Prénom', 'Claire');
    await champ(page, '#ov-nouvelle', 'Téléphone', '+33 6 39 98 10 20'); await champ(page, '#ov-nouvelle', 'Ville', 'Angers');
    await cible(page, '#ov-nouvelle', '^Prénom', 1);
    await t.photo(page, 'ajouter-contact-2');
    await voir(page, '#obtn-save');
    await t.marquer(page, '#obtn-save', '3'); await t.photo(page, 'ajouter-contact-3'); await t.demarquer(page);
  } },

  /* 10 — Faire inscrire une personne par QR code ou lien */
  { nom: 'inscription-qr', opt: { role: 'referent' }, jouer: async function (page, t) {
    await profil(page); await cible(page, '#oprof', '^📲 Afficher mon QR code$');
    await t.marquer(page, '#tuto-cible', '1'); await t.photo(page, 'inscription-qr-1'); await t.demarquer(page);
    await page.evaluate(function () { oProfClose(); oMyQr(); }); await page.waitForTimeout(1200);
    await t.photo(page, 'inscription-qr-2');
    await fermerTout(page);
    await page.evaluate(function () { oSw('demandes'); }); await page.waitForTimeout(900);
    await t.photo(page, 'inscription-qr-3');
  } },

  /* 11 — Suivre mes contacts et leur avancement */
  { nom: 'suivre-contacts', opt: { role: 'referent' }, jouer: async function (page, t) {
    await page.evaluate(function () { oSw('contacts'); }); await page.waitForTimeout(700);
    await t.marquer(page, '#ofilter-st', '1'); await t.photo(page, 'suivre-contacts-1'); await t.demarquer(page);
    await fiche(page, 'c_demo_4');
    await t.photo(page, 'suivre-contacts-2');
    await cible(page, '#omo', '^📨 Demander une modification');
    await t.marquer(page, '#tuto-cible', '3'); await t.photo(page, 'suivre-contacts-3'); await t.demarquer(page);
  } },

  /* 12 — Envoyer une demande d'informations (découverte, puis inscription) */
  { nom: 'demande-infos', opt: { role: 'referent' }, jouer: async function (page, t) {
    await page.evaluate(function () { oDrawerOpen(); }); await page.waitForTimeout(600);
    await voir(page, '#odr-dec');
    await t.marquer(page, '#odr-dec', '1'); await t.photo(page, 'demande-infos-1'); await t.demarquer(page);
    await page.evaluate(function () { oDrawerClose(); oDecOpen(); }); await page.waitForTimeout(700);
    await page.fill('#dc-pr', 'Claire'); await page.fill('#dc-nm', 'Moreau'); await page.fill('#dc-tel', '+33 6 39 98 10 20');
    await page.evaluate(function () { var b = document.querySelectorAll('#dc-int button,#dc-int label,#dc-int .ofilter-chip'); if (b[0]) b[0].click(); if (b[4]) b[4].click(); });
    await voir(page, '#dc-int');
    await t.photo(page, 'demande-infos-2');
    await page.evaluate(function () { oDecClose(); oReqOpen(); }); await page.waitForTimeout(700);
    await page.fill('#rq-pr', 'Claire'); await page.fill('#rq-nm', 'Moreau'); await page.fill('#rq-tel', '+33 6 39 98 10 20');
    await page.evaluate(function () { oReqPrev(); }); await voir(page, '#rq-tel');
    await t.photo(page, 'demande-infos-3');
  } },

  /* 13 — Demander une visio à mon gestionnaire */
  { nom: 'demander-visio', opt: { role: 'referent' }, jouer: async function (page, t) {
    await fiche(page, 'c_demo_3'); await cible(page, '#omo', '^🎥 Zoom$');
    await t.marquer(page, '#tuto-cible', '1'); await t.photo(page, 'demander-visio-1'); await t.demarquer(page);
    await page.evaluate(function () { oZoomAsk('c_demo_3'); }); await page.waitForTimeout(700);
    await t.photo(page, 'demander-visio-2');
    await page.evaluate(function (d) { zaMode('later'); document.getElementById('zoom-d').value = d; document.getElementById('zoom-h').value = '14:30'; zaRefresh(); }, jour(2));
    await page.waitForTimeout(300);
    await t.marquer(page, '#zoom-later', '3'); await t.photo(page, 'demander-visio-3'); await t.demarquer(page);
  } },

  /* 14 — Recueillir le consentement e-mail */
  { nom: 'consentement-ref', opt: { role: 'referent' }, jouer: async function (page, t) {
    await page.evaluate(function () { oDecOpen(); }); await page.waitForTimeout(700);
    await page.fill('#dc-pr', 'Claire'); await page.fill('#dc-em', 'claire.moreau@exemple.fr'); await page.fill('#dc-tel', '+33 6 39 98 10 20');
    await page.evaluate(function () { var c = document.getElementById('dc-camp'); c.disabled = false; c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await t.marquer(page, 'label:has(#dc-camp)', '1'); await t.photo(page, 'consentement-1'); await t.demarquer(page);
  } },
  { nom: 'consentement-gest', opt: {}, jouer: async function (page, t) {
    await fiche(page, 'c_demo_5');
    await rubrique(page, '^📧 campagne e-mail');
    await cible(page, '#omo', '^📨 Demander le consentement');
    await t.marquer(page, '#tuto-cible', '2'); await t.photo(page, 'consentement-2'); await t.demarquer(page);
  } },

  /* 15 — Proposer un témoignage */
  { nom: 'temoignage-ref', opt: { role: 'referent' }, jouer: async function (page, t) {
    await fiche(page, 'c_demo_7'); await rubrique(page, '^🌿 accompagnement');
    await cible(page, '#omo', '^➕ Témoignage$');
    await t.marquer(page, '#tuto-cible', '1'); await t.photo(page, 'proposer-temoignage-1'); await t.demarquer(page);
    await page.evaluate(function () { document.getElementById('tuto-cible').click(); }); await page.waitForTimeout(800);
    await t.photo(page, 'proposer-temoignage-2');
    await page.evaluate(function () { var e = document.querySelector('.on textarea'); if (e) e.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(300);
    await t.photo(page, 'proposer-temoignage-3');
  } },

  /* 16 — Voir mes contacts utiles */
  { nom: 'contacts-utiles', opt: { role: 'referent' }, jouer: async function (page, t) {
    await t.marquer(page, '.ucbar', '1'); await t.photo(page, 'contacts-utiles-1'); await t.demarquer(page);
    await page.evaluate(function () { document.querySelector('.ucbar .ochd').click(); }); await page.waitForTimeout(500);
    await voir(page, '#uc-equipe');
    await t.photo(page, 'contacts-utiles-2');
  } },

  /* ═════════ Parcours 2 — Gestionnaire : la fiche et le suivi ═════════ */

  /* 17 — Lire une fiche en un coup d'œil */
  { nom: 'lire-fiche', opt: {}, jouer: async function (page, t) {
    await fiche(page, 'c_demo_3');
    await t.photo(page, 'lire-fiche-1');
    await cible(page, '#omo', '^Suivi du contact$');
    await page.evaluate(function () { document.getElementById('tuto-cible').scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(300);
    await t.photo(page, 'lire-fiche-2');
    await cible(page, '#omo', '^Journal des actions');
    await page.evaluate(function () { var e = document.getElementById('tuto-cible'); (e.onclick ? e : e.parentElement).click(); e.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(400);
    await t.photo(page, 'lire-fiche-3');
  } },

  /* 18 — Statuts, étapes et pipeline */
  { nom: 'statuts-pipeline', opt: {}, jouer: async function (page, t) {
    await fiche(page, 'c_demo_3');
    await page.evaluate(function () { var b = document.querySelector('#omo [onclick*="oSetStatut"]'); b.parentElement.id = 'tuto-cible'; b.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300);
    await t.marquer(page, '#tuto-cible', '1'); await t.photo(page, 'statuts-pipeline-1'); await t.demarquer(page);
    await page.evaluate(function () { oClose(); oSw('pipeline'); }); await page.waitForTimeout(800);
    await t.photo(page, 'statuts-pipeline-2');
    await page.evaluate(function () { oCtxOpen('c_demo_3'); }); await page.waitForTimeout(600);
    await t.marquer(page, '#octx-st', '3'); await t.photo(page, 'statuts-pipeline-3'); await t.demarquer(page);
  } },

  /* 19 — Les actions du jour */
  { nom: 'actions-du-jour', opt: {}, jouer: async function (page, t) {
    await page.evaluate(function () { oSw('actions'); }); await page.waitForTimeout(800);
    await t.photo(page, 'actions-du-jour-1');
    await page.evaluate(function () { var h = document.querySelector('#ov-actions .oacc-hd'); h.click(); h.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(500);
    await t.photo(page, 'actions-du-jour-2');
    await cible(page, '#ov-actions', '^Marquer fait$');
    await t.marquer(page, '#tuto-cible', '3'); await t.photo(page, 'actions-du-jour-3'); await t.demarquer(page);
  } },

  /* 20 — Envoyer un message par le bon canal — 21 — Personnaliser un message avant l'envoi */
  { nom: 'message', opt: {}, jouer: async function (page, t) {
    await page.evaluate(function () { oSw('actions'); }); await page.waitForTimeout(800);
    await page.evaluate(function () { var h = document.querySelector('#ov-actions .oacc-hd'); h.click(); h.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(500);
    await cible(page, '#ov-actions', '^🇫🇷 Français$', 1);
    await t.marquer(page, '#tuto-cible', '1'); await t.photo(page, 'personnaliser-message-1'); await t.demarquer(page);
    await t.marquer(page, '#ov-actions .oacc-ta', '2'); await t.photo(page, 'personnaliser-message-2'); await t.demarquer(page);
    await cible(page, '#ov-actions', '^Envoyer sur WhatsApp');
    await t.marquer(page, '#tuto-cible', '1'); await t.photo(page, 'envoyer-message-1'); await t.demarquer(page);
    await page.evaluate(function () { document.getElementById('tuto-cible').click(); }); await page.waitForTimeout(700);
    await t.marquer(page, '#osend .snd-grid', '2'); await t.photo(page, 'envoyer-message-2'); await t.demarquer(page);
    await t.marquer(page, 'label:has(#snd-remember)', '3'); await t.photo(page, 'envoyer-message-3'); await t.demarquer(page);
  } },

  /* 22 — Noter une observation, poser un rappel */
  { nom: 'observation-rappel', opt: {}, jouer: async function (page, t) {
    await fiche(page, 'c_demo_1'); await cible(page, '#omo', 'Valider un contact / ajouter une observation$');
    await t.marquer(page, '#tuto-cible', '1'); await t.photo(page, 'observation-rappel-1'); await t.demarquer(page);
    await page.evaluate(function () { oOpenSuivi('c_demo_1'); }); await page.waitForTimeout(700);
    await page.fill('#osv-txt', 'Échange de dix minutes. Souhaite en parler à son mari, à rappeler jeudi.');
    await t.photo(page, 'observation-rappel-2');
    await page.evaluate(function () { var c = document.getElementById('osv-rap-on'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); if (c.onclick) c.onclick(); });
    await page.waitForTimeout(400); await voir(page, '#osv-rap-on');
    await t.marquer(page, 'label:has(#osv-rap-on)', '3'); await t.photo(page, 'observation-rappel-3'); await t.demarquer(page);
  } },

  /* 23 — Prendre un rendez-vous */
  { nom: 'prendre-rdv', opt: {}, jouer: async function (page, t) {
    await fiche(page, 'c_demo_3'); await cible(page, '#omo', '^📅 RDV$');
    await t.marquer(page, '#tuto-cible', '1'); await t.photo(page, 'prendre-rdv-1'); await t.demarquer(page);
    await page.evaluate(function () { oCalOpen('c_demo_3'); }); await page.waitForTimeout(700);
    await t.photo(page, 'prendre-rdv-2');
    await page.evaluate(function () { oCalClose(); oClose(); oSw('agenda'); }); await page.waitForTimeout(800);
    await t.photo(page, 'prendre-rdv-3');
  } },

  /* 24 — Lancer une visio Zoom et y ajouter des personnes */
  { nom: 'visio-zoom', opt: {}, jouer: async function (page, t) {
    await fiche(page, 'c_demo_3');
    await page.evaluate(function () { oZoomOpen('c_demo_3'); }); await page.waitForTimeout(700);
    await t.marquer(page, '#zoom-m-now', '1'); await t.photo(page, 'visio-zoom-1'); await t.demarquer(page);
    await cible(page, '#ozoom', '^👥 Ajouter une personne', 1);
    await t.marquer(page, '#tuto-cible', '2'); await t.photo(page, 'visio-zoom-2'); await t.demarquer(page);
    await cible(page, '#ozoom', '^📤 Envoyer et ouvrir ma salle');
    await t.marquer(page, '#tuto-cible', '3'); await t.photo(page, 'visio-zoom-3'); await t.demarquer(page);
  } },

  /* 25 — Compléter une fiche incomplète */
  { nom: 'fiche-incomplete', opt: {}, jouer: async function (page, t) {
    await page.evaluate(function () { oSw('contacts'); }); await page.waitForTimeout(700);
    await cible(page, '#ov-contacts', '^✍️ 11$');
    await t.marquer(page, '#tuto-cible', '1'); await t.photo(page, 'fiche-incomplete-1'); await t.demarquer(page);
    await fiche(page, 'c_demo_7'); await cible(page, '#omo', '^Fiche à compléter — 11 champs manquants$', 2);
    await page.evaluate(function () { document.getElementById('tuto-cible').scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(300);
    await t.photo(page, 'fiche-incomplete-2');
    await page.evaluate(function () { oClose(); oEdit('c_demo_7'); }); await page.waitForTimeout(800); await neutre(page);
    await page.evaluate(function () { var m = document.querySelector('#ov-nouvelle .miss-lbl'); if (m) m.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300);
    await t.photo(page, 'fiche-incomplete-3');
  } },

  /* 26 — Repérer et fusionner les doublons */
  { nom: 'doublons', opt: { role: 'admin' }, jouer: async function (page, t) {
    await page.evaluate(function () { oSw('equipe'); }); await page.waitForTimeout(800);
    await cible(page, '#eq-admin-tools', 'Supprimer les doublons$');
    await t.marquer(page, '#tuto-cible', '2'); await t.photo(page, 'doublons-1'); await t.demarquer(page);
  } }
];

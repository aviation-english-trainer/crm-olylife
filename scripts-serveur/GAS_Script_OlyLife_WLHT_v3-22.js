// ═══════════════════════════════════════════════════════════════════
// SCRIPT GOOGLE APPS — CRM OLYLIFE WLHT v2
// v3.15 — CAMPAGNES E-MAIL (Systeme.io) & CONSENTEMENT
//         · le CRM pilote les campagnes par TAGS Systeme.io (API publique) : oly_decouverte / oly_reseau / oly_stop + ref_<équipe>
//         · inscription seulement si e-mail + consentement tracé (emailConsent, emailConsentLe, emailConsentSrc)
//         · passage « Dans le réseau » / « Abandon » → bascule automatique de parcours côté serveur
//         · webhook Systeme.io « Tag ajouté » : oly_desinscrit (règle « désabonné ») → consentement retiré ; oly_fin_* → campagne terminée
// v3.22 · ADRESSES : une seule adresse (facturation = livraison par défaut) ; livraison à une autre adresse / autre
//         personne (livNom, livPrenom, livTel, livEmail, livAdresse, livCp, livVille, livPays) reçue du formulaire d'inscription
//         et reportée dans la fiche à l'intégration. Les anciens champs fact* restent acceptés (compatibilité).
// v3.21 · DEMANDES (formulaires publics) : e-mail de la personne « par qui avez-vous entendu parler » (viaEmail) et e-mail
//         de remerciement à cette personne (nom, prénom, e-mail, téléphone seulement) · récapitulatif e-mail au demandeur
//         (tout ce qu'il a saisi, mot de passe jamais repris, pièce masquée) · alerte aussi à l'e-mail du profil du super-admin
//         · la demande garde la liste des destinataires (alerteA) · pièce d'identité recopiée dans la fiche à l'intégration.
// v3.20 · CONSENTEMENT PAR LIEN : page publique consentement.html?r=<lien du membre>&c=<id fiche> → op consentInfo / consent
//         (consentement e-mail tracé emailConsentSrc = 'lien', inscription Découverte automatique) ; limite 30 / h par lien.
//         · NOTIFICATIONS PUSH (OneSignal) : propriété de script ONESIGNAL_KEY (clé REST) + App ID dans Administration → Liens.
//           pushSend_() : nouvelle demande, RDV Calendly, avance / don enregistré, rappel d'avance → téléphones des membres concernés.
// v3.19 · SUPER-ADMIN & DROITS : le compte « root » (ADMIN_CODE) est le super-admin — lui seul crée / modifie / retire
//         des administrateurs (op saveUsers) et enregistre la matrice des droits (config.params.droits, op saveConfig).
//         Droits « clients / prospects » appliqués côté serveur : formulaires publics, campagnes automatiques,
//         e-mails d'annonce et rappels courtois d'avances. · saveMyProfile enregistre aussi le lien Calendly personnel.
// v3.18 · AVANCES & DONS — e-mails d'annonce automatiques dès l'enregistrement (op upsert) : au bénéficiaire, à la personne
//         qui avance / donne (gestionnaire, référent ou client), aux gestionnaires de la fiche et à l'admin, avec le message
//         WhatsApp prêt pour chacun ; marquage a.notifLe / a.notifA renvoyé à l'app (clé « notif »)
//         · rappels d'avances J-3 · veille · J : le bénéficiaire reçoit aussi un rappel courtois par e-mail (jamais en retard)
//         · les dons : annonce + remerciement, aucun rappel
// v3.17 · correctif pull : saveDB_ après payload_ pour persister les pubTokens (bug « Lien invalide »)
// v3.16 · formulaires publics (lien de l'admin) : « Par qui en avez-vous entendu parler ? » → téléphone reconnu → demande
//         rattachée au bon référent / gestionnaire, journal dans la fiche de la personne qui a recommandé, e-mail d'alerte adapté
//         · inscription automatique à la campagne « Découverte » de tout contact À contacter / En cours / Prêt ayant e-mail + consentement
//         · tag oly_encours posé/retiré selon le statut « En cours » (newsletter hebdomadaire Zoom du comité) · op sioBulk (rattrapage)
//         ▶ Réglages : Projet → Paramètres → Propriétés du script → SIO_API_KEY (clé « Public API » Systeme.io)
//           et SIO_HOOK_SECRET (mot de passe libre, repris dans l'URL du webhook : …/exec?hook=sio&k=<secret>)
// v3.14 — CLOISONNEMENT DES GESTIONNAIRES & COMITÉ
//         · un gestionnaire ne voit que ses contacts, ses référents (rattachés ou partageant ses tags) et leurs contacts / demandes
//           — il ne voit plus les autres gestionnaires ; « voit tout » devient une exception explicite (périmètre « tout »)
//         · alerte « nouvelle demande » : à la personne dont c'est le lien + à son/ses gestionnaire(s) + à l'admin
//         · un gestionnaire ou un référent peut AUSSI être membre du comité scientifique (u.comite)
//         · option « voit le comité scientifique » (u.voitComite) : ses membres apparaissent dans les Contacts utiles
// v3.13 — FACTURES & MOT DE PASSE OLYLIFE (temporaire)
//         · factures PDF déposées dans Drive « CRM OlyLife — Factures » (lien en lecture seule pour l'envoi au client)
//         · mot de passe du compte OlyLife du client : coffre séparé (db.secrets), JAMAIS renvoyé avec les fiches,
//           consultable à la demande (admin / gestionnaire de la fiche, tracé dans le journal d'administration),
//           effacé définitivement après l'envoi de la facture
//         · le mot de passe d'une demande QR est transféré sur la fiche au moment de l'intégration
//         · e-mail « nouvelle demande » : envoyé à l'e-mail du profil ET à celui du résumé quotidien ; invitations d'agenda → e-mail du profil
// v3.12 — DEMANDES : lien profond du courriel (?go=demandes) · visibilité par personne (admin = tout, gestionnaire = selon périmètre, référent = les siennes) · suppression réservée à l'admin · fiche et suivi mémorisés à l'intégration
// v3.11 — PARCOURS DÉCOUVERTE : formulaire public decouverte.html (prénom, WhatsApp, centres d'intérêt)
//         → « Demandes reçues » type « decouverte » (nom facultatif, e-mail de notification adapté)
// v3.10 — E-MAILS HTML envoyés par le CRM (kit de bienvenue, messages) via MailApp, au nom du membre, réponse vers son adresse
// v3.9 — QR CODE D'INSCRIPTION (formulaire public → « Demandes reçues ») · OCR des captures d'écran (Drive API)
//        ▶ Pour l'OCR : éditeur Apps Script → Services (+) → « Drive API » (v3) → Ajouter, puis Nouvelle version
// v3.8 — ADMINISTRATION : paramètres (relances, catalogue, seuils de rang, liens, signature) dans config.params
// v3.7 — SÉCURITÉ : sessions par appareil (jeton, expiration, révocation), frein anti-force brute,
//        journal d'administration, restauration de sauvegarde, masquage des pièces d'identité,
//        périmètre des gestionnaires (tout / ses équipes)
// v3.6 — Ressources (protocoles, précautions, témoignages audio sur Drive) · rôle « comité »
// v3.5 — Photos de profil (utilisateurs + contacts) · « Mon profil » · Multi-utilisateurs · Rôles · Codes d'accès · Filtrage serveur
// + rappels automatiques des AVANCES D'ARGENT (J-3, J-1, jour J, retard)
// + digest email par utilisateur (heure choisie) · sauvegarde Drive journalière
// ▶ Après collage : Exécuter → installerDeclencheurs (une seule fois)
// + Email matinal automatique (conservé de la v1)
// ═══════════════════════════════════════════════════════════════════
//
// NOUVEAUTÉS v2 :
// • Connexion par code d'accès — chaque personne a le sien
// • 3 rôles : admin (tout voir/tout gérer), gestionnaire (contacts
//   attribués), referent (uniquement les contacts qu'il a référés)
// • Le serveur ne renvoie QUE les contacts autorisés — le filtrage
//   n'est pas fait dans le navigateur
// • Sauvegarde fiche par fiche (upsert) : deux personnes peuvent
//   travailler en même temps sans écraser le travail de l'autre
// • Stockage dans un fichier JSON sur votre Google Drive
//   (plus de limite de taille, et vous pouvez le consulter)
// • Migration automatique : au premier lancement, les contacts de
//   la v1 (PropertiesService) sont repris tels quels
//
// ── INSTALLATION / MISE À JOUR ──────────────────────────────────────
// 1. script.google.com → ouvrir le projet existant du CRM
// 2. Remplacer TOUT le code par ce fichier → personnaliser les
//    3 constantes ci-dessous → Enregistrer
// 3. Déployer → GÉRER LES DÉPLOIEMENTS → ✏️ Modifier →
//    Version : « Nouvelle version » → Déployer
//    ⚠️ Surtout PAS « Nouveau déploiement » : cela changerait l'URL.
//    En passant par « Gérer les déploiements », l'URL /exec reste
//    IDENTIQUE et rien n'est à reconfigurer côté application.
// 4. Recharger l'application → se connecter avec le CODE ADMIN
//    ci-dessous → créer les utilisateurs dans l'onglet Équipe.
//
// EMAIL MATINAL : inchangé. Si le déclencheur était déjà installé
// en v1, il continue de fonctionner. Sinon : ▶ Exécuter →
// installerDeclencheur → Autoriser.
// ═══════════════════════════════════════════════════════════════════

// ╔═══════════════════════════════════════════════════════════════╗
// ║  À PERSONNALISER AVANT DÉPLOIEMENT                            ║
// ╚═══════════════════════════════════════════════════════════════╝
var ADMIN_CODE = 'WLHT-OLYLIFE-2026';         // ← code d'accès admin — changez-le si besoin
var ADMIN_NOM  = 'Jean-Charles';              // ← nom affiché du 1er admin
var MON_EMAIL  = 'teamwaterlifehightech@gmail.com'; // ← email pour les rappels du matin
var SESSION_JOURS = 30;        // durée d'une session (jours) avant nouvelle saisie du code
var LOGIN_CODE_GET = true;
var LEADS_MAX_JOURS = 60;      // demandes reçues (QR) conservées au plus 60 jours
var LEAD_RATE_HEURE = 30;      // demandes max par heure et par QR (anti-spam)
var APP_PUBLIC_URL = 'https://crm.team-waterlifehightech.com/';     // false = interdire l'ancienne connexion par code dans l'URL (une fois toute l'équipe passée en v3.12+)

// Constantes métier (garder identiques à l'application)
var SEUIL_LOGISTIQUE = 5;
var DELAI_INSTALL    = 7;
var DELAI_TEMOIGNAGE = 30;

// Techniques
var CRM_KEY_V1  = 'olylife_wlht_crm_data';        // ancienne clé v1 (migration)
var DB_FILE_KEY = 'owlht_db_file_id';
var DB_FILENAME = 'CRM_OlyLife_WLHT_DB.json';

// ── BASE DE DONNÉES (fichier JSON sur Drive) ────────────────────────
function getDB_() {
  var props = PropertiesService.getScriptProperties();
  var fileId = props.getProperty(DB_FILE_KEY);
  var file = null;
  if (fileId) {
    try { file = DriveApp.getFileById(fileId); if (file.isTrashed()) file = null; } catch (e) { file = null; }
  }
  if (!file) {
    // Première exécution : créer le fichier + migrer les données v1
    var init = { contacts: [], users: [], config: { referents: [] } };
    var old = props.getProperty(CRM_KEY_V1);
    if (old) {
      try {
        var p = JSON.parse(old);
        if (p && p.contacts && p.contacts.length) init.contacts = p.contacts;
      } catch (e) {}
    }
    file = DriveApp.createFile(DB_FILENAME, JSON.stringify(init), 'application/json');
    props.setProperty(DB_FILE_KEY, file.getId());
    return init;
  }
  try {
    var db = JSON.parse(file.getBlob().getDataAsString());
    if (!db.contacts) db.contacts = [];
    if (!db.users) db.users = [];
    if (!db.config) db.config = { referents: [] };
    if (!db.config.referents) db.config.referents = [];
    return db;
  } catch (e) {
    return { contacts: [], users: [], config: { referents: [] } };
  }
}
function saveDB_(db) {
  var fileId = PropertiesService.getScriptProperties().getProperty(DB_FILE_KEY);
  DriveApp.getFileById(fileId).setContent(JSON.stringify(db));
}

// ── UTILISATEURS & DROITS ───────────────────────────────────────────
function findUser_(db, code) {
  if (!code) return null;
  code = String(code).trim();
  if (code === ADMIN_CODE) {
    var rd = {};
    try { rd = JSON.parse(PropertiesService.getScriptProperties().getProperty('root_digest') || '{}'); } catch (e) {}
    var rp = (db.config && db.config.rootProfile) || {};   // v3.5 — photo / tél / email de l'admin principal
    return { id: 'root', nom: ADMIN_NOM, role: 'admin', superAdmin: true, tags: [], digestEmail: rd.email || MON_EMAIL, digestHeure: rd.heure || '07:00', calendlyUrl: rd.cal || '', photo: rp.photo || '', tel: rp.tel || '', email: rp.email || '' };
  }
  var users = db.users || [];
  for (var i = 0; i < users.length; i++) {
    if (users[i] && users[i].code && String(users[i].code).trim() === code && users[i].actif !== false) {
      return users[i];
    }
  }
  return null;
}
function isVisible_(c, user) {
  if (!c) return false;
  if (user.role === 'admin') return true;
  var tags = user.tags || [];
  // gestionnaire : voit tout le pipeline — sauf si son périmètre est limité à ses équipes (v3.7)
  if (user.role === 'gestionnaire') {
    if (user.scope === 'tout') return true;                                   // exception explicite
    if (suivis_(c).indexOf(user.nom) >= 0 || c.createdBy === user.nom) return true;
    var sc = scope_(user);
    if (sc.names.indexOf(c.refere || '') >= 0 || sc.names.indexOf(c.createdBy || '') >= 0 || sc.names.indexOf(c.referentNom || '') >= 0) return true;
    if (sc.tags.indexOf(c.refere || '') >= 0) return true;
    var cts = c.ctags || [];
    for (var gi = 0; gi < cts.length; gi++) if (sc.tags.indexOf(cts[gi]) >= 0) return true;
    return false;
  }
  // référent : les contacts qui portent son tag (ctags) ou qu'il a référés
  if (tags.indexOf(c.refere || '') >= 0 || (c.refere || '') === user.nom) return true;
  var ct = c.ctags || [];
  for (var i = 0; i < tags.length; i++) if (ct.indexOf(tags[i]) >= 0) return true;
  return c.createdBy === user.nom || c.referentNom === user.nom;
}
function visibleContacts_(db, user) {
  var out = [];
  (db.contacts || []).forEach(function (c) { if (isVisible_(c, user)) out.push(c); });
  return out;
}
function suiveursFor_(db, user) {
  var all = suiveurs_(db);
  if (!user || user.role === 'admin' || (user.role === 'gestionnaire' && user.scope === 'tout')) return all;
  var ok = [ADMIN_NOM];
  (db.users || []).forEach(function (u) { if (u.role === 'admin' && u.actif !== false && ok.indexOf(u.nom) < 0) ok.push(u.nom); });
  if (user.role === 'gestionnaire') ok.push(user.nom);
  else gestsOfUser_(db, user).forEach(function (g) { if (ok.indexOf(g.nom) < 0) ok.push(g.nom); });
  return all.filter(function (n) { return ok.indexOf(n) >= 0; });
}
function suiveurs_(db) {
  var names = [ADMIN_NOM];
  (db.users || []).forEach(function (u) {
    if (u && u.actif !== false && (u.role === 'admin' || u.role === 'gestionnaire') && names.indexOf(u.nom) < 0) {
      names.push(u.nom);
    }
  });
  return names;
}
// v3.6.1 — « Contacts utiles » : admin + gestionnaires (nom, rôle, tél, e-mail, photo) visibles par tous les rôles
function equipe_(db, user) {
  var rp = (db.config && db.config.rootProfile) || {};
  var out = [{ nom: ADMIN_NOM, role: 'admin', tel: rp.tel || '', email: rp.email || '', photo: rp.photo || '' }];
  var isAdm = !user || user.role === 'admin';
  var refIds = (user && user.role === 'gestionnaire') ? scope_(user).ids : [];
  var mesGests = (user && user.role !== 'admin' && user.role !== 'gestionnaire') ? gestsOfUser_(db, user).map(function (g) { return g.id; }) : [];
  (db.users || []).forEach(function (u) {
    if (!u || u.actif === false || u.pending) return;
    var ok = false;
    if (u.role === 'admin') ok = true;
    else if (isAdm) ok = u.role === 'gestionnaire' || estComite_(u);
    else if (u.id === user.id) ok = true;
    else if (user.role === 'gestionnaire' && refIds.indexOf(u.id) >= 0) ok = true;              // ses référents
    else if (mesGests.indexOf(u.id) >= 0) ok = true;                                          // le(s) gestionnaire(s) du référent
    else if (estComite_(u) && voitComite_(user)) ok = true;                                   // comité, si autorisé
    else if (estComite_(user) && u.voitComite) ok = true;                                     // le comité voit qui peut échanger avec lui
    if (ok) out.push({ nom: u.nom, role: u.role, comite: !!u.comite, tel: u.tel || '', email: u.email || '', photo: u.photo || '' });
  });
  return out;
}
// v3.19 — matrice des droits (config.params.droits[role][cle]) ; valeur par défaut si non réglée
function droit_(db, role, key, def) { try { var d = db.config && db.config.params && db.config.params.droits; if (d && d[role] && d[role][key] !== undefined) return !!d[role][key]; } catch (e) {} return def !== false; }
function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.TEXT);
}

// ── GET : connexion + lecture filtrée ───────────────────────────────
function doGet(e) {
  // Ancienne connexion (code dans l'URL) — conservée pour les anciennes versions de l'app ; passez LOGIN_CODE_GET à false pour la couper
  if (!LOGIN_CODE_GET) return out_({ ok: false, error: 'auth' });
  var code = (e && e.parameter && e.parameter.code) ? e.parameter.code : '';
  var db = getDB_();
  var user = findUser_(db, code);
  if (!user) { loginFail_(); return out_({ ok: false, error: 'auth' }); }
  return out_(payload_(db, user));
}
// Masque une pièce d'identité pour les rôles non admin (seuls les 4 derniers caractères restent lisibles)
function maskId_(v) { v = String(v || ''); if (!v) return ''; return '••••' + v.slice(-4); }
// ── v3.13 — coffre des mots de passe OlyLife (séparé des fiches, jamais renvoyé en liste) ──
var SRV_VERSION = '3.22';
function secrets_(db) { if (!db.secrets || typeof db.secrets !== 'object') db.secrets = {}; return db.secrets; }
function secKey_(cid, key) { return String(cid || '') + '|' + String(key || 'main'); }
function mdpFlags_(db, cid) {
  var out = {}, sec = secrets_(db), pre = String(cid) + '|';
  Object.keys(sec).forEach(function (k) { if (k.indexOf(pre) === 0) out[k.slice(pre.length)] = (sec[k].le || '').slice(0, 10) || '1'; });
  return out;
}
// Qui peut voir / modifier le mot de passe : l'admin, ou le gestionnaire à qui la fiche est attribuée (ou qui l'a créée)
function canSecret_(c, user) {
  if (user.role === 'admin') return true;
  if (user.role !== 'gestionnaire') return false;
  if (!c) return true; // fiche pas encore synchronisée
  return suivis_(c).indexOf(user.nom) >= 0 || c.createdBy === user.nom;
}
// ── v3.14 — périmètre des gestionnaires ──
var CUR_DB_ = null, SCOPE_CACHE_ = {};
function estComite_(u) { return !!u && (u.role === 'comite' || !!u.comite); }
function voitComite_(u) { return !!u && (u.role === 'admin' || estComite_(u) || !!u.voitComite); }
// Référents (et membres du comité) rattachés à un gestionnaire : choix explicite (gests), sinon proposés par lui, sinon tag commun
function refsOfGest_(db, g) {
  var gt = g.tags || [];
  return (db.users || []).filter(function (u) {
    if (!u || u.id === g.id || u.role === 'admin' || u.role === 'gestionnaire' || u.pending) return false;
    if (u.gests && u.gests.length) return u.gests.indexOf(g.nom) >= 0;
    if (u.proposePar && u.proposePar === g.nom) return true;
    return (u.tags || []).some(function (t) { return gt.indexOf(t) >= 0; });
  });
}
function gestsOfUser_(db, u) {
  return (db.users || []).filter(function (g) { return g && g.role === 'gestionnaire' && g.actif !== false && !g.pending && refsOfGest_(db, g).some(function (r) { return r.id === u.id; }); });
}
function scope_(user) {
  if (SCOPE_CACHE_[user.id]) return SCOPE_CACHE_[user.id];
  var db = CUR_DB_ || getDB_(), refs = refsOfGest_(db, user), tags = (user.tags || []).slice(), names = [user.nom], ids = [];
  refs.forEach(function (r) { ids.push(r.id); if (names.indexOf(r.nom) < 0) names.push(r.nom); (r.tags || []).forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); }); });
  return (SCOPE_CACHE_[user.id] = { tags: tags, names: names, ids: ids });
}
function contactById_(db, id) { for (var i = 0; i < db.contacts.length; i++) if (db.contacts[i].id === id) return db.contacts[i]; return null; }
function referentsFor_(db, user) {
  var all = db.config.referents || [];
  if (user.role === 'admin' || (user.role === 'gestionnaire' && user.scope === 'tout')) return all;
  var tg = user.role === 'gestionnaire' ? scope_(user).tags : (user.tags || []);
  return all.filter(function (t) { return tg.indexOf(t) >= 0; });
}
function payload_(db, user) {
  var contacts = visibleContacts_(db, user);
  if (user.role !== 'admin') contacts = contacts.map(function (c) { if (!c.pieceId) return c; var cc = {}; for (var k in c) cc[k] = c[k]; cc.pieceId = maskId_(c.pieceId); return cc; });
  var res = {
    ok: true,
    user: { id: user.id, nom: user.nom, role: user.role, tags: user.tags || [], tel: user.tel || '', email: user.email || '', photo: user.photo || '', digestEmail: user.digestEmail || '', digestHeure: user.digestHeure || '', calendlyUrl: user.calendlyUrl || '', scope: user.scope === 'tout' ? 'tout' : 'equipes', comite: !!user.comite, voitComite: !!user.voitComite, pubToken: pubTokenOf_(db, user), superAdmin: !!user.superAdmin, push: user.push !== false },
    contacts: contacts,
    config: { srv: SRV_VERSION, referents: referentsFor_(db, user), suiveurs: suiveursFor_(db, user), stocks: db.config.stocks || [], ressources: db.config.ressources || {}, equipe: equipe_(db, user), sessionJours: SESSION_JOURS, params: db.config.params || {}, leadsNew: leadsFor_(db, user).filter(function (l) { return l.statut !== 'traite'; }).length }
  };
  if (user.role === 'admin') {
    res.users = (db.users || []).map(function (u) {
      return { id: u.id, nom: u.nom, role: u.role, tags: u.tags || [], code: u.code, actif: u.actif !== false, tel: u.tel || '', email: u.email || '', photo: u.photo || '', digestEmail: u.digestEmail || '', digestHeure: u.digestHeure || '', calendlyUrl: u.calendlyUrl || '', pending: !!u.pending, proposePar: u.proposePar || '', scope: u.scope === 'tout' ? 'tout' : 'equipes', comite: !!u.comite, voitComite: !!u.voitComite, gests: u.gests || [], sessions: (db.sessions || []).filter(function (s) { return s.userId === u.id; }).length };
    });
  } else if (user.role === 'gestionnaire') {
    // Vue équipe en lecture : pas de codes d'accès, pas d'emails — v3.14 : lui-même et ses référents seulement (sauf périmètre « tout »)
    var scU = user.scope === 'tout' ? null : scope_(user);
    res.users = (db.users || []).filter(function (u) { return !scU || u.id === user.id || scU.ids.indexOf(u.id) >= 0; }).map(function (u) {
      return { id: u.id, nom: u.nom, role: u.role, tags: u.tags || [], actif: u.actif !== false, tel: u.tel || '', photo: u.photo || '', calendlyUrl: u.calendlyUrl || '', pending: !!u.pending, proposePar: u.proposePar || '' };
    });
  }
  return res;
}

// ── QR CODE D'INSCRIPTION & DEMANDES REÇUES (v3.9) ─────────────────
function pubTokenOf_(db, user) {
  if (user.id === 'root') {
    db.config.rootProfile = db.config.rootProfile || {};
    if (!db.config.rootProfile.pubToken) db.config.rootProfile.pubToken = 'q' + token_().slice(0, 15);
    return db.config.rootProfile.pubToken;
  }
  var u = (db.users || []).find(function (x) { return x.id === user.id; });
  if (!u) return '';
  if (!u.pubToken) u.pubToken = 'q' + token_().slice(0, 15);
  return u.pubToken;
}
function userByPubToken_(db, r) {
  r = String(r || '').trim(); if (!r || r.length < 8) return null;
  var rp = (db.config && db.config.rootProfile) || {};
  if (rp.pubToken && rp.pubToken === r) return findUser_(db, ADMIN_CODE);
  return (db.users || []).find(function (u) { return u.pubToken === r && u.actif !== false && !u.pending; }) || null;
}
function leadsFor_(db, user) {
  var all = db.leads || [];
  // v3.12 : admin = tout · gestionnaire (périmètre « tout ») = tout, comme ses contacts · sinon : ses propres demandes + celles portant l'un de ses tags
  var tags = user.tags || [];
  // v3.14 : gestionnaire = ses demandes + celles de ses référents (+ tags de son équipe) ; « tout » seulement en exception
  var sc = user.role === 'gestionnaire' && user.scope !== 'tout' ? scope_(user) : null;
  if (sc) tags = sc.tags;
  var mine = (user.role === 'admin' || (user.role === 'gestionnaire' && user.scope === 'tout')) ? all
    : all.filter(function (l) { return l.userId === user.id || (sc && sc.ids.indexOf(l.userId) >= 0) || (l.tag && tags.indexOf(l.tag) >= 0); });
  return mine.map(function (l) {
    var o = {}; for (var k in l) o[k] = l[k];
    delete o.mdp;                                          // jamais renvoyé en liste
    if (user.role !== 'admin' && o.pieceId) o.pieceId = maskId_(o.pieceId);
    return o;
  }).sort(function (a, b) { return a.ts < b.ts ? 1 : -1; });
}
function purgeLeads_(db) {
  var lim = Date.now() - LEADS_MAX_JOURS * 86400000;
  db.leads = (db.leads || []).filter(function (l) { return new Date(l.ts).getTime() > lim; });
}
function handleLead_(db, req) {
  if (req.website) return out_({ ok: true });                       // pot de miel : robots ignorés silencieusement
  var owner = userByPubToken_(db, req.r);
  if (!owner) return out_({ ok: false, error: 'lien' });
  var lienDe = owner.nom;                                             // v3.16 — qui a transmis le lien (avant rattachement éventuel)
  var cache = CacheService.getScriptCache(), ck = 'lead_' + req.r, n = parseInt(cache.get(ck) || '0', 10) + 1;
  cache.put(ck, String(n), 3600);
  if (n > LEAD_RATE_HEURE) return out_({ ok: false, error: 'trop' });
  var S = function (v, max) { return String(v || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 120); };
  var nom = S(req.nom, 80), prenom = S(req.prenom, 80), tel = S(req.tel, 30);
  var type = req.type === 'decouverte' ? 'decouverte' : 'inscription';
  if (!droit_(db, 'client', type === 'decouverte' ? 'formDecouverte' : 'formInscription', true)) return out_({ ok: false, error: 'ferme' });   // v3.19 — formulaire désactivé par le super-admin
  if (type === 'decouverte') { if (!prenom || !tel) return out_({ ok: false, error: 'champs' }); }
  else if (!nom || !tel) return out_({ ok: false, error: 'champs' });
  var interets = []; try { (Array.isArray(req.interets) ? req.interets : String(req.interets || '').split(',')).forEach(function (x) { x = S(x, 40); if (x && interets.length < 8 && interets.indexOf(x) < 0) interets.push(x); }); } catch (ie) {}
  // v3.16 — « Par qui en avez-vous entendu parler ? » (formulaire ouvert avec le lien de l'admin)
  var via = null, viaContact = null;
  if (S(req.viaTel, 30) || S(req.viaPrenom, 60)) {
    via = { prenom: S(req.viaPrenom, 60), nom: S(req.viaNom, 60), tel: S(req.viaTel, 30), email: S(req.viaEmail, 120).toLowerCase(), match: '', matchNom: '', matchRole: '', matchTag: '', matchUserId: '', matchContactId: '', prenomOk: false };
    var vd = telDigits_(via.tel), vp = norm_(via.prenom).split(' ')[0];
    if (vd.length >= 8) {
      var mu = null, root = findUser_(db, ADMIN_CODE);
      if (root && telDigits_(root.tel) === vd) mu = root;
      if (!mu) mu = (db.users || []).find(function (u) { return u.actif !== false && !u.pending && telDigits_(u.tel) === vd; }) || null;
      if (mu) {
        via.match = 'user'; via.matchNom = mu.nom; via.matchRole = mu.role; via.matchTag = (mu.tags || [])[0] || ''; via.matchUserId = mu.id;
        via.prenomOk = !vp || norm_(mu.nom).indexOf(vp) >= 0;
        if (mu.id !== owner.id && (mu.role === 'referent' || mu.role === 'gestionnaire')) owner = mu;   // la demande part chez la bonne personne
      } else {
        var mcs = db.contacts.filter(function (c) { return telDigits_(c.tel) === vd; });
        if (mcs.length === 1 || (mcs.length > 1 && vp)) {
          var mc = mcs.length === 1 ? mcs[0] : (mcs.filter(function (c) { return norm_(c.prenom).split(' ')[0] === vp; })[0] || null);
          if (mc) {
            via.match = 'contact'; via.matchNom = ((mc.prenom || '') + ' ' + (mc.nom || '')).trim(); via.matchRole = statutDe_(mc) === 'reseau' ? 'client' : 'contact';
            via.matchTag = (mc.ctags || [])[0] || mc.refere || ''; via.matchContactId = mc.id; via.matchSuivi = (suivis_(mc) || [])[0] || '';
            via.prenomOk = !vp || norm_(mc.prenom).split(' ')[0] === vp;
            viaContact = mc;
            var ru = via.matchTag ? (db.users || []).find(function (u) { return u.actif !== false && !u.pending && (u.tags || []).indexOf(via.matchTag) >= 0; }) : null;
            if (ru && ru.id !== owner.id) owner = ru;                                                   // vers le référent de cette personne
          }
        }
      }
    }
  }
  purgeLeads_(db);
  var lead = {
    id: 'ld_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: now_(), statut: 'nouveau',
    userId: owner.id, userNom: owner.nom, tag: (owner.tags && owner.tags[0]) || owner.nom,
    nom: nom.toUpperCase(), prenom: prenom, tel: tel, email: S(req.email, 120), pays: S(req.pays, 60),
    adresse: S(req.adresse, 200), cp: S(req.cp, 12), ville: S(req.ville, 80),
    livNom: S(req.livNom, 80), livPrenom: S(req.livPrenom, 80), livTel: S(req.livTel, 30), livEmail: S(req.livEmail, 120),
    livAdresse: S(req.livAdresse || (req.livFlag ? req.factAdresse : ''), 200), livCp: S(req.livCp || (req.livFlag ? req.factCp : ''), 12), livVille: S(req.livVille || (req.livFlag ? req.factVille : ''), 80), livPays: S(req.livPays || (req.livFlag ? req.factPays : ''), 60),
    factAdresse: req.livFlag ? '' : S(req.factAdresse, 200), factCp: req.livFlag ? '' : S(req.factCp, 12), factVille: req.livFlag ? '' : S(req.factVille, 80), factPays: req.livFlag ? '' : S(req.factPays, 60),
    pieceType: S(req.pieceType, 30), pieceId: S(req.pieceId, 30), mdp: S(req.mdp, 60),
    message: S(req.message, 500), consent: !!req.consent, consentEmail: !!req.consentEmail, lang: S(req.lang, 5) || 'fr', source: 'qr',
    type: type, interets: interets,
    via: via, lienDe: lienDe
  };
  db.leads = db.leads || []; db.leads.push(lead);
  if (viaContact) {                                                   // v3.16 — trace chez la personne qui a recommandé
    viaContact.journal = viaContact.journal || [];
    viaContact.journal.push({ id: 'j_' + Date.now() + '_v', ts: now_(), auteur: 'système', role: 'systeme', type: 'systeme', texte: '🤝 A recommandé ' + (lead.prenom + ' ' + lead.nom).trim() + ' — demande ' + (type === 'decouverte' ? 'de découverte' : 'd\'inscription') + ' reçue' + (lead.tel ? ' (' + lead.tel + ')' : '') });
    viaContact.lastActivity = now_();
  }
  adminLog_(db, 'QR ' + owner.nom, type === 'decouverte' ? 'demande de découverte reçue' : 'demande d\'inscription reçue', lead.prenom + ' ' + lead.nom);
  saveDB_(db);
  // e-mail au référent (et à l'admin principal)
  try {
    var dest = [];
    // v3.13 — e-mail du profil ET e-mail du résumé quotidien (s'ils diffèrent, les deux reçoivent)
    [owner.email, owner.digestEmail].forEach(function (em) { em = String(em || '').trim().toLowerCase(); if (em && dest.indexOf(em) < 0) dest.push(em); });
    // v3.14 — le(s) gestionnaire(s) de ce référent sont prévenus aussi (et eux seuls)
    if (owner.role !== 'admin' && owner.role !== 'gestionnaire') gestsOfUser_(db, owner).forEach(function (g) { [g.email, g.digestEmail].forEach(function (em) { em = String(em || '').trim().toLowerCase(); if (em && dest.indexOf(em) < 0) dest.push(em); }); });
    if (dest.indexOf(MON_EMAIL) < 0) dest.push(MON_EMAIL);
    try { var rpA = (db.config && db.config.rootProfile) || {}, rdA = {}; try { rdA = JSON.parse(PropertiesService.getScriptProperties().getProperty('root_digest') || '{}'); } catch (e0) {}
      [rpA.email, rdA.email].forEach(function (em) { em = String(em || '').trim().toLowerCase(); if (em && dest.indexOf(em) < 0) dest.push(em); }); } catch (e1) {}   // v3.21 — e-mail du profil du super-admin
    lead.alerteA = dest.slice();
    var isDec = type === 'decouverte';
    var viaTxt = '';
    if (via) viaTxt = '<p>🤝 <b>De la part de :</b> ' + [via.prenom, via.nom].filter(Boolean).join(' ') + (via.tel ? ' · ' + via.tel : '') + '<br>' + (via.match ? '✅ Téléphone reconnu : <b>' + via.matchNom + '</b> (' + { admin: 'administrateur', gestionnaire: 'gestionnaire', referent: 'référent', client: 'client du réseau', contact: 'contact du CRM' }[via.matchRole] + (via.matchTag ? ' · équipe ' + via.matchTag : '') + ')' + (via.prenomOk ? '' : ' — <span style="color:#C0392B">le prénom indiqué ne correspond pas, à vérifier</span>') + (owner.nom !== lienDe ? '<br>La demande a été rattachée à <b>' + owner.nom + '</b> (formulaire ouvert avec le lien de ' + lienDe + ').' : '') : '❔ Téléphone non reconnu dans le CRM — à rattacher à la main depuis « Demandes reçues ».') + '</p>';
    MailApp.sendEmail({ to: dest.join(','), subject: (isDec ? '🌱 CRM OlyLife — nouvelle demande de découverte (' : '📥 CRM OlyLife — nouvelle demande d\'inscription (') + (lead.prenom + ' ' + lead.nom).trim() + (via && via.match ? ' · de la part de ' + via.matchNom : '') + ')',
      htmlBody: '<p>Une personne vient de remplir le formulaire ' + (isDec ? 'de découverte' : 'd\'inscription') + ' transmis par <b>' + lienDe + '</b>.</p><p><b>' + lead.prenom + ' ' + lead.nom + '</b><br>' + lead.tel + (lead.email ? '<br>' + lead.email : '') + (lead.ville ? '<br>' + lead.ville : '') + (interets.length ? '<br>Intérêts : ' + interets.join(', ') : '') + (lead.message ? '<br><i>' + lead.message + '</i>' : '') + '</p>' + viaTxt + '<p>' + (isDec ? 'Envoyez-lui les informations de découverte depuis le CRM → ' : 'Retrouvez-la dans le CRM → ') + '<a href="' + APP_PUBLIC_URL + '?go=demandes">Demandes reçues</a>.</p>' });
    try { adminLog_(db, 'système', 'alerte « nouvelle demande » envoyée', lead.prenom + ' ' + lead.nom + ' → ' + dest.join(', ')); } catch (le3) {}
    // v3.21 — récapitulatif au demandeur (ce qu'il a saisi ; mot de passe jamais repris, pièce masquée)
    try {
      if (lead.email) {
        var L = function (k, v) { return v ? '<tr><td style="padding:4px 10px 4px 0;color:#5A6E61;white-space:nowrap">' + k + '</td><td style="padding:4px 0"><b>' + v + '</b></td></tr>' : ''; };
        var tab = '<table style="border-collapse:collapse;font-size:14px">' + L('Nom', lead.nom) + L('Prénom', lead.prenom) + L('Téléphone', lead.tel) + L('E-mail', lead.email)
          + (isDec ? L('Centres d\'intérêt', (lead.interets || []).join(', ')) : L('Adresse (facturation)', [lead.adresse, lead.cp, lead.ville, lead.pays].filter(Boolean).join(', ')) + L('Livraison', [[lead.livNom, lead.livPrenom].filter(Boolean).join(' '), lead.livTel, lead.livAdresse, lead.livCp, lead.livVille, lead.livPays].filter(Boolean).join(', ')) + L('Pièce d\'identité', lead.pieceId ? (lead.pieceType || 'Pièce') + ' ' + maskId_(lead.pieceId) : '') + L('Mot de passe choisi', lead.mdp ? '•••••••• (conservé de façon sécurisée, jamais envoyé par e-mail)' : ''))
          + L('Message', lead.message) + (via ? L('De la part de', [via.prenom, via.nom].filter(Boolean).join(' ') + (via.tel ? ' · ' + via.tel : '')) : '') + L('Consentement e-mail', lead.consentEmail ? 'oui' : 'non') + '</table>';
        var who = owner.nom + (owner.tel ? ' · ' + owner.tel : '') + (owner.email ? ' · ' + owner.email : '');
        var corpsR = 'Bonjour ' + lead.prenom + ',<br><br>Nous avons bien reçu votre ' + (isDec ? 'demande de découverte' : 'demande d\'inscription OlyLife') + '. Voici le récapitulatif de ce que vous avez saisi :<br><br>' + tab
          + '<br>' + (isDec ? '<b>' + owner.nom + '</b> vous envoie très vite les informations sur WhatsApp.' : '<b>' + owner.nom + '</b> prend le relais : création de votre compte OlyLife, enregistrement de la commande, puis envoi de la facture. Vous serez tenu(e) informé(e) à chaque étape.')
          + '<br><br>Votre interlocuteur : ' + who + '<br><br>Bien à vous,<br>Association Water Life High Tech';
        MailApp.sendEmail({ to: lead.email, subject: (isDec ? '🌱 Votre demande de découverte OlyLife est bien reçue' : '📥 Votre demande d\'inscription OlyLife est bien reçue — récapitulatif'), htmlBody: avMailShell_(isDec ? '🌱 Demande bien reçue' : '📥 Demande d\'inscription bien reçue', 'Water Life High Tech', '#126A3C', corpsR), name: 'Water Life High Tech', replyTo: owner.email || MON_EMAIL });
        lead.recapEnvoye = now_();
      }
    } catch (re) { Logger.log('recap demandeur : ' + re); }
    // v3.21 — merci à la personne qui a recommandé (nom, prénom, e-mail, téléphone du demandeur seulement — rien de confidentiel)
    try {
      var viaEm = via ? (via.email || (viaContact && viaContact.email) || (via.match === 'user' ? emailDe_(db, via.matchNom) : '')) : '';
      if (viaEm) {
        var corpsV = 'Bonjour ' + (via.prenom || '') + ',<br><br>Merci ! <b>' + (lead.prenom + ' ' + lead.nom).trim() + '</b> vient de remplir le formulaire ' + (isDec ? 'de découverte' : 'd\'inscription OlyLife') + ' <b>de votre part</b>.<br><br>'
          + '<table style="border-collapse:collapse;font-size:14px">' + L('Nom', lead.nom) + L('Prénom', lead.prenom) + L('E-mail', lead.email) + L('Téléphone', lead.tel) + '</table><br>'
          + 'La suite (compte, commande, facture) est prise en charge par <b>' + owner.nom + '</b>' + (owner.tel ? ' · ' + owner.tel : '') + '. Les autres informations restent confidentielles entre ' + lead.prenom + ' et son gestionnaire.<br><br>Encore merci pour votre confiance 🙏<br>Association Water Life High Tech';
        MailApp.sendEmail({ to: viaEm, subject: '🤝 ' + (lead.prenom + ' ' + lead.nom).trim() + ' s\'est inscrit(e) de votre part — merci !', htmlBody: avMailShell_('🤝 Merci pour cette recommandation', 'Water Life High Tech', '#126A3C', corpsV), name: 'Water Life High Tech', replyTo: owner.email || MON_EMAIL });
        lead.viaMerciEnvoye = viaEm;
        if (viaContact) { viaContact.journal.push({ id: 'j_' + Date.now() + '_vm', ts: now_(), auteur: 'système', role: 'systeme', type: 'systeme', texte: '✉️ E-mail de remerciement envoyé (' + viaEm + ') pour la recommandation de ' + (lead.prenom + ' ' + lead.nom).trim() }); }
      }
    } catch (ve) { Logger.log('merci recommandeur : ' + ve); }
    saveDB_(db);
    try { var pu = [owner]; if (owner.role !== 'admin' && owner.role !== 'gestionnaire') pu = pu.concat(gestsOfUser_(db, owner)); pu.push({ id: 'root' }); pushSend_(db, pu, (isDec ? '🌱 Nouvelle demande de découverte' : '📥 Nouvelle demande d\'inscription'), (lead.prenom + ' ' + lead.nom).trim() + (lead.tel ? ' · ' + lead.tel : '') + ' — lien de ' + lienDe, ''); } catch (pe) {}   // v3.20
  } catch (me) { try { adminLog_(db, 'système', 'échec alerte « nouvelle demande »', String(me && me.message ? me.message : me)); saveDB_(db); } catch (le4) {} }
  return out_({ ok: true, referent: owner.nom });
}

// ── OCR (v3.9) : image → texte via la conversion Google Docs (Drive API avancée) ──
// ═══ v3.20 — Consentement e-mail par lien public ═══════════════════
function handleConsent_(db, req, op) {
  var owner = userByPubToken_(db, req.r);
  if (!owner) return out_({ ok: false, error: 'lien' });
  var c = contactById_(db, String(req.c || ''));
  if (!c) return out_({ ok: false, error: 'lien' });
  if (owner.role !== 'admin' && !isVisible_(c, owner)) return out_({ ok: false, error: 'lien' });
  var masque = function (em) { em = String(em || ''); var i = em.indexOf('@'); return i > 1 ? em.charAt(0) + '•••' + em.slice(i - 1) : (em ? '•••' : ''); };
  if (op === 'consentInfo') return out_({ ok: true, prenom: c.prenom || '', nom: (c.nom || '').charAt(0) + '.', ref: owner.nom, deja: !!c.emailConsent, emailMasque: masque(c.email), aEmail: !!c.email });
  var cache = CacheService.getScriptCache(), ck = 'cons_' + req.r, n = parseInt(cache.get(ck) || '0', 10) + 1; cache.put(ck, String(n), 3600);
  if (n > 30) return out_({ ok: false, error: 'trop' });
  var email = String(req.email || '').trim().toLowerCase().slice(0, 120);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return out_({ ok: false, error: 'email' });
  if (!email && !c.email) return out_({ ok: false, error: 'email' });
  if (!req.ok) return out_({ ok: false, error: 'case' });
  if (email && email !== (c.email || '').toLowerCase()) { c.email = email; }
  c.emailConsent = true; c.emailConsentLe = now_(); c.emailConsentSrc = 'lien' + (req.canal ? '-' + String(req.canal).slice(0, 12) : '');
  c.journal = c.journal || [];
  c.journal.push({ id: 'j_' + Date.now() + '_cs', ts: now_(), auteur: (c.prenom || '') + ' ' + (c.nom || ''), role: '', type: 'systeme', texte: '✅ Consentement e-mail donné par la personne elle-même (lien envoyé par ' + owner.nom + ')' + (email ? ' — adresse : ' + email : '') });
  c.lastActivity = now_();
  try { sioAuto_(db, c, owner.nom, 'consentement donné par lien'); } catch (e) {}
  saveDB_(db);
  try { pushSend_(db, [owner], '✅ Consentement reçu', (c.prenom || '') + ' ' + (c.nom || '') + ' a accepté les e-mails WLHT', ''); } catch (e) {}
  return out_({ ok: true, prenom: c.prenom || '' });
}
// ═══ v3.20 — Notifications push (OneSignal) ═══════════════════════
// Script Properties : ONESIGNAL_KEY (clé REST). App ID : db.config.params.liens.onesignalAppId (Administration → Liens).
// Les appareils sont identifiés par external_id = id utilisateur CRM ('root' pour le super-admin).
function pushKey_() { return PropertiesService.getScriptProperties().getProperty('ONESIGNAL_KEY') || ''; }
function pushAppId_(db) { try { return (db.config.params.liens || {}).onesignalAppId || ''; } catch (e) { return ''; } }
function pushSend_(db, users, titre, corps, url) {
  var key = pushKey_(), app = pushAppId_(db); if (!key || !app) return false;
  var ids = {}; (users || []).forEach(function (u) { if (!u) return; var id = typeof u === 'string' ? u : u.id; if (id && (typeof u === 'string' || u.push !== false)) ids[id] = 1; });
  ids = Object.keys(ids); if (!ids.length) return false;
  var body = { app_id: app, target_channel: 'push', include_aliases: { external_id: ids }, headings: { en: titre, fr: titre }, contents: { en: corps, fr: corps }, url: url || 'https://crm.team-waterlifehightech.com/', chrome_web_icon: 'https://crm.team-waterlifehightech.com/icon-192.png' };
  try {
    var r = UrlFetchApp.fetch('https://api.onesignal.com/notifications?c=push', { method: 'post', contentType: 'application/json', headers: { Authorization: 'Key ' + key }, payload: JSON.stringify(body), muteHttpExceptions: true });
    if (r.getResponseCode() >= 300) { Logger.log('push ' + r.getResponseCode() + ' ' + r.getContentText().slice(0, 300)); return false; }
    return true;
  } catch (e) { Logger.log('push : ' + e); return false; }
}
function usersByNoms_(db, noms) { var out = []; (noms || []).forEach(function (n) { if (!n) return; if (n === ADMIN_NOM) { out.push({ id: 'root' }); return; } for (var i = 0; i < db.users.length; i++) if (db.users[i].nom === n) { out.push(db.users[i]); break; } }); return out; }
// ▶ Test : envoie une notification push au super-admin
function testerPush() { var db = getDB_(); Logger.log(pushSend_(db, [{ id: 'root' }], '🔔 Test CRM OlyLife', 'Les notifications push fonctionnent.', '')); }
function ocrImage_(req) {
  if (typeof Drive === 'undefined' || !Drive.Files) return { ok: false, error: 'ocr_service' };
  try {
    var bytes = Utilities.base64Decode(req.data || '');
    if (!bytes.length) return { ok: false, error: 'vide' };
    if (bytes.length > 8 * 1024 * 1024) return { ok: false, error: 'trop_lourd' };
    var blob = Utilities.newBlob(bytes, req.mime || 'image/jpeg', req.name || ('capture_' + Date.now() + '.jpg'));
    var id = '';
    if (Drive.Files.create) {          // Drive API v3
      var f3 = Drive.Files.create({ name: 'ocr_tmp_' + Date.now(), mimeType: 'application/vnd.google-apps.document' }, blob, { ocrLanguage: 'fr' });
      id = f3.id;
    } else {                            // Drive API v2
      var f2 = Drive.Files.insert({ title: 'ocr_tmp_' + Date.now(), mimeType: 'application/vnd.google-apps.document' }, blob, { ocr: true, ocrLanguage: 'fr' });
      id = f2.id;
    }
    var text = '';
    try { text = DocumentApp.openById(id).getBody().getText(); } catch (de) { text = ''; }
    try { DriveApp.getFileById(id).setTrashed(true); } catch (te) {}
    try { if (Drive.Files.remove) Drive.Files.remove(id); else if (Drive.Files['delete']) Drive.Files['delete'](id); } catch (re) {}
    return { ok: true, text: text };
  } catch (err) { return { ok: false, error: 'ocr: ' + String(err && err.message ? err.message : err) }; }
}

// ── SESSIONS (v3.7) ────────────────────────────────────────────────
function token_() { var a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', t = ''; for (var i = 0; i < 40; i++) t += a.charAt(Math.floor(Math.random() * a.length)); return t; }
function purgeSessions_(db) {
  var now = Date.now();
  db.sessions = (db.sessions || []).filter(function (s) { return s && s.exp > now; });
}
function sessionUser_(db, token) {
  if (!token) return null;
  purgeSessions_(db);
  for (var i = 0; i < db.sessions.length; i++) {
    var s = db.sessions[i];
    if (s.token !== token) continue;
    var user = s.userId === 'root' ? findUser_(db, ADMIN_CODE) : (db.users || []).find(function (u) { return u.id === s.userId && u.actif !== false && !u.pending; });
    if (!user) { db.sessions.splice(i, 1); return null; }
    s.last = now_(); s.exp = Date.now() + SESSION_JOURS * 86400000;   // session glissante
    return user;
  }
  return null;
}
function now_() { return new Date().toISOString(); }
function authUser_(db, req) {
  if (req.token) return sessionUser_(db, req.token);
  if (req.code && LOGIN_CODE_GET) return findUser_(db, req.code);
  return null;
}
// Frein anti-force brute : compteur global d'échecs sur 10 min (cache), alerte e-mail à partir de 10 échecs
function loginFail_() {
  var c = CacheService.getScriptCache();
  var n = (parseInt(c.get('login_fail') || '0', 10) || 0) + 1;
  c.put('login_fail', String(n), 600);
  if (n >= 10 && !c.get('login_alert')) {
    c.put('login_alert', '1', 3600);
    try { MailApp.sendEmail({ to: MON_EMAIL, subject: '🚨 CRM OlyLife — tentatives de connexion répétées', htmlBody: '<p>' + n + ' codes d\'accès refusés en moins de 10 minutes. Si ce n\'est pas un membre de l\'équipe qui se trompe, pensez à régénérer les codes exposés (Équipe) et à vérifier le journal d\'administration.</p>' }); } catch (e) {}
  }
  Utilities.sleep(Math.min(5000, 800 * n));   // chaque échec ralentit un peu plus le suivant
  return n;
}
function loginBlocked_() { var n = parseInt(CacheService.getScriptCache().get('login_fail') || '0', 10) || 0; return n >= 15; }
function deviceLabel_(d) { d = d || {}; return { id: String(d.id || '').slice(0, 40), label: String(d.label || 'Appareil').slice(0, 80) }; }
// Journal d'administration (500 dernières entrées)
function adminLog_(db, par, action, detail) {
  db.adminLog = db.adminLog || [];
  db.adminLog.unshift({ ts: now_(), par: par || '—', action: action, detail: String(detail || '').slice(0, 300) });
  if (db.adminLog.length > 500) db.adminLog.length = 500;
}
function sessionsOut_(db, userId) {
  purgeSessions_(db);
  return db.sessions.filter(function (s) { return !userId || s.userId === userId; }).map(function (s) { return { id: s.id, userId: s.userId, nom: s.nom, device: s.device, created: s.created, last: s.last, exp: new Date(s.exp).toISOString() }; });
}

// ── POST : écriture par opérations (upsert / delete / users / config)
function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (le) { return out_({ ok: false, error: 'busy' }); }
  try {
    var raw = '';
    if (e && e.parameter && e.parameter.data) raw = e.parameter.data;
    else if (e && e.postData && e.postData.contents) raw = e.postData.contents;
    // ── v3.15 — webhook Systeme.io (…/exec?hook=sio&k=<secret>) : pas de jeton CRM, corps JSON libre ──
    if (e && e.parameter && e.parameter.hook === 'sio') {
      var hs = PropertiesService.getScriptProperties().getProperty('SIO_HOOK_SECRET') || '';
      if (!hs || e.parameter.k !== hs) return out_({ ok: false, error: 'secret' });
      var hdb = getDB_(); var hr = sioHook_(hdb, raw); saveDB_(hdb); return out_(hr);
    }
    var req = JSON.parse(raw);

    var db = getDB_();
    CUR_DB_ = db; SCOPE_CACHE_ = {};
    var op = req.op || 'upsert';

    // ── Formulaire public d'inscription via QR code (v3.9) — sans code d'accès ──
    if (op === 'leadInfo') {
      var lo = userByPubToken_(db, req.r);
      if (!lo) return out_({ ok: false, error: 'lien' });
      var pl = (db.config.params && db.config.params.liens) || {};
      return out_({ ok: true, nom: lo.nom, role: lo.role, tel: lo.tel || '', support: { tel: pl.waSupportTel || '33651001085', nom: pl.waSupportNom || ADMIN_NOM } });
    }
    if (op === 'lead') return handleLead_(db, req);
    if (op === 'consentInfo' || op === 'consent') return handleConsent_(db, req, op);   // v3.20

    // ── Connexion (v3.7) : code → session par appareil, jeton renvoyé à l'app ──
    if (op === 'login') {
      if (loginBlocked_()) return out_({ ok: false, error: 'tentatives', attente: 10 });
      var lu = findUser_(db, req.code);
      if (!lu) { var nf = loginFail_(); return out_({ ok: false, error: 'auth', echecs: nf }); }
      purgeSessions_(db);
      var dev = deviceLabel_(req.device);
      // un même appareil ne garde qu'une session
      db.sessions = db.sessions.filter(function (s) { return !(s.userId === lu.id && dev.id && s.device && s.device.id === dev.id); });
      var sess = { id: 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), token: token_(), userId: lu.id, nom: lu.nom, device: dev, created: now_(), last: now_(), exp: Date.now() + SESSION_JOURS * 86400000 };
      db.sessions.push(sess);
      adminLog_(db, lu.nom, 'connexion', dev.label);
      var pl = payload_(db, lu); pl.token = sess.token; pl.sessionId = sess.id;
      saveDB_(db);
      return out_(pl);
    }

    var user = authUser_(db, req);
    if (!user) return out_({ ok: false, error: req.token ? 'session' : 'auth' });

    if (op === 'pull') { var pl = payload_(db, user); saveDB_(db); return out_(pl); }   // v3.17 : payload_ avant saveDB_ pour persister les pubTokens
    // ── Demandes reçues (QR) ──
    if (op === 'leads') { purgeLeads_(db); saveDB_(db); return out_({ ok: true, leads: leadsFor_(db, user) }); }
    if (op === 'leadDone') {
      var ld = (db.leads || []).find(function (l) { return l.id === req.id; });
      if (!ld) return out_({ ok: false, error: 'introuvable' });
      if (!(user.role === 'admin' || user.role === 'gestionnaire' || ld.userId === user.id)) return out_({ ok: false, error: 'forbidden' });
      if (req.action === 'supprime' && user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });   // v3.12 : seul l'admin supprime (après vérification)
      if (req.action === 'supprime') db.leads = db.leads.filter(function (l) { return l.id !== req.id; });
      else {
        ld.statut = 'traite'; ld.traitePar = user.nom; ld.traiteLe = now_(); if (req.ficheId) ld.ficheId = String(req.ficheId).slice(0, 60); if (req.suiviPar) ld.suiviPar = String(req.suiviPar).slice(0, 120);
        // v3.13 — le mot de passe choisi par le client suit la fiche (coffre), il n'est plus perdu à l'intégration
        if (ld.mdp && req.ficheId) {
          secrets_(db)[secKey_(req.ficheId, 'main')] = { mdp: String(ld.mdp), le: now_(), par: user.nom, src: 'demande QR' };
          var fc = contactById_(db, req.ficheId); if (fc) fc.mdpSet = mdpFlags_(db, fc.id);
        }
        if (req.ficheId && ld.pieceId) { var fcp = contactById_(db, req.ficheId); if (fcp && !fcp.pieceId) { fcp.pieceId = ld.pieceId; if (ld.pieceType && !fcp.pieceType) fcp.pieceType = ld.pieceType; } }   // v3.21 — la pièce suit la fiche
        delete ld.mdp; delete ld.pieceId;
      }
      adminLog_(db, user.nom, req.action === 'supprime' ? 'demande QR supprimée' : 'demande QR intégrée', (ld.prenom || '') + ' ' + (ld.nom || ''));
      saveDB_(db); return out_({ ok: true });
    }
    if (op === 'leadMdp') {
      var lm = (db.leads || []).find(function (l) { return l.id === req.id; });
      if (!lm) return out_({ ok: false, error: 'introuvable' });
      if (!(user.role === 'admin' || user.role === 'gestionnaire' || lm.userId === user.id)) return out_({ ok: false, error: 'forbidden' });
      adminLog_(db, user.nom, 'mot de passe QR consulté', (lm.prenom || '') + ' ' + (lm.nom || ''));
      saveDB_(db); return out_({ ok: true, mdp: lm.mdp || '', pieceId: lm.pieceId || '' });
    }
    if (op === 'myQr') { var tk = pubTokenOf_(db, user); saveDB_(db); return out_({ ok: true, token: tk, url: APP_PUBLIC_URL + 'inscription.html?r=' + tk, urlDecouverte: APP_PUBLIC_URL + 'decouverte.html?r=' + tk }); }
    if (op === 'userQr') {
      if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });
      var uq = req.userId === 'root' ? findUser_(db, ADMIN_CODE) : (db.users || []).find(function (u) { return u.id === req.userId; });
      if (!uq) return out_({ ok: false, error: 'introuvable' });
      var tk2 = pubTokenOf_(db, uq); saveDB_(db); return out_({ ok: true, token: tk2, url: APP_PUBLIC_URL + 'inscription.html?r=' + tk2, urlDecouverte: APP_PUBLIC_URL + 'decouverte.html?r=' + tk2 });
    }
    // ── Suppression d'un média Drive (témoignage audio remplacé ou supprimé) (v3.10) ──
    if (op === 'deleteMedia') {
      var mid = (String(req.url || '').match(/\/d\/([A-Za-z0-9_-]{10,})/) || [])[1] || String(req.id || '');
      if (!mid) return out_({ ok: false, error: 'id' });
      try { var mf = DriveApp.getFileById(mid); var pf = mf.getParents(); var okFolder = false; while (pf.hasNext()) { if (pf.next().getName() === 'CRM OlyLife — Témoignages') okFolder = true; }
        if (!okFolder) return out_({ ok: false, error: 'hors_dossier' });
        mf.setTrashed(true); adminLog_(db, user.nom, 'audio témoignage supprimé', mf.getName()); saveDB_(db); return out_({ ok: true });
      } catch (de) { return out_({ ok: false, error: String(de && de.message ? de.message : de) }); }
    }
    // ── E-mail HTML envoyé par le CRM (v3.10) ──
    if (op === 'sendMail') {
      lock.releaseLock();
      var to = String(req.to || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return out_({ ok: false, error: 'email' });
      var ck2 = 'mail_' + user.id, cache2 = CacheService.getScriptCache(), nm = parseInt(cache2.get(ck2) || '0', 10) + 1;
      cache2.put(ck2, String(nm), 86400);
      if (nm > 60) return out_({ ok: false, error: 'quota' });
      try {
        MailApp.sendEmail({ to: to, subject: String(req.subject || 'OlyLife — Water Life High Tech').slice(0, 200), htmlBody: String(req.html || ''), body: String(req.text || ''), name: String(req.fromName || user.nom || 'Water Life High Tech').slice(0, 80), replyTo: (user.email || user.digestEmail || MON_EMAIL) });
        return out_({ ok: true, reste: MailApp.getRemainingDailyQuota() });
      } catch (me) { return out_({ ok: false, error: 'mail: ' + String(me && me.message ? me.message : me) }); }
    }
    // ── OCR d'une capture d'écran (v3.9) — Drive API, fichier temporaire supprimé aussitôt ──
    if (op === 'ocr') {
      lock.releaseLock();
      return out_(ocrImage_(req));
    }
    if (op === 'logout') { db.sessions = (db.sessions || []).filter(function (s) { return s.token !== req.token; }); saveDB_(db); return out_({ ok: true }); }
    if (op === 'sessions') { return out_({ ok: true, sessions: sessionsOut_(db, user.role === 'admin' ? (req.userId || '') : user.id) }); }
    if (op === 'revokeSession') {
      var before = (db.sessions || []).length;
      db.sessions = (db.sessions || []).filter(function (s) { return !(s.id === req.id && (user.role === 'admin' || s.userId === user.id)); });
      if (db.sessions.length < before) adminLog_(db, user.nom, 'session révoquée', req.id);
      saveDB_(db); return out_({ ok: true });
    }
    if (op === 'adminLog') { if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' }); return out_({ ok: true, log: (db.adminLog || []).slice(0, req.n || 200) }); }
    if (op === 'listBackups') {
      if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });
      var bf = dossierSauvegardes_(), bl = [], bit = bf.getFiles();
      while (bit.hasNext()) { var f = bit.next(); if (f.getName().indexOf('CRM_OlyLife_') === 0) bl.push({ id: f.getId(), name: f.getName(), date: f.getDateCreated().toISOString(), size: f.getSize() }); }
      bl.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      return out_({ ok: true, backups: bl.slice(0, 90) });
    }
    if (op === 'restoreBackup') {
      if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });
      var bfile = DriveApp.getFileById(req.id);
      var data = JSON.parse(bfile.getBlob().getDataAsString());
      if (!data || !data.contacts) return out_({ ok: false, error: 'sauvegarde_invalide' });
      // filet : on sauvegarde l'état courant avant d'écraser
      dossierSauvegardes_().createFile('CRM_OlyLife_avant-restauration_' + Utilities.formatDate(new Date(), FUSEAU, 'yyyy-MM-dd_HHmm') + '.json', JSON.stringify(db), 'application/json');
      data.sessions = db.sessions || [];            // on garde les sessions en cours
      data.adminLog = db.adminLog || [];
      data.leads = db.leads || [];                  // et les demandes reçues (QR)
      data.config = data.config || { referents: [] };
      adminLog_(data, user.nom, 'restauration', bfile.getName() + ' (' + data.contacts.length + ' contacts)');
      saveDB_(data);
      return out_({ ok: true, contacts: data.contacts.length, users: (data.users || []).length });
    }
    if (op === 'backupNow') {
      if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });
      sauvegardeQuotidienne(); adminLog_(db, user.nom, 'sauvegarde manuelle', ''); saveDB_(db); return out_({ ok: true });
    }

    // Compatibilité v1 : un POST {contacts:[...]} sans op, venant d'un
    // admin, est traité comme un upsert complet.
    if (!req.op && req.contacts && user.role !== 'admin') {
      return out_({ ok: false, error: 'forbidden' });
    }

    var campUpd = [];                                                       // v3.16 — inscriptions automatiques faites côté serveur, renvoyées à l'app
    var notifUpd = [];                                                      // v3.18 — e-mails d'annonce d'avances / dons envoyés par le serveur
    if (op === 'upsert') {
      var list = req.contacts || [];
      list.forEach(function (nc) {
        if (!nc) return;
        if (!nc.id) nc.id = 'c_' + Date.now() + '_' + Math.floor(Math.random() * 1e6).toString(36);
        delete nc.mdp; delete nc.olyMdp;                     // v3.13 — un mot de passe ne transite jamais par la fiche
        nc.mdpSet = mdpFlags_(db, nc.id);                    // indicateur calculé par le serveur seul
        if (user.role !== 'admin' && /^••••/.test(String(nc.pieceId || ''))) delete nc.pieceId;   // v3.7 — valeur masquée, on garde l'original
        // Un référent ne crée/modifie que des fiches portant son tag
        if (user.role === 'referent' || user.role === 'comite') {
          var myTag = (user.tags && user.tags[0]) || user.nom;
          if (!nc.refere) nc.refere = myTag;
          nc.ctags = nc.ctags || [];
          if (nc.ctags.indexOf(myTag) < 0) nc.ctags.push(myTag);
        }
        var idx = -1;
        for (var i = 0; i < db.contacts.length; i++) { if (db.contacts[i].id === nc.id) { idx = i; break; } }
        if (idx >= 0) {
          if (user.role !== 'admin' && !isVisible_(db.contacts[idx], user)) return; // pas le droit
          var merged = {};
          var k;
          for (k in db.contacts[idx]) merged[k] = db.contacts[idx][k];
          for (k in nc) merged[k] = nc[k];
          var oldSt = statutDe_(db.contacts[idx]);
          try { var oldAv = db.contacts[idx].avances || []; (merged.avances || []).forEach(function (a) { if (!a) return; for (var oi = 0; oi < oldAv.length; oi++) if (oldAv[oi].id === a.id) { if (oldAv[oi].notifLe) { a.notifLe = oldAv[oi].notifLe; a.notifA = oldAv[oi].notifA || []; a.notifier = false; } if (oldAv[oi].sent && !(a.sent && Object.keys(a.sent).length)) a.sent = oldAv[oi].sent; break; } }); } catch (pe) {}   // v3.18 — les marques d'envoi du serveur (annonce, rappels) ne sont jamais écrasées par une copie périmée de l'app
          db.contacts[idx] = merged;
          // v3.15 — bascule automatique de campagne quand le statut change (filet de sécurité, l'app le fait déjà)
          try { var newSt = statutDe_(merged), cp = merged.campagne || {};
            if (newSt !== oldSt && merged.emailConsent && merged.email) {
              if (newSt === 'reseau' && cp.parcours !== 'reseau') sioSet_(db, merged, 'reseau', user.nom, 'passage « Dans le réseau »');
              else if (newSt === 'abandon' && cp.parcours && cp.parcours !== 'stop') sioSet_(db, merged, 'stop', user.nom, 'passage « Abandon »');
            }
            var nj0 = (merged.journal || []).length;
            if (sioAuto_(db, merged, user.nom)) campUpd.push({ id: merged.id, campagne: merged.campagne, sioId: merged.sioId || '', sioEmail: merged.sioEmail || '', journal: (merged.journal || []).slice(nj0) });   // v3.16
          } catch (se) {}
          try { avNotifNouvelles_(db, merged, user, notifUpd); } catch (ne) { Logger.log('avNotif : ' + ne); }   // v3.18
        } else {
          if (!nc.createdAt) nc.createdAt = new Date().toISOString().split('T')[0];
          if (!nc.actions) nc.actions = {};
          if (!nc.produits) nc.produits = [];
          db.contacts.unshift(nc);
          try { var nj1 = (nc.journal || []).length; if (sioAuto_(db, nc, user.nom)) campUpd.push({ id: nc.id, campagne: nc.campagne, sioId: nc.sioId || '', sioEmail: nc.sioEmail || '', journal: (nc.journal || []).slice(nj1) }); } catch (se2) {}   // v3.16
          try { avNotifNouvelles_(db, nc, user, notifUpd); } catch (ne2) { Logger.log('avNotif : ' + ne2); }   // v3.18
        }
      });
    }
    else if (op === 'delete') {
      if (user.role === 'referent' || user.role === 'comite') return out_({ ok: false, error: 'forbidden' });
      var ids = req.ids || [];
      db.contacts = db.contacts.filter(function (c) {
        if (ids.indexOf(c.id) < 0) return true;           // pas concerné → on garde
        if (user.role === 'admin') return false;           // admin → suppression
        return !isVisible_(c, user);                       // gestionnaire → seulement les siens
      });
    }
    else if (op === 'saveUsers') {
      if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });
      var oldU = {}; (db.users || []).forEach(function (u) { oldU[u.id] = u; });
      if (user.id !== 'root') {                                                   // v3.19 — seuls le super-admin touche aux administrateurs
        var newMap = {}; (req.users || []).forEach(function (u) { if (u && u.id) newMap[u.id] = u; });
        var touche = (req.users || []).some(function (u) { if (!u) return false; var o = oldU[u.id]; if (u.role === 'admin' && (!o || o.role !== 'admin')) return true; if (o && o.role === 'admin' && JSON.stringify([o.nom, o.code, o.actif !== false, o.tel, o.email, o.role]) !== JSON.stringify([u.nom || '', u.code || '', u.actif !== false, u.tel || '', u.email || '', u.role || 'referent'])) return true; return false; })
          || Object.keys(oldU).some(function (id) { return oldU[id].role === 'admin' && !newMap[id]; });
        if (touche) { adminLog_(db, user.nom, 'tentative refusée', 'modification d\'un administrateur (réservé au super-admin)'); saveDB_(db); return out_({ ok: false, error: 'super_admin' }); }
      }
      db.users = (req.users || []).map(function (u) {
        return {
          id: u.id || ('u_' + Date.now() + '_' + Math.floor(Math.random() * 1e6).toString(36)),
          nom: u.nom || '', role: u.role || 'referent',
          tags: u.tags || [], code: u.code || '', actif: u.actif !== false,
          tel: u.tel || '', email: u.email || '', photo: u.photo || '', digestEmail: u.digestEmail || '', digestHeure: u.digestHeure || '',
          pending: !!u.pending, proposePar: u.proposePar || '', proposeLe: u.proposeLe || '', calendlyUrl: u.calendlyUrl || '', scope: u.scope === 'tout' ? 'tout' : 'equipes',
          comite: !!u.comite, voitComite: !!u.voitComite, gests: (u.gests || []).filter(Boolean),
          push: (oldU[u.id] && oldU[u.id].push !== undefined) ? oldU[u.id].push : (u.push !== false)   // v3.20 — préférence push conservée côté serveur
        };
      });
      // journal d'administration : créations, suppressions, désactivations, codes, rôles
      var newIds = {};
      db.users.forEach(function (u) {
        newIds[u.id] = 1; var o = oldU[u.id];
        if (!o) { adminLog_(db, user.nom, 'accès créé', u.nom + ' (' + u.role + ')'); return; }
        if (o.code !== u.code) adminLog_(db, user.nom, 'code modifié', u.nom);
        if (o.role !== u.role) adminLog_(db, user.nom, 'rôle modifié', u.nom + ' : ' + o.role + ' → ' + u.role);
        if ((o.actif !== false) !== u.actif) adminLog_(db, user.nom, u.actif ? 'accès réactivé' : 'accès désactivé', u.nom);
        if ((o.scope === 'tout' ? 'tout' : 'equipes') !== u.scope) adminLog_(db, user.nom, 'périmètre modifié', u.nom + ' : ' + u.scope);
        if (!!o.comite !== u.comite) adminLog_(db, user.nom, u.comite ? 'ajouté au comité scientifique' : 'retiré du comité scientifique', u.nom);
        if (JSON.stringify(o.gests || []) !== JSON.stringify(u.gests)) adminLog_(db, user.nom, 'rattachement modifié', u.nom + ' → ' + (u.gests.join(', ') || '—'));
      });
      Object.keys(oldU).forEach(function (id) { if (!newIds[id]) adminLog_(db, user.nom, 'accès supprimé', oldU[id].nom); });
      // un accès supprimé, désactivé ou dont le code a changé perd ses sessions
      var okIds = {}; db.users.forEach(function (u) { if (u.actif !== false && !u.pending && (!oldU[u.id] || oldU[u.id].code === u.code)) okIds[u.id] = 1; });
      db.sessions = (db.sessions || []).filter(function (s) { return s.userId === 'root' || okIds[s.userId]; });
    }
    else if (op === 'proposeUser') {
      // Un gestionnaire propose un référent ; l'admin approuvera (actif:false, pending:true, pas de code)
      if (user.role === 'referent') return out_({ ok: false, error: 'forbidden' });
      var pu = req.user || {};
      if (!pu.nom) return out_({ ok: false, error: 'nom' });
      var dup = (db.users || []).some(function (u) { return (u.nom || '').toLowerCase() === String(pu.nom).toLowerCase(); });
      if (!dup) {
        db.users.push({ id: pu.id || ('u_' + Date.now()), nom: pu.nom, role: 'referent', tags: pu.tags && pu.tags.length ? pu.tags : [pu.nom], code: '', tel: pu.tel || '', actif: false, pending: true, proposePar: user.nom, proposeLe: new Date().toISOString() });
        try { MailApp.sendEmail({ to: MON_EMAIL, subject: '👤 CRM OlyLife — nouveau référent proposé : ' + pu.nom, htmlBody: '<p><b>' + user.nom + '</b> propose un nouveau référent : <b>' + pu.nom + '</b>' + (pu.tel ? ' (' + pu.tel + ')' : '') + '.</p><p>Ouvrez le CRM → Équipe → « Approuver et générer le code ».</p>' }); } catch (e) {}
      }
    }
    else if (op === 'calendlyFetch') {
      // Détail d'un RDV juste réservé depuis le CRM (heure, lieu, lien visio)
      var evd = calendlyEventDetail_(req.eventUri);
      return out_(evd ? { ok: true, event: evd } : { ok: false, error: calendlyToken_() ? 'introuvable' : 'calendly_token' });
    }
    else if (op === 'syncCalendly') {
      if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });
      lock.releaseLock();
      var res = syncCalendly();
      return out_(res);
    }
    else if (op === 'rappelAgenda') {
      // Événement Google Agenda (agenda du compte WLHT) + invitations aux personnes concernées
      try { rappelAgenda_(db, user, req); } catch (e) { Logger.log('Agenda : ' + e); }
    }
    else if (op === 'saveMyDigest') {
      // Chaque utilisateur peut régler son propre résumé quotidien
      if (user.id === 'root') {
        PropertiesService.getScriptProperties().setProperty('root_digest', JSON.stringify({ email: req.digestEmail || '', heure: req.digestHeure || '', cal: req.calendlyUrl || '' }));
      } else {
        for (var ui = 0; ui < db.users.length; ui++) {
          if (db.users[ui].id === user.id) { db.users[ui].digestEmail = req.digestEmail || ''; db.users[ui].digestHeure = req.digestHeure || ''; db.users[ui].calendlyUrl = req.calendlyUrl || ''; }
        }
      }
    }
    else if (op === 'saveMyProfile') {
      // v3.5 — chaque utilisateur met à jour sa photo, son téléphone et son email
      var pf = { photo: String(req.photo || '').slice(0, 60000), tel: req.tel || '', email: req.email || '' };
      var calOk = /^https:\/\/(www\.)?calendly\.com\//i.test(String(req.calendlyUrl || ''));
      if (req.push !== undefined && user.id !== 'root') { for (var pu2 = 0; pu2 < db.users.length; pu2++) if (db.users[pu2].id === user.id) db.users[pu2].push = !!req.push; }   // v3.20 — préférence notifications push
      if (user.id === 'root') {
        db.config.rootProfile = pf;
        if (req.calendlyUrl !== undefined) { var rdc = {}; try { rdc = JSON.parse(PropertiesService.getScriptProperties().getProperty('root_digest') || '{}'); } catch (e) {} rdc.cal = calOk ? req.calendlyUrl : ''; PropertiesService.getScriptProperties().setProperty('root_digest', JSON.stringify(rdc)); }   // v3.19
      } else {
        for (var pi = 0; pi < db.users.length; pi++) {
          if (db.users[pi].id === user.id) { db.users[pi].photo = pf.photo; db.users[pi].tel = pf.tel; db.users[pi].email = pf.email; if (pf.email && !db.users[pi].digestEmail) db.users[pi].digestEmail = pf.email; if (req.calendlyUrl !== undefined) db.users[pi].calendlyUrl = calOk ? req.calendlyUrl : ''; }   // v3.6 / v3.19 — e-mail → résumé quotidien ; lien Calendly personnel
        }
      }
    }
    else if (op === 'saveRessources') {
      // v3.6 — protocoles du comité scientifique + compléments aux fiches « précautions »
      if (user.role !== 'admin' && !estComite_(user)) return out_({ ok: false, error: 'forbidden' });
      adminLog_(db, user.nom, 'ressources modifiées', ((req.ressources || {}).protocoles || []).length + ' fiche(s) conseils');
      db.config.ressources = req.ressources || {};
    }
    else if (op === 'uploadMedia') {
      // v3.6 — témoignage audio enregistré dans l'app → dossier Drive « CRM OlyLife — Témoignages »
      lock.releaseLock();
      try {
        var folder = null, it = DriveApp.getFoldersByName('CRM OlyLife — Témoignages');
        folder = it.hasNext() ? it.next() : DriveApp.createFolder('CRM OlyLife — Témoignages');
        var bytes = Utilities.base64Decode(req.data || '');
        if (!bytes.length) return out_({ ok: false, error: 'vide' });
        if (bytes.length > 15 * 1024 * 1024) return out_({ ok: false, error: 'trop_lourd' });
        var blob = Utilities.newBlob(bytes, req.mime || 'audio/webm', req.name || ('temoignage_' + Date.now() + '.webm'));
        var file = folder.createFile(blob);
        try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (se) {}
        return out_({ ok: true, id: file.getId(), url: 'https://drive.google.com/file/d/' + file.getId() + '/preview' });
      } catch (ue) { return out_({ ok: false, error: String(ue && ue.message ? ue.message : ue) }); }
    }
    // ── v3.13 — mot de passe du compte OlyLife (coffre) ──
    else if (op === 'mdpSet' || op === 'mdpGet' || op === 'mdpPurge') {
      var sc = contactById_(db, req.contactId);
      if (!canSecret_(sc, user)) return out_({ ok: false, error: 'forbidden' });
      var sk = secKey_(req.contactId, req.key), who = sc ? ((sc.prenom || '') + ' ' + (sc.nom || '')) : req.contactId;
      if (op === 'mdpSet') {
        var v = String(req.mdp || '').slice(0, 80);
        if (!v) return out_({ ok: false, error: 'vide' });
        secrets_(db)[sk] = { mdp: v, le: now_(), par: user.nom, src: 'saisie' };
        adminLog_(db, user.nom, 'mot de passe OlyLife enregistré', who + ' (' + (req.key || 'main') + ')');
      } else if (op === 'mdpGet') {
        var sv = secrets_(db)[sk];
        if (!sv) return out_({ ok: false, error: 'absent' });
        adminLog_(db, user.nom, 'mot de passe OlyLife consulté', who + ' (' + (req.key || 'main') + ')');
        if (sc) sc.mdpSet = mdpFlags_(db, sc.id);
        saveDB_(db); return out_({ ok: true, mdp: sv.mdp, le: sv.le, par: sv.par });
      } else {
        delete secrets_(db)[sk];
        adminLog_(db, user.nom, 'mot de passe OlyLife effacé', who + ' (' + (req.key || 'main') + ')' + (req.raison ? ' — ' + String(req.raison).slice(0, 80) : ''));
      }
      if (sc) sc.mdpSet = mdpFlags_(db, sc.id);
      saveDB_(db); return out_({ ok: true, mdpSet: sc ? sc.mdpSet : {} });
    }
    // ── v3.13 — factures PDF → Drive « CRM OlyLife — Factures » ──
    else if (op === 'uploadFacture') {
      var fcx = contactById_(db, req.contactId);
      if (user.role === 'referent' || user.role === 'comite') return out_({ ok: false, error: 'forbidden' });
      if (fcx && user.role !== 'admin' && !isVisible_(fcx, user)) return out_({ ok: false, error: 'forbidden' });
      lock.releaseLock();
      try {
        var ff = null, fit = DriveApp.getFoldersByName('CRM OlyLife — Factures');
        ff = fit.hasNext() ? fit.next() : DriveApp.createFolder('CRM OlyLife — Factures');
        var fb = Utilities.base64Decode(req.data || '');
        if (!fb.length) return out_({ ok: false, error: 'vide' });
        if (fb.length > 10 * 1024 * 1024) return out_({ ok: false, error: 'trop_lourd' });
        var fname = String(req.name || ('facture_' + Date.now() + '.pdf')).replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
        var ffile = ff.createFile(Utilities.newBlob(fb, req.mime || 'application/pdf', fname));
        try { ffile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (fse) {}
        return out_({ ok: true, id: ffile.getId(), url: 'https://drive.google.com/file/d/' + ffile.getId() + '/view' });
      } catch (fe) { return out_({ ok: false, error: String(fe && fe.message ? fe.message : fe) }); }
    }
    else if (op === 'deleteFacture') {
      if (user.role !== 'admin' && user.role !== 'gestionnaire') return out_({ ok: false, error: 'forbidden' });
      var fid = (String(req.url || '').match(/\/d\/([A-Za-z0-9_-]{10,})/) || [])[1] || String(req.id || '');
      if (!fid) return out_({ ok: false, error: 'id' });
      try { var df = DriveApp.getFileById(fid), dp = df.getParents(), okF = false; while (dp.hasNext()) { if (dp.next().getName() === 'CRM OlyLife — Factures') okF = true; }
        if (!okF) return out_({ ok: false, error: 'hors_dossier' });
        df.setTrashed(true); adminLog_(db, user.nom, 'facture supprimée', df.getName()); saveDB_(db); return out_({ ok: true });
      } catch (dfe) { return out_({ ok: false, error: String(dfe && dfe.message ? dfe.message : dfe) }); }
    }
    // v3.13 — e-mail de test vers un accès (adresse du profil + adresse du résumé quotidien)
    else if (op === 'testMail') {
      if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });
      var tu = null; (db.users || []).forEach(function (u) { if (u.id === req.userId) tu = u; });
      if (!tu) return out_({ ok: false, error: 'accès introuvable — enregistrez-le d\'abord' });
      var td = []; [tu.email, tu.digestEmail].forEach(function (em) { em = String(em || '').trim().toLowerCase(); if (em && td.indexOf(em) < 0) td.push(em); });
      if (!td.length) return out_({ ok: false, error: 'aucune adresse enregistrée sur le serveur pour ' + tu.nom });
      try { MailApp.sendEmail({ to: td.join(','), subject: '✅ CRM OlyLife — e-mail de test pour ' + tu.nom, htmlBody: '<p>Bonjour ' + tu.nom + ',</p><p>Ceci est un e-mail de test envoyé par ' + user.nom + ' depuis le CRM OlyLife WLHT. Si vous le lisez, les alertes « nouvelle demande », les invitations d\'agenda et le résumé quotidien vous arriveront bien à cette adresse.</p><p>Pensez à vérifier vos indésirables et à ajouter l\'expéditeur à vos contacts.</p>', name: 'CRM OlyLife — WLHT' }); }
      catch (te) { return out_({ ok: false, error: String(te && te.message ? te.message : te) }); }
      adminLog_(db, user.nom, 'e-mail de test envoyé', tu.nom + ' → ' + td.join(', '));
      saveDB_(db); return out_({ ok: true, dest: td, quota: MailApp.getRemainingDailyQuota() });
    }
    // ── v3.15 — campagnes e-mail Systeme.io ──
    else if (op === 'sioSync') {
      var scx = contactById_(db, req.contactId);
      if (!scx) return out_({ ok: false, error: 'introuvable' });
      if (user.role !== 'admin' && !isVisible_(scx, user)) return out_({ ok: false, error: 'forbidden' });
      if (user.role === 'referent') return out_({ ok: false, error: 'forbidden' });
      var sr = sioSet_(db, scx, String(req.parcours || ''), user.nom, String(req.raison || ''));
      saveDB_(db); return out_(sr);
    }
    else if (op === 'sioBulk') {                                            // v3.16 — rattrapage : inscrit tous les consentants non inscrits
      if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });
      if (!sioKey_()) return out_({ ok: false, error: 'SIO_API_KEY manquante' });
      var nb = 0, elig = 0, t0 = Date.now();
      for (var bi = 0; bi < db.contacts.length; bi++) {
        var bc = db.contacts[bi], bst = statutDe_(bc);
        if (!bc.email || !bc.emailConsent || bst === 'reseau' || bst === 'abandon' || (bc.campagne && bc.campagne.parcours)) continue;
        elig++;
        if (Date.now() - t0 > 240000) break;                                  // 4 min max par appel : relancer le bouton s'il reste des fiches
        if (sioAuto_(db, bc, user.nom, 'rattrapage — inscription des contacts consentants')) nb++;
      }
      saveDB_(db); return out_({ ok: true, inscrits: nb, eligibles: elig, reste: Math.max(0, elig - nb) });
    }
    else if (op === 'sioStatus') {
      if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });
      var key = PropertiesService.getScriptProperties().getProperty('SIO_API_KEY') || '';
      if (!key) return out_({ ok: true, configured: false, hook: !!PropertiesService.getScriptProperties().getProperty('SIO_HOOK_SECRET') });
      var tst = sioReq_('GET', '/api/tags?limit=100');
      var hookUrl = ScriptApp.getService().getUrl() + '?hook=sio&k=' + (PropertiesService.getScriptProperties().getProperty('SIO_HOOK_SECRET') || '(à définir)');
      if (!tst.ok) return out_({ ok: true, configured: true, api: false, error: tst.error, hookUrl: hookUrl });
      var names = (tst.data && tst.data.items ? tst.data.items : []).map(function (t) { return t.name; });
      return out_({ ok: true, configured: true, api: true, tags: names, hookUrl: hookUrl, quota: UrlFetchApp ? undefined : undefined });
    }
    else if (op === 'saveConfig') {
      if (user.role !== 'admin') return out_({ ok: false, error: 'forbidden' });
      if (req.config && req.config.stocks) adminLog_(db, user.nom, 'stock modifié', req.config.stocks.map(function (x) { return x.qte + '×' + x.produit.split('(')[0].trim() + '@' + x.qui; }).join(', '));
      if (req.config && req.config.referents) db.config.referents = req.config.referents;
      if (req.config && req.config.stocks) db.config.stocks = req.config.stocks;   // v3.4 — stock de machines
      if (req.config && req.config.params) {                                          // v3.8 — menu Administration
        var old = db.config.params || {}, chg = [];
        if (user.id !== 'root' && JSON.stringify(old.droits || null) !== JSON.stringify(req.config.params.droits || null)) {   // v3.19 — la matrice des droits n'est modifiable que par le super-admin
          if (old.droits) req.config.params.droits = old.droits; else delete req.config.params.droits;
        }
        Object.keys(req.config.params).forEach(function (k) { if (JSON.stringify(old[k]) !== JSON.stringify(req.config.params[k])) chg.push(k); });
        db.config.params = req.config.params;
        if (chg.length) adminLog_(db, user.nom, 'paramètres modifiés', chg.join(', '));
      }
    }
    else {
      return out_({ ok: false, error: 'op' });
    }

    saveDB_(db);
    var res = { ok: true }; if (campUpd.length) res.camp = campUpd; if (notifUpd.length) res.notif = notifUpd;   // v3.18
    return out_(res);
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    lock.releaseLock();
  }
}

// ── UTILITAIRES DATES (email matinal) ───────────────────────────────
function addDays(dateStr, n) {
  var d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}
function diffDays(dateStr) {
  if (!dateStr) return null;
  var d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

// ── EMAIL MATINAL AUTOMATIQUE (inchangé, lit la nouvelle base) ─────
function envoyerEmailMatinal() {
  var db = getDB_();
  var contacts = db.contacts || [];
  if (!contacts.length) return;

  var RELANCE_STEPS = [
    { k: 'j2',  d: 2,  l: 'J+2 — 1er rappel' },
    { k: 'j5',  d: 5,  l: 'J+5 — 2e rappel' },
    { k: 'j12', d: 12, l: 'J+12 — dernier rappel' }
  ];

  var items = [];

  contacts.forEach(function (c) {
    var actions = c.actions || {};
    var nomComplet = (c.nom || '') + ' ' + (c.prenom || '');
    var suivi = c.suiviPar ? ' · suivi : ' + c.suiviPar : '';

    if (c.etape === 'Prospect' || c.etape === 'Relance en cours') {
      RELANCE_STEPS.forEach(function (s) {
        var done = actions[s.k] && actions[s.k].done;
        if (done || !c.createdAt) return;
        var diff = diffDays(addDays(c.createdAt, s.d));
        if (diff !== null && diff <= 1) {
          items.push({ type: 'Relance', nom: nomComplet, label: s.l + suivi, diff: diff, tel: c.tel || '' });
        }
      });
    }
    if (c.numCommande && !c.tracking && c.dateCommande) {
      var doneL = actions.logistique && actions.logistique.done;
      if (!doneL) {
        var diffL = diffDays(addDays(c.dateCommande, SEUIL_LOGISTIQUE));
        if (diffL !== null && diffL <= 1) {
          items.push({ type: 'Logistique', nom: nomComplet, label: 'Sans tracking depuis la commande (n°' + c.numCommande + ')' + suivi, diff: diffL, tel: c.tel || '' });
        }
      }
    }
    if (c.tracking && !c.installConfirm) {
      var doneI = actions.installation && actions.installation.done;
      var base = c.dateLivraison || c.dateCommande;
      if (!doneI && base) {
        var diffI = diffDays(addDays(base, DELAI_INSTALL));
        if (diffI !== null && diffI <= 1) {
          items.push({ type: 'Installation', nom: nomComplet, label: 'Suivi installation & mise en route' + suivi, diff: diffI, tel: c.tel || '' });
        }
      }
    }
    if (c.installConfirm && !c.temoignageTexte) {
      var doneT = actions.temoignage && actions.temoignage.done;
      if (!doneT && c.dateInstall) {
        var diffT = diffDays(addDays(c.dateInstall, DELAI_TEMOIGNAGE));
        if (diffT !== null && diffT <= 1) {
          items.push({ type: 'Témoignage', nom: nomComplet, label: 'Demande de témoignage' + suivi, diff: diffT, tel: c.tel || '' });
        }
      }
    }
  });

  if (!items.length) return;

  items.sort(function (a, b) { return a.diff - b.diff; });

  var aujourd_hui = new Date();
  var date_fr = aujourd_hui.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var couleurType = { 'Relance': '#3FD8C6', 'Logistique': '#E8636B', 'Installation': '#C9A574', 'Témoignage': '#33C481' };

  function ligne(item) {
    var statut = item.diff < 0
      ? '<span style="color:#E8636B;font-weight:700">⚠ Retard ' + Math.abs(item.diff) + 'j</span>'
      : item.diff === 0
        ? '<span style="color:#C9A574;font-weight:700">✅ Aujourd\'hui</span>'
        : '<span style="color:#33C481;font-weight:700">Demain</span>';
    var num = (item.tel || '').replace(/\D/g, '');
    var waBtn = num
      ? '<a href="https://wa.me/' + num + '" style="background:#25D366;color:#fff;padding:5px 12px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;margin-left:8px">WhatsApp →</a>'
      : '';
    var typeBadge = '<span style="background:' + (couleurType[item.type] || '#5E7086') + '22;color:' + (couleurType[item.type] || '#5E7086') + ';padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700">' + item.type + '</span>';
    return '<tr style="border-bottom:1px solid #1C3450">'
      + '<td style="padding:10px 12px">' + typeBadge + '</td>'
      + '<td style="padding:10px 12px;font-weight:600;color:#EAF0F6">' + item.nom + '</td>'
      + '<td style="padding:10px 12px;color:#9FB0C3;font-size:12px">' + item.label + '</td>'
      + '<td style="padding:10px 12px">' + statut + waBtn + '</td>'
      + '</tr>';
  }

  var html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;background:#040E1A;padding:20px">'
    + '<div style="background:linear-gradient(135deg,#081527,#12283F);border:1px solid #1C3450;border-radius:14px;padding:24px 28px;margin-bottom:20px">'
    + '<div style="font-size:22px;font-weight:700;color:#C9A574">CRM OlyLife — Rappels du jour</div>'
    + '<div style="font-size:13px;color:#9FB0C3;margin-top:4px">' + date_fr + '</div>'
    + '</div>'
    + '<div style="background:#E8636B22;border:1px solid #E8636B;border-radius:10px;padding:12px 16px;margin-bottom:20px;color:#E8636B;font-weight:600;font-size:14px">'
    + '🔔 ' + items.length + ' action' + (items.length > 1 ? 's' : '') + ' à traiter'
    + '</div>'
    + '<table style="width:100%;border-collapse:collapse;background:#0B1D31;border-radius:10px;overflow:hidden;border:1px solid #1C3450">'
    + '<thead><tr style="background:#12283F">'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#C9A574;text-transform:uppercase">Type</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#C9A574;text-transform:uppercase">Contact</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#C9A574;text-transform:uppercase">Étape</th>'
    + '<th style="padding:8px 12px;text-align:left;font-size:11px;color:#C9A574;text-transform:uppercase">Action</th>'
    + '</tr></thead><tbody>'
    + items.map(ligne).join('')
    + '</tbody></table>'
    + '<div style="background:#12283F;border-radius:10px;padding:14px 18px;font-size:12px;color:#9FB0C3;text-align:center;margin-top:20px">'
    + 'Cet email est généré automatiquement par votre CRM OlyLife — WLHT.'
    + '</div></body></html>';

  var sujet = '🔔 CRM OlyLife — ' + items.length + ' rappel(s) pour aujourd\'hui';

  MailApp.sendEmail({ to: MON_EMAIL, subject: sujet, htmlBody: html });
  Logger.log('Email matinal envoyé : ' + items.length + ' action(s).');
}

// ── INSTALLER LE DÉCLENCHEUR AUTOMATIQUE (7h00 chaque matin) ───────
function installerDeclencheur() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'envoyerEmailMatinal') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('envoyerEmailMatinal')
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .inTimezone('Africa/Abidjan')
    .create();
  Logger.log('Déclencheur installé ! Email matinal à 7h00 (heure Abidjan) chaque jour.');
}

// ── TESTER L'EMAIL MAINTENANT ───────────────────────────────────────
function testerEmail() {
  envoyerEmailMatinal();
  Logger.log('Email de test envoyé à ' + MON_EMAIL);
}

// ── VÉRIFIER LA MIGRATION (facultatif) ──────────────────────────────
// ▶ Exécuter → verifierMigration : affiche le nombre de contacts repris
function verifierMigration() {
  var db = getDB_();
  Logger.log('Contacts en base : ' + db.contacts.length);
  Logger.log('Utilisateurs : ' + db.users.length);
  Logger.log('Référents configurés : ' + (db.config.referents || []).join(', '));
}

// ═══════════════════════════════════════════════════════════════════
// v3 — RÉSUMÉ QUOTIDIEN PAR UTILISATEUR (à l'heure choisie dans l'app)
// ═══════════════════════════════════════════════════════════════════
var FUSEAU = 'Europe/Paris';   // fuseau de référence pour l'heure des résumés

function suivis_(c) {
  if (c.suivis && c.suivis.length) return c.suivis;
  return String(c.suiviPar || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
}
function emailDe_(db, nom) {
  if (!nom) return '';
  if (nom === ADMIN_NOM) { var rd = {}; try { rd = JSON.parse(PropertiesService.getScriptProperties().getProperty('root_digest') || '{}'); } catch (e) {} return rd.email || MON_EMAIL; }
  for (var i = 0; i < db.users.length; i++) if (db.users[i].nom === nom) return db.users[i].email || db.users[i].digestEmail || '';   // v3.13 — e-mail du profil en priorité (invitations d'agenda)
  return '';
}
// ── AGENDA GOOGLE : un événement par rappel, invités = gestionnaires + référent ──
function rappelAgenda_(db, user, req) {
  var idx = -1;
  for (var i = 0; i < db.contacts.length; i++) if (db.contacts[i].id === req.contactId) { idx = i; break; }
  if (idx < 0) return;
  var c = db.contacts[idx];
  if (user.role !== 'admin' && !isVisible_(c, user)) return;
  var cal = CalendarApp.getDefaultCalendar();
  var oldId = req.eventId || (c.rappel && c.rappel.eventId) || (c._agendaEventId || '');
  if (oldId) { try { var ev0 = cal.getEventById(oldId); if (ev0) ev0.deleteEvent(); } catch (e) {} }
  if (req.action === 'delete' || !req.rappel || !req.rappel.date) { if (c.rappel) delete c.rappel.eventId; delete c._agendaEventId; return; }
  var r = req.rappel;
  var hm = String(r.heure || '10:00').split(':');
  var start = new Date(r.date + 'T00:00:00');
  start.setHours(parseInt(hm[0], 10) || 10, parseInt(hm[1], 10) || 0, 0, 0);
  var end = new Date(start.getTime() + 30 * 60000);
  var titre = '⏰ Rappel CRM : ' + (c.nom || '') + ' ' + (c.prenom || '');
  var desc = (r.texte ? r.texte + '\n' : '') + (c.tel ? 'Tél : ' + c.tel + '\n' : '') + (r.pour ? 'Pour : ' + r.pour + '\n' : '') + 'Créé par : ' + (r.par || user.nom) + '\nOuvrir le CRM : https://crm.team-waterlifehightech.com/';
  // invités : la personne attribuée, les gestionnaires du contact, le référent (tag)
  var noms = [r.pour].concat(suivis_(c));
  (c.ctags || []).forEach(function (t) { db.users.forEach(function (u) { if ((u.tags || []).indexOf(t) >= 0) noms.push(u.nom); }); });
  var guests = [];
  noms.forEach(function (nm) { var e = emailDe_(db, nm); if (e && guests.indexOf(e) < 0 && e !== Session.getEffectiveUser().getEmail()) guests.push(e); });
  var ev = cal.createEvent(titre, start, end, { description: desc, guests: guests.join(','), sendInvites: guests.length > 0 });
  ev.addPopupReminder(30);
  if (!c.rappel) c.rappel = r;
  c.rappel.eventId = ev.getId();
  c._agendaEventId = ev.getId();
}
// ═══════════════ v3.15 — SYSTEME.IO (API publique) ═══════════════
var SIO_BASE = 'https://api.systeme.io';
var SIO_TAGS = { decouverte: 'oly_decouverte', reseau: 'oly_reseau', stop: 'oly_stop', consent: 'oly_consent', encours: 'oly_encours' };
function sioKey_() { return PropertiesService.getScriptProperties().getProperty('SIO_API_KEY') || ''; }
function sioReq_(method, path, body) {
  var key = sioKey_(); if (!key) return { ok: false, error: 'SIO_API_KEY manquante (Propriétés du script)' };
  try {
    var opt = { method: method, headers: { 'X-API-Key': key, 'Accept': 'application/json' }, muteHttpExceptions: true };
    if (body) { opt.contentType = 'application/json'; opt.payload = JSON.stringify(body); }
    var r = UrlFetchApp.fetch(SIO_BASE + path, opt), code = r.getResponseCode(), txt = r.getContentText();
    var data = null; try { data = txt ? JSON.parse(txt) : null; } catch (pe) {}
    if (code >= 200 && code < 300) return { ok: true, data: data, code: code };
    return { ok: false, error: 'HTTP ' + code + (data && (data.detail || data.message) ? ' — ' + (data.detail || data.message) : ''), code: code };
  } catch (fe) { return { ok: false, error: String(fe && fe.message ? fe.message : fe) }; }
}
// Tags Systeme.io : cache { nom → id } dans db.config.sioTags, création à la volée
function sioTagId_(db, name) {
  db.config.sioTags = db.config.sioTags || {};
  if (db.config.sioTags[name]) return db.config.sioTags[name];
  var r = sioReq_('GET', '/api/tags?limit=100');
  if (r.ok && r.data && r.data.items) r.data.items.forEach(function (t) { db.config.sioTags[t.name] = t.id; });
  if (db.config.sioTags[name]) return db.config.sioTags[name];
  var c = sioReq_('POST', '/api/tags', { name: name });
  if (c.ok && c.data && c.data.id) { db.config.sioTags[name] = c.data.id; return c.data.id; }
  return null;
}
// Contact Systeme.io correspondant à une fiche (par e-mail) — créé s'il n'existe pas ; id mémorisé dans c.sioId
function sioContactId_(db, c) {
  var email = String(c.email || '').trim().toLowerCase(); if (!email) return { ok: false, error: 'pas d\'e-mail' };
  if (c.sioId && c.sioEmail === email) return { ok: true, id: c.sioId };
  var g = sioReq_('GET', '/api/contacts?email=' + encodeURIComponent(email) + '&limit=1');
  var found = g.ok && g.data && g.data.items && g.data.items.length ? g.data.items[0] : null;
  if (found) { c.sioId = found.id; c.sioEmail = email; return { ok: true, id: found.id }; }
  var fields = [];
  if (c.prenom) fields.push({ slug: 'first_name', value: String(c.prenom).split(' ')[0] });
  if (c.nom) fields.push({ slug: 'surname', value: String(c.nom) });
  if (c.tel) fields.push({ slug: 'phone_number', value: String(c.tel) });
  if (c.pays) fields.push({ slug: 'country', value: /france/i.test(c.pays) ? 'FR' : String(c.pays).slice(0, 2).toUpperCase() });
  var p = sioReq_('POST', '/api/contacts', { email: email, locale: 'fr', fields: fields });
  if (p.ok && p.data && p.data.id) { c.sioId = p.data.id; c.sioEmail = email; return { ok: true, id: p.data.id }; }
  return { ok: false, error: p.error || 'création impossible' };
}
function sioTagOn_(db, cid, name) { var id = sioTagId_(db, name); if (!id) return false; var r = sioReq_('POST', '/api/contacts/' + cid + '/tags', { tagId: id }); return r.ok || r.code === 409 || r.code === 422; }
function sioTagOff_(db, cid, name) { var id = sioTagId_(db, name); if (!id) return true; var r = sioReq_('DELETE', '/api/contacts/' + cid + '/tags/' + id); return r.ok || r.code === 404; }
// Bascule de parcours : 'decouverte' | 'reseau' | 'stop' | 'pause' | 'reprise'
function sioSet_(db, c, parcours, par, raison) {
  if (!sioKey_()) return { ok: false, error: 'SIO_API_KEY manquante' };
  var email = String(c.email || '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'email' };
  if (!c.emailConsent && parcours !== 'stop') return { ok: false, error: 'consent' };
  var ci = sioContactId_(db, c); if (!ci.ok) return { ok: false, error: ci.error };
  var id = ci.id, cp = c.campagne || {}, want = {}, ok = true;
  if (parcours === 'pause') { cp.pause = now_(); cp.pausePar = par; want = { stop: 1 }; }
  else if (parcours === 'reprise') { delete cp.pause; delete cp.pausePar; parcours = cp.parcours || 'decouverte'; }
  if (parcours === 'decouverte') want = { decouverte: 1, reseau: 0, stop: 0 };
  else if (parcours === 'reseau') want = { decouverte: 0, reseau: 1, stop: 0 };
  else if (parcours === 'stop') want = { decouverte: 0, reseau: 0, stop: 1 };
  Object.keys(want).forEach(function (k) { var r = want[k] ? sioTagOn_(db, id, SIO_TAGS[k]) : sioTagOff_(db, id, SIO_TAGS[k]); if (!r) ok = false; });
  sioTagOn_(db, id, SIO_TAGS.consent);
  // v3.16 — oly_encours : segment « newsletter hebdomadaire Zoom » = contacts En cours (RDV pris / échange engagé), tant que le parcours tourne
  var stC = statutDe_(c), enc = stC === 'encours' && parcours !== 'stop' && parcours !== 'pause';
  if (enc) sioTagOn_(db, id, SIO_TAGS.encours); else sioTagOff_(db, id, SIO_TAGS.encours);
  cp.encours = enc;
  (c.ctags || []).forEach(function (t) { var tn = 'ref_' + String(t).replace(/[^\w-]+/g, '_').slice(0, 30); sioTagOn_(db, id, tn); });
  if (parcours !== 'pause') { cp.parcours = parcours === 'stop' ? 'stop' : parcours; cp.depuis = now_(); cp.par = par; }
  cp.events = (cp.events || []).slice(-30); cp.events.push({ ts: now_(), type: parcours, par: par, raison: raison || '' });
  c.campagne = cp;
  var lib = { decouverte: '📧 Inscrit à la campagne « Découverte »', reseau: '📧 Basculé sur la campagne « Membre du réseau » (Découverte arrêtée)', stop: '📧 Campagnes e-mail arrêtées', pause: '📧 Campagne mise en pause', reprise: '📧 Campagne reprise' }[parcours] || '📧 Campagne : ' + parcours;
  c.journal = c.journal || []; c.journal.push({ id: 'j_' + Date.now() + '_' + Math.floor(Math.random() * 1000), ts: now_(), auteur: par || 'système', role: 'systeme', type: 'systeme', texte: lib + (raison ? ' — ' + raison : '') + (ok ? '' : ' (⚠️ synchronisation Systeme.io partielle)') });
  c.lastActivity = now_();
  adminLog_(db, par || 'système', 'campagne e-mail : ' + parcours, (c.prenom || '') + ' ' + (c.nom || '') + ' <' + email + '>');
  return { ok: ok, campagne: cp, sioId: id, warning: ok ? '' : 'Certains tags n\'ont pas pu être posés — vérifiez la clé API' };
}
// Webhook Systeme.io → journal de la fiche (e-mail retrouvé n'importe où dans le corps)
function sioHook_(db, raw) {
  var body = null; try { body = JSON.parse(raw || '{}'); } catch (pe) { return { ok: false, error: 'json' }; }
  var email = '', typ = String(body.type || body.event || (body.data && body.data.type) || 'event');
  (function find(o, d) { if (email || !o || d > 6) return; if (typeof o === 'string') { if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(o)) email = o.toLowerCase(); return; } if (typeof o === 'object') Object.keys(o).forEach(function (k) { if (!email && (k === 'email' && typeof o[k] === 'string')) email = String(o[k]).toLowerCase(); }); if (!email && typeof o === 'object') Object.keys(o).forEach(function (k) { find(o[k], d + 1); }); })(body, 0);
  if (!email) return { ok: true, ignored: 'no-email' };
  var c = null; for (var i = 0; i < db.contacts.length; i++) if (String(db.contacts[i].email || '').toLowerCase() === email) { c = db.contacts[i]; break; }
  if (!c) return { ok: true, ignored: 'unknown-contact' };
  var tag = (body.data && body.data.tag && body.data.tag.name) || (body.tag && body.tag.name) || '';
  // Seuls les tags posés par les règles Systeme.io intéressent le CRM : oly_desinscrit (désinscription) et oly_fin_* (campagne terminée).
  // Les tags que le CRM pose lui-même (oly_decouverte, oly_reseau, oly_stop, oly_consent, ref_*) sont ignorés pour éviter les doublons.
  if (tag && !/^oly_desinscrit$|^oly_fin_/i.test(tag)) return { ok: true, ignored: 'tag-crm' };
  if (!tag && !/unsubscri|desabonn|désabonn|bounce|complet|finish|termin/i.test(typ)) return { ok: true, ignored: 'event' };
  var lib = /^oly_fin_/i.test(tag) ? '📧 Campagne terminée (' + tag.replace(/^oly_fin_/i, '') + ')' : '📧 Systeme.io : ' + typ.replace(/[._]/g, ' ') + (tag ? ' — ' + tag : '');
  var cp = c.campagne || {}; cp.lastEvent = { ts: now_(), type: typ, tag: tag }; c.campagne = cp;
  if (/unsubscri|desabonn|désabonn|bounce/i.test(typ) || /^oly_desinscrit$/i.test(tag)) {
    cp.parcours = 'stop'; cp.depuis = now_(); c.emailConsent = false; c.emailConsentRetire = now_();
    lib = '📧 Désinscription des e-mails (Systeme.io) — consentement retiré, campagnes arrêtées';
  }
  c.journal = c.journal || []; c.journal.push({ id: 'j_' + Date.now() + '_' + Math.floor(Math.random() * 1000), ts: now_(), auteur: 'Systeme.io', role: 'systeme', type: 'systeme', texte: lib });
  return { ok: true };
}
// v3.16 — inscription automatique : tout contact À contacter / En cours / Prêt avec e-mail + consentement entre dans « Découverte » ;
// le tag oly_encours suit le statut. Silencieux si la clé API manque. Retourne true si quelque chose a changé.
function sioAuto_(db, c, par, raison) {
  try {
    if (!sioKey_() || !c || !c.email || !c.emailConsent) return false;
    if (!droit_(db, 'client', 'campagnes', true)) return false;   // v3.19
    var st = statutDe_(c), cp = c.campagne || {};
    if (st === 'reseau' || st === 'abandon') return false;
    if (!cp.parcours) { sioSet_(db, c, 'decouverte', par || 'système', raison || 'inscription automatique (statut ' + ({ afaire: 'À contacter', encours: 'En cours', close: 'Prêt' }[st] || st) + ')'); return true; }
    if (cp.parcours === 'decouverte' && !cp.pause && c.sioId) {               // seul le tag oly_encours à ajuster
      var enc = st === 'encours', had = !!cp.encours;
      if (enc !== had) { if (enc) sioTagOn_(db, c.sioId, SIO_TAGS.encours); else sioTagOff_(db, c.sioId, SIO_TAGS.encours); cp.encours = enc; c.campagne = cp; return true; }
    }
  } catch (e) {}
  return false;
}
function statutDe_(c) {
  if (c.statut) return c.statut;
  if (c.estPartenaire || c.etape === 'Partenaire équipe') return 'reseau';
  if (c.journal && c.journal.length) return 'encours';
  return 'afaire';
}
function contactsDe_(db, u) {
  if (u.role === 'admin') return db.contacts;
  if (u.role === 'gestionnaire') return db.contacts.filter(function (c) { return suivis_(c).indexOf(u.nom) >= 0 || (c.rappel && c.rappel.pour === u.nom); });
  var tag = (u.tags || [])[0];
  return db.contacts.filter(function (c) { return tag && ((c.ctags && c.ctags.indexOf(tag) >= 0) || (c.refere || '').indexOf(tag) >= 0); });
}
function rappelPour_(c, u) {
  if (!c.rappel || !c.rappel.date) return false;
  if (u.role === 'admin') return true;
  if (u.role === 'gestionnaire') return c.rappel.pour === u.nom || !c.rappel.pour || suivis_(c).indexOf(u.nom) >= 0;
  var tag = (u.tags || [])[0];
  return !!(tag && c.ctags && c.ctags.indexOf(tag) >= 0);
}
function fmtDate_(s) { if (!s) return '—'; var d = new Date(s); return Utilities.formatDate(d, FUSEAU, 'dd/MM/yyyy'); }
function fmtDT_(s) { if (!s) return ''; return Utilities.formatDate(new Date(s), FUSEAU, 'dd/MM HH:mm'); }

function construireDigest_(db, u) {
  var mes = contactsDe_(db, u);
  var hier = new Date(); hier.setDate(hier.getDate() - 1); hier.setHours(0, 0, 0, 0);
  var aFaire = mes.filter(function (c) { return statutDe_(c) === 'afaire'; });
  var enCours = mes.filter(function (c) { return statutDe_(c) === 'encours'; });
  var prets = mes.filter(function (c) { return statutDe_(c) === 'close'; });
  var raps = db.contacts.filter(function (c) { return rappelPour_(c, u) && diffDays(c.rappel.date) <= 0; })
    .sort(function (a, b) { return (a.rappel.date + (a.rappel.heure || '')).localeCompare(b.rappel.date + (b.rappel.heure || '')); });
  var nouveautes = [];
  mes.forEach(function (c) {
    (c.journal || []).forEach(function (e) { if (e.auteur !== u.nom && new Date(e.ts) >= hier) nouveautes.push({ c: c, e: e }); });
  });
  nouveautes.sort(function (a, b) { return b.e.ts.localeCompare(a.e.ts); });
  if (!raps.length && !aFaire.length && !nouveautes.length && !prets.length) return null;

  var V = '#126A3C', R = '#C63E47', J = '#D9A400', G = '#4FB874';
  function nomC(c) { return (c.nom || '') + ' ' + (c.prenom || ''); }
  function wa(c) { var n = (c.tel || '').replace(/\D/g, ''); return n ? ' <a href="https://wa.me/' + n + '" style="background:#25D366;color:#fff;padding:3px 9px;border-radius:6px;text-decoration:none;font-size:11px;font-weight:700">WhatsApp</a>' : ''; }
  function bloc(titre, couleur, lignes) {
    if (!lignes.length) return '';
    return '<div style="margin:18px 0 6px;font-size:13px;font-weight:700;color:' + couleur + ';text-transform:uppercase;letter-spacing:.5px">' + titre + ' (' + lignes.length + ')</div>'
      + '<table style="width:100%;border-collapse:collapse">' + lignes.join('') + '</table>';
  }
  function li(c, extra) {
    return '<tr><td style="padding:8px 10px;border-bottom:1px solid #E3EDE6;font-size:13px"><b>' + nomC(c) + '</b>' + (c.tel ? ' · ' + c.tel : '') + wa(c)
      + (extra ? '<div style="color:#5A6B60;font-size:12px;margin-top:2px">' + extra + '</div>' : '') + '</td></tr>';
  }
  var html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#F6FAF6;padding:18px;color:#1E2B23">'
    + '<div style="background:linear-gradient(135deg,#126A3C,#0B4A2A);border-radius:14px;padding:20px 22px;color:#fff">'
    + '<div style="font-size:20px;font-weight:700">Bonjour ' + u.nom + ' 👋</div>'
    + '<div style="font-size:13px;opacity:.9;margin-top:4px">Votre résumé CRM OlyLife — ' + frQuand_(new Date().toISOString()).split(' à ')[0] + '</div>'
    + '<div style="margin-top:12px;font-size:13px"><span style="background:' + R + ';padding:3px 9px;border-radius:20px;margin-right:6px">🔴 ' + aFaire.length + ' à contacter</span>'
    + '<span style="background:' + J + ';padding:3px 9px;border-radius:20px;margin-right:6px">🟡 ' + enCours.length + ' en cours</span>'
    + '<span style="background:' + G + ';padding:3px 9px;border-radius:20px">🟢 ' + prets.length + ' prêts</span></div></div>'
    + '<div style="background:#fff;border:1px solid #E3EDE6;border-radius:14px;padding:6px 14px 14px;margin-top:14px">'
    + bloc('⏰ Rappels du jour / en retard', J, raps.map(function (c) { var d = diffDays(c.rappel.date); return li(c, (d < 0 ? '<b style="color:' + R + '">Retard ' + Math.abs(d) + 'j</b>' : "<b>Aujourd'hui</b>") + ' · ' + fmtDate_(c.rappel.date) + (c.rappel.heure ? ' ' + c.rappel.heure : '') + (c.rappel.pour ? ' · pour ' + c.rappel.pour : '') + (c.rappel.texte ? ' — ' + c.rappel.texte : '')); }))
    + bloc('🔔 Nouveautés sur vos contacts (24h)', V, nouveautes.slice(0, 12).map(function (x) { return li(x.c, fmtDT_(x.e.ts) + ' · ' + x.e.auteur + ' : ' + x.e.texte); }))
    + bloc('🔴 À contacter', R, aFaire.slice(0, 15).map(function (c) { return li(c, c.notes ? String(c.notes).slice(0, 120) : ''); }))
    + bloc('🟢 Prêts à closer', G, prets.map(function (c) { return li(c, ''); }))
    + '</div>'
    + '<div style="text-align:center;font-size:11px;color:#7A8A80;margin-top:14px">Ouvrir le CRM : <a href="https://crm.team-waterlifehightech.com/" style="color:' + V + '">crm.team-waterlifehightech.com</a><br>Pour changer l\'heure ou l\'adresse de ce résumé : onglet Équipe → Mon résumé quotidien.</div>'
    + '</body></html>';
  return { html: html, sujet: '🌿 CRM OlyLife — ' + (raps.length ? raps.length + ' rappel(s) · ' : '') + aFaire.length + ' à contacter · ' + nouveautes.length + ' nouveauté(s)' };
}

// Exécutée toutes les heures : envoie le résumé aux personnes dont c'est l'heure
function envoyerDigests() {
  var db = getDB_();
  var heureNow = parseInt(Utilities.formatDate(new Date(), FUSEAU, 'H'), 10);
  var props = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), FUSEAU, 'yyyy-MM-dd');
  var dest = [];
  // admin principal
  var rd = {}; try { rd = JSON.parse(props.getProperty('root_digest') || '{}'); } catch (e) {}
  dest.push({ id: 'root', nom: ADMIN_NOM, role: 'admin', tags: [], digestEmail: rd.email || MON_EMAIL, digestHeure: rd.heure || '07:00' });
  (db.users || []).forEach(function (u) { if (u.actif !== false && u.digestEmail && u.digestHeure) dest.push(u); });
  dest.forEach(function (u) {
    var h = parseInt(String(u.digestHeure).split(':')[0], 10);
    if (h !== heureNow) return;
    var key = 'digest_sent_' + u.id;
    if (props.getProperty(key) === today) return;          // déjà envoyé aujourd'hui
    var d = construireDigest_(db, u);
    if (d) {
      try { MailApp.sendEmail({ to: u.digestEmail, subject: d.sujet, htmlBody: d.html, name: 'CRM OlyLife — WLHT' }); } catch (e) { Logger.log('Échec envoi à ' + u.digestEmail + ' : ' + e); return; }
      Logger.log('Résumé envoyé à ' + u.nom + ' <' + u.digestEmail + '>');
    }
    props.setProperty(key, today);
  });
}
// ▶ Test : envoie immédiatement votre résumé admin à MON_EMAIL
function testerDigestAdmin() {
  var db = getDB_();
  var d = construireDigest_(db, { id: 'root', nom: ADMIN_NOM, role: 'admin', tags: [] });
  if (!d) { Logger.log('Rien à envoyer aujourd\'hui'); return; }
  MailApp.sendEmail({ to: MON_EMAIL, subject: '[TEST] ' + d.sujet, htmlBody: d.html, name: 'CRM OlyLife — WLHT' });
  Logger.log('Test envoyé à ' + MON_EMAIL);
}

// ═══════════════════════════════════════════════════════════════════
// v3 — SAUVEGARDE JOURNALIÈRE SUR DRIVE (dossier « CRM OlyLife — Sauvegardes »)
// ═══════════════════════════════════════════════════════════════════
var BACKUP_FOLDER = 'CRM OlyLife — Sauvegardes';
var BACKUP_KEEP   = 60;   // nombre de sauvegardes conservées (1 par jour)

function dossierSauvegardes_() {
  var it = DriveApp.getFoldersByName(BACKUP_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(BACKUP_FOLDER);
}
function sauvegardeQuotidienne() {
  var db = getDB_();
  var folder = dossierSauvegardes_();
  var nom = 'CRM_OlyLife_' + Utilities.formatDate(new Date(), FUSEAU, 'yyyy-MM-dd_HHmm') + '.json';
  folder.createFile(nom, JSON.stringify(db), 'application/json');
  // rotation : on garde les BACKUP_KEEP plus récentes
  var files = [], it = folder.getFiles();
  while (it.hasNext()) { var f = it.next(); if (f.getName().indexOf('CRM_OlyLife_') === 0) files.push(f); }
  files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  files.slice(BACKUP_KEEP).forEach(function (f) { f.setTrashed(true); });
  Logger.log('Sauvegarde créée : ' + nom + ' (' + db.contacts.length + ' contacts, ' + db.users.length + ' accès) — ' + Math.min(files.length, BACKUP_KEEP) + ' conservée(s)');
}
// ▶ Restaurer une sauvegarde Drive : indiquer le nom exact du fichier
function restaurerSauvegarde(nomFichier) {
  if (!nomFichier) throw new Error('Indiquez le nom du fichier, ex : restaurerSauvegarde("CRM_OlyLife_2026-10-06_0300.json")');
  var it = dossierSauvegardes_().getFilesByName(nomFichier);
  if (!it.hasNext()) throw new Error('Fichier introuvable : ' + nomFichier);
  var db = JSON.parse(it.next().getBlob().getDataAsString());
  sauvegardeQuotidienne();   // sécurité : on sauvegarde l'état actuel avant d'écraser
  saveDB_(db);
  Logger.log('Base restaurée depuis ' + nomFichier + ' : ' + db.contacts.length + ' contacts');
}

// ═══════════════════════════════════════════════════════════════════
// ▶ À EXÉCUTER UNE FOIS : installe les 3 déclencheurs automatiques
//   • envoyerDigests        — toutes les heures (résumé à l'heure choisie par chacun)
//   • sauvegardeQuotidienne — chaque nuit vers 3h
//   • envoyerEmailMatinal   — 7h (ancien email de rappels, conservé)
// ═══════════════════════════════════════════════════════════════════
function installerDeclencheurs() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['envoyerDigests', 'sauvegardeQuotidienne', 'envoyerEmailMatinal', 'syncCalendly', 'rappelsAvances'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('envoyerDigests').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('sauvegardeQuotidienne').timeBased().atHour(3).everyDays(1).inTimezone(FUSEAU).create();
  ScriptApp.newTrigger('envoyerEmailMatinal').timeBased().atHour(7).everyDays(1).inTimezone(FUSEAU).create();
  ScriptApp.newTrigger('rappelsAvances').timeBased().atHour(8).everyDays(1).inTimezone(FUSEAU).create();
  if (PropertiesService.getScriptProperties().getProperty('CALENDLY_TOKEN')) ScriptApp.newTrigger('syncCalendly').timeBased().everyHours(1).create();
  sauvegardeQuotidienne();
  Logger.log('Déclencheurs installés : digests (chaque heure), sauvegarde (3h), email matinal (7h), rappels d\'avances (8h)' + (PropertiesService.getScriptProperties().getProperty('CALENDLY_TOKEN') ? ', synchro Calendly (chaque heure)' : ' — synchro Calendly NON installée (jeton CALENDLY_TOKEN absent)') + '. Première sauvegarde créée.');
}

// ═══════════════════════════════════════════════════════════════════
// v3.2 — CALENDLY : les réservations remontent dans le CRM
// ─────────────────────────────────────────────────────────────────
// ▶ Réglage (une seule fois) :
//   1. Calendly → Intégrations & applications → API et webhooks →
//      « Obtenir un jeton » (Personal Access Token) → copier.
//   2. Ici : Paramètres du projet (⚙️) → Propriétés du script →
//      Ajouter : CALENDLY_TOKEN = (le jeton collé).
//   3. Exécuter → installerDeclencheurs (ajoute la synchro toutes les heures).
// Fonctionnement :
//   • Chaque lien de RDV envoyé depuis le CRM porte l'identifiant de la
//     fiche (utm_content) → la réservation est rattachée au bon contact.
//   • Sinon, rapprochement par email puis par téléphone.
//   • Réservation inconnue → nouvelle fiche « En cours » créée (source Calendly).
//   • Annulation → notée dans le journal de la fiche.
// ═══════════════════════════════════════════════════════════════════
function calendlyToken_() { return PropertiesService.getScriptProperties().getProperty('CALENDLY_TOKEN') || ''; }
function calendlyGet_(url) {
  var tok = calendlyToken_();
  if (!tok) return null;
  var r = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + tok }, muteHttpExceptions: true });
  if (r.getResponseCode() >= 300) { Logger.log('Calendly ' + r.getResponseCode() + ' ' + url + ' → ' + r.getContentText().slice(0, 300)); return null; }
  return JSON.parse(r.getContentText());
}
function calLieu_(loc) {
  if (!loc) return { lieu: '', join: '' };
  var k = loc.type || loc.kind || '';
  var lib = { zoom: 'Zoom', zoom_conference: 'Zoom', google_conference: 'Google Meet', outbound_call: 'Appel téléphonique', inbound_call: 'Appel téléphonique', physical: 'Sur place', ask_invitee: '', custom: '' };
  var txt = (lib[k] !== undefined ? lib[k] : k) + (loc.location ? (lib[k] ? ' — ' : '') + loc.location : '');
  return { lieu: txt.trim(), join: loc.join_url || '' };
}
function calendlyEventDetail_(uri) {
  if (!uri) return null;
  var d = calendlyGet_(uri);
  if (!d || !d.resource) return null;
  var e = d.resource, L = calLieu_(e.location);
  return { start: e.start_time, end: e.end_time, nom: e.name, lieu: L.lieu, joinUrl: L.join, host: ((e.event_memberships || [])[0] || {}).user_name || '', statut: e.status === 'canceled' ? 'canceled' : 'active' };
}
function frQuand_(iso) {
  var d = new Date(iso);
  var j = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][parseInt(Utilities.formatDate(d, FUSEAU, 'u'), 10) % 7];
  return j + ' ' + Utilities.formatDate(d, FUSEAU, "dd/MM 'à' HH:mm");
}
function telDigits_(t) { return String(t || '').replace(/\D/g, '').slice(-9); }
function norm_(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }   // v3.16
function syncCalendly() {
  if (!calendlyToken_()) return { ok: false, error: 'calendly_token' };
  var me = calendlyGet_('https://api.calendly.com/users/me');
  if (!me || !me.resource) return { ok: false, error: 'jeton Calendly refusé' };
  var props = PropertiesService.getScriptProperties();
  var since = new Date(Date.now() - 3 * 864e5).toISOString();
  // tous les RDV de l'organisation (si droits admin Calendly), sinon ceux de l'utilisateur
  var base = 'https://api.calendly.com/scheduled_events?count=100&sort=start_time:asc&min_start_time=' + encodeURIComponent(since);
  var url = base + '&organization=' + encodeURIComponent(me.resource.current_organization);
  var page = calendlyGet_(url);
  if (!page) { url = base + '&user=' + encodeURIComponent(me.resource.uri); page = calendlyGet_(url); }
  if (!page) return { ok: false, error: 'lecture des RDV impossible' };
  var events = [];
  while (page) {
    events = events.concat(page.collection || []);
    var nx = page.pagination && page.pagination.next_page;
    page = nx ? calendlyGet_(nx) : null;
  }
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (le) { return { ok: false, error: 'busy' }; }
  var stats = { ok: true, added: 0, created: 0, canceled: 0, updated: 0 };
  try {
    var db = getDB_();
    events.forEach(function (ev) {
      var invs = calendlyGet_(ev.uri + '/invitees?count=50');
      if (!invs) return;
      var L = calLieu_(ev.location);
      var host = ((ev.event_memberships || [])[0] || {}).user_name || '';
      (invs.collection || []).forEach(function (inv) {
        var cid = (inv.tracking && inv.tracking.utm_content) || '';
        var email = String(inv.email || '').toLowerCase();
        var tel = inv.text_reminder_number || '';
        (inv.questions_and_answers || []).forEach(function (qa) { if (!tel && /t[ée]l|mobile|phone|portable/i.test(qa.question || '')) tel = qa.answer || ''; });
        var c = null, i;
        for (i = 0; i < db.contacts.length && !c; i++) if (cid && db.contacts[i].id === cid) c = db.contacts[i];
        for (i = 0; i < db.contacts.length && !c; i++) if (email && String(db.contacts[i].email || '').toLowerCase() === email) c = db.contacts[i];
        for (i = 0; i < db.contacts.length && !c; i++) if (telDigits_(tel).length >= 8 && telDigits_(db.contacts[i].tel) === telDigits_(tel)) c = db.contacts[i];
        var annule = inv.status === 'canceled' || ev.status === 'canceled';
        var nowIso = new Date().toISOString();
        var quand = frQuand_(ev.start_time);
        if (!c) {
          if (annule) return;
          var parts = String(inv.name || '').trim().split(/\s+/);
          var ln = inv.last_name || (parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'CALENDLY');
          var fn = inv.first_name || (parts.length > 1 ? parts[0] : '');
          var notes = (inv.questions_and_answers || []).map(function (qa) { return qa.question + ' : ' + qa.answer; }).join('\n');
          c = { id: 'c_cal_' + Date.now() + '_' + Math.floor(Math.random() * 1e5), nom: String(ln).toUpperCase(), prenom: fn, tel: tel, email: inv.email || '',
                pays: '', ville: '', etape: 'Prospect', qualification: 'Chaud', statut: 'encours', refere: 'Calendly', ctags: [], suivis: host ? [host.trim()] : [], suiviPar: host ? host.trim() : '',
                createdAt: nowIso.slice(0, 10), createdBy: 'Calendly', actions: {}, produits: [], notes: notes, journal: [], rdvs: [] };
          c.journal.push({ id: 'j_' + Date.now(), ts: nowIso, auteur: 'Calendly', role: '', type: 'systeme', texte: 'Contact créé automatiquement par une réservation Calendly' });
          db.contacts.unshift(c); stats.created++;
        }
        c.rdvs = c.rdvs || []; c.journal = c.journal || [];
        var r = null;
        for (i = 0; i < c.rdvs.length; i++) if (c.rdvs[i].uri === ev.uri) r = c.rdvs[i];
        if (!r) {
          if (annule) return;
          r = { uri: ev.uri, invitee: inv.uri, source: 'calendly' };
          c.rdvs.push(r); stats.added++;
          try { pushSend_(db, usersByNoms_(db, (host ? [host.trim()] : []).concat(suivis_(c))).concat([{ id: 'root' }]), '📅 RDV réservé', ((c.prenom || '') + ' ' + (c.nom || '')).trim() + ' — ' + ev.name + ' — ' + quand, ''); } catch (pe) {}   // v3.20
          c.journal.push({ id: 'j_' + Date.now() + '_' + Math.floor(Math.random() * 1e4), ts: nowIso, auteur: 'Calendly', role: '', type: 'rdv', texte: 'RDV réservé : ' + ev.name + ' — ' + quand + (host ? ' avec ' + host.trim() : '') });
          if (!c.statut || c.statut === 'afaire') { c.journal.push({ id: 'j_' + Date.now() + '_s', ts: nowIso, auteur: 'Calendly', role: '', type: 'statut', texte: 'Statut : À contacter → En cours (RDV pris)' }); c.statut = 'encours'; }
          c.lastActivity = nowIso;
          sioAuto_(db, c, 'Calendly', 'RDV Calendly réservé');              // v3.16 — tag oly_encours (newsletter Zoom)
        }
        var avant = r.statut;
        r.start = ev.start_time; r.end = ev.end_time; r.nom = ev.name; r.lieu = L.lieu; r.joinUrl = L.join; r.host = host.trim();
        r.reschedule = inv.reschedule_url || ''; r.cancel = inv.cancel_url || '';
        r.statut = annule ? 'canceled' : 'active';
        if (annule && avant !== 'canceled') {
          stats.canceled++;
          c.journal.push({ id: 'j_' + Date.now() + '_c', ts: nowIso, auteur: 'Calendly', role: '', type: 'rdv', texte: 'RDV annulé : ' + ev.name + ' — ' + quand + ((inv.cancellation && inv.cancellation.reason) ? ' (motif : ' + inv.cancellation.reason + ')' : '') });
          c.lastActivity = nowIso;
        }
      });
    });
    saveDB_(db);
    props.setProperty('calendly_last_sync', new Date().toISOString());
  } finally { lock.releaseLock(); }
  Logger.log('Synchro Calendly : ' + JSON.stringify(stats));
  return stats;
}
// ▶ Test manuel : Exécuter → testerCalendly (affiche le résultat dans le journal d'exécution)
function testerCalendly() { Logger.log(JSON.stringify(syncCalendly())); }


// ═══════════════════════════════════════════════════════════════════
// v3.3 — AVANCES D'ARGENT : rappels automatiques J-3 · J-1 · Jour J · retard
// Chaque contact peut porter c.avances = [{id, montant, devise, date,
// echeance, motif, type:'avance'|'don', statut: 'encours'|'partiel'|'rembourse'|'don',
// par, parId, rembs:[{date,montant,complet}], sent:{...}}]
// Un email est envoyé aux gestionnaires du contact + à l'admin,
// avec le message WhatsApp prêt à envoyer en un clic.
// ═══════════════════════════════════════════════════════════════════
function avWaMsgSrv_(c, a) {
  return 'Bonjour ' + (c.prenom || '') + ', j\'espère que vous allez bien 🌿\n\nPetit rappel amical concernant l\'avance de ' + a.montant + ' ' + (a.devise || '€') + ' du ' + fmtDate_(a.date) + (a.motif ? ' pour votre ' + a.motif : '') + ' : le remboursement est prévu le ' + fmtDate_(a.echeance) + '.\n\nMerci de me confirmer que c\'est toujours bon pour vous. Belle journée !\nWater Life High Tech';
}
function rappelsAvances(force) {
  var db = getDB_(), changed = false;
  var props = PropertiesService.getScriptProperties();
  var rd = {}; try { rd = JSON.parse(props.getProperty('root_digest') || '{}'); } catch (e) {}
  var adminEmail = rd.email || MON_EMAIL;
  (db.contacts || []).forEach(function (c) {
    (c.avances || []).forEach(function (a) {
      if (!a || a.type === 'don' || a.statut === 'rembourse' || !a.echeance) return;   // v3.5 — les dons n'ont ni échéance ni rappel
      var rendu = (a.rembs || []).reduce(function (t, r) { return t + (+r.montant || 0); }, 0), reste = Math.max(0, (+a.montant || 0) - rendu);
      var d = diffDays(a.echeance);
      var key = d === 3 ? 'j3' : d === 1 ? 'j1' : d === 0 ? 'j0' : (d < 0 ? 'late' : '');
      if (!key) return;
      a.sent = a.sent || {};
      if (a.sent[key] && !force) return;
      // destinataires : gestionnaires du contact (email connu) + admin
      var dest = {};
      dest[adminEmail] = true;
      suivis_(c).forEach(function (nom) { var em = emailDe_(db, nom); if (em) dest[em] = true; });
      // v3.5 — la personne qui a avancé l'argent reçoit aussi le rappel
      var payerEmail = a.parEmail || '';
      if (!payerEmail && a.parId) { for (var pi = 0; pi < db.contacts.length; pi++) if (db.contacts[pi].id === a.parId) { payerEmail = db.contacts[pi].email || ''; break; } }
      if (!payerEmail && a.par) { payerEmail = emailDe_(db, a.par); if (!payerEmail) for (var ui = 0; ui < db.users.length; ui++) if (db.users[ui].nom === a.par) { payerEmail = db.users[ui].email || db.users[ui].digestEmail || ''; break; } }
      if (payerEmail) dest[payerEmail] = true;
      var payerTel = (a.parTel || '').replace(/\D/g, '');
      var waPayer = payerTel ? 'https://wa.me/' + payerTel + '?text=' + encodeURIComponent('Bonjour ' + String(a.par || '').split(' ')[0] + ' 🌿\n\nPetit point sur l\'avance de ' + a.montant + ' ' + (a.devise || '€') + ' que vous avez faite le ' + fmtDate_(a.date) + ' à ' + (c.nom || '') + ' ' + (c.prenom || '') + (a.motif ? ' pour ' + a.motif : '') + ' : le remboursement est prévu le ' + fmtDate_(a.echeance) + (rendu ? ' (déjà rendu ' + rendu + ', reste ' + reste + ' ' + (a.devise || '€') + ')' : '') + '.\n\nJe vous tiens informé(e) dès que c\'est réglé. Merci pour votre confiance 🙏\nWater Life High Tech') : '';
      var quand = d === 3 ? 'dans 3 jours' : d === 1 ? 'DEMAIN' : d === 0 ? "AUJOURD'HUI" : 'EN RETARD de ' + Math.abs(d) + ' jour(s)';
      var coul = d <= 0 ? '#C63E47' : d === 1 ? '#D9A400' : '#126A3C';
      var wa = (c.tel || '').replace(/\D/g, '');
      var waUrl = wa ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent(avWaMsgSrv_(c, a)) : '';
      var html = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#F6FAF6;padding:18px;color:#1E2B23">'
        + '<div style="background:' + coul + ';border-radius:14px;padding:18px 20px;color:#fff">'
        + '<div style="font-size:18px;font-weight:700">💶 Avance à récupérer — ' + quand + '</div>'
        + '<div style="font-size:13px;opacity:.92;margin-top:4px">' + (c.nom || '') + ' ' + (c.prenom || '') + (c.tel ? ' · ' + c.tel : '') + '</div></div>'
        + '<div style="background:#fff;border:1px solid #E3EDE6;border-radius:14px;padding:16px;margin-top:12px;font-size:14px;line-height:1.8">'
        + '<b>Montant :</b> ' + a.montant + ' ' + (a.devise || '€') + (rendu ? ' — déjà rendu ' + rendu + ', <b>reste ' + reste + ' ' + (a.devise || '€') + '</b>' : '') + '<br>'
        + '<b>Avancé le :</b> ' + fmtDate_(a.date) + (a.motif ? '<br><b>Motif :</b> ' + a.motif : '') + '<br>'
        + '<b>Échéance :</b> ' + fmtDate_(a.echeance) + (a.par ? '<br><b>Avance faite par :</b> ' + a.par : '')
        + (waUrl ? '<div style="margin-top:14px"><a href="' + waUrl + '" style="background:#25D366;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700">💬 Rappel WhatsApp au bénéficiaire (message prêt)</a></div>' : '')
        + (waPayer ? '<div style="margin-top:10px"><a href="' + waPayer + '" style="background:#126A3C;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700">📣 Informer ' + a.par + ' (message prêt)</a></div>' : '')
        + '</div>'
        + '<div style="text-align:center;font-size:11px;color:#7A8A80;margin-top:12px">CRM OlyLife — WLHT · fiche : ' + (c.nom || '') + ' ' + (c.prenom || '') + '</div>'
        + '</body></html>';
      var benefOk = (d >= 0 && a.notifier !== false && droit_(db, 'client', 'rappelsAvances', true)) ? avMailRappelBenef_(db, c, a, d, rendu, reste) : false;   // v3.18 — rappel courtois au bénéficiaire (J-3 · veille · J)
      if (benefOk) html = html.replace('</body>', '<div style="text-align:center;font-size:11px;color:#126A3C;margin-top:6px">✉️ Le bénéficiaire a reçu son rappel courtois par e-mail (' + c.email + ').</div></body>');
      if (c.email) delete dest[c.email];
      Object.keys(dest).forEach(function (em) {
        try { MailApp.sendEmail({ to: em, subject: '💶 Avance ' + a.montant + ' ' + (a.devise || '€') + ' — ' + (c.nom || '') + ' ' + (c.prenom || '') + ' — ' + quand, htmlBody: html, name: 'CRM OlyLife — WLHT' }); } catch (e) { Logger.log('Avance : échec email ' + em + ' : ' + e); }
      });
      a.sent[key] = Utilities.formatDate(new Date(), FUSEAU, 'yyyy-MM-dd');
      try { pushSend_(db, usersByNoms_(db, suivis_(c)).concat([{ id: 'root' }]), '💶 Avance à récupérer — ' + quand, ((c.prenom || '') + ' ' + (c.nom || '')).trim() + ' · ' + a.montant + ' ' + (a.devise || '€') + (reste && reste !== a.montant ? ' (reste ' + reste + ')' : ''), ''); } catch (pe) {}   // v3.20
      changed = true;
      Logger.log('Rappel avance envoyé (' + key + ') : ' + (c.nom || '') + ' — ' + a.montant + ' ' + (a.devise || '€'));
    });
  });
  if (changed) saveDB_(db);
}

// ═══════════════════════════════════════════════════════════════════
// v3.18 — AVANCES & DONS : e-mails d'annonce automatiques à l'enregistrement
// Déclenché par l'op « upsert » : toute ligne c.avances[] portant notifier=true
// et sans notifLe est traitée UNE seule fois (notifLe posé ensuite, renvoyé à l'app).
//   • bénéficiaire  → e-mail d'annonce (avance : échéance + rappels à venir ; don : aucun remboursement)
//   • prêteur / donateur (gestionnaire, référent ou client) → confirmation + message WhatsApp prêt pour le bénéficiaire
//   • gestionnaires de la fiche + admin → notification interne avec les deux messages prêts
// ═══════════════════════════════════════════════════════════════════
function avNomC_(c) { return ((c.prenom || '') + ' ' + (c.nom || '')).trim(); }
function avPrenom_(c) { return (c.prenom || '').split(' ')[0] || (c.nom || ''); }
function avPayeurEmail_(db, a) {
  var em = a.parEmail || '';
  if (!em && a.parId) { for (var i = 0; i < db.contacts.length; i++) if (db.contacts[i].id === a.parId) { em = db.contacts[i].email || ''; break; } }
  if (!em && a.par) { em = emailDe_(db, a.par); if (!em) for (var u = 0; u < db.users.length; u++) if (db.users[u].nom === a.par) { em = db.users[u].email || db.users[u].digestEmail || ''; break; } }
  return em;
}
function avPayeurUser_(db, a) { var r = String(a.parRef || ''); if (r.indexOf('u:') !== 0) return null; var id = r.slice(2); for (var i = 0; i < db.users.length; i++) if (db.users[i].id === id) return db.users[i]; return null; }
function avMailShell_(titre, sousTitre, couleur, corps, pied) {
  return '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#F6FAF6;padding:18px;color:#1E2B23">'
    + '<div style="background:' + couleur + ';border-radius:14px;padding:18px 20px;color:#fff"><div style="font-size:18px;font-weight:700">' + titre + '</div>'
    + (sousTitre ? '<div style="font-size:13px;opacity:.92;margin-top:4px">' + sousTitre + '</div>' : '') + '</div>'
    + '<div style="background:#fff;border:1px solid #E3EDE6;border-radius:14px;padding:16px;margin-top:12px;font-size:14px;line-height:1.8">' + corps + '</div>'
    + '<div style="text-align:center;font-size:11px;color:#7A8A80;margin-top:12px">' + (pied || 'Association Water Life High Tech — groupe d\'entraide et de partage') + '</div></body></html>';
}
function avBtn_(url, lib, coul) { return url ? '<div style="margin-top:10px"><a href="' + url + '" style="background:' + coul + ';color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">' + lib + '</a></div>' : ''; }
function avWaBenefAnnonce_(c, a, signataire) {
  var don = a.type === 'don', p = avPrenom_(c), payeur = String(a.par || '').split(' ')[0];
  var t = don
    ? 'Bonjour ' + p + ' 🌿\n\nBonne nouvelle : un don de ' + a.montant + ' ' + (a.devise || '€') + (a.motif ? ' pour votre ' + a.motif : '') + ' vous est fait le ' + fmtDate_(a.date) + (payeur ? ' par ' + payeur : '') + '.\n\nIl s\'agit d\'un don : aucun remboursement n\'est attendu 🎁\n\nBelle journée !\n'
    : 'Bonjour ' + p + ' 🌿\n\nC\'est confirmé : une avance de ' + a.montant + ' ' + (a.devise || '€') + (a.motif ? ' pour votre ' + a.motif : '') + ' vous est accordée le ' + fmtDate_(a.date) + (payeur ? ' par ' + payeur : '') + '.\n\nLe remboursement est prévu le ' + fmtDate_(a.echeance) + '. Vous recevrez un petit rappel par e-mail 3 jours avant et le jour J — rien à faire d\'ici là 🙂\n\nN\'hésitez pas si vous avez la moindre question.\n';
  return t + (signataire || 'L\'équipe') + ' — Water Life High Tech';
}
function avWaPayeurAnnonce_(c, a, signataire) {
  var don = a.type === 'don', payeur = String(a.par || '').split(' ')[0];
  var t = don
    ? 'Bonjour ' + payeur + ' 🌿\n\nMerci infiniment : votre don de ' + a.montant + ' ' + (a.devise || '€') + ' à ' + avNomC_(c) + (a.motif ? ' pour ' + a.motif : '') + ' est bien enregistré à la date du ' + fmtDate_(a.date) + '.\n\nIl est tracé sur sa fiche et sur la vôtre ; aucun remboursement n\'est attendu. Merci pour votre générosité 🙏\n'
    : 'Bonjour ' + payeur + ' 🌿\n\nPetit point sur l\'avance de ' + a.montant + ' ' + (a.devise || '€') + ' que vous avez faite le ' + fmtDate_(a.date) + ' à ' + avNomC_(c) + (a.motif ? ' pour ' + a.motif : '') + ' : le remboursement est prévu le ' + fmtDate_(a.echeance) + '.\n\nJe vous tiens informé(e) dès que c\'est réglé. Merci pour votre confiance 🙏\n';
  return t + (signataire || 'L\'équipe') + ' — Water Life High Tech';
}
function avNotifNouvelles_(db, c, user, notifUpd) {
  if (!c || !c.avances || !c.avances.length) return;
  var aFaire = c.avances.filter(function (a) { return a && a.notifier && !a.notifLe; });
  if (!aFaire.length) return;
  var rd = {}; try { rd = JSON.parse(PropertiesService.getScriptProperties().getProperty('root_digest') || '{}'); } catch (e) {}
  var adminEmail = rd.email || MON_EMAIL, qui = (user && user.nom) || 'système';
  var gestNom = qui, gestEmail = emailDe_(db, qui) || '', gestTel = (user && user.tel) || '';
  var nowY = Utilities.formatDate(new Date(), FUSEAU, 'yyyy-MM-dd'), journal = [], resume = [];
  c.journal = c.journal || [];
  aFaire.forEach(function (a) {
    var don = a.type === 'don', dev = a.devise || '€', envoyes = [];
    var benefTel = String(c.tel || '').replace(/\D/g, ''), payeurTel = String(a.parTel || '').replace(/\D/g, '');
    var waBenef = benefTel ? 'https://wa.me/' + benefTel + '?text=' + encodeURIComponent(avWaBenefAnnonce_(c, a, gestNom)) : '';
    var waPayeur = payeurTel ? 'https://wa.me/' + payeurTel + '?text=' + encodeURIComponent(avWaPayeurAnnonce_(c, a, gestNom)) : '';
    var coul = don ? '#8E5BBE' : '#126A3C', lib = don ? '🎁 Don' : '💶 Avance';
    var recap = '<b>Montant :</b> ' + a.montant + ' ' + dev + '<br><b>' + (don ? 'Donné le' : 'Avancé le') + ' :</b> ' + fmtDate_(a.date)
      + (a.motif ? '<br><b>Motif :</b> ' + a.motif : '') + (a.par ? '<br><b>' + (don ? 'Donateur' : 'Avancé par') + ' :</b> ' + a.par : '')
      + (don ? '' : '<br><b>Remboursement prévu le :</b> ' + fmtDate_(a.echeance));
    // 1) bénéficiaire
    if (c.email && droit_(db, 'client', 'annonceAvances', true)) {
      var corpsB = 'Bonjour ' + avPrenom_(c) + ',<br><br>'
        + (don ? 'Bonne nouvelle : un <b>don de ' + a.montant + ' ' + dev + '</b>' + (a.motif ? ' pour votre ' + a.motif : '') + ' vous est fait' + (a.par ? ' par <b>' + a.par + '</b>' : '') + '. Il s\'agit d\'un don : <b>aucun remboursement n\'est attendu</b> 🎁'
               : 'C\'est confirmé : une <b>avance de ' + a.montant + ' ' + dev + '</b>' + (a.motif ? ' pour votre ' + a.motif : '') + ' vous est accordée' + (a.par ? ' par <b>' + a.par + '</b>' : '') + '.<br>Le remboursement est prévu le <b>' + fmtDate_(a.echeance) + '</b>. Vous recevrez un rappel par e-mail 3 jours avant, la veille et le jour J — rien à faire d\'ici là.')
        + '<br><br><div style="background:#F6FAF6;border-radius:10px;padding:10px 14px">' + recap + '</div><br>'
        + 'Pour toute question : ' + gestNom + (gestTel ? ' · ' + gestTel : '') + (gestEmail ? ' · ' + gestEmail : '') + '<br><br>Bien à vous,<br>' + gestNom + ' — Water Life High Tech';
      try { MailApp.sendEmail({ to: c.email, subject: (don ? '🎁 Un don de ' : '💶 Votre avance de ') + a.montant + ' ' + dev + (don ? ' vous est fait' : ' est enregistrée') + ' — Water Life High Tech', htmlBody: avMailShell_(don ? '🎁 Un don vous est fait' : '💶 Votre avance est enregistrée', 'Water Life High Tech', coul, corpsB), name: 'Water Life High Tech', replyTo: gestEmail || adminEmail }); envoyes.push('bénéficiaire'); } catch (e) { Logger.log('avNotif bénéficiaire : ' + e); }
    }
    // 2) prêteur / donateur
    var pEmail = avPayeurEmail_(db, a);
    if (pEmail && pEmail !== c.email) {
      var corpsP = 'Bonjour ' + String(a.par || '').split(' ')[0] + ',<br><br>'
        + (don ? 'Votre <b>don de ' + a.montant + ' ' + dev + '</b> à <b>' + avNomC_(c) + '</b>' + (a.motif ? ' pour ' + a.motif : '') + ' est bien enregistré. Il est tracé sur sa fiche et sur la vôtre ; aucun remboursement n\'est attendu. Merci pour votre générosité 🙏'
               : 'Votre <b>avance de ' + a.montant + ' ' + dev + '</b> à <b>' + avNomC_(c) + '</b>' + (a.motif ? ' pour ' + a.motif : '') + ' est bien enregistrée.<br>Le remboursement est prévu le <b>' + fmtDate_(a.echeance) + '</b>. Vous recevrez, comme le bénéficiaire, un rappel par e-mail 3 jours avant, la veille et le jour J.')
        + '<br><br><div style="background:#F6FAF6;border-radius:10px;padding:10px 14px">' + recap + '</div>'
        + avBtn_(waBenef, '💬 Message prêt pour ' + avPrenom_(c), '#25D366')
        + '<br>Bien à vous,<br>' + gestNom + ' — Water Life High Tech';
      try { MailApp.sendEmail({ to: pEmail, subject: (don ? '🎁 Votre don de ' : '💶 Votre avance de ') + a.montant + ' ' + dev + ' à ' + avNomC_(c) + ' est enregistré' + (don ? '' : 'e'), htmlBody: avMailShell_(don ? '🎁 Don enregistré — merci' : '💶 Avance enregistrée', avNomC_(c), coul, corpsP), name: 'Water Life High Tech', replyTo: gestEmail || adminEmail }); envoyes.push(don ? 'donateur' : 'prêteur'); } catch (e) { Logger.log('avNotif payeur : ' + e); }
    }
    // 3) gestionnaires de la fiche + admin (sans doublon avec les deux précédents)
    var dest = {}; dest[adminEmail] = true;
    suivis_(c).forEach(function (nom) { var em = emailDe_(db, nom); if (em) dest[em] = true; });
    if (gestEmail) dest[gestEmail] = true;
    if (c.email) delete dest[c.email]; if (pEmail) delete dest[pEmail];
    var corpsI = recap + '<br><b>Saisi par :</b> ' + qui + ' · ' + fmtDT_(new Date().toISOString())
      + '<br><b>E-mails d\'annonce envoyés :</b> ' + (envoyes.length ? envoyes.join(' + ') : 'aucun (pas d\'adresse e-mail connue)')
      + (don ? '' : '<br><b>Rappels :</b> J-3 · veille · jour J (bénéficiaire, ' + (a.par || 'prêteur') + ', gestionnaires, admin)')
      + avBtn_(waBenef, '💬 Annonce WhatsApp à ' + avPrenom_(c) + ' (message prêt)', '#25D366')
      + avBtn_(waPayeur, '📣 ' + (don ? 'Remercier ' : 'Informer ') + (a.par || 'la personne') + ' (message prêt)', '#126A3C');
    var nI = 0;
    Object.keys(dest).forEach(function (em) {
      try { MailApp.sendEmail({ to: em, subject: lib + ' ' + a.montant + ' ' + dev + ' — ' + avNomC_(c) + (a.par ? ' ← ' + a.par : ''), htmlBody: avMailShell_(lib + (don ? ' enregistré' : ' enregistrée') + ' — ' + avNomC_(c), c.tel || '', coul, corpsI, 'CRM OlyLife — WLHT · fiche : ' + avNomC_(c)), name: 'CRM OlyLife — WLHT' }); nI++; } catch (e) { Logger.log('avNotif interne ' + em + ' : ' + e); }
    });
    if (nI) envoyes.push(nI + ' gestionnaire' + (nI > 1 ? 's' : '') + '/admin');
    try { pushSend_(db, usersByNoms_(db, suivis_(c)).concat([{ id: 'root' }]), lib + ' ' + a.montant + ' ' + dev, avNomC_(c) + (a.par ? ' ← ' + a.par : '') + ' · saisi par ' + qui, ''); } catch (pe) {}   // v3.20
    a.notifLe = nowY; a.notifA = envoyes; a.notifier = false;
    var j = { id: 'j_' + Date.now() + '_av' + Math.floor(Math.random() * 1000), ts: now_(), auteur: 'système', role: 'systeme', type: 'systeme', texte: '✉️ ' + lib + ' ' + a.montant + ' ' + dev + ' — e-mails d\'annonce : ' + (envoyes.length ? envoyes.join(', ') : 'aucun destinataire avec e-mail') };
    c.journal.push(j); journal.push(j);
    resume.push(lib + ' ' + a.montant + ' ' + dev + ' : ' + (envoyes.length ? envoyes.join(', ') : 'aucun e-mail (adresses manquantes)'));
    Logger.log('avNotif ' + lib + ' ' + avNomC_(c) + ' → ' + envoyes.join(', '));
  });
  notifUpd.push({ id: c.id, avances: c.avances.map(function (a) { return { id: a.id, notifLe: a.notifLe || '', notifA: a.notifA || [] }; }), journal: journal, resume: resume.join(' · ') });
}
// Rappel courtois au bénéficiaire (J-3, veille, jour J) — jamais pour un retard, qui reste interne
function avMailRappelBenef_(db, c, a, d, rendu, reste) {
  if (!c.email) return false;
  var dev = a.devise || '€', quand = d === 3 ? 'dans 3 jours' : d === 1 ? 'demain' : 'aujourd\'hui';
  var gest = suivis_(c)[0] || ADMIN_NOM, gestEmail = emailDe_(db, gest) || '';
  var corps = 'Bonjour ' + avPrenom_(c) + ',<br><br>J\'espère que vous allez bien 🌿<br>Petit rappel amical : le remboursement de l\'avance de <b>' + a.montant + ' ' + dev + '</b>' + (a.motif ? ' pour votre ' + a.motif : '') + ' du ' + fmtDate_(a.date) + ' est prévu <b>' + quand + '</b> (le ' + fmtDate_(a.echeance) + ')'
    + (rendu ? ' — déjà rendu ' + rendu + ' ' + dev + ', <b>reste ' + reste + ' ' + dev + '</b>' : '') + '.<br><br>'
    + 'Merci de nous confirmer que c\'est toujours bon pour vous ; en cas de difficulté, dites-le simplement, on trouve une solution ensemble.<br><br>Belle journée,<br>' + gest + ' — Water Life High Tech';
  try { MailApp.sendEmail({ to: c.email, subject: '💶 Rappel : remboursement prévu ' + quand + ' — Water Life High Tech', htmlBody: avMailShell_('💶 Remboursement prévu ' + quand, 'Water Life High Tech', d === 0 ? '#D9A400' : '#126A3C', corps), name: 'Water Life High Tech', replyTo: gestEmail || MON_EMAIL }); return true; }
  catch (e) { Logger.log('Rappel bénéficiaire : échec ' + c.email + ' : ' + e); return false; }
}
// ▶ Test : force l'envoi des rappels d'avances éligibles maintenant
function testerRappelsAvances() { rappelsAvances(true); }
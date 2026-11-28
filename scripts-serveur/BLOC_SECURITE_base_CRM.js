// ═══════════════════════════════════════════════════════════════════
// CRM OlyLife — BLOC DE SÉCURITÉ COMPLET (28/11/2026)
// À coller TOUT EN BAS de GAS_Script.gs (après tout le reste), puis Enregistrer.
// Contient : diagnostic() · reparerBase(id) · versionsBase() · restaurerVersion(rev)
//            · getDB_ / saveDB_ protégés (verrou + refus d'écraser une base pleine) · verifierBase() · listerAcces()
// Ce bloc DOIT rester en dernier : ce sont les dernières fonctions du fichier qui s'appliquent.
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// CRM OlyLife — DIAGNOSTIC & RÉPARATION DE LA BASE
// À coller TOUT EN BAS du fichier GAS_Script.gs, puis Enregistrer.
// Ne modifie rien : diagnostic() ne fait que LIRE et afficher.
// ═══════════════════════════════════════════════════════════════════

function diagnostic() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty('owlht_db_file_id');
  Logger.log('════ DIAGNOSTIC CRM OlyLife ════');
  Logger.log('Projet : ' + ScriptApp.getScriptId());
  Logger.log('');
  Logger.log('1) Où le script croit-il que la base se trouve ?');
  Logger.log('   owlht_db_file_id = ' + (id || '(VIDE — le script ne sait plus où est la base)'));
  if (id) {
    try {
      var f = DriveApp.getFileById(id);
      var db = JSON.parse(f.getBlob().getDataAsString());
      Logger.log('   fichier : ' + f.getName() + ' · modifié le ' + f.getLastUpdated() + ' · corbeille : ' + f.isTrashed());
      Logger.log('   >>> ' + (db.contacts || []).length + ' contacts, ' + (db.users || []).length + ' accès');
    } catch (e) { Logger.log('   fichier INACCESSIBLE : ' + e.message); }
  }

  Logger.log('');
  Logger.log('2) Tous les fichiers CRM_OlyLife_WLHT_DB.json du Drive');
  var it = DriveApp.getFilesByName('CRM_OlyLife_WLHT_DB.json'), n = 0;
  while (it.hasNext()) {
    var g = it.next(), c = '?', u = '?';
    try { var d = JSON.parse(g.getBlob().getDataAsString()); c = (d.contacts || []).length; u = (d.users || []).length; } catch (e) {}
    n++;
    Logger.log('   ' + n + ') ' + c + ' contacts · ' + u + ' accès · modifié ' + g.getLastUpdated() + (g.isTrashed() ? ' · DANS LA CORBEILLE' : '') + '\n      ID = ' + g.getId());
  }
  if (!n) Logger.log('   (aucun fichier de ce nom)');

  Logger.log('');
  Logger.log('3) Les 12 dernières sauvegardes automatiques');
  var fo = DriveApp.getFoldersByName('CRM OlyLife — Sauvegardes');
  if (!fo.hasNext()) Logger.log('   (dossier de sauvegardes introuvable)');
  else {
    var fl = [], i2 = fo.next().getFiles();
    while (i2.hasNext()) { var b = i2.next(); if (b.getName().indexOf('CRM_OlyLife_') === 0) fl.push(b); }
    fl.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
    if (!fl.length) Logger.log('   (dossier vide)');
    fl.slice(0, 12).forEach(function (b) {
      var c = '?', u = '?';
      try { var d = JSON.parse(b.getBlob().getDataAsString()); c = (d.contacts || []).length; u = (d.users || []).length; } catch (e) {}
      Logger.log('   ' + b.getName() + '  →  ' + c + ' contacts · ' + u + ' accès');
    });
  }

  Logger.log('');
  Logger.log('4) Code d\'accès super-admin');
  Logger.log('   propriété ADMIN_CODE = ' + (p.getProperty('ADMIN_CODE') ? '(renseignée)' : '(vide → c\'est celui écrit dans le fichier qui sert)'));
  Logger.log('════ FIN ════');
}

// ▶ Repointer le CRM sur le BON fichier de base.
//   Copier l'ID affiché au point 2) du diagnostic, entre les guillemets.
function reparerBase(fileId) {
  if (!fileId) throw new Error('Indiquez l\'ID affiché par diagnostic(), ex : reparerBase("1AbC...")');
  var f = DriveApp.getFileById(fileId);
  if (f.isTrashed()) f.setTrashed(false);
  var db = JSON.parse(f.getBlob().getDataAsString());
  if (!db.contacts) throw new Error('Ce fichier n\'est pas une base CRM valide.');
  PropertiesService.getScriptProperties().setProperty('owlht_db_file_id', fileId);
  Logger.log('✅ Base repointée sur ' + f.getName() + ' : ' + db.contacts.length + ' contacts, ' + (db.users || []).length + ' accès.');
  Logger.log('Rechargez le CRM dans le navigateur.');
}

// ═══════════════════════════════════════════════════════════════════
// CRM OlyLife — RÉCUPÉRATION DE LA BASE
// À coller tout en bas de GAS_Script.gs, puis Enregistrer.
// 1) versionsBase()        → liste les versions du fichier gardées par Drive
// 2) restaurerVersion("…") → remet la version choisie
// (restaurerSauvegarde("CRM_OlyLife_2026-11-18_0340.json") existe déjà)
// ═══════════════════════════════════════════════════════════════════

function versionsBase_fid_() {
  var id = PropertiesService.getScriptProperties().getProperty('owlht_db_file_id');
  if (!id) throw new Error('Base introuvable (propriété owlht_db_file_id vide)');
  return id;
}
function versionsBase_api_(url) {
  var r = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('Drive a répondu ' + r.getResponseCode() + ' : ' + r.getContentText().slice(0, 300));
  return r;
}

// ▶ Liste les versions du fichier de base conservées par Google Drive
function versionsBase() {
  var fid = versionsBase_fid_();
  var j = JSON.parse(versionsBase_api_('https://www.googleapis.com/drive/v3/files/' + fid +
    '/revisions?pageSize=200&fields=revisions(id,modifiedTime,size)').getContentText());
  var revs = (j.revisions || []).reverse();   // la plus récente d'abord
  Logger.log('════ VERSIONS DU FICHIER DE BASE ════');
  if (!revs.length) { Logger.log('Aucune version conservée.'); return; }
  revs.slice(0, 15).forEach(function (rv) {
    var c = '?', u = '?';
    try {
      var d = JSON.parse(versionsBase_api_('https://www.googleapis.com/drive/v3/files/' + fid +
        '/revisions/' + rv.id + '?alt=media').getContentText());
      c = (d.contacts || []).length; u = (d.users || []).length;
    } catch (e) { c = 'illisible'; }
    Logger.log(c + ' contacts · ' + u + ' accès   ·   ' + rv.modifiedTime + '   ·   version ' + rv.id);
  });
  Logger.log('Choisissez la version la plus récente qui a vos contacts,');
  Logger.log('puis : restaurerVersion("le numéro de version")');
  Logger.log('════ FIN ════');
}

// ▶ Remet la version choisie (une sauvegarde de sécurité est faite avant)
function restaurerVersion(revId) {
  if (!revId) throw new Error('Indiquez le numéro de version affiché par versionsBase()');
  var fid = versionsBase_fid_();
  var txt = versionsBase_api_('https://www.googleapis.com/drive/v3/files/' + fid + '/revisions/' + revId + '?alt=media').getContentText();
  var db = JSON.parse(txt);
  if (!db || !db.contacts || !db.contacts.length) throw new Error('Cette version ne contient aucun contact — choisissez-en une autre.');
  dossierSauvegardes_().createFile('CRM_OlyLife_avant-restauration_' +
    Utilities.formatDate(new Date(), FUSEAU, 'yyyy-MM-dd_HHmm') + '.json',
    DriveApp.getFileById(fid).getBlob().getDataAsString(), 'application/json');
  DriveApp.getFileById(fid).setContent(txt);
  Logger.log('✅ Base restaurée : ' + db.contacts.length + ' contacts, ' + (db.users || []).length + ' accès.');
  Logger.log('Rechargez le CRM dans le navigateur.');
}

// ═══════════════════════════════════════════════════════════════════
// CRM OlyLife — PROTECTION DE LA BASE  (v3.55)
// À coller tout en bas de GAS_Script.gs, puis Enregistrer.
//
// Ces deux fonctions portent le même nom que celles du haut du script :
// étant les dernières, ce sont elles qui s'appliquent. Rien d'autre à toucher.
//
// Ce qui change, après l'incident du 18/11 :
//   1. VERROU  — deux enregistrements ne peuvent plus se croiser (c'est le
//                télescopage de 19:01:29 et 19:01:32 qui a corrompu le fichier).
//   2. ARRÊT   — si le fichier est illisible, le script s'arrête net au lieu
//                de repartir sur une base vide qu'il réécrirait par-dessus.
//   3. REFUS   — une base sans contact ne peut plus écraser une base pleine.
// ═══════════════════════════════════════════════════════════════════

function getDB_() {
  var fileId = PropertiesService.getScriptProperties().getProperty(DB_FILE_KEY);
  if (!fileId) throw new Error('BASE : identifiant du fichier absent. Arrêt — aucune base vide ne sera créée. Lancez diagnostic().');
  var file = DriveApp.getFileById(fileId);
  if (file.isTrashed()) throw new Error('BASE : le fichier est dans la corbeille. Arrêt.');
  var txt = file.getBlob().getDataAsString(), db = null;
  try { db = JSON.parse(txt); } catch (e) { db = null; }
  if (!db || !db.contacts) {
    throw new Error('BASE ILLISIBLE (' + txt.length + ' caractères lus). Rien n\'a été écrit, vos données sont intactes. ' +
                    'Lancez versionsBase() puis restaurerVersion("…") pour remettre la dernière version saine.');
  }
  if (!db.users) db.users = [];
  if (!db.config) db.config = { referents: [] };
  if (!db.config.referents) db.config.referents = [];
  return db;
}

function saveDB_(db) {
  if (!db || !db.contacts) throw new Error('BASE : enregistrement refusé — données absentes.');
  var fileId = PropertiesService.getScriptProperties().getProperty(DB_FILE_KEY);
  if (!fileId) throw new Error('BASE : identifiant du fichier absent — enregistrement refusé.');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw new Error('BASE : un autre enregistrement est en cours. Réessayez dans un instant.');
  try {
    var file = DriveApp.getFileById(fileId);
    if (!db.contacts.length) {
      var cur = null;
      try { cur = JSON.parse(file.getBlob().getDataAsString()); } catch (e) {}
      if (cur && cur.contacts && cur.contacts.length) {
        throw new Error('BASE : écriture refusée — ' + cur.contacts.length + ' contacts en place, 0 à écrire. ' +
                        'Le fichier n\'a pas été touché.');
      }
    }
    file.setContent(JSON.stringify(db));
  } finally {
    lock.releaseLock();
  }
}

// ▶ Contrôle de santé — à lancer quand on veut, ne modifie rien
function verifierBase() {
  var db = getDB_();
  Logger.log('✅ Base lisible : ' + db.contacts.length + ' contacts · ' + db.users.length + ' accès · ' +
             (db.leads || []).length + ' demandes.');
  var fid = PropertiesService.getScriptProperties().getProperty(DB_FILE_KEY);
  var f = DriveApp.getFileById(fid);
  Logger.log('Fichier : ' + f.getName() + ' · ' + Math.round(f.getSize() / 1024) + ' Ko · modifié le ' + f.getLastUpdated());
}

// ▶ Liste les accès (nom, rôle, code, jeton) et les 15 dernières lignes du journal d'administration
function listerAcces() {
  var db = getDB_();
  Logger.log('Base : ' + db.contacts.length + ' contacts · ' + db.users.length + ' accès');
  db.users.forEach(function (u) {
    Logger.log((u.actif === false ? '⛔ ' : u.pending ? '⏳ ' : '✅ ') + u.nom + ' · ' + u.role + ' · code ' + u.code + ' · jeton ' + (u.pubToken ? 'oui' : 'non'));
  });
  Logger.log('Dernières entrées du journal admin :');
  (db.adminLog || []).slice(0, 15).forEach(function (l) { Logger.log(l.ts + ' · ' + l.par + ' · ' + l.action + ' · ' + l.detail); });
}

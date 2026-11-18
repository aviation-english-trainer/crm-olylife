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

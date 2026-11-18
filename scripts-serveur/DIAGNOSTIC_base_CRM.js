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

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

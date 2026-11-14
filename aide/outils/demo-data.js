/* Jeu de données de DÉMONSTRATION pour les captures des tutoriels.
   Tout est fictif : noms inventés, téléphones dans la tranche réservée à la fiction
   (06 39 98 xx xx), e-mails en @exemple.fr. Aucune donnée réelle ne doit entrer ici.
   Les dates sont calculées par rapport à « aujourd'hui » : les écrans sont toujours remplis. */
'use strict';

function ymd(d) { return d.toISOString().slice(0, 10); }
function day(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; }
function at(n, h, m) { var d = day(n); d.setHours(h, m || 0, 0, 0); return d.toISOString(); }

var ROLES = {
  gestionnaire: { id: 'u_demo_gest', nom: 'Camille Martin', role: 'gestionnaire', tags: ['Camille'], tel: '+33 6 39 98 01 01', email: 'camille.martin@exemple.fr' },
  referent:     { id: 'u_demo_ref',  nom: 'Sophie Lambert', role: 'referent',     tags: ['Sophie'],  tel: '+33 6 39 98 01 02', email: 'sophie.lambert@exemple.fr' },
  admin:        { id: 'u_demo_adm',  nom: 'Alex Morel',     role: 'admin',        tags: ['Alex'],    tel: '+33 6 39 98 01 03', email: 'alex.morel@exemple.fr' }
};

function build(role) {
  var me = Object.assign({ photo: '', calendlyUrl: '', zoomUrl: '', memberId: '', rang: '', push: true, actif: true,
    pubToken: 'DEMO' }, ROLES[role || 'gestionnaire']);
  if (me.role !== 'referent') me.zoomUrl = 'https://us05web.zoom.us/j/0000000000';
  var G = 'Camille Martin', R = 'Sophie Lambert';

  function j(n, h, auteur, type, texte) {
    return { id: 'j_' + n + '_' + h + '_' + type, ts: at(n, h), auteur: auteur, role: auteur === G ? 'gestionnaire' : 'referent', type: type, texte: texte };
  }
  function c(o) {
    return Object.assign({ actions: {}, produits: [], journal: [], email: '', etape: 'Prospect', qualification: 'Tiède',
      canal: 'WhatsApp', registre: 'pro', ctags: ['Sophie'], refere: R, referentNom: R, suiviPar: G, createdBy: R, pays: 'France' }, o);
  }

  var contacts = [
    c({ id: 'c_demo_1', nom: 'BERNARD', prenom: 'Élise', tel: '+33 6 39 98 10 01', ville: 'Lyon', statut: 'afaire', createdAt: ymd(day(-3)) }),
    c({ id: 'c_demo_2', nom: 'PETIT', prenom: 'Hugo', tel: '+33 6 39 98 10 02', ville: 'Nantes', statut: 'afaire', createdAt: ymd(day(-1)) }),
    c({ id: 'c_demo_3', nom: 'ROUSSEL', prenom: 'Nadia', tel: '+33 6 39 98 10 03', email: 'nadia.roussel@exemple.fr', ville: 'Toulouse',
      etape: 'Relance en cours', statut: 'encours', createdAt: ymd(day(-12)),
      rappel: { date: ymd(day(0)), heure: '10:30', texte: 'Rappeler après sa lecture de la présentation', pour: G },
      journal: [j(-5, 9, R, 'note', 'Intéressée par la découverte des appareils de bien-être.'), j(-2, 15, G, 'appel', 'Premier échange — présentation envoyée.')] }),
    c({ id: 'c_demo_4', nom: 'GARNIER', prenom: 'Paul', tel: '+33 6 39 98 10 04', ville: 'Bordeaux',
      etape: 'Relance en cours', statut: 'encours', createdAt: ymd(day(-20)),
      rdvs: [{ start: at(0, 15, 0), nom: 'Rendez-vous OlyLife', host: G, lieu: 'Visio', statut: 'active' }],
      journal: [j(-6, 11, G, 'appel', 'A posé ses questions sur le fonctionnement.'), j(-1, 17, G, 'rdv', 'Rendez-vous fixé.')] }),
    c({ id: 'c_demo_5', nom: 'FONTAINE', prenom: 'Lucie', tel: '+33 6 39 98 10 05', email: 'lucie.fontaine@exemple.fr', ville: 'Nice',
      etape: 'Achat en cours', statut: 'close', createdAt: ymd(day(-30)),
      rdvs: [{ start: at(1, 11, 0), nom: 'Rendez-vous OlyLife', host: G, lieu: 'Visio', statut: 'active' }],
      journal: [j(-3, 10, G, 'note', 'Souhaite recevoir une proposition de commande.')] }),
    c({ id: 'c_demo_6', nom: 'MARCHAND', prenom: 'Karim', tel: '+33 6 39 98 10 06', ville: 'Lille',
      etape: 'Achat en cours', statut: 'close', createdAt: ymd(day(-25)),
      rappel: { date: ymd(day(-1)), heure: '', texte: 'Confirmer l\'adresse de livraison', pour: G },
      journal: [j(-4, 14, G, 'appel', 'Adresse de livraison à confirmer.')] }),
    c({ id: 'c_demo_7', nom: 'LEROY', prenom: 'Inès', tel: '+33 6 39 98 10 07', email: 'ines.leroy@exemple.fr', ville: 'Rennes',
      etape: 'Client', statut: 'reseau', createdAt: ymd(day(-60)),
      journal: [j(-2, 16, G, 'fait', 'Kit de bienvenue envoyé.')] }),
    c({ id: 'c_demo_8', nom: 'DUMAS', prenom: 'Olivier', tel: '+33 6 39 98 10 08', ville: 'Strasbourg',
      etape: 'Client', statut: 'reseau', createdAt: ymd(day(-90)),
      journal: [j(-6, 9, G, 'note', 'Satisfait de l\'accompagnement, à recontacter le mois prochain.')] })
  ];

  var users = [
    Object.assign({ actif: true }, ROLES.gestionnaire),
    Object.assign({ actif: true, gestionnaire: G }, ROLES.referent),
    Object.assign({ actif: true }, ROLES.admin)
  ];
  var equipe = [ROLES.gestionnaire, ROLES.admin].map(function (u) { return { nom: u.nom, role: u.role, tel: u.tel, email: u.email, photo: '' }; });

  return {
    ok: true,
    token: 'demo-token-captures-tutos',
    user: me,
    users: users,
    contacts: contacts,
    config: { srv: '3.37', referents: ['Sophie'], suiveurs: [G], equipe: equipe, params: { liens: { onesignalAppId: '' } }, leadsNew: 0 }
  };
}

module.exports = { build: build, ROLES: ROLES };

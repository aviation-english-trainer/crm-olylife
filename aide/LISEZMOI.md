# Aide & tutoriels du CRM OlyLife

Source unique des tutoriels. Trois sorties prévues : dans le CRM (fait), cours du BO Office (lot 5), e-mails de prise en main (lot 6).

| Fichier | Rôle |
|---|---|
| `tutos.json` | Les tutos : un objet par tuto (slug, titre, rôles, parcours, écran, objectif, étapes, piège, vérification, version, vidéo). |
| `index.html` | La page qui les affiche : recherche, filtre par rôle, lien direct `aide/#slug`, case « fait ». |
| `img/` | Captures, **générées** par `outils/captures.js`. Ne pas les retoucher à la main. |
| `outils/demo-data.js` | Jeu de données de démonstration. Tout y est fictif (noms inventés, téléphones 06 39 98 xx xx, e-mails @exemple.fr). |
| `outils/scenes.js` | Une scène par série de captures : ce qu'on ouvre, ce qu'on entoure, le nom de l'image. |
| `outils/captures.js` | Rejoue les scènes dans un téléphone simulé. Aucune requête ne part vers le vrai serveur. |

## Ajouter ou corriger un tuto
1. Écrire le texte dans `tutos.json` (le gras s'écrit `**comme ceci**`).
2. Ajouter la scène dans `outils/scenes.js` ; nom d'image `<slug>-<étape>.jpg`.
3. `node aide/outils/captures.js <slug>` puis relire les images.

## À chaque nouvelle version du CRM
`node aide/outils/captures.js` refait toutes les captures. Mettre à jour le champ `version` des tutos relus, et `VERSION` dans `sw.js` (les captures sont gardées en cache par version).

## Ouvrir un tuto depuis le CRM
- `oAide()` : la liste, filtrée sur le rôle connecté.
- `oAide('profil')` : un tuto précis.
- `oAideCtx()` : le tuto dont le champ `ecran` correspond à l'écran affiché (bouton **?** de la barre du haut).
- Bouton rond **?** : `<button class="aq" onclick="oAide('slug')">?</button>`.

## Règles de contenu
Appareils de bien-être, jamais de vocabulaire médical. Aucune promesse de revenus. Captures : données de démonstration uniquement, jamais de mot de passe.

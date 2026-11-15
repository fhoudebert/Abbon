# Format d'échange `.qcm` — version 1

Un fichier `.qcm` est une archive ZIP. Le format est ouvert : il peut être produit ou lu par d'autres outils.
Les schémas JSON de ce dossier sont générés depuis le code (`src/lib/interchange/format.ts`, `npm run schema`) et
vérifiés par les tests.

```
manifest.json          description du paquet (fait foi)       → manifest.schema.json
categories.json        tableau de catégories                  → category.schema.json (par élément)
quizzes/<id>.json      un fichier par QCM                     → quiz.schema.json
media/<sha256>.<ext>   images (png, jpg, gif, webp)
```

Une **sauvegarde complète** (`"kind": "backup"`) contient en plus `attempts.json` (tentatives, avec la copie du QCM
au démarrage), `answers.json` et `settings.json`. Elle se restaure depuis *Paramètres › Sauvegarde* et remplace tout
le contenu de l'appareil (le code PIN de l'appareil est conservé).

## Règles

- **Identifiants** : lettres, chiffres, `_` et `-` (UUID recommandé). À l'import, un QCM dont l'identifiant existe
  déjà peut être remplacé, copié (nouveaux identifiants) ou ignoré ; par défaut il est remplacé si sa `version` est
  plus récente, ignoré sinon.
- **Textes** : les champs multilingues sont des objets `{ "fr": "…", "en": "…" }` (codes de langue BCP 47 courts).
- **Contenu riche** (énoncés, réponses, explications) : soit du texte simple, soit un document JSON au format
  TipTap / ProseMirror (`{ "type": "doc", "content": [...] }`). Aucun HTML n'est accepté ni interprété. Nœuds
  affichés : `paragraph`, `text` (marques `bold`, `italic`, `underline`, `strike`, `code`), `hardBreak`,
  `bulletList`, `orderedList`, `listItem`, `blockquote`, `horizontalRule`, `codeBlock` (`attrs.language`),
  `table`, `tableRow`, `tableHeader`, `tableCell`, `image` (`attrs.hash`, `attrs.alt`). Tout autre nœud est réduit
  à son texte.
- **Images** : le nom du fichier est l'empreinte SHA-256 de son contenu, en hexadécimal ; le document y fait
  référence par `attrs.hash`. À l'import, l'empreinte, la signature du format et la taille (5 Mo au plus) sont
  vérifiées.
- **Sans corrigé** (`"solutions": false`) : les champs `correct`, `explanation` et `feedback` sont absents ; le QCM
  est importé en brouillon.
- **Limites** : 5 000 fichiers, 200 Mo décompressés, 20 Mo par fichier JSON, 30 niveaux d'imbrication.
- **Versions du format** : `formatVersion` augmente à chaque changement incompatible ; Abbon refuse un fichier
  d'une version plus récente que la sienne.

## GIFT (Moodle)

Abbon importe et exporte aussi le format texte GIFT : choix unique, choix multiples (poids `~%50%`), vrai/faux,
retours `#` et `####`. Les autres types (réponse courte, appariement, numérique, rédaction) sont signalés et
ignorés. À l'export, chaque bonne réponse d'un choix multiple vaut `100/n %` et chaque mauvaise `-100 %`.

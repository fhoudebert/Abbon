# Format d'échange `.qcm` — version 1

Un fichier `.qcm` est une archive ZIP. Le format est ouvert : il peut être produit ou lu par d'autres outils.
Les schémas JSON de ce dossier sont générés depuis le code (`src/lib/interchange/format.ts`, `npm run schema`) et
vérifiés par les tests.

```
manifest.json          description du paquet (fait foi)       → manifest.schema.json
categories.json        tableau de catégories                  → category.schema.json (par élément)
quizzes/<id>.json      un fichier par QCM                     → quiz.schema.json
media/<sha256>.<ext>   images (png, jpg, gif, webp)
module.json            facultatif : le fichier est un module           → module.schema.json
```

Une **sauvegarde complète** (`"kind": "backup"`) contient en plus `attempts.json` (tentatives, avec la copie du QCM
au démarrage), `answers.json`, `settings.json` et, s'il y en a, `modules.json` (modules installés : manifeste et dates) et `leitner.json` (boîte de
révision : compartiment, dates et copie de chaque question). Elle se restaure depuis *Paramètres › Sauvegarde* et remplace tout
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

## Types de questions

| `type` | Réponse | Champs |
|---|---|---|
| `single` | une case à cocher parmi `choices` | exactement un choix `correct` |
| `multiple` | plusieurs cases à cocher | au moins un choix `correct` |
| `short` | texte à saisir | `choices` vide ; `expected.accepted` (formes acceptées), `expected.caseSensitive` |
| `cloze` | texte à trous | `choices` vide ; `expected.text` (texte par langue, trous marqués `{{1}}`, `{{2}}`…), `expected.gaps` |
| `numeric` | nombre à saisir | `choices` vide ; `expected.value`, `expected.tolerance` (écart absolu), `expected.unit` (affichée, pas saisie) |

```json
{ "id": "q1", "type": "short", "prompt": { "fr": "Prétérit de to go ?" }, "points": 1, "position": 0,
  "choices": [], "expected": { "accepted": ["went"] } }
{ "id": "q2", "type": "numeric", "prompt": { "fr": "Valeur de g ?" }, "points": 1, "position": 1,
  "choices": [], "expected": { "value": 9.81, "tolerance": 0.01, "unit": "m/s²" } }
```

- **Réponse courte** : la saisie est comparée à chaque forme acceptée après retrait des espaces superflus et
  unification des apostrophes ; les majuscules sont ignorées sauf `caseSensitive`. Les accents comptent.
- **Réponse numérique** : virgule ou point décimal, signe moins typographique, espaces de milliers et notation
  scientifique (`1,5e3`) sont acceptés. La réponse est juste si |saisie − `value`| ≤ `tolerance`.
- Ces deux types sont notés en tout ou rien. Dans les réponses d'une sauvegarde, le texte saisi est dans `text`.
- **Texte à trous** :

  ```json
  { "id": "q3", "type": "cloze", "prompt": { "fr": "Complétez." }, "points": 1, "position": 2, "choices": [],
    "expected": {
      "text": { "fr": "She {{1}} to London. She {{2}} two cats." },
      "gaps": [
        { "kind": "text", "accepted": ["went", "did go"] },
        { "kind": "select", "accepted": ["has"], "options": ["have", "had"] }
      ] } }
  ```

  Le trou n° *n* du texte est `gaps[n-1]` ; le texte de chaque langue contient chaque repère une fois. Un trou
  `text` se compare comme une réponse courte ; un trou `select` est une liste déroulante formée de sa bonne
  réponse (`accepted[0]`) et de ses `options`. Notation : tout ou rien, ou part des trous justes si le QCM est en
  notation partielle. Les réponses de l'apprenant sont dans `texts`, une par trou.
- Sans corrigé (`includesSolutions: false`), `expected` est retiré, sauf l'unité d'une réponse numérique, et sauf le
  texte et les propositions des listes d'un texte à trous.
- **Compatibilité** : `short`, `numeric` et `cloze` datent d'Abbon 0.2.0. Un lecteur plus ancien refuse un QCM qui en
  contient (le QCM est signalé invalide, les autres s'importent).

## Modules

Un **module** est un fichier `.qcm` ordinaire (`"kind": "content"`) qui contient en plus `module.json`.
`manifest.json` n'a aucun champ nouveau : un lecteur qui ne connaît pas les modules ignore `module.json` et importe
les QCM comme un export ordinaire. Un lecteur qui les connaît installe le module d'un bloc, protège son contenu et
sait le mettre à jour ou le retirer.

```json
{
  "format": "abbon-module",
  "formatVersion": 1,
  "id": "org.abbon.anglais-verbes",
  "version": "0.1.0",
  "title": { "fr": "Anglais : verbes irréguliers", "en": "English: irregular verbs" },
  "description": { "fr": "…", "en": "…" },
  "level": "collège-lycée",
  "license": "CC-BY-NC-SA-4.0",
  "authors": ["Abbon"],
  "homepage": "https://github.com/fhoudebert/Abbon",
  "requires": { "app": ">=0.2.0", "features": [] },
  "categories": ["org-abbon-anglais-verbes_frequents-50"],
  "quizzes": ["org-abbon-anglais-verbes_preterit-01"],
  "sheets": { "org-abbon-anglais-verbes_frequents-50": { "fr": { "type": "doc", "content": [] } } }
}
```

- **`id`** : notation inversée en minuscules (`org.abbon.informatique`), stable d'une version à l'autre.
- **`version`** : SemVer. Une version plus récente met le module à jour ; la `version` entière de chaque QCM doit
  croître avec elle (Abbon utilise majeur × 1 000 000 + mineur × 1 000 + correctif).
- **`quizzes`, `categories`** : identifiants des QCM et des catégories du module, présents dans le même fichier.
  Seuls ceux-là sont installés. Ils doivent rester stables : ils relient l'historique des tentatives aux versions
  suivantes. Convention d'Abbon : préfixe `org-abbon-informatique_`.
- **`sheets`** : fiches de révision, par identifiant de catégorie puis par langue (contenu riche, images comprises).
- **`requires`** : `app` est une version minimale d'Abbon (`>=0.2.0`) ; `features` liste les fonctions de rendu
  nécessaires (`math`, `svg`… ; aucune n'est encore définie en version 0.2.0). L'installation est refusée si un
  prérequis manque.
- **`license`** : identifiant SPDX de la licence du contenu.
- Un `module.json` invalide, ou d'un `formatVersion` plus récent, est signalé ; le fichier reste importable comme un
  export ordinaire.
- À l'installation, un QCM du fichier n'écrase jamais un QCM personnel ni celui d'un autre module.

Les sources et l'outillage des modules d'Abbon sont décrits dans [modules.md](../modules.md).

## GIFT (Moodle)

Abbon importe et exporte aussi le format texte GIFT : choix unique, choix multiples (poids `~%50%`), vrai/faux,
réponse courte (`{=Paris =paris}`) et réponse numérique (`{#3.14:0.01}`, `{#1..5}`),
retours `#` et `####`. Les autres types (appariement, rédaction, réponse numérique à plusieurs valeurs) sont
signalés et ignorés. L'unité d'une réponse numérique, sans équivalent en GIFT, est ajoutée à l'énoncé. Un texte
à trous n'est pas exporté (GIFT ne décrit qu'un trou par question) : il est laissé en commentaire. À l'export, chaque bonne réponse d'un choix multiple vaut `100/n %` et chaque mauvaise `-100 %`.

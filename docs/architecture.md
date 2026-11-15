# Architecture d'Abbon

Quatre couches, de la plus stable à la plus dépendante de la plateforme.

1. **Domaine** (`src/lib/domain`) — types, calcul du score, statuts de progression. TypeScript pur,
   sans dépendance à Tauri ni à Svelte ; c'est là que vit la logique métier, et c'est la partie la plus testée.
2. **Données** (`src/lib/data`) — l'interface `Repository` isole le stockage.
   - `SqliteRepository` reçoit un `SqlDriver` (`execute` / `select`, paramètres `$1, $2…`). En application, le pilote
     est le plugin SQL de Tauri ; dans les tests, le SQLite intégré à Node. Le même SQL est donc testé sans lancer Tauri.
   - `MemoryRepository` sert à l'aperçu dans un navigateur (`npm run dev`).
3. **Interface** (`src/routes`, `src/lib/components`) — Svelte 5 (runes) et SvelteKit en mode SPA
   (`adapter-static`, pas de rendu serveur). État global dans `src/lib/app.svelte.ts`.
4. **Enveloppe Tauri** (`src-tauri`) — Rust minimal : enregistrement du plugin SQL et des migrations.

## Base de données

- Fichier `abbon.db` dans le répertoire de données de l'application (propre à chaque plateforme).
- Migrations dans `src-tauri/migrations/NNNN_nom.sql`, déclarées dans `src-tauri/src/lib.rs` et appliquées au
  chargement. Une migration publiée n'est jamais modifiée : on en ajoute une nouvelle (et on l'ajoute aussi à la liste
  `MIGRATIONS` de `src/lib/data/sqlite.testing.ts`).
- Les textes multilingues sont des colonnes JSON `{"fr": "...", "en": "..."}`.
- Les statuts « à faire / en cours / fait » ne sont pas stockés : ils sont déduits des tentatives
  (`src/lib/domain/progress.ts`).
- Chaque tentative enregistre la version du QCM, pour que ses résultats restent cohérents si le QCM est modifié.

## Passage d'un QCM (lot 1)

- `domain/session.ts` contient toute la logique, en fonctions pures : démarrage, ordre des questions et des choix,
  correction d'une réponse, fin de tentative, visibilité du corrigé, chrono.
- **Ordre aléatoire reproductible** : questions et choix sont mélangés avec une graine dérivée de l'identifiant de la
  tentative (et de la question). Une tentative reprise retrouve exactement le même ordre, sans rien stocker de plus.
- **Instantané** : au démarrage, la tentative enregistre une copie du QCM (`attempt.quiz_snapshot`, migration 2). La
  reprise, le récapitulatif et le corrigé utilisent cette copie, même si le QCM a été modifié depuis.
- **Enregistrement continu** : chaque réponse est écrite dès qu'elle change ; le temps (total et par question) est
  écrit toutes les 5 s, à chaque changement de question et quand l'application passe en arrière-plan (le chrono
  s'arrête alors). Fermer l'application ne perd donc rien.
- **Entraînement** : « Valider » corrige la question, affiche l'explication et verrouille la réponse.
  **Examen** : aucune correction avant la fin ; à la fin du temps imparti, la tentative est close automatiquement.
- **Corrigé** : selon le réglage du QCM — jamais, après la fin, ou seulement après réussite.
- **Refaire les erreurs** : nouvelle tentative limitée aux questions ratées. Ces tentatives partielles comptent
  pour le statut (fait / en cours) mais pas pour le dernier et le meilleur score.

## Internationalisation

- Interface : `src/lib/i18n/fr.ts` est la référence ; `en.ts` est typé à partir de lui (une clé manquante empêche la
  compilation) et un test vérifie que les deux catalogues ont les mêmes clés.
- Langue détectée depuis le système au premier lancement, puis mémorisée dans la table `setting`.
- Contenu : chaque QCM déclare ses langues ; `localize()` choisit la langue de l'interface, puis la langue principale
  du QCM.
- Styles en propriétés CSS logiques (`margin-inline`, `padding-block`…) pour une future langue de droite à gauche.

## Sécurité

- Politique de sécurité du contenu (CSP) stricte dans `tauri.conf.json` : pas de script ni de ressource distante.
- Permissions Tauri limitées au plugin SQL (`src-tauri/capabilities/default.json`).

## Édition (lot 2)

- **Contenu riche** : énoncés, réponses et explications sont des documents JSON TipTap/ProseMirror
  (`RichValue` = texte simple ou document). Aucun HTML n'est stocké ni injecté : `RichContent.svelte` rend une liste
  blanche de nœuds (paragraphes, listes, code, tableaux, images…) ; tout nœud inconnu est réduit à son texte. Les textes
  simples des QCM plus anciens restent valides.
- **Code** : coloration par lowlight (highlight.js), identique dans l'éditeur et à l'affichage ; langage au choix ou
  détecté automatiquement.
- **Images** : réduites à 1600 px à l'insertion, stockées dans la table `media` (base64, clé = SHA-256, migration 3),
  référencées dans le document par leur empreinte. Pas de fichier sur disque, pas de permission d'accès aux fichiers,
  sauvegarde atomique avec le QCM, export simple. Texte alternatif signalé s'il manque.
- **Sauvegarde atomique** : `saveQuiz` envoie toutes ses requêtes à la commande Rust `run_batch`
  (`src-tauri/src/batch.rs`), exécutées dans une transaction sur une seule connexion : tout ou rien.
- **Saisie** : les éditeurs transmettent leurs changements après une pause de frappe de 250 ms (revalider le QCM à chaque
  touche ralentissait la saisie). Sous WebKit, un clic sur un bouton ne retire pas le focus : enregistrer, publier,
  Ctrl+S et quitter la page appellent donc `flushEdits()` avant tout (`src/lib/rich/pending.ts`).
- **Publication** : `domain/validate.ts` liste erreurs (bloquantes) et avertissements. Un QCM publié modifié change de
  version ; s'il devient invalide, il repasse en brouillon à l'enregistrement.
- **Code PIN** : facultatif, PBKDF2-SHA-256 salé (150 000 itérations, WebCrypto). Il évite une modification par
  mégarde ; il ne chiffre pas la base.

## Échange (lot 3)

- **Format `.qcm`** : archive ZIP décrite dans [format-qcm/README.md](format-qcm/README.md). Les schémas Zod de
  `src/lib/interchange/format.ts` valident tout fichier importé ; les JSON Schema publiés en sont générés.
- **Lecture défensive** : limites de taille et de nombre de fichiers (archives piégées), chemins `..` refusés,
  profondeur JSON limitée, images vérifiées (empreinte, signature, taille). Un élément invalide est écarté et
  signalé, le reste est importé.
- **Import** : `planImport` propose une action par QCM (ajouter, remplacer si la version du fichier est plus
  récente, sinon ignorer) ; l'utilisateur peut aussi « ajouter une copie » (nouveaux identifiants). Chaque QCM est
  enregistré en tout ou rien ; une sauvegarde automatique est écrite avant (5 dernières conservées dans le dossier de
  données de l'application, `backups/`).
- **Sauvegarde complète** : contenus, images, historique (avec les copies de QCM des tentatives) et réglages, sauf
  le code PIN. La restauration remplace tout en une seule transaction (`replaceAll`).
- **GIFT** : `interchange/gift.ts`, analyseur tolérant (types non pris en charge signalés), export en `[html]`
  généré par Abbon.
- **Fichiers** : export par « Enregistrer sous » (plugins Tauri dialog + fs ; le chemin choisi est seul autorisé en
  écriture), import par `<input type="file">` (sans permission). Les droits fs sont limités au dossier `backups/`.

## Distribution (lot 4)

Voir [distribution.md](distribution.md). En bref : plugin updater de Tauri sur ordinateur (clé publique et adresse
du serveur intégrées à la compilation par `ABBON_UPDATER_PUBKEY` et `ABBON_UPDATE_URL` ; sans clé, le plugin
n'est pas chargé), lecture de `releases/version.json` par une commande Rust (`ureq`) pour Android et pour les
notes de version, ouverture de l'APK ou de la page de téléchargement par le plugin opener (HTTPS seulement).
`requireSignedVersion` empêche de faire installer une ancienne version signée.

## Modules (lot 6)

Voir [modules.md](modules.md) pour l'usage et le format des sources.

- **Format** : `module.json` dans un `.qcm` ordinaire (`interchange/module.ts` : schéma Zod, prérequis,
  `planModule`). Le manifeste du paquet ne change pas, pour rester lisible par Abbon 0.1.
- **Stockage** (migration 4) : table `module` (manifeste JSON complet, fiches comprises), colonnes
  `quiz.module_id` et `category.module_id`. `installModule` et `uninstallModule` s'exécutent chacune dans une
  transaction.
- **Historique** : les tentatives disparaissent avec leur QCM (`ON DELETE CASCADE`). Quand un QCM de module est
  retiré en gardant l'historique, tentatives et réponses sont d'abord copiées dans `attempt_archive` et
  `answer_archive`, puis remises en place quand le QCM revient (réinstallation, version suivante).
- **Contenu protégé** : l'éditeur ne s'ouvre pas sur un QCM de module ; l'import ordinaire ne propose pas de le
  remplacer (`interchange/plan.ts`) ; `planModule` écarte tout identifiant déjà pris par un autre contenu.
- **Sauvegarde complète** : `modules.json` ; l'appartenance des QCM est reposée à la restauration d'après les
  manifestes.
- **Outillage** (`scripts/modules`) : `source.ts` compile les sources Markdown + YAML avec les schémas et le code
  d'écriture de l'application ; `cli.mjs` les charge par Vite (alias `$lib`, TypeScript). La construction est
  reproductible : mêmes sources, même fichier.

## Questions à saisie (lot 6 bis)

- Types `short` et `numeric` : pas de `choices`, une réponse attendue dans `question.expected` (colonne JSON) ;
  le texte saisi est dans `answer.text`. Comparaison dans `domain/typed.ts` (fonctions pures : normalisation du
  texte, lecture d'un nombre, écart toléré) ; `scoreQuestion` les note en tout ou rien.
- « Répondu » ne se déduit plus des cases cochées : `isAnswered` (session.ts) tient compte du texte.
- Le texte saisi est gardé en mémoire à chaque frappe et écrit en base avec le chrono, au changement de question,
  à la validation et à la fin.
- Migration 5 (colonnes) ; la contrainte `CHECK` de `question.type` a été élargie dans la migration 1, aucune base
  n'étant à reprendre (voir [feuille-de-route.md](feuille-de-route.md)).

## Textes à trous (lot 6 ter)

- Type `cloze` : `expected.text` (texte brut par langue, repères `{{n}}`) et `expected.gaps` (saisie ou liste
  déroulante) ; réponses de l'apprenant dans `answer.texts` (migration 6). Logique dans `domain/cloze.ts`.
- `ClozeText.svelte` affiche le texte et ses champs ; il sert au passage, au corrigé et à l'aperçu. Les
  propositions d'une liste sont mélangées par tentative (même graine que les réponses à cocher).
- Le texte à trous est du texte brut (retours à la ligne conservés), sans mise en forme : la consigne, elle,
  reste un contenu riche.
- Les propositions d'une liste déroulante sont communes à toutes les langues.

## Limites connues

- Modules : l'historique mis de côté à la désinstallation n'est pas inclus dans la sauvegarde complète ; une
  catégorie de module renommée à la main reprend son nom à la mise à jour suivante.

- Les liens ne sont pas proposés dans l'éditeur (pas d'ouverture du navigateur externe pour l'instant).
- Les images qui ne servent plus restent en base jusqu'au « Nettoyer les images inutilisées » (Paramètres).
- Import GIFT : un QCM par fichier ; `$CATEGORY` est ignoré ; le texte `[html]` est réduit à du texte simple.
- Android : l'export passe par la fenêtre d'enregistrement du système ; non testé sur appareil à ce stade.
- Réordonner questions et réponses se fait par boutons ↑ ↓ (pas encore de glisser-déposer).

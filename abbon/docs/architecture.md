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
  `MIGRATIONS` de `src/lib/data/sqlite.test.ts`).
- Les textes multilingues sont des colonnes JSON `{"fr": "...", "en": "..."}`.
- Les statuts « à faire / en cours / fait » ne sont pas stockés : ils sont déduits des tentatives
  (`src/lib/domain/progress.ts`).
- Chaque tentative enregistre la version du QCM, pour que ses résultats restent cohérents si le QCM est modifié.

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

## Choix reportés

- **Transactions** : le plugin SQL utilise un pool de connexions ; `BEGIN` / `COMMIT` envoyés par des appels séparés
  ne sont pas garantis sur la même connexion. La sauvegarde d'un QCM n'est donc pas atomique en lot 0. À traiter au
  lot 2 (éditeur), par exemple avec une commande Rust dédiée qui écrit un QCM dans une transaction.

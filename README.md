<p align="center"><img src="assets/abbon-icon.png" width="120" alt=""></p>

# Abbon

Application de QCM hors ligne pour s'entraîner aux certifications (informatique, langues) et à la culture générale.
Une seule base de code HTML5 / TypeScript, empaquetée avec [Tauri 2](https://v2.tauri.app) pour **Linux**, **Android** et **Windows**.

Logiciel libre sous licence [MIT](LICENSE).

> **État : lot 3 (échange).** Import / export au format ouvert `.qcm` (voir [docs/format-qcm](docs/format-qcm/README.md))
> et au format GIFT de Moodle, export « sans corrigé », gestion des doublons à l'import, sauvegarde complète et
> restauration (sauvegarde automatique avant chaque import ou restauration).
> Lots précédents : édition des QCM (éditeur riche, catégories, PIN), passage (entraînement, examen, corrigé).
> À venir : distribution et mises à jour (lot 4), finition (lot 5).

### Raccourcis clavier (passage d'un QCM)

| Touche | Action |
|---|---|
| `1` … `9` | Cocher / décocher la réponse correspondante |
| `Entrée` | Valider (entraînement), question suivante, ou terminer |

Dans l'éditeur : `Ctrl+S` enregistre ; dans une réponse, `Entrée` crée la réponse suivante (`Maj+Entrée` : retour à la ligne).

## Prérequis

| Outil | Version |
|---|---|
| Node.js | 22.13 ou plus récent |
| Rust | 1.90 ou plus récent (`rustup`) |
| Linux | `libwebkit2gtk-4.1-dev`, `libxdo-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev` |
| Android | Android Studio (SDK + NDK), Java 17+, cibles Rust Android — voir [la doc Tauri](https://v2.tauri.app/start/prerequisites/#android) |
| Windows | Microsoft C++ Build Tools ; WebView2 (installé d'office sur Windows 10 récent et 11) |

Sous Debian / Ubuntu :

```sh
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev \
  libayatana-appindicator3-dev librsvg2-dev
```

## Développement

```sh
npm install
npm run tauri dev          # application de bureau (SQLite)
npm run dev                # interface seule dans un navigateur (stockage en mémoire)
```

Android (appareil branché en USB, débogage activé) :

```sh
npm run tauri android init   # une fois
npm run tauri android dev
```

## Vérifications

```sh
npm run check              # types TypeScript + Svelte
npm test                   # tests du domaine, de l'i18n, du SQL (SQLite de Node) et des formats d'échange
npm run schema             # régénère les JSON Schema publiés dans docs/format-qcm
cd src-tauri && cargo test # tests Rust (migrations)
```

## Paquets

```sh
npm run tauri build -- --bundles deb,rpm,appimage    # Linux
npm run tauri android build -- --apk                 # Android
npm run tauri build -- --bundles msi,nsis            # Windows (sur Windows)
```

### Intégration continue

- [`ci.yml`](.github/workflows/ci.yml) : types, tests TS et Rust, lint, à chaque push sur n'importe quelle branche et
  à chaque pull request.
- [`build.yml`](.github/workflows/build.yml) : paquets Linux, Android et Windows.
  - **À la demande** : onglet *Actions* → *Build* → *Run workflow*, puis saisir la branche (ou un tag, un commit) et
    cocher les plateformes. Les paquets se téléchargent depuis les *artifacts* de l'exécution.
    Avec `gh` : `gh workflow run build.yml --ref init -f ref=init -f windows=false`.
    Attention : GitHub exécute le fichier de workflow de la branche choisie dans « Use workflow from »
    (option `--ref`), le champ `ref` ne choisit que le code compilé. Pour tester une modification du
    workflow lui-même, choisir la même branche aux deux endroits.
  - **Sur un tag `vX.Y.Z`** : les trois plateformes, puis un brouillon de release avec les empreintes SHA-256.
    Le tag doit correspondre à la version de `package.json`, sinon le build s'arrête.

GitHub n'affiche le bouton *Run workflow* que si le workflow est présent sur la branche par défaut du dépôt.

### Signature de l'APK

L'APK est distribué directement (hors Play Store). Toutes les versions doivent être signées **avec la même clé**,
sinon Android refuse la mise à jour. Créer la clé une fois et la sauvegarder hors du poste :

```sh
keytool -genkeypair -v -keystore abbon.jks -keyalg RSA -keysize 4096 -validity 10000 -alias abbon
base64 -w0 abbon.jks   # valeur du secret ANDROID_KEYSTORE_BASE64
```

Puis déclarer dans les secrets du dépôt : `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. Sans ces secrets, la CI produit un APK de debug.

## Organisation du code

```
src/
  lib/domain/    modèle, score, progression, moteur de passage (session.ts) — TypeScript pur, testé
  lib/data/      interface Repository ; SQLite (Tauri) et mémoire (navigateur) ; données de démo
  lib/i18n/      messages fr / en, pluriels, formats Intl
  lib/rich/      contenu riche : éditeur TipTap, affichage sûr, coloration du code, images
  lib/interchange/  format .qcm (schémas, archive), plan d'import, GIFT
  lib/session.svelte.ts  tentative ouverte à l'écran : réponses, chrono, enregistrement
  lib/components/
  routes/        écrans (SvelteKit en mode SPA)
src-tauri/
  migrations/    schéma SQLite versionné (ne jamais modifier une migration publiée)
  src/lib.rs     enveloppe Tauri minimale : plugin SQL + migrations
  src/batch.rs   commande run_batch : écritures groupées dans une transaction
```

Voir [docs/architecture.md](docs/architecture.md).

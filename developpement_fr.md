# Abbon — développement

[English version](development.md) · [Présentation](lisezMoi.md)

Une seule base de code HTML5 / TypeScript (SvelteKit, Svelte 5), empaquetée avec [Tauri 2](https://v2.tauri.app)
pour Linux, Windows, macOS et Android. Données dans SQLite (application) ou en mémoire (navigateur).

## Prérequis

| Outil | Version |
|---|---|
| Node.js | 24 ou plus récent (la CI construit en Node 26) |
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
npm run module:check       # vérifie les sources des modules (dossier modules/)
npm run module:build       # construit dist/modules/Abbon-<nom>-<version>.qcm
npm run module:site        # exporte un module en site web (dist/sites/), --serveur : examen corrigé en PHP
npm run module:catalogue -- <dossier>   # pages index.html du catalogue de questionnaires
npm run atelier            # atelier de formules : dist/atelier/atelier-formules.html, page autonome (tools/atelier)
cd src-tauri && cargo test # tests Rust (migrations)
```

Les tests du correcteur PHP des sites d'examen (`src/lib/exam`) s'exécutent si `php` est installé (c'est le cas
des machines de la CI).

Audit d'accessibilité (axe-core, WCAG 2.1 A/AA) de tous les écrans dans WebKitGTK, le moteur de l'application
sous Linux (paquets `python3-gi`, `gir1.2-webkit2-4.1`) :

```sh
npm run build && npx vite preview --port 4173 &
npm run a11y                       # options : --themes dark --width 390 --shots captures/
```

Tests d'installation (lancent l'application 30 s et vérifient la création de la base) :
`scripts/smoke/linux.sh Abbon`, `scripts/smoke/windows.ps1 -Dist dossier`, `scripts/smoke/android.sh app.apk`.

## Paquets

```sh
npm run tauri build -- --bundles deb,rpm,appimage    # Linux
npm run tauri android build -- --apk                 # Android
npm run tauri build -- --bundles msi,nsis            # Windows (sur Windows)
npm run tauri build -- --target universal-apple-darwin --bundles app,dmg   # macOS (sur un Mac, avec les
                                                     # cibles Rust aarch64-apple-darwin et x86_64-apple-darwin)
```

### Intégration continue

- [`ci.yml`](.github/workflows/ci.yml) : types, tests TS et Rust, lint, audit d'accessibilité, à chaque push sur
  n'importe quelle branche et à chaque pull request.
- [`build.yml`](.github/workflows/build.yml) : paquets Linux, Android, Windows et macOS.
  - **À la demande** : onglet *Actions* → *Build* → *Run workflow*, puis saisir la branche (ou un tag, un commit) et
    cocher les plateformes. Les paquets se téléchargent depuis les *artifacts* de l'exécution.
    Avec `gh` : `gh workflow run build.yml --ref main -f ref=main -f windows=false`.
    Attention : GitHub exécute le fichier de workflow de la branche choisie dans « Use workflow from »
    (option `--ref`), le champ `ref` ne choisit que le code compilé. Pour tester une modification du
    workflow lui-même, choisir la même branche aux deux endroits.
  - **Sur un tag `vX.Y.Z`** : les quatre plateformes, puis un brouillon de release avec les empreintes SHA-256.
    Le tag doit correspondre à la version de `package.json`, sinon le build s'arrête.
  - **Tests d'installation** (case *smoke*, toujours sur un tag) : `.deb` sur Debian 12, Debian 13 et Ubuntu 24.04,
    `.rpm` sur Fedora, AppImage, installateur NSIS sous Windows, application macOS installée depuis le `.dmg`, APK sur un émulateur Android 14 (capture d'écran
    en *artifact*). Ils sont informatifs : la release ne les attend pas.

GitHub n'affiche le bouton *Run workflow* que si le workflow est présent sur la branche par défaut du dépôt.

### Signature de l'APK

L'APK est distribué directement (hors Play Store). Toutes les versions doivent être signées **avec la même clé**,
sinon Android refuse la mise à jour. Créer la clé une fois et la sauvegarder hors du poste :

```sh
keytool -genkeypair -v -keystore abbon.keystore -storetype PKCS12 -keyalg RSA -keysize 4096 \
  -validity 10000 -alias abbon
keytool -list -v -keystore abbon.keystore -alias abbon | grep SHA256   # empreinte du certificat
```

Le script [`scripts/android/sign-apk.sh`](scripts/android/sign-apk.sh) aligne, signe et vérifie l'APK. Il prend la
signature dans **une** des deux sources suivantes ; si les deux existent, l'environnement l'emporte.

**Sur GitHub** : les secrets sont rangés dans l'**environnement** `android-release`
(Settings → Environments), que le job Android déclare. Sur un tag, le build échoue si la clé manque ; sinon
il produit un APK de debug.

Deux points à vérifier si l'APK sort en debug alors que les secrets existent :

- **Le fichier de workflow exécuté est celui de la branche choisie dans « Use workflow from »** (`main` par
  défaut), pas celui de la branche compilée. La déclaration de l'environnement doit donc être présente sur `main`.
- **Règles de déploiement de l'environnement** (*Deployment branches and tags*) : si elles sont limitées, elles
  doivent autoriser la branche `main` **et les tags `v*`**, sinon le job Android d'une release est refusé.

| Réglage de l'environnement `android-release` | Variable lue par le script | |
|---|---|---|
| secret `ANDROID_KEYSTORE_BASE64` | `ABBON_KEYSTORE_FILE` (fichier décodé) | voir ci-dessous |
| secret `ANDROID_KEYSTORE_PASSWORD` | `ABBON_KEYSTORE_PASSWORD` | mot de passe du magasin |
| secret `ANDROID_KEY_ALIAS` | `ABBON_KEY_ALIAS` | défaut `abbon` |
| secret `ANDROID_KEY_PASSWORD` | `ABBON_KEY_PASSWORD` | défaut : celui du magasin (règle du PKCS12) |
| variable `ANDROID_CERT_SHA256` | `ABBON_CERT_SHA256` | facultatif : le build échoue si la clé n'est pas la bonne |

Valeur du secret `ANDROID_KEYSTORE_BASE64`, sans passer par un fichier (qui finirait par être commité) :

```sh
base64 -w0 abbon.keystore | gh secret set ANDROID_KEYSTORE_BASE64 --env android-release   # Linux
base64 -i abbon.keystore | gh secret set ANDROID_KEYSTORE_BASE64 --env android-release    # macOS
base64 -w0 abbon.keystore | xclip -selection clipboard    # ou copier, puis coller dans la page GitHub
```

Sous Windows (PowerShell) :
`[Convert]::ToBase64String([IO.File]::ReadAllBytes("abbon.keystore")) | Set-Clipboard`.

**Sur le poste** : déposer `abbon.keystore` et `keystore.properties` à la racine du dépôt. Ces deux fichiers
sont **ignorés par git** (`git check-ignore -v keystore.properties abbon.keystore`), et le script refuse de signer
s'ils sont suivis.

```properties
# keystore.properties — chemin relatif à ce fichier, ou absolu
storeFile=abbon.keystore
storePassword=…
keyAlias=abbon
keyPassword=…
```

SDK, NDK et Java : le CLI Tauri **ne lit pas** `local.properties`, il lui faut `ANDROID_HOME` et `NDK_HOME`.
[`scripts/android/env.sh`](scripts/android/env.sh) les déduit : variables d'environnement, sinon `sdk.dir`
(et `ndk.dir`) d'un `local.properties` à la racine du dépôt, sinon `~/Android/Sdk` ; le NDK le plus récent de
`<SDK>/ndk/` ; le JDK d'Android Studio si aucun Java n'est installé. `~` et `$HOME` y sont acceptés (Gradle, lui,
ne les développe pas : écrire un chemin absolu si `local.properties` sert aussi à Gradle).

```properties
# local.properties (ignoré par git)
sdk.dir=~/Android/Sdk
```

```sh
npm run android:apk     # init du projet si besoin, tauri android build --apk, signature → abbon-X.Y.Z.apk
```

## Organisation du code

```
src/
  lib/domain/    modèle, score, progression, moteur de passage (session.ts) — TypeScript pur, testé
  lib/data/      interface Repository ; SQLite (Tauri) et mémoire (navigateur) ; données de démo
  lib/i18n/      messages fr / en, pluriels, formats Intl
  lib/rich/      contenu riche : éditeur TipTap, affichage sûr, coloration du code, images
  lib/interchange/  format .qcm (schémas, archive), plan d'import, GIFT
  lib/update.svelte.ts  mises à jour (Paramètres, bandeau)
  lib/session.svelte.ts  tentative ouverte à l'écran : réponses, chrono, enregistrement
  lib/exam/      examen d'un site web corrigé par le serveur (PHP)
  lib/components/
  routes/        écrans (SvelteKit en mode SPA)
modules/         sources des modules de questionnaires (Markdown + YAML)
server/          page de téléchargement PHP et .htaccess
scripts/release/ préparation du site d'une version (version.json, latest.json)
scripts/modules/ vérification, construction et catalogue des modules
scripts/site/    export d'un QCM ou d'un module en site web
src-tauri/
  migrations/    schéma SQLite versionné (ne jamais modifier une migration publiée)
  src/lib.rs     enveloppe Tauri minimale : plugin SQL + migrations
  src/batch.rs   commande run_batch : écritures groupées dans une transaction
  src/update.rs  mises à jour (plugin updater, lecture de version.json)
```

Voir [docs/architecture.md](docs/architecture.md), [docs/modules.md](docs/modules.md) (écrire un module), [docs/distribution.md](docs/distribution.md) (versions et mises à jour) et [docs/format-qcm](docs/format-qcm/README.md) (format d'échange).

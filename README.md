<p align="center"><img src="assets/abbon-icon.png" width="120" alt=""></p>

# Abbon

Application de QCM hors ligne pour s'entraîner aux certifications (informatique, langues) et à la culture générale.
Une seule base de code HTML5 / TypeScript, empaquetée avec [Tauri 2](https://v2.tauri.app) pour **Linux**, **Android** et **Windows**.

Logiciel libre sous licence [MIT](LICENSE). Le contenu des modules (dossier `modules/`) est sous licence
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr). Le rendu des formules embarque
[KaTeX](https://katex.org) (licence MIT), et leur saisie visuelle [MathLive](https://mathlive.io) (licence MIT).

> **État : lot 7 (formules et figures).** Formules LaTeX rendues par KaTeX, équations chimiques et unités
> (mhchem), figures SVG incrustées après nettoyage, qui suivent le thème clair ou sombre.
> Lot 6 quater (révision espacée) : une boîte de révision (Leitner) commune à tous les QCM : on y range
> les questions à retenir, elles reviennent à intervalles croissants. Cinq types de questions : choix unique, choix multiples, réponse courte,
> réponse numérique et texte à trous (saisie ou liste déroulante) ; suite prévue dans [docs/feuille-de-route.md](docs/feuille-de-route.md).
> Lot 6 (modules de contenu) : un module est un fichier `.qcm` versionné, installé, mis à jour et retiré
> d'un bloc, avec fiches de révision ; premier module pilote : « Anglais : verbes irréguliers »
> ([docs/modules.md](docs/modules.md)).
> Lot 5 : accessibilité vérifiée (WCAG 2.1 AA, clair et sombre), thème et taille du texte
> réglables, interface utilisable sur téléphone, installation testée en CI sur Debian, Ubuntu, Fedora, Windows et
> un émulateur Android, installateur Windows en français et en anglais.
> Lots précédents : distribution et mises à jour ([docs/distribution.md](docs/distribution.md)), échange (`.qcm`,
> GIFT, sauvegarde), édition (éditeur riche, catégories, PIN), passage des QCM.

### Accessibilité

- Navigation complète au clavier, lien « Aller au contenu », focus placé sur le contenu à chaque changement de page,
  titre de fenêtre propre à chaque écran.
- Paramètres → Affichage : thème (système, clair, sombre) et taille du texte (normale, grande, très grande).
- Animations désactivées si le système le demande (`prefers-reduced-motion`).

### Raccourcis clavier (passage d'un QCM)

| Touche | Action |
|---|---|
| `1` … `9` | Cocher / décocher la réponse correspondante |
| `Entrée` | Valider (entraînement), question suivante, ou terminer |

Dans l'éditeur : `Ctrl+S` enregistre ; dans une réponse, `Entrée` crée la réponse suivante (`Maj+Entrée` : retour à la ligne).

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
cd src-tauri && cargo test # tests Rust (migrations)
```

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
server/          page de téléchargement PHP et .htaccess
scripts/release/ préparation du site d'une version (version.json, latest.json)
  lib/session.svelte.ts  tentative ouverte à l'écran : réponses, chrono, enregistrement
  lib/components/
  routes/        écrans (SvelteKit en mode SPA)
src-tauri/
  migrations/    schéma SQLite versionné (ne jamais modifier une migration publiée)
  src/lib.rs     enveloppe Tauri minimale : plugin SQL + migrations
  src/batch.rs   commande run_batch : écritures groupées dans une transaction
  src/update.rs  mises à jour (plugin updater, lecture de version.json)
```

Voir [docs/architecture.md](docs/architecture.md).

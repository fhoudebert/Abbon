# Abbon — development

[Version française](developpement_fr.md) · [Overview](README.md)

A single HTML5 / TypeScript code base (SvelteKit, Svelte 5), packaged with [Tauri 2](https://v2.tauri.app) for
Linux, Windows, macOS and Android. Data in SQLite (app) or in memory (browser).

## Requirements

| Tool | Version |
|---|---|
| Node.js | 24 or later (CI builds with Node 26) |
| Rust | 1.90 or later (`rustup`) |
| Linux | `libwebkit2gtk-4.1-dev`, `libxdo-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev` |
| Android | Android Studio (SDK + NDK), Java 17+, Rust Android targets — see [the Tauri docs](https://v2.tauri.app/start/prerequisites/#android) |
| Windows | Microsoft C++ Build Tools; WebView2 (preinstalled on recent Windows 10 and on 11) |

On Debian / Ubuntu:

```sh
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev \
  libayatana-appindicator3-dev librsvg2-dev
```

## Development

```sh
npm install
npm run tauri dev          # desktop app (SQLite)
npm run dev                # interface only, in a browser (in-memory storage)
```

Android (device plugged in over USB, debugging enabled):

```sh
npm run tauri android init   # once
npm run tauri android dev
```

## Checks

```sh
npm run check              # TypeScript + Svelte types
npm test                   # domain, i18n, SQL (Node's SQLite) and exchange format tests
npm run schema             # regenerates the JSON Schemas published in docs/format-qcm
npm run module:check       # checks module sources (modules/ folder)
npm run module:build       # builds dist/modules/Abbon-<name>-<version>.qcm
npm run module:site        # exports a module as a website (dist/sites/), --serveur: exam graded in PHP
npm run module:catalogue -- <folder>   # index.html pages of the quiz catalogue
cd src-tauri && cargo test # Rust tests (migrations)
```

The tests of the PHP grader used by exam websites (`src/lib/exam`) run when `php` is installed (it is on the CI
machines).

Accessibility audit (axe-core, WCAG 2.1 A/AA) of every screen in WebKitGTK, the app's engine on Linux (packages
`python3-gi`, `gir1.2-webkit2-4.1`):

```sh
npm run build && npx vite preview --port 4173 &
npm run a11y                       # options: --themes dark --width 390 --shots captures/
```

Installation tests (start the app for 30 s and check that the database is created):
`scripts/smoke/linux.sh Abbon`, `scripts/smoke/windows.ps1 -Dist folder`, `scripts/smoke/android.sh app.apk`.

## Packages

```sh
npm run tauri build -- --bundles deb,rpm,appimage    # Linux
npm run tauri android build -- --apk                 # Android
npm run tauri build -- --bundles msi,nsis            # Windows (on Windows)
npm run tauri build -- --target universal-apple-darwin --bundles app,dmg   # macOS (on a Mac, with the Rust
                                                     # targets aarch64-apple-darwin and x86_64-apple-darwin)
```

### Continuous integration

- [`ci.yml`](.github/workflows/ci.yml): types, TS and Rust tests, lint, accessibility audit, on every push to any
  branch and on every pull request.
- [`build.yml`](.github/workflows/build.yml): Linux, Android, Windows and macOS packages.
  - **On demand**: *Actions* tab → *Build* → *Run workflow*, then enter the branch (or a tag, a commit) and tick
    the platforms. The packages can be downloaded from the run's *artifacts*.
    With `gh`: `gh workflow run build.yml --ref main -f ref=main -f windows=false`.
    Note: GitHub runs the workflow file of the branch chosen in "Use workflow from" (`--ref` option); the `ref`
    field only chooses the code that is compiled. To test a change to the workflow itself, choose the same branch
    in both places.
  - **On a `vX.Y.Z` tag**: all four platforms, then a draft release with SHA-256 checksums. The tag must match
    the version in `package.json`, otherwise the build stops.
  - **Installation tests** (*smoke* box, always on a tag): `.deb` on Debian 12, Debian 13 and Ubuntu 24.04, `.rpm`
    on Fedora, AppImage, NSIS installer on Windows, macOS app installed from the `.dmg`, APK on an Android 14
    emulator (screenshot as an *artifact*). They are informative: the release does not wait for them.

GitHub only shows the *Run workflow* button if the workflow exists on the repository's default branch.

### Signing the APK

The APK is distributed directly (outside the Play Store). Every version must be signed **with the same key**,
otherwise Android refuses the update. Create the key once and keep a copy off the machine:

```sh
keytool -genkeypair -v -keystore abbon.keystore -storetype PKCS12 -keyalg RSA -keysize 4096 \
  -validity 10000 -alias abbon
keytool -list -v -keystore abbon.keystore -alias abbon | grep SHA256   # certificate fingerprint
```

The script [`scripts/android/sign-apk.sh`](scripts/android/sign-apk.sh) aligns, signs and verifies the APK. It
takes the signing key from **one** of the two sources below; if both exist, the environment wins.

**On GitHub**: the secrets live in the `android-release` **environment** (Settings → Environments), which the
Android job declares. On a tag, the build fails if the key is missing; otherwise it produces a debug APK.

Two things to check if the APK comes out as debug although the secrets exist:

- **The workflow file that runs is the one from the branch chosen in "Use workflow from"** (`main` by default),
  not the one from the compiled branch. The environment declaration must therefore be on `main`.
- **Environment deployment rules** (*Deployment branches and tags*): if they are restricted, they must allow the
  `main` branch **and `v*` tags**, otherwise the Android job of a release is refused.

| `android-release` environment setting | Variable read by the script | |
|---|---|---|
| secret `ANDROID_KEYSTORE_BASE64` | `ABBON_KEYSTORE_FILE` (decoded file) | see below |
| secret `ANDROID_KEYSTORE_PASSWORD` | `ABBON_KEYSTORE_PASSWORD` | keystore password |
| secret `ANDROID_KEY_ALIAS` | `ABBON_KEY_ALIAS` | default `abbon` |
| secret `ANDROID_KEY_PASSWORD` | `ABBON_KEY_PASSWORD` | default: the keystore's (PKCS12 rule) |
| variable `ANDROID_CERT_SHA256` | `ABBON_CERT_SHA256` | optional: the build fails if the key is not the right one |

Value of the `ANDROID_KEYSTORE_BASE64` secret, without going through a file (which would end up committed):

```sh
base64 -w0 abbon.keystore | gh secret set ANDROID_KEYSTORE_BASE64 --env android-release   # Linux
base64 -i abbon.keystore | gh secret set ANDROID_KEYSTORE_BASE64 --env android-release    # macOS
base64 -w0 abbon.keystore | xclip -selection clipboard    # or copy, then paste in the GitHub page
```

On Windows (PowerShell):
`[Convert]::ToBase64String([IO.File]::ReadAllBytes("abbon.keystore")) | Set-Clipboard`.

**On your machine**: put `abbon.keystore` and `keystore.properties` at the root of the repository. Both files are
**ignored by git** (`git check-ignore -v keystore.properties abbon.keystore`), and the script refuses to sign if
they are tracked.

```properties
# keystore.properties — path relative to this file, or absolute
storeFile=abbon.keystore
storePassword=…
keyAlias=abbon
keyPassword=…
```

SDK, NDK and Java: the Tauri CLI **does not read** `local.properties`; it needs `ANDROID_HOME` and `NDK_HOME`.
[`scripts/android/env.sh`](scripts/android/env.sh) works them out: environment variables, otherwise `sdk.dir`
(and `ndk.dir`) from a `local.properties` at the root of the repository, otherwise `~/Android/Sdk`; the most recent
NDK in `<SDK>/ndk/`; Android Studio's JDK if no Java is installed. `~` and `$HOME` are accepted there (Gradle does
not expand them: write an absolute path if `local.properties` is also used by Gradle).

```properties
# local.properties (ignored by git)
sdk.dir=~/Android/Sdk
```

```sh
npm run android:apk     # project init if needed, tauri android build --apk, signing → abbon-X.Y.Z.apk
```

## Code layout

```
src/
  lib/domain/    model, scoring, progress, quiz engine (session.ts) — pure TypeScript, tested
  lib/data/      Repository interface; SQLite (Tauri) and memory (browser); demo data
  lib/i18n/      fr / en messages, plurals, Intl formats
  lib/rich/      rich content: TipTap editor, safe rendering, code highlighting, images
  lib/interchange/  .qcm format (schemas, archive), import plan, GIFT
  lib/update.svelte.ts  updates (Settings, banner)
  lib/session.svelte.ts  attempt on screen: answers, timer, saving
  lib/exam/      website exam graded by the server (PHP)
  lib/components/
  routes/        screens (SvelteKit in SPA mode)
modules/         quiz module sources (Markdown + YAML)
server/          PHP download page and .htaccess
scripts/release/ release website files (version.json, latest.json)
scripts/modules/ checking, building and cataloguing modules
scripts/site/    exporting a quiz or a module as a website
src-tauri/
  migrations/    versioned SQLite schema (never modify a published migration)
  src/lib.rs     minimal Tauri wrapper: SQL plugin + migrations
  src/batch.rs   run_batch command: grouped writes in a transaction
  src/update.rs  updates (updater plugin, reading version.json)
```

See [docs/architecture.md](docs/architecture.md), [docs/modules.md](docs/modules.md) (writing a module),
[docs/distribution.md](docs/distribution.md) (versions and updates) and [docs/format-qcm](docs/format-qcm/README.md)
(exchange format); these documents are in French.

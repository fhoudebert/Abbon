#!/usr/bin/env bash
# Construit et signe l'APK de release d'Abbon sur le poste (npm run android:apk).
#
# SDK, NDK et Java : voir scripts/android/env.sh (ANDROID_HOME, ou sdk.dir dans local.properties).
# Signature : voir scripts/android/sign-apk.sh (keystore.properties + abbon.keystore à la racine).
# Les arguments sont passés à « tauri android build » (ex. --target aarch64 pour un seul ABI).
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
cd "$root"
# shellcheck source=env.sh
source scripts/android/env.sh

echo "SDK  : $ANDROID_HOME"
echo "NDK  : ${NDK_HOME:-absent, à installer avec le SDK Manager}"
echo "Java : ${JAVA_HOME:-$(command -v java || echo absent)}"
[ -n "${NDK_HOME:-}" ] || exit 1

# Le projet Gradle (src-tauri/gen/android) est généré, pas versionné.
[ -d src-tauri/gen/android ] || npx tauri android init

npx tauri android build --apk "$@"
bash scripts/android/sign-apk.sh

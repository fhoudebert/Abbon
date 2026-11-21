#!/usr/bin/env bash
# Aligne et signe l'APK de release d'Abbon, sur le poste comme dans le CI.
#
# La signature vient d'UNE des deux sources suivantes (si les deux existent, l'environnement l'emporte) :
#
#   1. les variables d'environnement — c'est ce que fait le CI :
#        ABBON_KEYSTORE_FILE      chemin du keystore (absolu, ou relatif à la racine du dépôt)
#        ABBON_KEYSTORE_PASSWORD  mot de passe du magasin
#        ABBON_KEY_ALIAS          alias de la clé (défaut : abbon)
#        ABBON_KEY_PASSWORD       mot de passe de la clé (défaut : celui du magasin, règle du PKCS12)
#
#   2. à défaut, keystore.properties à la racine du dépôt (IGNORÉ par git), au format habituel :
#        storeFile=abbon.keystore      relatif au dossier de keystore.properties, ou absolu
#        storePassword=…
#        keyAlias=abbon
#        keyPassword=…
#      (ABBON_KEYSTORE_PROPERTIES désigne un autre fichier.)
#
# Facultatif : ABBON_CERT_SHA256 = empreinte SHA-256 attendue du certificat ; le script échoue si
# l'APK est signé par une autre clé (Android refuserait alors les mises à jour).
#
# Usage : scripts/android/sign-apk.sh [APK non signé] [APK signé]
#   par défaut : l'APK *release-unsigned.apk produit par « tauri android build --apk »,
#   et abbon-<version>.apk à la racine du dépôt.
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
die() { echo "sign-apk : $*" >&2; exit 1; }

# --- APK d'entrée et de sortie ------------------------------------------------------------------
in=${1:-}
if [ -z "$in" ]; then
  in=$(find "$root/src-tauri/gen/android/app/build/outputs/apk" -name '*release-unsigned.apk' 2>/dev/null | head -1 || true)
  [ -n "$in" ] || die "aucun APK *release-unsigned.apk : lancer d'abord « npm run tauri android build -- --apk »."
fi
[ -f "$in" ] || die "APK introuvable : $in"
version=$(node -p "require('$root/package.json').version" 2>/dev/null || echo dev)
out=${2:-"$root/abbon-$version.apk"}

# --- Source de la signature ---------------------------------------------------------------------
props=${ABBON_KEYSTORE_PROPERTIES:-"$root/keystore.properties"}

# Lit une clé d'un fichier .properties (« clé=valeur » ou « clé: valeur », # et ! en commentaire).
prop() {
  sed -n -E "s/^[[:space:]]*$1[[:space:]]*[=:][[:space:]]*//p" "$props" | tail -1 | sed -E 's/\r$//'
}

if [ -n "${ABBON_KEYSTORE_FILE:-}" ]; then
  source_name='variables ABBON_*'
  ks=$ABBON_KEYSTORE_FILE
  case "$ks" in /*) ;; *) ks="$root/$ks" ;; esac
  ks_pass=${ABBON_KEYSTORE_PASSWORD:-}
  alias=${ABBON_KEY_ALIAS:-}
  key_pass=${ABBON_KEY_PASSWORD:-}
elif [ -f "$props" ]; then
  source_name=$(basename "$props")
  ks=$(prop storeFile)
  ks=${ks:-abbon.keystore}
  case "$ks" in /*) ;; *) ks="$(cd "$(dirname "$props")" && pwd)/$ks" ;; esac
  ks_pass=$(prop storePassword)
  alias=$(prop keyAlias)
  key_pass=$(prop keyPassword)
else
  die "ni ABBON_KEYSTORE_FILE ni $props : impossible de signer. Voir docs/distribution.md (Signature de l'APK)."
fi
alias=${alias:-abbon}
key_pass=${key_pass:-$ks_pass}
[ -f "$ks" ] || die "$source_name désigne le keystore $ks, qui n'existe pas."
[ -n "$ks_pass" ] || die "$source_name : mot de passe du magasin absent (ABBON_KEYSTORE_PASSWORD ou storePassword)."

# Un keystore suivi par git finirait publié avec le dépôt.
for f in "$ks" "$props"; do
  if [ -f "$f" ] && git -C "$root" ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    die "$f est suivi par git : le retirer (git rm --cached) et changer les mots de passe avant de signer."
  fi
done

# --- Outils du SDK Android ----------------------------------------------------------------------
# ANDROID_HOME, sinon sdk.dir de local.properties, sinon ~/Android/Sdk ; à défaut, outils du PATH.
# shellcheck source=env.sh
source "$root/scripts/android/env.sh" 2>/dev/null || true
sdk=${ANDROID_HOME:-}
bt=
if [ -n "$sdk" ] && [ -d "$sdk/build-tools" ]; then
  bt=$(ls -d "$sdk"/build-tools/* 2>/dev/null | sort -V | tail -1)
fi
tool() { if [ -n "$bt" ] && [ -x "$bt/$1" ]; then echo "$bt/$1"; else command -v "$1" || die "$1 introuvable (build-tools du SDK Android)."; fi; }
zipalign=$(tool zipalign)
apksigner=$(tool apksigner)

# --- Alignement, signature, vérification ---------------------------------------------------------
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
"$zipalign" -f -p 4 "$in" "$tmp/aligned.apk"

# Mots de passe passés par l'environnement (« env: »), jamais sur la ligne de commande.
export ABBON_SIGN_KS_PASS=$ks_pass ABBON_SIGN_KEY_PASS=$key_pass
extra=()
[ -n "${ABBON_MIN_SDK:-}" ] && extra=(--min-sdk-version "$ABBON_MIN_SDK")
if ! "$apksigner" sign --ks "$ks" --ks-key-alias "$alias" \
  --ks-pass env:ABBON_SIGN_KS_PASS --key-pass env:ABBON_SIGN_KEY_PASS \
  "${extra[@]}" --out "$out" "$tmp/aligned.apk" 2> "$tmp/err.txt"; then
  grep -m1 -E 'Exception|ERROR' "$tmp/err.txt" >&2 || tail -3 "$tmp/err.txt" >&2
  die "signature refusée : mot de passe ou alias (« $alias ») incorrect pour $(basename "$ks") ?"
fi
unset ABBON_SIGN_KS_PASS ABBON_SIGN_KEY_PASS
rm -f "$out.idsig"

"$apksigner" verify "${extra[@]}" --print-certs "$out" > "$tmp/certs.txt"
got=$(sed -n 's/^Signer #1 certificate SHA-256 digest: //p' "$tmp/certs.txt")
if [ -n "${ABBON_CERT_SHA256:-}" ]; then
  want=$(echo "$ABBON_CERT_SHA256" | tr -d ': ' | tr 'A-F' 'a-f')
  if [ "$got" != "$want" ]; then
    rm -f "$out"
    die "certificat inattendu $got (attendu $want) : mauvais keystore, les mises à jour seraient refusées."
  fi
fi
echo "APK signé : $out"
echo "  clé « $alias » de $(basename "$ks") (via $source_name), certificat SHA-256 $got"

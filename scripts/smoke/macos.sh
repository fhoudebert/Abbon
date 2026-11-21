#!/usr/bin/env bash
# Test de lancement d'Abbon sous macOS (CI) : l'application, copiée depuis l'image disque,
# doit tourner 30 s sans s'arrêter et avoir créé sa base SQLite (preuve que l'interface
# s'est chargée et que les migrations ont tourné).
#
# Usage : scripts/smoke/macos.sh <fichier .dmg>    (le premier, si plusieurs sont donnés)
set -euo pipefail

dmg="$1"
mnt="$(mktemp -d)"
apps="$(mktemp -d)"
log="$(mktemp)"
db="$HOME/Library/Application Support/org.abbon.app/abbon.db"
rm -f "$db"

hdiutil attach -nobrowse -readonly -mountpoint "$mnt" "$dmg" >/dev/null
cp -R "$mnt"/*.app "$apps"/
hdiutil detach "$mnt" >/dev/null
found=("$apps"/*.app)
app="${found[0]}"
echo "Application : $app ($(lipo -archs "$app/Contents/MacOS/Abbon"))"

"$app/Contents/MacOS/Abbon" >"$log" 2>&1 &
pid=$!
sleep 30
if ! kill -0 "$pid" 2>/dev/null; then
  wait "$pid" && code=0 || code=$?
  echo "::error::Abbon s'est arrêté avant 30 s (code $code)"
  cat "$log"
  exit 1
fi
kill "$pid" 2>/dev/null || true
wait "$pid" 2>/dev/null || true

if [ ! -s "$db" ]; then
  echo "::error::base non créée ($db) : l'interface ne s'est pas chargée"
  cat "$log"
  exit 1
fi
echo "OK : Abbon tourne et a créé sa base ($(stat -f%z "$db") octets)"

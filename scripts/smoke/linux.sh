#!/usr/bin/env bash
# Test de lancement d'Abbon sous Linux (CI) : l'application doit tourner 30 s sans s'arrêter
# et avoir créé sa base SQLite (preuve que l'interface s'est chargée et que les migrations ont tourné).
#
# Usage : scripts/smoke/linux.sh <commande de lancement…>    (xvfb-run requis)
set -euo pipefail

# Conteneur lancé en root, sans GPU : pas de bac à sable WebKit, rendu logiciel.
export WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1 WEBKIT_DISABLE_COMPOSITING_MODE=1 LIBGL_ALWAYS_SOFTWARE=1
XDG_CONFIG_HOME="$(mktemp -d)"
XDG_DATA_HOME="$(mktemp -d)"
export XDG_CONFIG_HOME XDG_DATA_HOME
log="$(mktemp)"

set +e
xvfb-run -a timeout 30 "$@" >"$log" 2>&1
code=$?
set -e

db="$XDG_CONFIG_HOME/org.abbon.app/abbon.db"
if [ "$code" -ne 124 ]; then
  echo "::error::Abbon s'est arrêté avant 30 s (code $code)"
  cat "$log"
  exit 1
fi
if [ ! -s "$db" ]; then
  echo "::error::base non créée ($db) : l'interface ne s'est pas chargée"
  cat "$log"
  exit 1
fi
echo "OK : Abbon tourne et a créé sa base ($(stat -c%s "$db") octets)"

#!/usr/bin/env bash
# Test d'installation d'Abbon sur un émulateur Android (CI) : installation de l'APK, lancement,
# l'application doit encore tourner après 40 s, sans plantage dans le journal ; capture d'écran.
#
# Usage : scripts/smoke/android.sh <fichier.apk>     (adb connecté à l'émulateur)
set -euo pipefail
APK="$1"
PKG=org.abbon.app

adb wait-for-device
adb install -r "$APK"
adb logcat -c
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 40

adb exec-out screencap -p > android-smoke.png || true
if ! adb shell pidof "$PKG" >/dev/null; then
  echo "::error::Abbon ne tourne plus après 40 s"
  adb logcat -d | tail -200
  exit 1
fi
if adb logcat -d | grep -E "FATAL EXCEPTION|Fatal signal" ; then
  echo "::error::plantage dans le journal"
  adb logcat -d | tail -200
  exit 1
fi
# APK de debug : on peut vérifier que la base a été créée (preuve que l'interface s'est chargée).
if adb shell run-as "$PKG" true 2>/dev/null; then
  if ! adb shell run-as "$PKG" find . -name abbon.db | grep -q abbon.db; then
    echo "::error::base non créée : l'interface ne s'est pas chargée"
    adb logcat -d | grep -iE "abbon|tauri|chromium" | tail -100
    exit 1
  fi
  echo "OK : base créée"
fi
echo "OK : Abbon tourne sur l'émulateur"

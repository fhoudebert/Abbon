# Localise le SDK, le NDK et Java pour les scripts Android d'Abbon (à « sourcer », pas à exécuter).
#
# Le CLI Tauri ne lit PAS local.properties : il exige ANDROID_HOME et NDK_HOME dans l'environnement.
# Ce fichier les déduit, dans cet ordre :
#
#   SDK : ANDROID_HOME, ANDROID_SDK_ROOT, sdk.dir de local.properties (racine du dépôt, puis
#         src-tauri/gen/android), ~/Android/Sdk (emplacement par défaut d'Android Studio sous Linux).
#   NDK : NDK_HOME, ndk.dir de local.properties, puis la version la plus récente de <SDK>/ndk/.
#   Java : JAVA_HOME ou java dans le PATH, sinon le JDK fourni avec Android Studio (jbr).
#
# Dans local.properties, « ~ » et « $HOME » sont acceptés ici (Gradle, lui, ne les développe pas).

_abbon_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

# Valeur d'une clé dans le premier local.properties qui la contient, « ~ » et « $HOME » développés.
_abbon_local_prop() {
  local f v
  for f in "$_abbon_root/local.properties" "$_abbon_root/src-tauri/gen/android/local.properties"; do
    [ -f "$f" ] || continue
    v=$(sed -n -E "s/^[[:space:]]*$1[[:space:]]*[=:][[:space:]]*//p" "$f" | tail -1 | sed -E 's/\r$//; s/[[:space:]]+$//')
    [ -n "$v" ] || continue
    v=${v//\\:/:}          # échappements Java (C\:\\…) éventuels
    v=${v//\\\\/\\}
    case "$v" in "~"*) v="$HOME${v:1}" ;; esac
    v=${v//\$HOME/$HOME}
    v=${v//\$\{HOME\}/$HOME}
    echo "$v"
    return 0
  done
  return 1
}

if [ -z "${ANDROID_HOME:-}" ]; then
  ANDROID_HOME=${ANDROID_SDK_ROOT:-$(_abbon_local_prop sdk.dir || true)}
  ANDROID_HOME=${ANDROID_HOME:-$HOME/Android/Sdk}
fi
if [ ! -d "$ANDROID_HOME" ]; then
  echo "SDK Android introuvable : $ANDROID_HOME" >&2
  echo "  Définir ANDROID_HOME, ou sdk.dir=/chemin/du/Sdk dans local.properties à la racine du dépôt." >&2
  return 1 2>/dev/null || exit 1
fi
export ANDROID_HOME ANDROID_SDK_ROOT=$ANDROID_HOME

if [ -z "${NDK_HOME:-}" ]; then
  NDK_HOME=$(_abbon_local_prop ndk.dir || true)
  if [ -z "$NDK_HOME" ] && [ -d "$ANDROID_HOME/ndk" ]; then
    NDK_HOME=$(ls -d "$ANDROID_HOME"/ndk/*/ 2>/dev/null | sort -V | tail -1)
    NDK_HOME=${NDK_HOME%/}
  fi
fi
[ -n "$NDK_HOME" ] && export NDK_HOME

if [ -z "${JAVA_HOME:-}" ] && ! command -v java >/dev/null 2>&1; then
  for _abbon_jbr in "$HOME/android-studio/jbr" /opt/android-studio/jbr /usr/local/android-studio/jbr \
      /snap/android-studio/current/jbr "/Applications/Android Studio.app/Contents/jbr/Contents/Home"; do
    if [ -x "$_abbon_jbr/bin/java" ]; then export JAVA_HOME=$_abbon_jbr; break; fi
  done
fi

unset -f _abbon_local_prop
unset _abbon_jbr

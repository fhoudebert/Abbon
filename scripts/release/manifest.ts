/**
 * Manifestes de release (fonctions pures, testées) :
 * - version.json : description de la version pour la page de téléchargement et l'application
 *   (Android notamment) ;
 * - latest.json : format du plugin updater de Tauri (Linux, Windows, macOS), fichiers signés.
 */

export interface Artifact {
  name: string;
  size: number;
  sha256: string;
  /** Contenu du fichier .sig produit par `tauri build` (mises à jour). */
  signature?: string;
}

export type Arch = 'x86_64' | 'aarch64' | 'universal';

export interface Kind {
  platform: 'linux' | 'windows' | 'android' | 'macos';
  /** app : archive .app.tar.gz de l'application macOS, pour les mises à jour automatiques. */
  kind: 'appimage' | 'deb' | 'rpm' | 'nsis' | 'msi' | 'apk' | 'dmg' | 'app';
  /**
   * Processeur : x86_64 (Intel, AMD) ou aarch64 (ARM64), d'après le nom donné par Tauri (amd64, x64,
   * x86_64 ; arm64, aarch64). universal : application macOS (Apple silicon et Intel) et APK Android.
   */
  arch: Arch;
}

const KINDS: [string, Kind['platform'], Kind['kind']][] = [
  ['.appimage', 'linux', 'appimage'],
  ['.deb', 'linux', 'deb'],
  ['.rpm', 'linux', 'rpm'],
  ['.msi', 'windows', 'msi'],
  ['.exe', 'windows', 'nsis'],
  ['.apk', 'android', 'apk'],
  ['.dmg', 'macos', 'dmg'],
  ['.app.tar.gz', 'macos', 'app'],
];

/** Reconnaît le type de fichier d'après son nom ; null pour les autres (ex. SHA256SUMS.txt). */
export function classify(name: string): Kind | null {
  const n = name.toLowerCase();
  const found = KINDS.find(([ext]) => n.endsWith(ext));
  if (!found) return null;
  const [, platform, kind] = found;
  if (platform === 'macos' || platform === 'android') return { platform, kind, arch: 'universal' };
  // Sans indication (anciens noms) : x86_64, la seule architecture publiée avant ARM64.
  const arch: Arch = /(^|[^a-z0-9])(arm64|aarch64)([^a-z0-9]|$)/.test(n) ? 'aarch64' : 'x86_64';
  return { platform, kind, arch };
}

/** x86_64 d'abord : les versions d'Abbon antérieures à ARM64 proposent le premier fichier de leur système. */
const ARCH_RANK: Record<Arch, number> = { universal: 0, x86_64: 0, aarch64: 1 };

/** Notes d'une version dans CHANGELOG.md : section « ## X.Y.Z », sous-sections « ### fr », « ### en ». */
export function notesFromChangelog(markdown: string, version: string): Record<string, string> {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((l) => new RegExp(`^##\\s+\\[?v?${version.replace(/\./g, '\\.')}\\]?(\\s|$)`).test(l));
  if (start === -1) return {};
  const notes: Record<string, string[]> = {};
  let lang: string | null = null;
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    const h = /^###\s+([a-z]{2})\b/i.exec(line);
    if (h) {
      lang = h[1].toLowerCase();
      notes[lang] = [];
    } else if (lang) notes[lang].push(line);
  }
  return Object.fromEntries(
    Object.entries(notes)
      .map(([l, ls]) => [l, ls.join('\n').trim()])
      .filter(([, text]) => text),
  );
}

export function buildVersionJson(version: string, date: string, notes: Record<string, string>, artifacts: Artifact[]) {
  return {
    format: 'abbon-release',
    formatVersion: 1,
    version,
    date,
    notes,
    files: artifacts
      .flatMap((a) => {
        const k = classify(a.name);
        return k ? [{ platform: k.platform, kind: k.kind, arch: k.arch, name: a.name, size: a.size, sha256: a.sha256 }] : [];
      })
      .sort((x, y) => ARCH_RANK[x.arch] - ARCH_RANK[y.arch]),
  };
}

/**
 * latest.json du plugin updater. Clés « os-arch-type » (le plugin les cherche en premier), plus
 * « linux-<arch> », « windows-<arch> » et « darwin-<arch> » par défaut (arch : x86_64, aarch64). Seuls les fichiers signés y
 * figurent. L'application macOS est universelle : la même archive sert Apple silicon et Intel.
 * `baseUrl` : adresse du site (fichiers dans `releases/`), ou fonction donnant l'adresse de chaque fichier
 * (release GitHub : `…/releases/download/vX.Y.Z/<nom>`).
 */
export function buildLatestJson(
  version: string,
  date: string,
  notes: string,
  baseUrl: string | ((name: string) => string),
  artifacts: Artifact[],
) {
  const urlFor =
    typeof baseUrl === 'function'
      ? baseUrl
      : (name: string) => `${baseUrl.replace(/\/+$/, '')}/releases/${encodeURIComponent(name)}`;
  const platforms: Record<string, { signature: string; url: string }> = {};
  for (const a of artifacts) {
    const k = classify(a.name);
    if (!k || !a.signature) continue;
    const entry = { signature: a.signature.trim(), url: urlFor(a.name) };
    if (k.platform === 'linux' || k.platform === 'windows') platforms[`${k.platform}-${k.arch}-${k.kind}`] = entry;
    else if (k.platform === 'macos' && k.kind === 'app')
      for (const arch of ['aarch64', 'x86_64']) platforms[`darwin-${arch}-app`] = platforms[`darwin-${arch}`] = entry;
  }
  // Valeurs par défaut quand le type d'installation n'est pas connu.
  for (const arch of ['x86_64', 'aarch64']) {
    const linux = platforms[`linux-${arch}-appimage`];
    if (linux) platforms[`linux-${arch}`] = linux;
    const win = platforms[`windows-${arch}-nsis`] ?? platforms[`windows-${arch}-msi`];
    if (win) platforms[`windows-${arch}`] = win;
  }
  return { version, notes, pub_date: date, platforms };
}

/** Contenu de SHA256SUMS.txt (format de `sha256sum`). */
export const sha256sums = (artifacts: Artifact[]) =>
  artifacts.map((a) => `${a.sha256}  ${a.name}`).join('\n') + '\n';

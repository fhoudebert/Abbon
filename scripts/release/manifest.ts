/**
 * Manifestes de release (fonctions pures, testées) :
 * - version.json : description de la version pour la page de téléchargement et l'application
 *   (Android notamment) ;
 * - latest.json : format du plugin updater de Tauri (Linux, Windows), fichiers signés.
 */

export interface Artifact {
  name: string;
  size: number;
  sha256: string;
  /** Contenu du fichier .sig produit par `tauri build` (mises à jour). */
  signature?: string;
}

export interface Kind {
  platform: 'linux' | 'windows' | 'android' | 'macos';
  kind: 'appimage' | 'deb' | 'rpm' | 'nsis' | 'msi' | 'apk' | 'dmg';
}

/** Reconnaît le type de fichier d'après son nom ; null pour les autres (ex. SHA256SUMS.txt). */
export function classify(name: string): Kind | null {
  const n = name.toLowerCase();
  if (n.endsWith('.appimage')) return { platform: 'linux', kind: 'appimage' };
  if (n.endsWith('.deb')) return { platform: 'linux', kind: 'deb' };
  if (n.endsWith('.rpm')) return { platform: 'linux', kind: 'rpm' };
  if (n.endsWith('.msi')) return { platform: 'windows', kind: 'msi' };
  if (n.endsWith('.exe')) return { platform: 'windows', kind: 'nsis' };
  if (n.endsWith('.apk')) return { platform: 'android', kind: 'apk' };
  if (n.endsWith('.dmg')) return { platform: 'macos', kind: 'dmg' };
  return null;
}

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
    files: artifacts.flatMap((a) => {
      const k = classify(a.name);
      return k ? [{ platform: k.platform, kind: k.kind, name: a.name, size: a.size, sha256: a.sha256 }] : [];
    }),
  };
}

/**
 * latest.json du plugin updater. Clés « os-arch-type » (le plugin les cherche en premier), plus
 * « linux-x86_64 » et « windows-x86_64 » par défaut. Seuls les fichiers signés y figurent.
 */
export function buildLatestJson(
  version: string,
  date: string,
  notes: string,
  baseUrl: string,
  artifacts: Artifact[],
) {
  const base = baseUrl.replace(/\/+$/, '');
  const platforms: Record<string, { signature: string; url: string }> = {};
  for (const a of artifacts) {
    const k = classify(a.name);
    if (!k || !a.signature || (k.platform !== 'linux' && k.platform !== 'windows')) continue;
    const entry = { signature: a.signature.trim(), url: `${base}/releases/${encodeURIComponent(a.name)}` };
    platforms[`${k.platform}-x86_64-${k.kind}`] = entry;
  }
  // Valeurs par défaut quand le type d'installation n'est pas connu.
  if (platforms['linux-x86_64-appimage']) platforms['linux-x86_64'] = platforms['linux-x86_64-appimage'];
  const win = platforms['windows-x86_64-nsis'] ?? platforms['windows-x86_64-msi'];
  if (win) platforms['windows-x86_64'] = win;
  return { version, notes, pub_date: date, platforms };
}

/** Contenu de SHA256SUMS.txt (format de `sha256sum`). */
export const sha256sums = (artifacts: Artifact[]) =>
  artifacts.map((a) => `${a.sha256}  ${a.name}`).join('\n') + '\n';

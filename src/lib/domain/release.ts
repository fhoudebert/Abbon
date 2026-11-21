/**
 * Versions et description d'une release (`releases/version.json` sur le serveur).
 * Le fichier est produit par la CI (scripts/release) ; il est lu ici comme une donnée non fiable.
 */
import { z } from 'zod';

/** Compare deux versions « X.Y.Z » (suffixe -beta… : antérieur à la version finale). */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [main, pre = ''] = v.trim().replace(/^v/, '').split('-', 2);
    const nums = main.split('.').map((n) => Number.parseInt(n, 10) || 0);
    while (nums.length < 3) nums.push(0);
    return { nums, pre };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) if (x.nums[i] !== y.nums[i]) return x.nums[i] < y.nums[i] ? -1 : 1;
  if (x.pre === y.pre) return 0;
  if (!x.pre) return 1;
  if (!y.pre) return -1;
  return x.pre < y.pre ? -1 : 1;
}

export const isNewer = (candidate: string, current: string) => compareVersions(candidate, current) > 0;

const ReleaseFileSchema = z.object({
  platform: z.enum(['linux', 'windows', 'android', 'macos']),
  kind: z.string().max(20),
  name: z.string().regex(/^[\w.+-]{1,200}$/, 'nom de fichier invalide'),
  size: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});

export const ReleaseSchema = z.object({
  format: z.literal('abbon-release'),
  formatVersion: z.number().int().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[\w.]+)?$/),
  date: z.string().max(40),
  notes: z.record(z.string().max(10), z.string().max(5000)).default({}),
  files: z.array(ReleaseFileSchema).max(50),
});

export type Release = z.infer<typeof ReleaseSchema>;
export type ReleaseFile = z.infer<typeof ReleaseFileSchema>;

/** Valide le contenu de version.json ; null s'il est inutilisable. */
export function parseRelease(raw: unknown): Release | null {
  const r = ReleaseSchema.safeParse(raw);
  return r.success ? r.data : null;
}

/** Fichier à proposer pour une plateforme (Android : l'APK). */
export function downloadFor(release: Release, platform: string): ReleaseFile | undefined {
  const order: Record<string, string[]> = {
    android: ['apk'],
    windows: ['nsis', 'msi'],
    linux: ['appimage', 'deb', 'rpm'],
    macos: ['dmg'],
  };
  const files = release.files.filter((f) => f.platform === platform);
  for (const kind of order[platform] ?? []) {
    const f = files.find((x) => x.kind === kind);
    if (f) return f;
  }
  return files[0];
}

/**
 * Dépôt GitHub désigné par l'adresse du serveur : « https://github.com/propriétaire/dépôt », éventuellement
 * suivie de « /releases ». Les fichiers sont alors pris dans la dernière release publiée. Même règle que côté Rust.
 */
export function githubRepo(server: string): string | null {
  try {
    const u = new URL(server.trim());
    if (u.protocol !== 'https:' || u.hostname !== 'github.com') return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length === 3 && parts[2] === 'releases') parts.pop();
    return parts.length === 2 ? `https://github.com/${parts[0]}/${parts[1]}` : null;
  } catch {
    return null;
  }
}

/** Adresse d'un fichier publié : dossier releases/ du site, ou dernière release GitHub. */
export function releaseFileUrl(server: string, name: string): string {
  const gh = githubRepo(server);
  if (gh) return `${gh}/releases/latest/download/${encodeURIComponent(name)}`;
  return `${server.trim().replace(/\/+$/, '')}/releases/${encodeURIComponent(name)}`;
}

/** Adresse publique d'un fichier de la release. */
export const releaseUrl = (server: string, file: ReleaseFile) => releaseFileUrl(server, file.name);

/** Page de téléchargement : le site, ou la page des releases GitHub. */
export function downloadPage(server: string): string {
  const gh = githubRepo(server);
  return gh ? `${gh}/releases` : server.trim();
}

/** Adresse du serveur acceptée : HTTPS (HTTP seulement pour localhost, tests). Même règle que côté Rust. */
export function isValidServer(input: string): boolean {
  try {
    const u = new URL(input.trim());
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
    return (u.protocol === 'https:' || (u.protocol === 'http:' && local)) && !u.search && !u.hash && !u.username;
  } catch {
    return false;
  }
}

/** Notes de version dans la langue voulue (sinon anglais, sinon la première). */
export const releaseNotes = (r: Release, lang: string) => r.notes[lang] ?? r.notes.en ?? Object.values(r.notes)[0] ?? '';

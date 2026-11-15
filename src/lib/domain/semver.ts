/**
 * Versions SemVer des modules (« 1.2.3 »), sans dépendance.
 * Les pré-versions (« 1.0.0-rc.1 ») sont acceptées et classées avant la version finale.
 */
export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  pre: string;
}

const RE = /^(\d{1,4})\.(\d{1,4})\.(\d{1,4})(?:-([0-9A-Za-z.-]{1,40}))?$/;

export function parseSemver(v: string): SemVer | null {
  const m = RE.exec(v.trim());
  return m ? { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ?? '' } : null;
}

export const isSemver = (v: string) => parseSemver(v) !== null;

/** < 0 si a précède b, 0 si égales, > 0 sinon. Une version illisible précède toutes les autres. */
export function compareSemver(a: string, b: string): number {
  const x = parseSemver(a);
  const y = parseSemver(b);
  if (!x || !y) return x ? 1 : y ? -1 : 0;
  for (const k of ['major', 'minor', 'patch'] as const) if (x[k] !== y[k]) return x[k] - y[k];
  if (x.pre === y.pre) return 0;
  if (!x.pre) return 1; // la version finale suit ses pré-versions
  if (!y.pre) return -1;
  return x.pre.localeCompare(y.pre, 'en', { numeric: true });
}

/** Condition du type « >=0.2.0 » (seul opérateur reconnu ; une version seule vaut « >= »). */
export function satisfiesMin(version: string, range: string): boolean {
  const min = range.trim().replace(/^>=\s*/, '');
  if (!isSemver(min)) return false;
  // La pré-version d'une version suffisante suffit (0.2.0-beta satisfait >=0.2.0) : on compare sans elle.
  return compareSemver(version.replace(/-.*$/, ''), min) >= 0;
}

/**
 * Version entière d'un QCM de module, déduite de la version du module : 1.2.3 → 1 002 003.
 * Une version d'Abbon qui ne connaît pas les modules remplace ainsi correctement un QCM plus ancien.
 */
export function quizVersionOf(version: string): number {
  const v = parseSemver(version);
  if (!v) return 1;
  return Math.max(1, v.major * 1_000_000 + Math.min(v.minor, 999) * 1000 + Math.min(v.patch, 999));
}

/**
 * Site web exporté (lecteur autonome pour hébergement mutualisé).
 *
 * La même interface est construite une seconde fois avec `vite build --mode site` : routage par fragment
 * (`#/quiz/…`), chemins relatifs, sans administration. Les contenus arrivent par `donnees.js`, qui définit
 * `window.ABBON_SITE` avant le chargement de l'application ; la progression du visiteur reste dans son
 * navigateur (stockage local). `reglages.js`, facultatif et modifiable à la main après l'export, définit
 * `window.ABBON_SITE_SETTINGS` : modes proposés et corrigé de l'examen. Voir docs/architecture.md, « Export en site web ».
 */

/** Vrai dans la construction du site web, faux dans l'application. */
export const SITE: boolean = __SITE__;

/** Lien interne : `#/chemin` dans le site (routage par fragment), `/chemin` dans l'application. */
export const to = (path: string) => (SITE ? `#${path}` : path);

/** Contenu de `donnees.js`. */
export interface SiteData {
  format: 'abbon-site';
  version: 1;
  /** Identifiant stable du site : clé de la progression dans le navigateur. */
  id: string;
  title: string;
  /** Modes proposés (absent dans les premiers exports : voir `examOnly`). */
  modes?: SiteModes;
  /** Examen : corrigé à la fin, ou jamais. */
  solutions?: SiteSolutions;
  /** Premiers exports : examen seulement. */
  examOnly?: boolean;
  /** Archive .qcm (module ou sauvegarde sans historique), en base 64. */
  package: string;
}

export function isSiteData(v: unknown): v is SiteData {
  const d = v as Partial<SiteData> | null;
  return !!d && d.format === 'abbon-site' && d.version === 1 && typeof d.id === 'string' && typeof d.package === 'string';
}

/** Données du site (absentes dans l'application ou si `donnees.js` manque). */
export function siteData(): SiteData | null {
  if (!SITE || typeof window === 'undefined') return null;
  const d = (window as { ABBON_SITE?: unknown }).ABBON_SITE;
  return isSiteData(d) ? d : null;
}

/** Modes proposés : entraînement et examen, entraînement seulement (avec la boîte de révision), examen seulement. */
export type SiteModes = 'both' | 'training' | 'exam';
export type SiteSolutions = 'end' | 'never';

/** Réglages effectifs du site. */
export interface SiteSettings {
  modes: SiteModes;
  solutions: SiteSolutions;
}

/** Valeurs acceptées dans `reglages.js` (en français, pour une modification à la main) et en interne. */
const MODE_NAMES: Record<string, SiteModes> = {
  'les-deux': 'both',
  both: 'both',
  entrainement: 'training',
  entraînement: 'training',
  training: 'training',
  examen: 'exam',
  exam: 'exam',
};
const SOLUTION_NAMES: Record<string, SiteSolutions> = { fin: 'end', end: 'end', jamais: 'never', never: 'never' };

/**
 * Réglages du site : ceux de `reglages.js` s'ils sont lisibles, sinon ceux choisis à l'export.
 * Une valeur inconnue est ignorée (la valeur de l'export s'applique).
 */
export function resolveSettings(data: Pick<SiteData, 'modes' | 'solutions' | 'examOnly'> | null, override?: unknown): SiteSettings {
  const o = (override && typeof override === 'object' ? override : {}) as { modes?: unknown; corrige?: unknown };
  const norm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
  return {
    modes: MODE_NAMES[norm(o.modes)] ?? data?.modes ?? (data?.examOnly ? 'exam' : 'both'),
    solutions: SOLUTION_NAMES[norm(o.corrige)] ?? data?.solutions ?? 'end',
  };
}

export function siteSettings(): SiteSettings {
  const w = typeof window === 'undefined' ? {} : (window as { ABBON_SITE_SETTINGS?: unknown });
  return resolveSettings(siteData(), w.ABBON_SITE_SETTINGS);
}

/** Site en mode examen seulement : ni entraînement, ni boîte de révision. */
export const examOnly = () => SITE && siteSettings().modes === 'exam';
/** Site en mode entraînement seulement : pas d'examen. */
export const trainingOnly = () => SITE && siteSettings().modes === 'training';

const MODE_LABELS: Record<SiteModes, string> = { both: 'les-deux', training: 'entrainement', exam: 'examen' };

/** Texte de `reglages.js`, commenté pour être modifié à la main après l'export. */
export const settingsScript = (s: SiteSettings) => `// Réglages du site Abbon : modifiables après l'export, sans rien reconstruire.
// Enregistrer ce fichier (encodage UTF-8), le redéposer, puis recharger la page dans le navigateur.
window.ABBON_SITE_SETTINGS = {
  // Modes proposés aux visiteurs :
  //   "les-deux"      entraînement (correction à chaque question, boîte de révision) et examen ;
  //   "entrainement"  entraînement seulement ;
  //   "examen"        examen seulement (ni entraînement ni boîte de révision).
  modes: "${MODE_LABELS[s.modes]}",
  // Corrigé de l'examen : "fin" (après l'envoi des réponses) ou "jamais".
  corrige: "${s.solutions === 'end' ? 'fin' : 'jamais'}",
};
`;

/** Texte de `donnees.js`. Le JSON est échappé pour ne jamais fermer la balise script. */
export const siteScript = (data: SiteData) =>
  `window.ABBON_SITE = ${JSON.stringify(data).replace(/</g, '\\u003c')};\n`;

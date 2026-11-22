/**
 * Site web exporté (lecteur autonome pour hébergement mutualisé).
 *
 * La même interface est construite une seconde fois avec `vite build --mode site` : routage par fragment
 * (`#/quiz/…`), chemins relatifs, sans administration. Les contenus arrivent par `donnees.js`, qui définit
 * `window.ABBON_SITE` avant le chargement de l'application ; la progression du visiteur reste dans son
 * navigateur (stockage local). Voir docs/architecture.md, « Export en site web ».
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
  /** Mode examen seulement : pas d'entraînement ni de boîte de révision. */
  examOnly: boolean;
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

/** Site en mode examen seulement : ni entraînement, ni boîte de révision. */
export const examOnly = () => !!siteData()?.examOnly;

/** Texte de `donnees.js`. Le JSON est échappé pour ne jamais fermer la balise script. */
export const siteScript = (data: SiteData) =>
  `window.ABBON_SITE = ${JSON.stringify(data).replace(/</g, '\\u003c')};\n`;

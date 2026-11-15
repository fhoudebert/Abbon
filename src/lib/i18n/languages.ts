/** Langues proposées pour le contenu des QCM (nom dans la langue elle-même). */
export const CONTENT_LANGUAGES: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
};

export const languageName = (code: string) => CONTENT_LANGUAGES[code] ?? code;

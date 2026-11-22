// Types globaux de l'application.
declare global {
  /** Version d'Abbon, injectée depuis package.json par Vite. */
  const __APP_VERSION__: string;
  /** Construction du site web exporté (`vite build --mode site`). */
  const __SITE__: boolean;
}

export {};

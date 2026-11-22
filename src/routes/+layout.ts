// Tauri doesn't have a Node.js server to do proper SSR
// so we use adapter-static with a fallback to index.html to put the site in SPA mode
// See: https://svelte.dev/docs/kit/single-page-apps
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
// Écrit sous forme d'expression (et non de littéral) : la construction du site web (vite.config.js,
// « abbon-site-page-options ») retire cette ligne, que SvelteKit refuse avec le routage par fragment.
export const ssr = Boolean(false);

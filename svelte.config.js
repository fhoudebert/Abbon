// Tauri doesn't have a Node.js server to do proper SSR
// so we use adapter-static with a fallback to index.html to put the site in SPA mode
// See: https://svelte.dev/docs/kit/single-page-apps
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import process from "node:process";

/**
 * Site web exporté (`vite build --mode site`) : routage par fragment (`#/quiz/…`), qui fonctionne sur tout
 * hébergement statique, à la racine comme dans un sous-dossier, sans règle de réécriture ; sortie dans
 * build-site/. Voir src/lib/site.ts.
 */
const argv = process.argv;
const SITE =
  process.env.ABBON_SITE_BUILD === "1" ||
  argv.includes("--mode=site") ||
  (argv.includes("--mode") && argv[argv.indexOf("--mode") + 1] === "site");
// Les étapes finales de SvelteKit (analyse, page de repli) tournent dans des processus enfants, qui relisent
// cette configuration sans les arguments de la ligne de commande : la variable d'environnement leur est transmise.
if (SITE) process.env.ABBON_SITE_BUILD = "1";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(
      SITE
        ? { pages: "build-site", assets: "build-site", fallback: "index.html" }
        : { fallback: "index.html" },
    ),
    ...(SITE ? { router: { type: "hash" }, outDir: ".svelte-kit-site" } : {}),
  },
};

export default config;

import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import { sveltekit } from "@sveltejs/kit/vite";
import process from "node:process";
const host = process.env.TAURI_DEV_HOST;
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

/**
 * KaTeX déclare chaque police en trois formats (woff2, woff, ttf). Les trois moteurs d'Abbon lisent
 * le woff2 : les deux autres sont retirés de la feuille de style, donc du paquet (≈ 0,9 Mo de moins).
 */
const katexWoff2Only = {
  name: "katex-woff2-only",
  enforce: "pre",
  /** @param {string} code @param {string} id */
  transform(code, id) {
    if (!/katex[^/]*\.css/.test(id)) return null;
    return code.replace(/,\s*url\([^)]*\.(?:woff|ttf)\)\s*format\("(?:woff|truetype)"\)/g, "");
  },
};

/**
 * Site web (routage par fragment) : SvelteKit y refuse les options de page. `ssr = false`, nécessaire à
 * l'application (page de repli sans rendu serveur), est retiré de src/routes/+layout.ts pour cette construction
 * (il y est écrit `Boolean(false)` : l'analyse statique de SvelteKit se rabat alors sur le module transformé).
 */
const siteWithoutPageOptions = {
  name: "abbon-site-page-options",
  enforce: "pre",
  /** @param {string} code @param {string} id */
  transform(code, id) {
    if (!/src[\\/]routes[\\/]\+layout\.ts$/.test(id)) return null;
    return code.replace(/^export const ssr = Boolean\(false\);$/m, "");
  },
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [katexWoff2Only, ...(mode === "site" ? [siteWithoutPageOptions] : []), sveltekit()],
  // MathLive (≈ 800 Ko) forme un morceau à part, chargé seulement à l'ouverture de l'éditeur visuel.
  build: { chunkSizeWarningLimit: 900 },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Site web exporté : `vite build --mode site` (voir svelte.config.js et src/lib/site.ts).
    __SITE__: JSON.stringify(mode === "site"),
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || "127.0.0.1",
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));

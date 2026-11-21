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

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [katexWoff2Only, sveltekit()],
  // MathLive (≈ 800 Ko) forme un morceau à part, chargé seulement à l'ouverture de l'éditeur visuel.
  build: { chunkSizeWarningLimit: 900 },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
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

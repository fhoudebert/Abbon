/**
 * Atelier de formules : page HTML autonome (un seul fichier, hors ligne), construite à partir du code d'Abbon
 * (MathLive, KaTeX, mhchem). `npm run atelier` → dist/atelier/atelier-formules.html (voir pack.ts).
 */
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

/** Feuille de style de KaTeX : seules les polices woff2 sont gardées (tous les navigateurs actuels les lisent). */
const woff2Only: Plugin = {
  name: 'atelier-woff2-only',
  enforce: 'pre',
  transform(code, id) {
    if (!/katex(\.min)?\.css/.test(id)) return;
    return code.replace(/,\s*url\([^)]+\.(?:woff|ttf)\)\s*format\("(?:woff|truetype)"\)/g, '');
  },
};

export default defineConfig({
  root,
  base: './',
  plugins: [woff2Only, svelte({ configFile: false })],
  resolve: { alias: { $lib: fileURLToPath(new URL('../../src/lib', import.meta.url)) } },
  build: {
    outDir: fileURLToPath(new URL('../../dist/atelier/build', import.meta.url)),
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000, // polices dans le CSS
    cssCodeSplit: false,
    modulePreload: false,
    chunkSizeWarningLimit: 4000, // une seule page, tout compris
    rolldownOptions: { output: { codeSplitting: false } }, // un seul script
  },
});

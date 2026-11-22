#!/usr/bin/env node
/**
 * Vérifie et construit les modules de contenu (dossier modules/).
 *
 *   npm run module:check [nom…]     vérifie les sources (toutes par défaut)
 *   npm run module:build [nom…]     vérifie puis écrit dist/modules/Abbon-<nom>-<version>.qcm
 *   npm run module:site [--examen [--sans-corrige]] [nom…]
 *                                   site web dans dist/sites/<nom>/ (après npm run build:site)
 *
 * Le code est celui de l'application (schémas et écriture du format .qcm) : il est chargé par Vite,
 * qui résout l'alias `$lib` et le TypeScript, sans étape de compilation séparée.
 */
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../..', import.meta.url));
const server = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  resolve: { alias: { $lib: fileURLToPath(new URL('../../src/lib', import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  define: { __SITE__: 'false' },
});
let code = 1;
try {
  const { main } = await server.ssrLoadModule('/scripts/modules/main.ts');
  code = await main(process.argv.slice(2), root);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
} finally {
  await server.close();
}
process.exit(code);

import { describe, expect, it } from 'vitest';
import { relativeIndex } from './html';

const BUILT = `<!doctype html>
<html lang="fr">
  <head>
    <link rel="icon" href="/favicon.png" />
    <link href="/_app/immutable/entry/start.js" rel="modulepreload">
    <link href="/_app/immutable/assets/0.css" rel="stylesheet">
  </head>
  <body>
    <script>
      Promise.all([import("/_app/immutable/entry/start.js"), import("/_app/immutable/entry/app.js")]);
    </script>
  </body>
</html>`;

describe('index.html du site web', () => {
  it('chemins relatifs et données chargées avant l’application', () => {
    const out = relativeIndex(BUILT);
    expect(out).toContain('href="./favicon.png"');
    expect(out).toContain('href="./_app/immutable/entry/start.js"');
    expect(out).toContain('import("./_app/immutable/entry/app.js")');
    expect(out).not.toMatch(/(href|src)="\/[^/]|import\("\//);
    expect(out.indexOf('<script src="./reglages.js"></script>')).toBeLessThan(out.indexOf('<script src="./donnees.js"></script>'));
    expect(out.indexOf('<script src="./donnees.js"></script>')).toBeLessThan(out.indexOf('</head>'));
  });
});

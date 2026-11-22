/** index.html avec des chemins relatifs et le script des données. */
export function relativeIndex(html: string): string {
  const out = html
    .replace(/(href|src)="\/(?!\/)/g, '$1="./')
    .replace(/import\("\/_app\//g, 'import("./_app/')
    .replace('</head>', '    <script src="./donnees.js"></script>\n  </head>');
  if (/(href|src)="\/[^/]|import\("\//.test(out)) throw new Error('chemin absolu restant dans index.html');
  return out;
}

/**
 * Page autonome : copie d'une partie de l'écran en un fichier HTML qui s'ouvre sans l'application (lot 16,
 * récapitulatif de la boîte). Les feuilles de style chargées sont recopiées, polices des formules incluses
 * (en `data:`), ainsi que les images, pour que le fichier s'affiche et s'imprime hors ligne, dans n'importe
 * quel navigateur.
 */

const FONT_URL = /url\((["']?)([^"')]+\.(?:woff2?|ttf|otf))\1\)/g;

function base64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function dataUrl(url: string, mime?: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = mime ?? res.headers.get('content-type') ?? 'application/octet-stream';
    return `data:${type};base64,${base64(new Uint8Array(await res.arrayBuffer()))}`;
  } catch {
    return null;
  }
}

/** Texte de toutes les feuilles de style du document, polices incluses. */
export async function inlineStyles(doc: Document = document): Promise<string> {
  const parts: string[] = [];
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // feuille d'une autre origine : illisible, et sans intérêt ici
    }
    const base = sheet.href ?? doc.baseURI;
    let css = Array.from(rules, (r) => r.cssText).join('\n');
    const fonts = new Map<string, string>();
    for (const m of css.matchAll(FONT_URL)) {
      const abs = new URL(m[2], base).href;
      if (fonts.has(m[0])) continue;
      const ext = m[2].split('.').pop()!;
      const data = await dataUrl(abs, `font/${ext === 'otf' ? 'otf' : ext}`);
      if (data) fonts.set(m[0], `url("${data}")`);
    }
    for (const [from, to] of fonts) css = css.split(from).join(to);
    parts.push(css);
  }
  return parts.join('\n');
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * Fichier HTML autonome reprenant `root` (sans ses éléments `[data-no-export]`). `extraCss` s'ajoute aux
 * styles de l'application (mise en page propre au fichier).
 */
export async function standaloneHtml(root: HTMLElement, title: string, lang: string, extraCss = ''): Promise<string> {
  const clone = root.cloneNode(true) as HTMLElement;
  for (const el of Array.from(clone.querySelectorAll('[data-no-export]'))) el.remove();
  for (const img of Array.from(clone.querySelectorAll('img'))) {
    if (img.src.startsWith('blob:') || img.src.startsWith(location.origin)) {
      const data = await dataUrl(img.src);
      if (data) img.src = data;
    }
  }
  const css = await inlineStyles();
  return [
    '<!DOCTYPE html>',
    `<html lang="${escapeHtml(lang)}">`,
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${css}\n${extraCss}</style>`,
    '</head>',
    `<body><main class="standalone">${clone.outerHTML}</main></body>`,
    '</html>',
  ].join('\n');
}

/**
 * Image PNG d'une formule (navigateur) : le rendu de KaTeX est placé dans un SVG (foreignObject) avec la feuille
 * de style de KaTeX et ses polices incorporées, puis dessiné sur un canevas. Texte noir sur fond transparent ou
 * blanc, à l'échelle `scale` (×3 : net à l'impression).
 */
import katex from 'katex';
import 'katex/contrib/mhchem';
import { mathMacros } from '$lib/rich/macros';

let styles: Promise<string> | null = null;

/**
 * Feuille de style de KaTeX autonome : une image SVG ne charge rien, les polices y sont donc incorporées
 * (déjà fait dans la page autonome ; dans l'application, lues une fois depuis ses fichiers, woff2 seulement).
 */
export function katexStyles(): Promise<string> {
  styles ??= import('katex/dist/katex.min.css?inline').then(async ({ default: css }) => {
    const urls = new Set<string>();
    for (const m of css.matchAll(/url\(["']?([^)"']+\.woff2)["']?\)/g)) if (!m[1].startsWith('data:')) urls.add(m[1]);
    const data = new Map<string, string>();
    await Promise.all(
      [...urls].map(async (u) => {
        const blob = await (await fetch(new URL(u, document.baseURI))).blob();
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        data.set(u, `data:font/woff2;base64,${btoa(bin)}`);
      }),
    );
    return css
      .replace(/,\s*url\([^)]+\.(?:woff|ttf)["']?\)\s*format\(["'](?:woff|truetype)["']\)/g, '')
      .replace(/url\(["']?([^)"']+\.woff2)["']?\)/g, (m, u: string) => (data.has(u) ? `url(${data.get(u)})` : m));
  });
  styles.catch(() => (styles = null));
  return styles;
}

export async function formulaPng(latex: string, opts: { scale?: number; background?: string } = {}): Promise<Blob> {
  const scale = opts.scale ?? 3;
  const css = await katexStyles();
  const html = katex.renderToString(latex, { output: 'html', displayMode: false, throwOnError: true, strict: 'ignore', trust: false, macros: mathMacros() });
  const box = 'font-size:24px;color:#000;padding:6px;display:inline-block;white-space:nowrap';
  // Mesure dans la page, hors écran, avec la même feuille de style.
  const probe = document.createElement('div');
  probe.style.cssText = `position:fixed;left:-10000px;top:0;${box}`;
  probe.innerHTML = html;
  document.body.append(probe);
  await document.fonts.ready;
  const rect = probe.getBoundingClientRect();
  probe.remove();
  const w = Math.ceil(rect.width) + 2;
  const h = Math.ceil(rect.height) + 2;
  const xhtml = new XMLSerializer().serializeToString(Object.assign(document.createElement('div'), { innerHTML: html }));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}">` +
    `<foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="${box}">` +
    `<style>${css.replace(/<\//g, '<\\/')}</style>${xhtml}</div></foreignObject></svg>`;
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('image'))), 'image/png'));
}

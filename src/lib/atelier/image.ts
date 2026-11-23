/**
 * Image PNG d'une formule (navigateur) : le rendu de KaTeX est placé dans un SVG (foreignObject) avec la feuille
 * de style de KaTeX et ses polices incorporées, puis dessiné sur un canevas. Texte noir sur fond transparent ou
 * blanc, à l'échelle `scale` (×3 : net à l'impression).
 */
import katex from 'katex';
import 'katex/contrib/mhchem';

export async function formulaPng(latex: string, css: string, opts: { scale?: number; background?: string } = {}): Promise<Blob> {
  const scale = opts.scale ?? 3;
  const html = katex.renderToString(latex, { output: 'html', displayMode: false, throwOnError: true, strict: 'ignore', trust: false });
  // Mesure dans la page, hors écran, avec la même feuille de style.
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:-10000px;top:0;font-size:24px;color:#000;padding:6px;display:inline-block;white-space:nowrap';
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
    `<foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:24px;color:#000;padding:6px;display:inline-block;white-space:nowrap">` +
    `<style>${css.replace(/]]>/g, '')}</style>${xhtml}</div></foreignObject></svg>`;
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

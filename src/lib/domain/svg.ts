/**
 * Nettoyage des figures SVG avant de les incruster dans la page.
 *
 * Une figure incrustée (et non affichée par <img>) hérite de la couleur du texte : avec des traits
 * en `currentColor`, elle suit le thème clair ou sombre. En contrepartie, son contenu entre dans la
 * page ; rien n'y est donc recopié tel quel. Le fichier est lu par un analyseur XML volontairement
 * strict, puis **réécrit** à partir d'une liste blanche d'éléments, d'attributs et de propriétés de
 * style. Ce qui n'est pas reconnu est retiré : scripts, gestionnaires d'événements, <style>,
 * <foreignObject>, <image>, liens, références externes. Fonctions pures, sans DOM.
 */

const ELEMENTS = new Set([
  'svg', 'g', 'defs', 'title', 'desc', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'marker', 'pattern', 'symbol', 'use',
]);

/** Propriétés de présentation, acceptées comme attributs et dans `style`. */
const PRESENTATION = new Set([
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin',
  'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'color', 'stop-color', 'stop-opacity',
  'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'alignment-baseline',
  'letter-spacing', 'word-spacing', 'text-decoration', 'clip-path', 'clip-rule', 'mask', 'marker-start', 'marker-mid',
  'marker-end', 'display', 'visibility', 'vector-effect', 'paint-order', 'shape-rendering', 'text-rendering',
]);

const ATTRIBUTES = new Set([
  ...PRESENTATION,
  'id', 'viewBox', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points',
  'dx', 'dy', 'rotate', 'textLength', 'lengthAdjust', 'transform', 'preserveAspectRatio', 'pathLength',
  'gradientUnits', 'gradientTransform', 'spreadMethod', 'offset', 'fx', 'fy', 'fr',
  'clipPathUnits', 'maskUnits', 'maskContentUnits', 'patternUnits', 'patternContentUnits', 'patternTransform',
  'markerWidth', 'markerHeight', 'markerUnits', 'refX', 'refY', 'orient', 'href', 'style',
]);

interface Element {
  name: string;
  attrs: [string, string][];
  children: (Element | string)[];
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/** Entités prédéfinies et numériques seulement : aucune entité déclarée n'est acceptée. */
function decode(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]{1,6}|#\d{1,7}|[a-zA-Z]+);/g, (_m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      if (code > 0x10ffff || (code < 0x20 && ![9, 10, 13].includes(code))) throw new Error('entité invalide');
      return String.fromCodePoint(code);
    }
    if (!(e in ENTITIES)) throw new Error(`entité « &${e}; » non reconnue`);
    return ENTITIES[e];
  });
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s: string) => esc(s).replace(/"/g, '&quot;');

/** Analyse XML minimale et stricte : éléments, attributs, texte, commentaires, CDATA. */
function parse(src: string): Element {
  let i = 0;
  const fail = (msg: string): never => {
    throw new Error(msg);
  };
  const skipMisc = () => {
    for (;;) {
      while (/\s/.test(src[i] ?? '')) i++;
      if (src.startsWith('<?', i)) i = src.indexOf('?>', i) === -1 ? fail('déclaration non refermée') : src.indexOf('?>', i) + 2;
      else if (src.startsWith('<!--', i)) i = src.indexOf('-->', i) === -1 ? fail('commentaire non refermé') : src.indexOf('-->', i) + 3;
      else break;
    }
  };
  const name = () => {
    const m = /^[A-Za-z_][\w.:-]*/.exec(src.slice(i, i + 80));
    if (!m) fail('nom attendu');
    i += m![0].length;
    return m![0];
  };
  const element = (depth: number): Element => {
    if (depth > 60) fail('imbrication trop profonde');
    i++; // <
    const el: Element = { name: name(), attrs: [], children: [] };
    for (;;) {
      const before = i;
      while (/\s/.test(src[i] ?? '')) i++;
      if (src[i] === '>') {
        i++;
        break;
      }
      if (src.startsWith('/>', i)) {
        i += 2;
        return el;
      }
      if (i === before) fail('espace attendu entre deux attributs');
      const key = name();
      while (/\s/.test(src[i] ?? '')) i++;
      if (src[i] !== '=') fail('« = » attendu');
      i++;
      while (/\s/.test(src[i] ?? '')) i++;
      const quote = src[i];
      if (quote !== '"' && quote !== "'") fail('valeur d’attribut entre guillemets attendue');
      const end = src.indexOf(quote, i + 1);
      if (end === -1) fail('attribut non refermé');
      const raw = src.slice(i + 1, end);
      if (raw.includes('<')) fail('« < » dans un attribut');
      el.attrs.push([key, decode(raw)]);
      i = end + 1;
    }
    for (;;) {
      if (i >= src.length) fail(`<${el.name}> non refermé`);
      if (src.startsWith('</', i)) {
        i += 2;
        if (name() !== el.name) fail(`</${el.name}> attendu`);
        while (/\s/.test(src[i] ?? '')) i++;
        if (src[i] !== '>') fail('« > » attendu');
        i++;
        return el;
      }
      if (src.startsWith('<!--', i)) {
        const end = src.indexOf('-->', i);
        if (end === -1) fail('commentaire non refermé');
        i = end + 3;
      } else if (src.startsWith('<![CDATA[', i)) {
        const end = src.indexOf(']]>', i);
        if (end === -1) fail('CDATA non refermé');
        el.children.push(src.slice(i + 9, end));
        i = end + 3;
      } else if (src.startsWith('<?', i) || src.startsWith('<!', i)) {
        fail('instruction ou déclaration interdite');
      } else if (src[i] === '<') {
        el.children.push(element(depth + 1));
      } else {
        const end = src.indexOf('<', i);
        const stop = end === -1 ? src.length : end;
        el.children.push(decode(src.slice(i, stop)));
        i = stop;
      }
    }
  };
  if (src.charCodeAt(0) === 0xfeff) i = 1;
  skipMisc();
  if (src.startsWith('<!DOCTYPE', i) || src.startsWith('<!doctype', i)) {
    // DOCTYPE simple toléré (Inkscape, Illustrator), sans sous-ensemble interne : pas d'entités déclarées.
    const end = src.indexOf('>', i);
    if (end === -1 || src.slice(i, end).includes('[')) fail('DOCTYPE avec déclarations interdit');
    i = end + 1;
    skipMisc();
  }
  if (src[i] !== '<') fail('élément racine attendu');
  const root = element(0);
  skipMisc();
  if (i < src.length) fail('contenu après la racine');
  return root;
}

const local = (n: string) => n.slice(n.indexOf(':') + 1);

/** Valeur sans danger : pas d'adresse externe, pas de script, pas d'échappement CSS. */
function safeValue(v: string, prefix: string): string | null {
  if (v.length > 20_000 || /[\\<>]|javascript:|data:|expression|@import|-moz-binding/i.test(v)) return null;
  let ok = true;
  // url(...) : seulement une référence interne « #identifiant », réécrite avec le préfixe.
  const out = v.replace(/url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi, (_m, _q, target: string) => {
    if (!/^#[\w.:-]+$/.test(target.trim())) ok = false;
    return `url(#${prefix}${target.trim().slice(1)})`;
  });
  return ok && !/url\(/i.test(out.replace(/url\(#[\w.:-]+\)/g, '')) ? out : null;
}

function safeStyle(style: string, prefix: string): string {
  const out: string[] = [];
  for (const decl of style.split(';')) {
    const at = decl.indexOf(':');
    if (at === -1) continue;
    const prop = decl.slice(0, at).trim().toLowerCase();
    const value = safeValue(decl.slice(at + 1).trim(), prefix);
    if (PRESENTATION.has(prop) && value) out.push(`${prop}:${value}`);
  }
  return out.join(';');
}

function write(el: Element, prefix: string, root: boolean): string {
  const tag = local(el.name);
  if (!ELEMENTS.has(tag) || (el.name.includes(':') && !el.name.startsWith('svg:'))) return '';
  const attrs: string[] = [];
  const seen = new Set<string>();
  for (const [rawKey, rawValue] of el.attrs) {
    // xlink:href → href ; tout autre attribut à préfixe (xmlns:*, inkscape:*, sodipodi:*…) est retiré.
    const key = rawKey === 'xlink:href' ? 'href' : rawKey;
    if (key.includes(':') || !ATTRIBUTES.has(key) || seen.has(key)) continue;
    let value: string | null = rawValue.trim();
    if (key === 'id') value = /^[\w.:-]{1,80}$/.test(value) ? prefix + value : null;
    else if (key === 'href') value = /^#[\w.:-]{1,80}$/.test(value) ? `#${prefix}${value.slice(1)}` : null;
    else if (key === 'style') value = safeStyle(value, prefix) || null;
    else value = safeValue(value, prefix);
    if (value === null) continue;
    seen.add(key);
    attrs.push(` ${key}="${escAttr(value)}"`);
  }
  if (root) attrs.unshift(' xmlns="http://www.w3.org/2000/svg"');
  const body = el.children.map((c) => (typeof c === 'string' ? esc(c) : write(c, prefix, false))).join('');
  return `<${tag}${attrs.join('')}>${body}</${tag}>`;
}

/** Le contenu ressemble-t-il à un fichier SVG ? (reconnaissance du type, avant toute analyse) */
export function looksLikeSvg(text: string): boolean {
  const head = text.slice(0, 4096).replace(/^﻿/, '');
  return /^\s*(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!DOCTYPE\s+svg[^>[]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head);
}

/**
 * SVG nettoyé, prêt à être incrusté, ou null si le fichier n'est pas un SVG bien formé.
 * `prefix` rend les identifiants uniques dans la page (plusieurs figures peuvent s'y côtoyer).
 */
export function sanitizeSvg(text: string, prefix = ''): string | null {
  if (text.length > 2_000_000) return null;
  try {
    const root = parse(text);
    if (local(root.name) !== 'svg') return null;
    // Sans viewBox, une figure ne peut pas s'adapter à la largeur : on la déduit de width/height.
    if (!root.attrs.some(([k]) => k === 'viewBox')) {
      const num = (k: string) => parseFloat(root.attrs.find(([a]) => a === k)?.[1] ?? '');
      const [w, h] = [num('width'), num('height')];
      if (w > 0 && h > 0) root.attrs.push(['viewBox', `0 0 ${w} ${h}`]);
    }
    const p = prefix && !/^[A-Za-z][\w-]{0,40}$/.test(prefix) ? '' : prefix;
    return write(root, p, true) || null;
  } catch {
    return null;
  }
}

/** Raison pour laquelle un SVG est refusé (outillage), ou null s'il est accepté. */
export function svgProblem(text: string): string | null {
  try {
    const root = parse(text);
    return local(root.name) === 'svg' ? null : 'la racine n’est pas <svg>';
  } catch (e) {
    return (e as Error).message;
  }
}

/**
 * Format GIFT (format texte de Moodle) — import et export.
 *
 * Pris en charge à l'import :
 *  - choix unique  { =bonne ~mauvaise ~mauvaise }
 *  - choix multiples  { ~%50%bonne ~%50%bonne ~%-100%mauvaise }  (poids > 0 = bonne réponse)
 *  - vrai / faux  { T } { F } { TRUE } { FALSE }  → choix unique « Vrai / Faux »
 *  - titre ::titre::, format [html] [markdown] [plain] [moodle], retours #… et ####…, commentaires //
 * Ignorés (signalés) : réponse courte, appariement, numérique, rédaction, $CATEGORY.
 *
 * L'export écrit chaque question en [html] (HTML produit par Abbon, texte échappé).
 */
import { newId } from '$lib/domain/text';
import { plainToDoc, richToPlain, pick } from '$lib/domain/rich';
import type { Lang, Question, Quiz, RichNode, RichValue } from '$lib/domain/types';

// ---- Import -----------------------------------------------------------------

export type GiftSkipReason = 'matching' | 'numerical' | 'essay' | 'description' | 'no_answer_block' | 'no_correct';

export interface GiftResult {
  quiz: Quiz;
  skipped: { index: number; title: string; reason: GiftSkipReason }[];
  categoriesIgnored: boolean;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** HTML → texte : balises retirées, sauts de ligne conservés, entités décodées. Rien n'est interprété. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6]|pre|tr)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Retire les échappements GIFT (\~ \= \# \{ \} \: \\ et \n). */
const unescape = (s: string) => s.replace(/\\n/g, '\n').replace(/\\([~=#{}:\\])/g, '$1');

/** Découpe sur un caractère non échappé. */
function splitUnescaped(s: string, re: RegExp): string[] {
  const out: string[] = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && i + 1 < s.length) {
      cur += s[i] + s[i + 1];
      i++;
    } else if (re.test(s[i])) {
      out.push(cur);
      cur = s[i];
    } else cur += s[i];
  }
  out.push(cur);
  return out;
}

/** Index du premier caractère non échappé. */
function indexUnescaped(s: string, ch: string, from = 0): number {
  for (let i = from; i < s.length; i++) {
    if (s[i] === '\\') i++;
    else if (s[i] === ch) return i;
  }
  return -1;
}

function toText(raw: string, format: string): string {
  const t = unescape(raw.trim());
  return format === 'html' ? htmlToText(t) : t;
}

/** Sépare le fichier en blocs de questions (lignes vides), sans couper à l'intérieur d'un bloc { }. */
function blocks(text: string): string[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let cur: string[] = [];
  let depth = 0;
  for (const line of lines) {
    if (/^\s*\/\//.test(line)) continue; // commentaire
    if (!line.trim() && depth === 0) {
      if (cur.length) out.push(cur.join('\n'));
      cur = [];
      continue;
    }
    cur.push(line);
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '\\') i++;
      else if (line[i] === '{') depth++;
      else if (line[i] === '}') depth = Math.max(0, depth - 1);
    }
  }
  if (cur.length) out.push(cur.join('\n'));
  return out;
}

/** Lit un fichier GIFT ; chaque fichier donne un QCM (brouillon) dans la langue `lang`. */
export function parseGift(text: string, title: string, lang: Lang, now = new Date()): GiftResult {
  const questions: Question[] = [];
  const skipped: GiftResult['skipped'] = [];
  let categoriesIgnored = false;
  let index = 0;

  for (const block of blocks(text)) {
    let b = block.trim();
    if (/^\$CATEGORY:/i.test(b)) {
      categoriesIgnored = true;
      const rest = b.split('\n').slice(1).join('\n').trim();
      if (!rest) continue;
      b = rest;
    }
    index++;
    let qTitle = '';
    const t = /^::(.*?)::/s.exec(b);
    if (t) {
      qTitle = unescape(t[1].trim());
      b = b.slice(t[0].length).trim();
    }
    let format = 'moodle';
    const f = /^\[(html|markdown|plain|moodle)\]/i.exec(b);
    if (f) {
      format = f[1].toLowerCase();
      b = b.slice(f[0].length);
    }

    const open = indexUnescaped(b, '{');
    const close = open === -1 ? -1 : indexUnescaped(b, '}', open);
    const label = qTitle || toText(b.slice(0, open === -1 ? 60 : open), format).slice(0, 60);
    if (open === -1 || close === -1) {
      skipped.push({ index, title: label, reason: open === -1 ? 'description' : 'no_answer_block' });
      continue;
    }
    const before = b.slice(0, open);
    const after = b.slice(close + 1);
    let body = b.slice(open + 1, close).trim();

    // Retour général ####
    let general = '';
    const g = body.indexOf('####');
    if (g !== -1) {
      general = body.slice(g + 4);
      body = body.slice(0, g);
    }
    // Question à trou : le texte continue après le bloc.
    const prompt = after.trim() ? `${toText(before, format)} _____ ${toText(after, format)}` : toText(before, format);

    if (body === '') {
      skipped.push({ index, title: label, reason: 'essay' });
      continue;
    }
    const explanation = general.trim() ? { [lang]: plainToDoc(toText(general, format)) } : null;
    if (body.startsWith('#')) {
      // Réponse numérique : {#4}, {#3.14:0.01} (valeur et écart) ou {#1..5} (intervalle).
      const num = '[+-]?\\d+(?:\\.\\d+)?';
      const m = new RegExp(`^#\\s*(${num})\\s*(?:(:|\\.\\.)\\s*(${num}))?\\s*(?:#.*)?$`, 's').exec(body.trim());
      if (!m) {
        skipped.push({ index, title: label, reason: 'numerical' });
        continue;
      }
      const a = Number(m[1]);
      const b2 = m[3] === undefined ? 0 : Number(m[3]);
      const range = m[2] === '..';
      const round = (n: number) => Number(n.toPrecision(12));
      questions.push({
        id: newId(),
        type: 'numeric',
        prompt: { [lang]: plainToDoc(prompt) },
        points: 1,
        position: questions.length,
        explanation,
        choices: [],
        expected: range ? { value: round((a + b2) / 2), tolerance: round(Math.abs(b2 - a) / 2) } : { value: a, tolerance: Math.abs(b2) },
      });
      continue;
    }
    const tf = /^(T|TRUE|F|FALSE)\s*(#.*)?$/is.exec(body.trim());
    const id = newId();
    if (tf) {
      const isTrue = tf[1].toUpperCase().startsWith('T');
      const vrai = lang === 'fr' ? 'Vrai' : 'True';
      const faux = lang === 'fr' ? 'Faux' : 'False';
      questions.push({
        id,
        type: 'single',
        prompt: { [lang]: plainToDoc(prompt) },
        points: 1,
        position: questions.length,
        explanation: general.trim() ? { [lang]: plainToDoc(toText(general, format)) } : null,
        choices: [
          { id: newId(), content: { [lang]: vrai }, correct: isTrue, position: 0, feedback: null },
          { id: newId(), content: { [lang]: faux }, correct: !isTrue, position: 1, feedback: null },
        ],
      });
      continue;
    }

    const parts = splitUnescaped(body, /[=~]/).map((p) => p.trim()).filter(Boolean);
    if (parts.some((p) => /->/.test(p.replace(/\\./g, '')))) {
      skipped.push({ index, title: label, reason: 'matching' });
      continue;
    }
    if (!parts.some((p) => p.startsWith('~'))) {
      // Réponse courte : que des réponses « = », toutes acceptées (poids et retours ignorés).
      const accepted = parts
        .map((p) => {
          const rest = p.slice(1).replace(/^%-?\d+(?:\.\d+)?%/, '');
          const fb = indexUnescaped(rest, '#');
          return toText(fb === -1 ? rest : rest.slice(0, fb), format).trim();
        })
        .filter(Boolean);
      if (!accepted.length) {
        skipped.push({ index, title: label, reason: 'no_correct' });
        continue;
      }
      questions.push({
        id,
        type: 'short',
        prompt: { [lang]: plainToDoc(prompt) },
        points: 1,
        position: questions.length,
        explanation,
        choices: [],
        expected: { accepted: [...new Set(accepted)] },
      });
      continue;
    }

    const choices = parts.map((p, i) => {
      const sign = p[0];
      let rest = p.slice(1);
      let weight = sign === '=' ? 100 : 0;
      const w = /^%(-?\d+(?:\.\d+)?)%/.exec(rest);
      if (w) {
        weight = Number(w[1]);
        rest = rest.slice(w[0].length);
      }
      const fb = indexUnescaped(rest, '#');
      const content = fb === -1 ? rest : rest.slice(0, fb);
      const feedback = fb === -1 ? '' : rest.slice(fb + 1);
      return {
        id: newId(),
        content: { [lang]: toText(content, format) } as Record<Lang, RichValue>,
        correct: weight > 0,
        position: i,
        feedback: feedback.trim() ? { [lang]: toText(feedback, format) } : null,
      };
    });
    const nCorrect = choices.filter((c) => c.correct).length;
    if (nCorrect === 0) {
      skipped.push({ index, title: label, reason: 'no_correct' });
      continue;
    }
    // Plusieurs bonnes réponses : choix multiples.
    const type = nCorrect === 1 ? 'single' : 'multiple';
    questions.push({
      id,
      type,
      prompt: { [lang]: plainToDoc(prompt) },
      points: 1,
      position: questions.length,
      explanation: general.trim() ? { [lang]: plainToDoc(toText(general, format)) } : null,
      choices,
    });
  }

  const ts = now.toISOString();
  return {
    quiz: {
      id: newId(),
      categoryId: null,
      title: { [lang]: title },
      description: null,
      languages: [lang],
      level: null,
      tags: ['gift'],
      timeLimitSec: null,
      passThreshold: 0.7,
      scoring: 'all_or_nothing',
      solutionVisibility: 'after_submit',
      shuffle: true,
      status: 'draft',
      version: 1,
      author: null,
      createdAt: ts,
      updatedAt: ts,
      questions,
    },
    skipped,
    categoriesIgnored,
  };
}

// ---- Export -----------------------------------------------------------------

const escHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Échappe les caractères spéciaux GIFT. */
export const escapeGift = (s: string) => s.replace(/([~=#{}:\\])/g, '\\$1').replace(/\n/g, '\\n');

/**
 * Contenu riche → HTML simple (texte échappé ; images en data: si fournies).
 * `inline` : un contenu d'un seul paragraphe est écrit sans <p> (réponses).
 */
export function richToHtml(
  value: RichValue | null | undefined,
  image?: (hash: string) => string | undefined,
  inline = false,
): string {
  if (!value) return '';
  if (typeof value === 'string')
    return inline && !value.includes('\n') ? escHtml(value) : value.split('\n').map((l) => `<p>${escHtml(l)}</p>`).join('');
  if (inline && value.content?.length === 1 && value.content[0].type === 'paragraph')
    return richToHtml({ type: 'doc', content: value.content[0].content ?? [] }, image);
  const marks: Record<string, string> = { bold: 'strong', italic: 'em', underline: 'u', strike: 's', code: 'code' };
  const tags: Record<string, string> = {
    paragraph: 'p', bulletList: 'ul', orderedList: 'ol', listItem: 'li', blockquote: 'blockquote',
    table: 'table', tableRow: 'tr', tableCell: 'td', tableHeader: 'th',
  };
  const node = (n: RichNode): string => {
    const inner = () => (n.content ?? []).map(node).join('');
    switch (n.type) {
      case 'text': {
        let s = escHtml(n.text ?? '');
        for (const m of n.marks ?? []) if (marks[m.type]) s = `<${marks[m.type]}>${s}</${marks[m.type]}>`;
        return s;
      }
      // Formules : notation TeX de Moodle (filtre « TeX » ou MathJax).
      case 'math':
        return `\\(${escHtml((n.content ?? []).map((c) => c.text ?? '').join(''))}\\)`;
      case 'mathBlock':
        return `<p>\\[${escHtml((n.content ?? []).map((c) => c.text ?? '').join(''))}\\]</p>`;
      case 'hardBreak':
        return '<br>';
      case 'horizontalRule':
        return '<hr>';
      case 'codeBlock':
        return `<pre><code>${escHtml((n.content ?? []).map((c) => c.text ?? '').join(''))}</code></pre>`;
      case 'image': {
        const src = typeof n.attrs?.hash === 'string' ? image?.(n.attrs.hash) : undefined;
        const alt = escHtml(String(n.attrs?.alt ?? ''));
        return src ? `<img src="${src}" alt="${alt}">` : alt ? `<p>[${alt}]</p>` : '';
      }
      case 'doc':
        return inner();
      default:
        return tags[n.type] ? `<${tags[n.type]}>${inner()}</${tags[n.type]}>` : inner();
    }
  };
  return node(value);
}

/** Pourcentage au format attendu par Moodle (5 décimales au plus). */
const pct = (n: number) => String(Math.round(n * 100000) / 100000);

/**
 * Écrit un QCM en GIFT, dans une langue. Choix multiples : chaque bonne réponse vaut 100/n %,
 * chaque mauvaise −100 % (au plus proche de « tout ou rien » ; Moodle plafonne à 0).
 * Réponse courte : `{=a =b}` ; réponse numérique : `{#valeur:écart}` ; texte à trous, expression : non exportés.
 */
export function quizToGift(quiz: Quiz, lang: Lang, image?: (hash: string) => string | undefined, categoryName?: string): string {
  const main = quiz.languages[0];
  const html = (v: Record<Lang, RichValue> | null | undefined, inline = false) =>
    escapeGift(richToHtml(pick(v, lang, main), image, inline));
  const lines: string[] = [`// ${richToPlain(pick(quiz.title, lang, main)).replace(/\n/g, ' ')} — Abbon`, `// ${new Date().toISOString().slice(0, 10)}`, ''];
  if (categoryName) lines.push(`$CATEGORY: ${categoryName.replace(/\n/g, ' ')}`, '');
  [...quiz.questions]
    .sort((a, b) => a.position - b.position)
    .forEach((q, i) => {
      if (q.type === 'cloze') {
        // GIFT ne sait décrire qu'un seul trou par question : les textes à trous ne sont pas exportés.
        lines.push(`// Q${i + 1} : texte à trous, non exporté (sans équivalent en GIFT)`, '');
        return;
      }
      if (q.type === 'expression') {
        // Moodle ne compare pas des formules en GIFT : les questions « expression » ne sont pas exportées.
        lines.push(`// Q${i + 1} : expression à écrire, non exportée (sans équivalent en GIFT)`, '');
        return;
      }
      const correct = q.choices.filter((c) => c.correct).length;
      const wrong = q.choices.length - correct;
      const answers = [...q.choices]
        .sort((a, b) => a.position - b.position)
        .map((c) => {
          const prefix =
            q.type === 'single' ? (c.correct ? '=' : '~') : c.correct ? `~%${pct(100 / Math.max(1, correct))}%` : wrong ? '~%-100%' : '~';
          const fb = c.feedback && pick(c.feedback, lang, main) ? `#${html(c.feedback, true)}` : '';
          return `\t${prefix}${html(c.content, true)}${fb}`;
        });
      const e = q.expected ?? {};
      if (q.type === 'short') {
        answers.length = 0;
        for (const a of (e.accepted ?? []).filter((x) => x.trim())) answers.push(`\t=${escapeGift(a.trim())}`);
      } else if (q.type === 'numeric') {
        // L'unité n'a pas d'équivalent en GIFT : elle est ajoutée à l'énoncé.
        answers.length = 0;
        answers.push(`\t#${e.value ?? 0}${e.tolerance ? `:${e.tolerance}` : ''}`);
      }
      const unit = q.type === 'numeric' && e.unit ? escapeGift(` (${escHtml(e.unit)})`) : '';
      const expl = q.explanation && pick(q.explanation, lang, main) ? [`\t####${html(q.explanation)}`] : [];
      lines.push(`::Q${i + 1}:: [html]${html(q.prompt)}${unit} {`, ...answers, ...expl, '}', '');
    });
  return lines.join('\n');
}

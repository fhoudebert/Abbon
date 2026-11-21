/**
 * Sources d'un module → contenu d'un fichier `.qcm` (fonctions pures, testées).
 *
 *   modules/<nom>/module.yaml          métadonnées, catégories (ordre et noms)
 *   modules/<nom>/<catégorie>/*.md     un fichier par QCM (en-tête YAML + questions)
 *   modules/<nom>/<catégorie>/fiche.<langue>.md   fiche de révision (facultative)
 *
 * Le format est décrit dans docs/modules.md.
 */
import { parse as parseYaml } from 'yaml';
import { isEmptyRich } from '$lib/domain/rich';
import { quizVersionOf } from '$lib/domain/semver';
import { expressionProblem, stripConstant } from '$lib/domain/expr';
import { parseNumber } from '$lib/domain/typed';
import type { Category, ClozeGap, ExpectedAnswer, I18nRich, I18nText, ModuleManifest, Question, QuestionType, Quiz } from '$lib/domain/types';
import { CategorySchema, QuizSchema } from '$lib/interchange/format';
import { MODULE_FORMAT, MODULE_FORMAT_VERSION, modulePrefix, ModuleSchema } from '$lib/interchange/module';
import { mathError } from '$lib/rich/math';
import { toDocument, toRich, type MarkdownContext } from './markdown';

export interface SourceFile {
  /** Chemin relatif au dossier du module, avec des « / ». */
  path: string;
  text: string;
}

export interface Issue {
  level: 'error' | 'warning';
  file: string;
  /** Identifiant de la question, si le problème la concerne. */
  ref?: string;
  message: string;
}

/** Image ou figure d'un module, déjà lue : son empreinte SHA-256 et son type reconnu (null : type refusé). */
export interface Asset {
  /** Chemin relatif au dossier du module, avec des « / ». */
  path: string;
  hash: string;
  mime: string | null;
}

export interface Compiled {
  /** Chemins des images réellement utilisées (à joindre au fichier .qcm). */
  assets: string[];
  manifest: ModuleManifest;
  quizzes: Quiz[];
  categories: Category[];
  issues: Issue[];
  stats: { category: string; level: string; quizzes: number; questions: number }[];
}

const LOCAL_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANG = /^[a-z]{2,3}$/;
const LEVELS = ['bases', 'approfondissement', 'expert'];

/** Sépare l'en-tête YAML (`---` … `---`) du corps. */
export function splitFrontMatter(text: string): { meta: Record<string, unknown>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!m) throw new Error('en-tête YAML absent (le fichier doit commencer par ---)');
  const meta = parseYaml(m[1]) ?? {};
  if (typeof meta !== 'object' || Array.isArray(meta)) throw new Error('en-tête YAML : un dictionnaire est attendu');
  return { meta: meta as Record<string, unknown>, body: text.slice(m[0].length) };
}

interface RawQuestion {
  id: string;
  type?: QuestionType;
  /** Réponse courte : respecter les majuscules (« · short · case-sensitive »). */
  caseSensitive?: boolean;
  /** Texte brut par langue ; `answers` : lignes « = réponse » des questions à saisie. */
  langs: Map<string, { prompt: string; choices: { correct: boolean; text: string }[]; answers: string[]; explanation: string }>;
}

const TYPES: readonly string[] = ['single', 'multiple', 'short', 'numeric', 'cloze', 'expression'];

/**
 * Texte à trous d'une source : les trous sont entre accolades.
 *   {went|did go}        saisie, avec les formes acceptées
 *   {has ~have ~had}     liste déroulante : la bonne réponse, puis les autres propositions après « ~ »
 * Renvoie le texte au format de l'application (« {{1}} », « {{2}} »…) et les trous. `\{` écrit une accolade.
 */
export function parseClozeSource(src: string): { text: string; gaps: ClozeGap[] } {
  const gaps: ClozeGap[] = [];
  const text = src
    .replace(/\\([{}])/g, (_m, c: string) => (c === '{' ? '\u0001' : '\u0002'))
    .replace(/\{([^{}]*)\}/g, (_m, body: string) => {
      const [first, ...others] = body.split('~').map((x) => x.trim());
      if (others.length) gaps.push({ kind: 'select', accepted: [first], options: others.filter(Boolean) });
      else gaps.push({ kind: 'text', accepted: first.split('|').map((x) => x.trim()).filter(Boolean) });
      return `{{${gaps.length}}}`;
    })
    .replaceAll('\u0001', '{')
    .replaceAll('\u0002', '}');
  return { text, gaps };
}

/**
 * Réponse numérique d'une source : « 9,81 », « 9,81 ± 0,01 », « 9,81 ± 0,01 m/s² », « 4 faces ».
 * Renvoie null si la ligne est illisible.
 */
export function parseNumericAnswer(line: string): ExpectedAnswer | null {
  const num = '[+\\-\u2212]?[\\d.,]+(?:[eE][+\\-]?\\d+)?';
  const m = new RegExp(`^\\s*(${num})\\s*(?:(?:±|\\+/?-)\\s*(${num}))?\\s*(.*)$`).exec(line);
  if (!m) return null;
  const value = parseNumber(m[1]);
  const tolerance = m[2] === undefined ? 0 : parseNumber(m[2]);
  if (value === null || tolerance === null) return null;
  const unit = m[3].trim();
  return { value, tolerance: Math.abs(tolerance), ...(unit ? { unit } : {}) };
}

/**
 * Expression attendue d'une source : « $3x^2$ », ou « $\frac{x^3}{3} + C$ » pour une primitive (égalité à une
 * constante près). Les dollars sont facultatifs. Renvoie l'erreur de lecture s'il y en a une.
 */
export function parseExpressionAnswer(line: string): { expected: ExpectedAnswer; problem: string | null } {
  let latex = line.trim().replace(/^\$+|\$+$/g, '').trim();
  const constant = /\+\s*C\s*$/.test(latex);
  if (constant) latex = stripConstant(latex).trim();
  return { expected: { latex, ...(constant ? { constant: true } : {}) }, problem: expressionProblem(latex) };
}

/** Découpe le corps d'un fichier de QCM en questions (`## identifiant · type`). */
export function splitQuestions(body: string, mainLang: string): RawQuestion[] {
  const out: RawQuestion[] = [];
  let q: RawQuestion | null = null;
  let lang = mainLang;
  let part: 'prompt' | 'choices' | 'explanation' = 'prompt';
  let inCode = false;
  const cur = () => {
    if (!q) throw new Error('texte avant la première question (« ## identifiant · single »)');
    if (!q.langs.has(lang)) q.langs.set(lang, { prompt: '', choices: [], answers: [], explanation: '' });
    return q.langs.get(lang)!;
  };
  for (const line of body.replace(/\r\n?/g, '\n').split('\n')) {
    if (/^\s*`{3,}/.test(line)) inCode = !inCode;
    const head = !inCode && /^##\s+(.+?)\s*$/.exec(line);
    if (head) {
      const [, id, type, option] = /^(\S+)(?:\s*[·|]\s*(\S+))?(?:\s*[·|]\s*(\S+))?$/.exec(head[1]) ?? [];
      if (!id) throw new Error(`titre de question illisible : « ${line} »`);
      if (type && !TYPES.includes(type)) throw new Error(`${id} : type « ${type} » inconnu (${TYPES.join(', ')})`);
      if (option && !(type === 'short' && option === 'case-sensitive'))
        throw new Error(`${id} : option « ${option} » inconnue (seule « short · case-sensitive » existe)`);
      q = { id, type: type as RawQuestion['type'], caseSensitive: option === 'case-sensitive' || undefined, langs: new Map() };
      out.push(q);
      lang = mainLang;
      part = 'prompt';
      continue;
    }
    const sub = !inCode && /^###\s+([a-z]{2,3})\s*$/.exec(line);
    if (sub) {
      if (!q) throw new Error(`« ${line} » avant la première question`);
      lang = sub[1];
      part = 'prompt';
      continue;
    }
    if (!q && !line.trim()) continue;
    const c = cur();
    const choice = !inCode && /^- \[( |x|X)\]\s+(.*)$/.exec(line);
    const typedAnswer = !inCode && /^=\s+(.*\S)\s*$/.exec(line);
    if (typedAnswer) {
      if (part === 'explanation') throw new Error(`${q!.id} : une réponse suit l'explication`);
      part = 'choices';
      c.answers.push(typedAnswer[1]);
    } else if (choice) {
      if (part === 'explanation') throw new Error(`${q!.id} : une réponse suit l'explication`);
      part = 'choices';
      c.choices.push({ correct: choice[1] !== ' ', text: choice[2] });
    } else if (!inCode && /^>/.test(line) && (part !== 'prompt' || c.prompt.trim())) {
      // Après l'énoncé, une citation est l'explication (une question à saisie peut ne rien avoir entre les deux).
      part = 'explanation';
      c.explanation += line.replace(/^> ?/, '') + '\n';
    } else if (part === 'prompt') {
      c.prompt += line + '\n';
    } else if (part === 'choices' && c.choices.length && /^\s+\S/.test(line)) {
      c.choices[c.choices.length - 1].text += '\n' + line.trim(); // suite d'une réponse, en retrait
    } else if (line.trim()) {
      throw new Error(`${q!.id} : ligne inattendue après les réponses : « ${line.trim()} »`);
    }
  }
  if (inCode) throw new Error('bloc de code non refermé');
  return out;
}

const i18nText = (v: unknown, what: string): I18nText => {
  if (typeof v === 'string') throw new Error(`${what} : un texte par langue est attendu, ex. { fr: "…", en: "…" }`);
  if (!v || typeof v !== 'object') throw new Error(`${what} manquant`);
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, String(x)]));
};

/**
 * En français, une virgule entre deux chiffres est décimale ; LaTeX y mettrait une espace : elle est
 * protégée par des accolades (« 9{,}81 »). Sauf dans \pu{…} et \ce{…}, que mhchem met déjà en forme
 * (il y écrirait sinon « 9 ,81 »).
 */
export function frenchDecimals(latex: string): string {
  let out = '';
  let i = 0;
  const re = /\\(?:pu|ce)\s*\{/g;
  for (let m = re.exec(latex); m; m = re.exec(latex)) {
    out += latex.slice(i, m.index).replace(/(\d),(?=\d)/g, '$1{,}');
    let depth = 1;
    let k = m.index + m[0].length;
    for (; k < latex.length && depth; k++) depth += latex[k] === '{' ? 1 : latex[k] === '}' ? -1 : 0;
    out += latex.slice(m.index, k);
    i = re.lastIndex = k;
  }
  return out + latex.slice(i).replace(/(\d),(?=\d)/g, '$1{,}');
}

/** Compile un module. Les erreurs sont rassemblées dans `issues` : rien n'est écrit s'il y en a. */
export function compileModule(files: readonly SourceFile[], assets: readonly Asset[] = []): Compiled {
  const issues: Issue[] = [];
  const assetByPath = new Map(assets.map((a) => [a.path, a]));
  const usedAssets = new Set<string>();
  const features = new Set<string>();

  /** Images et formules d'un fichier source, dans une langue (les chemins d'image sont relatifs au fichier). */
  const context = (file: string, lang: string): MarkdownContext => ({
    image(src, alt) {
      const dir = file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : '';
      const parts: string[] = [];
      for (const p of (dir + src).split('/')) {
        if (p === '..') parts.pop();
        else if (p && p !== '.') parts.push(p);
      }
      const asset = assetByPath.get(parts.join('/'));
      if (!asset) throw new Error(`image « ${src} » introuvable`);
      if (!asset.mime) throw new Error(`image « ${src} » : format non reconnu, ou SVG mal formé (PNG, JPEG, GIF, WebP, SVG)`);
      if (!alt) throw new Error(`image « ${src} » sans texte alternatif : écrire ![description](${src})`);
      usedAssets.add(asset.path);
      if (asset.mime === 'image/svg+xml') features.add('svg');
      return { type: 'image', attrs: { hash: asset.hash, alt } };
    },
    math(latex) {
      const tex = lang === 'fr' ? frenchDecimals(latex) : latex;
      const problem = mathError(tex);
      if (problem) throw new Error(`formule « ${latex} » : ${problem}`);
      features.add('math');
      return tex;
    },
  });

  const err = (file: string, message: string, ref?: string) => issues.push({ level: 'error', file, message, ref });
  const warn = (file: string, message: string, ref?: string) => issues.push({ level: 'warning', file, message, ref });
  const byPath = new Map(files.map((f) => [f.path, f]));

  const src = byPath.get('module.yaml');
  if (!src) throw new Error('module.yaml introuvable');
  const y = (parseYaml(src.text) ?? {}) as Record<string, unknown>;
  const id = String(y.id ?? '');
  const version = String(y.version ?? '');
  const languages = (Array.isArray(y.languages) ? y.languages : ['fr']).map(String);
  const main = languages[0];
  if (!languages.every((l) => LANG.test(l))) err('module.yaml', 'languages : codes de langue attendus, ex. [fr, en]');
  const date = y.date instanceof Date ? y.date : new Date(String(y.date ?? ''));
  if (Number.isNaN(date.getTime())) err('module.yaml', 'date : date de publication attendue (AAAA-MM-JJ)');
  const ts = Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
  const prefix = modulePrefix(id);
  const authors = (Array.isArray(y.authors) ? y.authors : []).map(String);
  const defaults = (y.defaults ?? {}) as Record<string, unknown>;

  const needLangs = (rec: Record<string, unknown>, file: string, what: string, ref?: string) => {
    for (const l of languages) if (!(l in rec) || rec[l] === '') err(file, `${what} : texte manquant en « ${l} »`, ref);
    for (const l of Object.keys(rec)) if (!languages.includes(l)) err(file, `${what} : langue « ${l} » absente de module.yaml`, ref);
  };

  const categories: Category[] = [];
  const quizzes: Quiz[] = [];
  const sheets: Record<string, I18nRich> = {};
  const stats: Compiled['stats'] = [];
  const seenQuiz = new Map<string, string>();
  const seenQuestion = new Map<string, string>();
  const usedFiles = new Set(['module.yaml']);

  const cats = Array.isArray(y.categories) ? (y.categories as Record<string, unknown>[]) : [];
  if (!cats.length) err('module.yaml', 'categories : au moins une catégorie est attendue');
  cats.forEach((c, position) => {
    const local = String(c?.id ?? '');
    if (!LOCAL_ID.test(local)) return err('module.yaml', `catégorie « ${local} » : identifiant en minuscules, chiffres et tirets`);
    if (categories.some((o) => o.id === prefix + local)) return err('module.yaml', `catégorie « ${local} » déclarée deux fois`);
    const catId = prefix + local;
    try {
      const name = i18nText(c.name, `catégorie ${local} : name`);
      needLangs(name, 'module.yaml', `catégorie ${local} : name`);
      categories.push({ id: catId, parentId: null, name, position, color: c.color ? String(c.color) : null });
    } catch (e) {
      return err('module.yaml', (e as Error).message);
    }

    // Fiche de révision : fiche.<langue>.md
    const sheet: I18nRich = {};
    for (const l of languages) {
      const f = byPath.get(`${local}/fiche.${l}.md`);
      if (!f) continue;
      usedFiles.add(f.path);
      try {
        sheet[l] = toDocument(f.text.trim(), context(f.path, l));
        if (isEmptyRich(sheet[l])) err(f.path, 'fiche vide');
      } catch (e) {
        err(f.path, (e as Error).message);
      }
    }
    if (Object.keys(sheet).length) {
      needLangs(sheet, `${local}/`, 'fiche de révision');
      sheets[catId] = sheet;
    }

    const quizFiles = files
      .filter((f) => f.path.startsWith(`${local}/`) && f.path.endsWith('.md') && !/\/fiche\.[a-z]{2,3}\.md$/.test(f.path))
      .sort((a, b) => a.path.localeCompare(b.path, 'en'));
    if (!quizFiles.length) warn('module.yaml', `catégorie « ${local} » sans QCM`);
    for (const f of quizFiles) {
      usedFiles.add(f.path);
      try {
        const quiz = compileQuiz(f);
        quizzes.push(quiz);
        const level = quiz.level ?? '—';
        const row = stats.find((s) => s.category === local && s.level === level);
        if (row) (row.quizzes++, (row.questions += quiz.questions.length));
        else stats.push({ category: local, level, quizzes: 1, questions: quiz.questions.length });
      } catch (e) {
        err(f.path, (e as Error).message);
      }
    }

    function compileQuiz(f: SourceFile): Quiz {
      const { meta, body } = splitFrontMatter(f.text);
      const localId = String(meta.id ?? '');
      if (!LOCAL_ID.test(localId)) throw new Error(`id « ${localId} » : minuscules, chiffres et tirets attendus`);
      const quizId = prefix + localId;
      if (seenQuiz.has(quizId)) throw new Error(`id « ${localId} » déjà utilisé par ${seenQuiz.get(quizId)}`);
      seenQuiz.set(quizId, f.path);
      const title = i18nText(meta.title, 'title');
      needLangs(title, f.path, 'title');
      const description = meta.description ? i18nText(meta.description, 'description') : null;
      if (description) needLangs(description, f.path, 'description');
      const level = meta.level == null ? null : String(meta.level);
      if (!level) warn(f.path, `level manquant (${LEVELS.join(', ')})`);
      else if (!LEVELS.includes(level)) warn(f.path, `level « ${level} » inhabituel (${LEVELS.join(', ')})`);
      const opt = <T>(key: string, fallback: T): T => (meta[key] ?? defaults[key] ?? fallback) as T;

      const questions: Question[] = [];
      splitQuestions(body, main).forEach((raw, qPos) => {
        const ref = raw.id;
        if (!LOCAL_ID.test(raw.id)) return err(f.path, 'identifiant de question en minuscules, chiffres et tirets', ref);
        const qId = `${quizId}_${raw.id}`;
        if (qId.length > 100) return err(f.path, 'identifiant trop long (100 caractères avec le préfixe)', ref);
        if (seenQuestion.has(qId)) return err(f.path, `identifiant déjà utilisé dans ${seenQuestion.get(qId)}`, ref);
        seenQuestion.set(qId, f.path);
        for (const l of raw.langs.keys()) if (!languages.includes(l)) err(f.path, `langue « ${l} » absente de module.yaml`, ref);
        const first = raw.langs.get(main);
        if (!first) return err(f.path, `texte manquant en « ${main} »`, ref);

        const flags = first.choices.map((c) => c.correct);
        const right = flags.filter(Boolean).length;
        const type: QuestionType = raw.type ?? (first.answers.length && !flags.length ? 'short' : right > 1 ? 'multiple' : 'single');
        const typed = type === 'short' || type === 'numeric' || type === 'cloze' || type === 'expression';

        // Questions à saisie : lignes « = réponse ». Les formes acceptées de toutes les langues s'additionnent.
        let expected: ExpectedAnswer | null = null;
        if (type === 'cloze') {
          // Lignes « = texte avec {trous} ». Une langue sans texte reprend celui de la langue principale.
          if (flags.length) err(f.path, 'texte à trous : pas de réponses à cocher (« - [ ] »)', ref);
          const main0 = parseClozeSource(first.answers.join('\n'));
          if (!main0.gaps.length) err(f.path, 'texte à trous : ligne « = texte avec {trou} » manquante ou sans trou', ref);
          if (main0.gaps.some((g) => !g.accepted.length || !g.accepted[0])) err(f.path, 'texte à trous : un trou est vide', ref);
          if (main0.gaps.some((g) => g.kind === 'select' && !g.options?.length)) err(f.path, 'texte à trous : une liste n’a qu’une proposition', ref);
          const text: Record<string, string> = {};
          for (const l of languages) {
            const lines = raw.langs.get(l)?.answers ?? [];
            if (!lines.length || l === main) {
              text[l] = main0.text;
              continue;
            }
            const other = parseClozeSource(lines.join('\n'));
            if (JSON.stringify(other.gaps) !== JSON.stringify(main0.gaps))
              err(f.path, `texte à trous : les trous en « ${l} » diffèrent de ceux en « ${main} »`, ref);
            text[l] = other.text;
          }
          expected = { text, gaps: main0.gaps };
        } else if (typed) {
          const all = [...new Set(languages.flatMap((l) => raw.langs.get(l)?.answers ?? []).map((a) => a.trim()))];
          if (flags.length) err(f.path, `question « ${type} » : pas de réponses à cocher (« - [ ] »), seulement des lignes « = réponse »`, ref);
          if (!all.length) err(f.path, 'réponse attendue manquante (ligne « = réponse »)', ref);
          if (type === 'short') expected = { accepted: all, ...(raw.caseSensitive ? { caseSensitive: true } : {}) };
          else if (type === 'expression') {
            if (all.length > 1) err(f.path, 'expression : une seule formule attendue (la même dans chaque langue)', ref);
            else if (all.length) {
              const r = parseExpressionAnswer(all[0]);
              if (r.problem) err(f.path, `expression attendue illisible : « ${all[0]} » (${r.problem})`, ref);
              else expected = r.expected;
            }
          } else if (all.length > 1) err(f.path, 'réponse numérique : une seule valeur attendue (la même dans chaque langue)', ref);
          else if (all.length) {
            expected = parseNumericAnswer(all[0]);
            if (!expected) err(f.path, `réponse numérique illisible : « ${all[0]} » (ex. « = 9,81 ± 0,01 m/s² »)`, ref);
          }
        } else if (first.answers.length) {
          err(f.path, `ligne « = réponse » dans une question « ${type} » (types à saisie : short, numeric, expression)`, ref);
        }

        if (typed) {
          // rien à vérifier sur les réponses à cocher
        } else if (type === 'single' && right !== 1) err(f.path, `choix unique : exactement une bonne réponse attendue (${right} cochée(s))`, ref);
        if (type === 'multiple' && right < 1) err(f.path, 'choix multiple : au moins une bonne réponse attendue', ref);
        if (typed) {
          // pas de réponses à cocher
        } else if (flags.length < 2) err(f.path, 'au moins deux réponses attendues', ref);
        else if (flags.length < 3 || flags.length > 5) warn(f.path, `${flags.length} réponses (3 à 5 conseillées)`, ref);

        const prompt: I18nRich = {};
        const explanation: I18nRich = {};
        const contents: I18nRich[] = flags.map(() => ({}));
        for (const l of languages) {
          const t = raw.langs.get(l);
          if (!t) {
            err(f.path, `texte manquant en « ${l} »`, ref);
            continue;
          }
          try {
            const ctx = context(f.path, l);
            prompt[l] = toRich(t.prompt, ctx);
            if (isEmptyRich(prompt[l])) err(f.path, `énoncé vide (${l})`, ref);
            if (!t.explanation.trim()) err(f.path, `explication manquante (${l})`, ref);
            else explanation[l] = toRich(t.explanation, ctx);
            if (typed) continue;
            if (t.choices.length !== flags.length || t.choices.some((c, k) => c.correct !== flags[k])) {
              err(f.path, `les réponses en « ${l} » ne correspondent pas à celles en « ${main} » (nombre, ordre ou cases cochées)`, ref);
              continue;
            }
            t.choices.forEach((c, k) => {
              contents[k][l] = toRich(c.text, ctx);
              if (isEmptyRich(contents[k][l])) err(f.path, `réponse ${k + 1} vide (${l})`, ref);
            });
            const texts = t.choices.map((c) => c.text.trim());
            if (new Set(texts).size !== texts.length) err(f.path, `deux réponses identiques (${l})`, ref);
            if (/toutes les réponses|aucune des réponses|all of the above|none of the above/i.test(texts.join('\n')))
              warn(f.path, `« toutes / aucune des réponses » à éviter (${l})`, ref);
          } catch (e) {
            err(f.path, `${(e as Error).message} (${l})`, ref);
          }
        }
        questions.push({
          id: qId,
          type,
          prompt,
          points: 1,
          position: qPos,
          explanation,
          choices: typed ? [] : flags.map((correct, k) => ({ id: `${qId}_c${k + 1}`, content: contents[k], correct, position: k, feedback: null })),
          ...(typed ? { expected } : {}),
        });
      });
      if (!questions.length) err(f.path, 'aucune question');
      else if (questions.length < 10 || questions.length > 15) warn(f.path, `${questions.length} questions (10 à 15 conseillées)`);

      return {
        id: quizId,
        categoryId: catId,
        title,
        description,
        languages,
        level,
        tags: (Array.isArray(meta.tags) ? meta.tags : []).map(String),
        timeLimitSec: opt<number | null>('timeLimitSec', null),
        passThreshold: opt('passThreshold', 0.7),
        scoring: opt<Quiz['scoring']>('scoring', 'all_or_nothing'),
        solutionVisibility: opt<Quiz['solutionVisibility']>('solutionVisibility', 'after_submit'),
        shuffle: opt('shuffle', true),
        status: 'published',
        version: quizVersionOf(version),
        author: authors.join(', ') || null,
        createdAt: ts,
        updatedAt: ts,
        questions,
      };
    }
  });

  for (const f of files) if (!usedFiles.has(f.path) && f.path.endsWith('.md')) warn(f.path, 'fichier hors de toute catégorie déclarée : ignoré');

  const manifest: ModuleManifest = {
    format: MODULE_FORMAT,
    formatVersion: MODULE_FORMAT_VERSION,
    id,
    version,
    title: (y.title ?? {}) as I18nText,
    description: (y.description as I18nText) ?? null,
    level: y.level == null ? null : String(y.level),
    license: String(y.license ?? ''),
    authors,
    homepage: y.homepage == null ? null : String(y.homepage),
    // Les fonctions de rendu réellement utilisées (formules, SVG) s'ajoutent à celles déclarées.
    requires: (() => {
      const declared = (y.requires ?? {}) as NonNullable<ModuleManifest['requires']>;
      const all = [...new Set([...(declared.features ?? []), ...features])].sort();
      return y.requires || all.length ? { ...declared, ...(all.length ? { features: all } : {}) } : null;
    })(),
    categories: categories.map((c) => c.id),
    quizzes: quizzes.map((q) => q.id),
    sheets: Object.keys(sheets).length ? sheets : null,
  };

  // Validation par les schémas du format d'échange (les mêmes qu'à l'import).
  const zerr = (file: string, e: { issues: { path: PropertyKey[]; message: string }[] }) =>
    e.issues.slice(0, 5).forEach((i) => err(file, `${i.path.join('.')} : ${i.message}`));
  const m = ModuleSchema.safeParse(manifest);
  if (!m.success) zerr('module.yaml', m.error);
  if (typeof y.title === 'object' && y.title) needLangs(y.title as Record<string, unknown>, 'module.yaml', 'title');
  if (typeof y.description === 'object' && y.description) needLangs(y.description as Record<string, unknown>, 'module.yaml', 'description');
  if (!authors.length) warn('module.yaml', 'authors : aucun auteur à citer');
  for (const c of categories) {
    const r = CategorySchema.safeParse(c);
    if (!r.success) zerr('module.yaml', r.error);
  }
  for (const q of quizzes) {
    const r = QuizSchema.safeParse(q);
    if (!r.success) zerr(seenQuiz.get(q.id) ?? q.id, r.error);
  }
  for (const a of assets) if (!usedAssets.has(a.path)) warn(a.path, 'image non utilisée : elle ne sera pas jointe au module');
  return { manifest, quizzes, categories, issues, stats, assets: [...usedAssets].sort() };
}

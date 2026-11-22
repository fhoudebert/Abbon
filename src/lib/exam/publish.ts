/**
 * Export d'un site d'examen corrigé par le serveur : les QCM publiés sans leurs réponses, et le corrigé
 * (`examen/solutions.php`) lu par le script de correction (server.ts, corriger.php).
 */
import { bytesToB64 } from '$lib/data/bytes';
import { expressionSamples } from '$lib/domain/expr';
import { localize } from '$lib/domain/text';
import { expectedText, hasChoices } from '$lib/domain/typed';
import type { Question, Quiz } from '$lib/domain/types';
import { stripSolutions } from '$lib/interchange/qcmPackage';
import type { SiteSolutions } from '$lib/site';
/**
 * QCM tel que publié dans le site : sans bonnes réponses, formes acceptées, valeurs ni explications
 * (voir `stripSolutions`). Restent le verso des cartes recto-verso (rien n'y est à deviner) et, pour les
 * expressions, les points de test où le lecteur évaluera la formule de l'élève.
 */
export function publicQuiz(quiz: Quiz): Quiz {
  const out = stripSolutions(quiz);
  const byId = new Map(quiz.questions.map((q) => [q.id, q]));
  out.questions = out.questions.map((q) => {
    const full = byId.get(q.id)!;
    if (q.type === 'flashcard') return { ...q, explanation: full.explanation ?? null };
    if (q.type === 'expression' && full.expected?.latex) {
      const { samples } = expressionSamples(full.expected.latex, { constant: full.expected.constant });
      return { ...q, expected: { ...(q.expected ?? {}), samples } };
    }
    return q;
  });
  return out;
}

/** Corrigé lu par corriger.php. */
export interface ServerSolutions {
  version: 1;
  /** Choix de l'export ; reglages.js, s'il est lisible par le serveur, l'emporte. */
  corrige: 'fin' | 'jamais' | 'enseignant';
  quizzes: Record<
    string,
    {
      /** Titre affiché dans la liste des copies. */
      title: string;
      /** Durée du QCM (secondes), si elle est fixée : contrôlée par le serveur. */
      timeLimitSec: number | null;
      scoring: Quiz['scoring'];
      passThreshold: number;
      questions: Record<string, Record<string, unknown>>;
    }
  >;
}

export function serverSolutions(quizzes: readonly Quiz[], solutions: SiteSolutions): ServerSolutions {
  const out: ServerSolutions = { version: 1, corrige: solutions === 'never' ? 'jamais' : solutions === 'teacher' ? 'enseignant' : 'fin', quizzes: {} };
  for (const quiz of quizzes) {
    const questions: Record<string, Record<string, unknown>> = {};
    const lang = quiz.languages[0] ?? 'fr';
    for (const q of [...quiz.questions].sort((a, b) => a.position - b.position)) {
      const entry: Record<string, unknown> = {
        type: q.type,
        points: q.points,
        display: displayOf(q, lang),
        choices: q.choices.map((c) => ({ id: c.id, correct: c.correct, feedback: c.feedback ?? null })),
        expected: q.expected ?? null,
        explanation: q.explanation ?? null,
      };
      if (q.type === 'expression' && q.expected?.latex) {
        try {
          const { values, hasVars } = expressionSamples(q.expected.latex, { constant: q.expected.constant });
          Object.assign(entry, { values, hasVars });
        } catch {
          /* attendue illisible : la question sera toujours fausse, comme dans l'application */
        }
      }
      questions[q.id] = entry;
    }
    const title = quiz.title[quiz.languages[0]] ?? Object.values(quiz.title)[0] ?? quiz.id;
    out.quizzes[quiz.id] = { title, timeLimitSec: quiz.timeLimitSec ?? null, scoring: quiz.scoring, passThreshold: quiz.passThreshold, questions };
  }
  return out;
}

/**
 * LaTeX rendu lisible en texte simple (la page de l'espace enseignant n'affiche pas les formules) :
 * « \displaystyle\int_0^2 3x^2\,\mathrm{d}x » → « ∫_0^2 3x^2 dx ».
 */
export function plainMath(text: string): string {
  const symbols: Record<string, string> = {
    int: '∫', sum: '∑', infty: '∞', neq: '≠', leq: '≤', geq: '≥', le: '≤', ge: '≥', times: '×', cdot: '·', mapsto: '↦',
    to: '→', rightarrow: '→', Rightarrow: '⇒', Leftrightarrow: '⇔', in: '∈', approx: '≈', pm: '±', pi: 'π', alpha: 'α',
    beta: 'β', theta: 'θ', lambda: 'λ', mu: 'μ', sigma: 'σ', omega: 'ω', Delta: 'Δ', ln: 'ln', exp: 'exp', sqrt: '√',
    cos: 'cos', sin: 'sin', tan: 'tan', lim: 'lim', ldots: '…', dots: '…', cdots: '…', R: 'ℝ', N: 'ℕ', Z: 'ℤ',
  };
  let t = text
    .replace(/\\(displaystyle|textstyle|left|right|big|Big|limits)\b/g, '')
    .replace(/\\[,;:!]|~/g, ' ')
    .replace(/\\(?:mathrm|text|mathbb|mathbf|operatorname|vec|overrightarrow)\{([^{}]*)\}/g, (_m, a: string) => symbols[a] ?? a);
  // Exposants et indices, puis fractions, de l'intérieur vers l'extérieur.
  for (let i = 0; i < 4; i++) {
    t = t
      .replace(/([_^])\{([^{}]*)\}/g, (_m, op: string, a: string) => (a.length > 1 ? `${op}(${a})` : `${op}${a}`))
      .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_m, a: string, b: string) => `${a.length > 1 ? `(${a})` : a}/${b.length > 1 ? `(${b})` : b}`);
  }
  t = t.replace(/\\([A-Za-z]+)/g, (m, name: string) => symbols[name] ?? m);
  for (let i = 0; i < 3; i++) t = t.replace(/\{([^{}]*)\}/g, '$1');
  return t.replace(/\s+/g, ' ').trim();
}

/** Textes de la question pour l'espace enseignant (détail d'une copie, statistiques) : énoncé, choix, réponse attendue. */
export function displayOf(q: Question, lang: string): { prompt: string; choices: Record<string, string>; expected: string } {
  const short = (t: string, n: number) => {
    const p = plainMath(t);
    return p.length > n ? `${p.slice(0, n - 1)}…` : p;
  };
  const choices = Object.fromEntries(
    [...q.choices].sort((a, b) => a.position - b.position).map((c) => [c.id, short(localize(c.content, lang).trim() || '—', 200)]),
  );
  const expected = hasChoices(q)
    ? q.choices.filter((c) => c.correct).map((c) => choices[c.id]).join(' ; ')
    : q.type === 'flashcard'
      ? '(autoévaluation)'
      : expectedText(q, lang);
  return { prompt: short(localize(q.prompt, lang).replace(/\s+/g, ' ').trim() || '—', 300), choices, expected: short(expected, 300) };
}

/** Texte de `examen/solutions.php` : le corrigé, en base 64, servi seulement à corriger.php. */
export function solutionsPhp(data: ServerSolutions): string {
  const b64 = bytesToB64(new TextEncoder().encode(JSON.stringify(data)));
  return `<?php
// Corrigé de l'examen Abbon, lu par corriger.php. Ouvert directement dans un navigateur, il ne renvoie rien.
if (!defined('ABBON_EXAMEN')) { http_response_code(404); exit; }
return json_decode(base64_decode('${b64}'), true);
`;
}

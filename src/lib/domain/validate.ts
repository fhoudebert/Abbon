import { imagesWithoutAlt, isEmptyRich } from './rich';
import { gapOptions, markersMatch } from './cloze';
import { expressionProblem } from './expr';
import { isTyped } from './typed';
import type { Quiz } from './types';

export type IssueCode =
  | 'title_empty'
  | 'no_question'
  | 'prompt_empty'
  | 'too_few_choices'
  | 'choice_empty'
  | 'single_needs_one_correct'
  | 'multiple_needs_correct'
  | 'short_needs_answer'
  | 'numeric_needs_value'
  | 'expression_needs_answer'
  | 'expression_invalid'
  | 'cloze_needs_gap'
  | 'cloze_markers'
  | 'cloze_gap_empty'
  | 'cloze_select_options'
  | 'points_invalid'
  | 'image_without_alt'
  | 'translation_missing';

export interface Issue {
  level: 'error' | 'warning';
  code: IssueCode;
  /** Question concernée (absente pour les problèmes du QCM lui-même). */
  questionId?: string;
  /** Rang de la question, à partir de 1. */
  questionNumber?: number;
  lang?: string;
  /** Précision (message de l'analyseur d'expressions). */
  detail?: string;
}

/**
 * Contrôles avant publication. Les erreurs bloquent la publication,
 * les avertissements sont seulement signalés.
 */
export function validateQuiz(quiz: Quiz): Issue[] {
  const issues: Issue[] = [];
  const [main, ...others] = quiz.languages.length ? quiz.languages : ['fr'];

  if (!quiz.title[main]?.trim()) issues.push({ level: 'error', code: 'title_empty', lang: main });
  if (quiz.questions.length === 0) issues.push({ level: 'error', code: 'no_question' });

  [...quiz.questions]
    .sort((a, b) => a.position - b.position)
    .forEach((q, i) => {
      const at = { questionId: q.id, questionNumber: i + 1 };
      if (isEmptyRich(q.prompt[main])) issues.push({ level: 'error', code: 'prompt_empty', lang: main, ...at });
      const typed = isTyped(q);
      if (q.type === 'short' && !(q.expected?.accepted ?? []).some((a) => a.trim()))
        issues.push({ level: 'error', code: 'short_needs_answer', ...at });
      if (q.type === 'numeric' && !(typeof q.expected?.value === 'number' && Number.isFinite(q.expected.value) && (q.expected.tolerance ?? 0) >= 0))
        issues.push({ level: 'error', code: 'numeric_needs_value', ...at });
      if (q.type === 'expression') {
        const latex = q.expected?.latex?.trim() ?? '';
        if (!latex) issues.push({ level: 'error', code: 'expression_needs_answer', ...at });
        else {
          const problem = expressionProblem(latex, { constant: q.expected?.constant });
          if (problem) issues.push({ level: 'error', code: 'expression_invalid', detail: problem, ...at });
        }
      }
      if (q.type === 'cloze') {
        const gaps = q.expected?.gaps ?? [];
        const text = q.expected?.text ?? {};
        if (gaps.length === 0) issues.push({ level: 'error', code: 'cloze_needs_gap', ...at });
        else {
          // Le texte de chaque langue renseignée doit contenir chaque trou une fois ; celui de la langue principale est obligatoire.
          for (const lang of [main, ...others])
            if ((lang === main || text[lang]?.trim()) && !markersMatch(text[lang] ?? '', gaps.length))
              issues.push({ level: 'error', code: 'cloze_markers', lang, ...at });
          if (gaps.some((g) => !g.accepted.some((a) => a.trim()))) issues.push({ level: 'error', code: 'cloze_gap_empty', ...at });
          if (gaps.some((g) => g.kind === 'select' && gapOptions(g).length < 2))
            issues.push({ level: 'error', code: 'cloze_select_options', ...at });
        }
      }
      if (!typed && q.choices.length < 2) issues.push({ level: 'error', code: 'too_few_choices', ...at });
      if (!typed && q.choices.some((c) => isEmptyRich(c.content[main])))
        issues.push({ level: 'error', code: 'choice_empty', lang: main, ...at });
      const correct = q.choices.filter((c) => c.correct).length;
      if (q.type === 'single' && correct !== 1)
        issues.push({ level: 'error', code: 'single_needs_one_correct', ...at });
      if (q.type === 'multiple' && correct < 1)
        issues.push({ level: 'error', code: 'multiple_needs_correct', ...at });
      if (!(q.points > 0)) issues.push({ level: 'error', code: 'points_invalid', ...at });

      const values = [q.prompt, q.explanation ?? {}, ...q.choices.map((c) => c.content)].flatMap((r) =>
        Object.values(r),
      );
      if (values.some((v) => imagesWithoutAlt(v) > 0))
        issues.push({ level: 'warning', code: 'image_without_alt', ...at });

      for (const lang of others) {
        const missing =
          isEmptyRich(q.prompt[lang]) || (!typed && q.choices.some((c) => isEmptyRich(c.content[lang])));
        if (missing) issues.push({ level: 'warning', code: 'translation_missing', lang, ...at });
      }
    });

  for (const lang of others)
    if (!quiz.title[lang]?.trim()) issues.push({ level: 'warning', code: 'translation_missing', lang });

  return issues;
}

export const canPublish = (issues: readonly Issue[]) => !issues.some((i) => i.level === 'error');

import { imagesWithoutAlt, isEmptyRich } from './rich';
import type { Quiz } from './types';

export type IssueCode =
  | 'title_empty'
  | 'no_question'
  | 'prompt_empty'
  | 'too_few_choices'
  | 'choice_empty'
  | 'single_needs_one_correct'
  | 'multiple_needs_correct'
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
      if (q.choices.length < 2) issues.push({ level: 'error', code: 'too_few_choices', ...at });
      if (q.choices.some((c) => isEmptyRich(c.content[main])))
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
          isEmptyRich(q.prompt[lang]) || q.choices.some((c) => isEmptyRich(c.content[lang]));
        if (missing) issues.push({ level: 'warning', code: 'translation_missing', lang, ...at });
      }
    });

  for (const lang of others)
    if (!quiz.title[lang]?.trim()) issues.push({ level: 'warning', code: 'translation_missing', lang });

  return issues;
}

export const canPublish = (issues: readonly Issue[]) => !issues.some((i) => i.level === 'error');

import { richToPlain } from './rich';
import { newId } from './text';
import type { Choice, Lang, Question, QuestionType, Quiz } from './types';

/** Nouveau QCM vide (brouillon) dans la langue donnée. */
export function newQuiz(lang: Lang, now = new Date()): Quiz {
  const ts = now.toISOString();
  return {
    id: newId(),
    categoryId: null,
    title: { [lang]: '' },
    description: null,
    languages: [lang],
    level: null,
    tags: [],
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
    questions: [],
  };
}

export function newChoice(position: number): Choice {
  return { id: newId(), content: {}, correct: false, position, feedback: null };
}

const typed = (type: QuestionType) => type === 'short' || type === 'numeric' || type === 'cloze' || type === 'expression';
const emptyExpected = (type: QuestionType) =>
  type === 'short' ? { accepted: [''] } : type === 'numeric' ? { tolerance: 0 } : type === 'cloze' ? { text: {}, gaps: [] } : type === 'expression' ? { latex: '' } : null;

/**
 * Nouvelle question : deux réponses vides à cocher (la première marquée juste en choix unique),
 * ou une réponse attendue vide pour une question à saisie.
 */
export function newQuestion(type: QuestionType, position: number): Question {
  const choices = typed(type) ? [] : [newChoice(0), newChoice(1)];
  if (type === 'single') choices[0].correct = true;
  return { id: newId(), type, prompt: {}, points: 1, position, explanation: null, choices, expected: emptyExpected(type) };
}

/** Copie d'une question avec de nouveaux identifiants. */
export function cloneQuestion(q: Question, position: number): Question {
  const copy = structuredClone(q);
  return { ...copy, id: newId(), position, choices: copy.choices.map((c) => ({ ...c, id: newId() })) };
}

/** Copie d'un QCM (brouillon, nouveaux identifiants, titre suffixé). */
export function cloneQuiz(quiz: Quiz, suffix: string, now = new Date()): Quiz {
  const copy = structuredClone(quiz);
  const ts = now.toISOString();
  return {
    ...copy,
    id: newId(),
    title: Object.fromEntries(Object.entries(copy.title).map(([l, v]) => [l, v ? `${v} ${suffix}` : v])),
    status: 'draft',
    version: 1,
    createdAt: ts,
    updatedAt: ts,
    questions: copy.questions.map((q) => cloneQuestion(q, q.position)),
  };
}

/** Renumérote les positions selon l'ordre du tableau. */
export function renumber<T extends { position: number }>(items: T[]): T[] {
  items.forEach((it, i) => (it.position = i));
  return items;
}

/** Déplace l'élément `index` de `delta` places (sans sortir du tableau). */
export function move<T extends { position: number }>(items: T[], index: number, delta: number): T[] {
  const to = index + delta;
  if (to < 0 || to >= items.length) return items;
  const [it] = items.splice(index, 1);
  items.splice(to, 0, it);
  return renumber(items);
}

/** Bascule « bonne réponse » ; en choix unique, une seule bonne réponse à la fois. */
export function toggleCorrect(q: Question, choiceId: string) {
  for (const c of q.choices) {
    if (c.id === choiceId) c.correct = q.type === 'single' ? true : !c.correct;
    else if (q.type === 'single') c.correct = false;
  }
}

/** Change le type ; vers « choix unique », ne garde que la première bonne réponse. */
export function setQuestionType(q: Question, type: QuestionType) {
  const was = q.type;
  q.type = type;
  if (typed(type)) {
    // Question à saisie : plus de réponses à cocher. La bonne réponse d'un choix unique sert d'amorce.
    if (was !== type) {
      const first = q.choices.find((c) => c.correct);
      const seed = first ? Object.values(first.content).map((v) => richToPlain(v)).find(Boolean) : undefined;
      q.expected = type === 'short' ? { accepted: [seed ?? ''] } : emptyExpected(type);
    }
    q.choices = [];
    return;
  }
  q.expected = null;
  if (q.choices.length === 0) {
    q.choices = [newChoice(0), newChoice(1)];
    if (type === 'single') q.choices[0].correct = true;
  }
  if (type === 'single') {
    let seen = false;
    for (const c of q.choices) {
      if (c.correct && !seen) seen = true;
      else c.correct = false;
    }
  }
}

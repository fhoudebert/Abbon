import type { Attempt, Category, Question, Quiz } from '$lib/domain/types';
import type { Repository } from './repository';

/**
 * Données de démonstration, installées au premier lancement.
 * Elles permettent de vérifier l'affichage des trois listes (à faire, en cours, faits)
 * avant que l'éditeur et le passage de QCM n'existent (lots 1 et 2).
 */
const SEEDED_KEY = 'demo_seeded';

const now = () => new Date().toISOString();

const q = (
  id: string,
  type: Question['type'],
  fr: string,
  en: string,
  choices: [string, string, boolean][],
  explanation?: [string, string],
): Question => ({
  id,
  type,
  prompt: { fr, en },
  points: 1,
  position: Number(id.split('-').pop()),
  explanation: explanation ? { fr: explanation[0], en: explanation[1] } : null,
  choices: choices.map(([cfr, cen, correct], i) => ({
    id: `${id}-c${i}`,
    content: { fr: cfr, en: cen },
    correct,
    position: i,
    feedback: null,
  })),
});

const baseQuiz = (id: string, categoryId: string, title: [string, string], desc: [string, string]) => {
  const t = now();
  return {
    id,
    categoryId,
    title: { fr: title[0], en: title[1] },
    description: { fr: desc[0], en: desc[1] },
    languages: ['fr', 'en'],
    level: null,
    tags: ['démo'],
    timeLimitSec: null,
    passThreshold: 0.7,
    scoring: 'all_or_nothing' as const,
    solutionVisibility: 'after_submit' as const,
    shuffle: true,
    status: 'published' as const,
    version: 1,
    author: 'Abbon',
    createdAt: t,
    updatedAt: t,
  };
};

export const demoCategories: Category[] = [
  { id: 'cat-culture', parentId: null, name: { fr: 'Culture générale', en: 'General knowledge' }, position: 0 },
  { id: 'cat-it', parentId: null, name: { fr: 'Informatique', en: 'Computing' }, position: 1 },
  { id: 'cat-lang', parentId: null, name: { fr: 'Langues', en: 'Languages' }, position: 2 },
];

export const demoQuizzes: Quiz[] = [
  {
    ...baseQuiz('demo-culture', 'cat-culture', ['Découverte', 'Discovery'], [
      'Trois questions pour découvrir Abbon.',
      'Three questions to discover Abbon.',
    ]),
    questions: [
      q('demo-culture-q-1', 'single', 'Quelle est la capitale de l’Australie ?', 'What is the capital of Australia?', [
        ['Sydney', 'Sydney', false],
        ['Canberra', 'Canberra', true],
        ['Melbourne', 'Melbourne', false],
      ], ['Canberra a été choisie comme compromis entre Sydney et Melbourne.', 'Canberra was chosen as a compromise between Sydney and Melbourne.']),
      q('demo-culture-q-2', 'multiple', 'Lesquels sont des gaz nobles ?', 'Which of these are noble gases?', [
        ['Néon', 'Neon', true],
        ['Azote', 'Nitrogen', false],
        ['Argon', 'Argon', true],
        ['Hydrogène', 'Hydrogen', false],
      ]),
      q('demo-culture-q-3', 'single', 'Combien de côtés a un hexagone ?', 'How many sides does a hexagon have?', [
        ['5', '5', false],
        ['6', '6', true],
        ['8', '8', false],
      ]),
    ],
  },
  {
    ...baseQuiz('demo-network', 'cat-it', ['Réseaux – notions de base', 'Networking basics'], [
      'Protocoles et modèle TCP/IP.',
      'Protocols and the TCP/IP model.',
    ]),
    questions: [
      q('demo-network-q-1', 'multiple', 'Quels protocoles fonctionnent sur TCP ?', 'Which protocols run over TCP?', [
        ['HTTP', 'HTTP', true],
        ['DNS (requête standard)', 'DNS (standard query)', false],
        ['SMTP', 'SMTP', true],
      ], ['DNS utilise UDP par défaut ; HTTP et SMTP utilisent TCP.', 'DNS uses UDP by default; HTTP and SMTP use TCP.']),
      q('demo-network-q-2', 'single', 'Quel est le port HTTPS par défaut ?', 'What is the default HTTPS port?', [
        ['80', '80', false],
        ['443', '443', true],
        ['8080', '8080', false],
      ]),
    ],
  },
  {
    ...baseQuiz('demo-english', 'cat-lang', ['Anglais – verbes irréguliers', 'English – irregular verbs'], [
      'Prétérit des verbes courants.',
      'Simple past of common verbs.',
    ]),
    languages: ['en'],
    questions: [
      q('demo-english-q-1', 'single', 'Simple past of “to go”', 'Simple past of “to go”', [
        ['goed', 'goed', false],
        ['went', 'went', true],
        ['gone', 'gone', false],
      ]),
    ],
  },
];

/** Installe les données de démonstration une seule fois. */
export async function seedDemo(repo: Repository): Promise<boolean> {
  if (await repo.getSetting(SEEDED_KEY)) return false;
  for (const c of demoCategories) await repo.saveCategory(c);
  for (const quiz of demoQuizzes) await repo.saveQuiz(quiz);

  const t = Date.now();
  const iso = (minutesAgo: number) => new Date(t - minutesAgo * 60_000).toISOString();
  const attempts: Attempt[] = [
    {
      id: 'demo-attempt-network',
      quizId: 'demo-network',
      quizVersion: 1,
      mode: 'training',
      status: 'finished',
      startedAt: iso(90),
      finishedAt: iso(85),
      elapsedSec: 300,
      currentIndex: 2,
      questionOrder: ['demo-network-q-1', 'demo-network-q-2'],
      score: 1,
      maxScore: 2,
    },
    {
      id: 'demo-attempt-english',
      quizId: 'demo-english',
      quizVersion: 1,
      mode: 'training',
      status: 'in_progress',
      startedAt: iso(10),
      elapsedSec: 40,
      currentIndex: 0,
      questionOrder: ['demo-english-q-1'],
    },
  ];
  for (const a of attempts) await repo.saveAttempt(a);
  await repo.setSetting(SEEDED_KEY, now());
  return true;
}

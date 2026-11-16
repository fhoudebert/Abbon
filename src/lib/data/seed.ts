import { dueAfter, newCard } from '$lib/domain/leitner';
import type { Attempt, Category, ModuleManifest, Question, Quiz } from '$lib/domain/types';
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
      q('demo-culture-q-3', 'single', 'Combien de faces a un dodécaèdre ?', 'How many faces does a dodecahedron have?', [
        ['8', '8', false],
        ['12', '12', true],
        ['16', '16', false],
        ['20', '20', false],
      ], ['Le dodécaèdre régulier a 12 faces pentagonales ; c’est l’icosaèdre qui en a 20.', 'The regular dodecahedron has 12 pentagonal faces; the icosahedron is the one with 20.']),
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

/** Question à saisie (réponse courte ou numérique) des données de démonstration. */
const typed = (id: string, type: 'short' | 'numeric' | 'cloze', fr: string, en: string, expected: Question['expected'], expl: [string, string]): Question => ({
  id,
  type,
  prompt: { fr, en },
  points: 1,
  position: Number(id.split('-').pop()),
  explanation: { fr: expl[0], en: expl[1] },
  choices: [],
  expected,
});

demoQuizzes.push({
  ...baseQuiz('demo-typed', 'cat-culture', ['Réponses à saisir', 'Typed answers'], [
    'Réponse courte et réponse numérique.',
    'Short answer and numerical answer.',
  ]),
  questions: [
    typed('demo-typed-q-1', 'short', 'Quelle est la capitale de l’Italie ?', 'What is the capital of Italy?', { accepted: ['Rome', 'Roma'] }, [
      'Rome est la capitale de l’Italie depuis 1871.',
      'Rome has been the capital of Italy since 1871.',
    ]),
    typed(
      'demo-typed-q-2',
      'numeric',
      'À quelle température l’eau bout-elle au niveau de la mer ?',
      'At what temperature does water boil at sea level?',
      { value: 100, tolerance: 0.5, unit: '°C' },
      ['100 °C sous une pression d’une atmosphère.', '100 °C under a pressure of one atmosphere.'],
    ),
    typed(
      'demo-typed-q-3',
      'cloze',
      'Complétez la phrase.',
      'Complete the sentence.',
      {
        text: {
          fr: 'La Terre tourne autour du {{1}} en environ {{2}} jours.',
          en: 'The Earth goes round the {{1}} in about {{2}} days.',
        },
        gaps: [
          { kind: 'text', accepted: ['Soleil', 'Sun'] },
          { kind: 'select', accepted: ['365'], options: ['28', '180'] },
        ],
      },
      ['Une révolution dure 365,25 jours.', 'One revolution takes 365.25 days.'],
    ),
  ],
});

/**
 * Module de démonstration, pour l'aperçu dans un navigateur seulement (`npm run dev`, audit
 * d'accessibilité) : il rend visibles les écrans propres aux modules (contenu protégé, fiche de révision).
 * L'application installée ne le reçoit pas : ses QCM de démonstration restent modifiables.
 */
export const demoModule: ModuleManifest = {
  format: 'abbon-module',
  formatVersion: 1,
  id: 'org.abbon.demo',
  version: '1.0.0',
  title: { fr: 'Démonstration : anglais', en: 'Demo: English' },
  description: { fr: 'Exemple de module installé.', en: 'Sample installed module.' },
  level: null,
  license: 'CC-BY-NC-SA-4.0',
  authors: ['Abbon'],
  homepage: 'https://github.com/fhoudebert/Abbon',
  requires: null,
  categories: ['cat-lang'],
  quizzes: ['demo-english'],
  sheets: {
    'cat-lang': Object.fromEntries(
      (
        [
          ['fr', 'À retenir', 'Le prétérit s’emploie seul, le participe passé avec un auxiliaire.', ['Base', 'Prétérit', 'Participe passé']],
          ['en', 'Key points', 'The past simple stands alone; the past participle needs an auxiliary.', ['Base form', 'Past simple', 'Past participle']],
        ] as const
      ).map(([lang, heading, text, head]) => [
        lang,
        {
          type: 'doc' as const,
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: heading }] },
            { type: 'paragraph', content: [{ type: 'text', text }] },
            {
              type: 'table',
              content: [head, ['go', 'went', 'gone'], ['see', 'saw', 'seen']].map((row, i) => ({
                type: 'tableRow',
                content: row.map((cell) => ({
                  type: i === 0 ? 'tableHeader' : 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: cell }] }],
                })),
              })),
            },
          ],
        },
      ]),
    ),
  },
};

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
    {
      id: 'demo-attempt-typed',
      quizId: 'demo-typed',
      quizVersion: 1,
      mode: 'training',
      status: 'finished',
      startedAt: iso(60),
      finishedAt: iso(58),
      elapsedSec: 95,
      currentIndex: 1,
      questionOrder: ['demo-typed-q-1', 'demo-typed-q-2', 'demo-typed-q-3'],
      score: 1,
      maxScore: 3,
    },
  ];
  for (const a of attempts) await repo.saveAttempt(a);
  await repo.saveAnswer('demo-attempt-typed', { questionId: 'demo-typed-q-3', selected: [], texts: ['soleil', '180'], correct: false, points: 0, timeSec: 15, flagged: false });
  for (const [questionId, text, correct] of [['demo-typed-q-1', 'rome', true], ['demo-typed-q-2', '90', false]] as const)
    await repo.saveAnswer('demo-attempt-typed', { questionId, selected: [], text, correct, points: correct ? 1 : 0, timeSec: 40, flagged: false });
  if (repo.backend === 'memory') {
    // Aperçu seulement : une boîte de révision déjà garnie (une question à revoir, une autre plus tard).
    const typedQuiz = demoQuizzes.find((quiz) => quiz.id === 'demo-typed')!;
    await repo.saveCard(newCard(typedQuiz, typedQuiz.questions[0]));
    await repo.saveCard({ ...newCard(demoQuizzes[0], demoQuizzes[0].questions[0]), box: 3, reviews: 2, dueAt: dueAfter(new Date(), 4) });
    await repo.installModule({
      manifest: demoModule,
      quizzes: demoQuizzes.filter((quiz) => demoModule.quizzes.includes(quiz.id)),
      categories: demoCategories.filter((c) => demoModule.categories.includes(c.id)),
      removedQuizIds: [],
    });
  }
  await repo.setSetting(SEEDED_KEY, now());
  return true;
}

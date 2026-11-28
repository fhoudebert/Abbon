/**
 * Examen corrigé par le serveur : rien du corrigé dans le site publié, et la notation du script PHP
 * identique à celle de l'application (si `php` est installé : c'est le cas des machines de la CI).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { demoCategories, demoModule, demoQuizzes } from '$lib/data/seed';
import { readProgress, SiteRepository, progressKey } from '$lib/data/site';
import { b64ToBytes } from '$lib/data/bytes';
import { stripConstant } from '$lib/domain/expr';
import { scoreQuestion, type QuestionScore } from '$lib/domain/scoring';
import { expectedText } from '$lib/domain/typed';
import { drawQuestionIds, resultOf, startAttempt } from '$lib/domain/session';
import type { Answer, Attempt, InstalledModule, Question, Quiz } from '$lib/domain/types';
import { parsePackage } from '$lib/interchange/qcmPackage';
import { siteContent, siteDataOf, zipSite } from '$lib/interchange/siteExport';
import { parseCandidate, resolveCollect, resolveDraw, resolveExamPoints, resolveSettings, resolveThreshold, settingsScript } from '$lib/site';
import { detailLocked, examState, finishWithGrade, gradeOnServer, gradeRequest, isGradeResponse, startOnServer, withDetail, withSolutions } from './client';
import { displayOf, plainMath, publicQuiz, serverSolutions, solutionsPhp } from './publish';
import { CORRIGER_PHP, ENSEIGNANT_PHP, examFiles, newPassword } from './server';
import type { GradeRequest, GradeResponse } from './types';

const fr = (s: string) => ({ fr: s });
let pos = 0;
const q = (type: Question['type'], extra: Partial<Question>): Question => ({
  id: `q${pos}`,
  type,
  prompt: fr(`Question ${pos}`),
  points: 1,
  position: pos++,
  explanation: fr(`Explication secrète ${pos}`),
  choices: [],
  expected: null,
  ...extra,
});
const choices = (...correct: boolean[]) =>
  correct.map((c, i) => ({ id: `c${i}`, content: fr(`choix ${i}`), correct: c, position: i, feedback: c ? fr('bravo secret') : null }));

/** Expressions : attendue (avec « + C » éventuel), réponses justes, réponses fausses. */
const EXPRESSIONS: [string, boolean, string[], string[]][] = [
  ['(n+1)^2', false, ['n^2+2n+1', 'S_n=(n+1)^2'], ['n^2', '2n+1', 'x+1']],
  ['(1-x)e^{-x}', false, ['e^{-x}-xe^{-x}', '\\frac{1-x}{e^x}'], ['(1+x)e^{-x}', '-xe^{-x}']],
  ['x-1', false, ['-1+x', 'y = x - 1'], ['x', 'x+1', 'y=x']],
  ['\\frac{1}{2}\\ln(2x+1) + C', true, ['\\frac{\\ln(2x+1)}{2}', '\\frac12\\ln(4x+2)'], ['\\ln(2x+1)', '\\frac{1}{2x+1}']],
  ['x\\ln x - x + C', true, ['x(\\ln x-1)', 'x\\ln x-x+5'], ['x\\ln x', '\\frac{1}{x}']],
  ['\\ln x', false, ['\\ln(x)', "f'(x)=\\ln x"], ['x\\ln x', '\\frac{1}{x}']],
  ['\\frac{2^n - (-1)^n}{3}', false, ['u_n=\\frac{2^n+(-1)^{n+1}}{3}'], ['\\frac{2^n+(-1)^n}{3}', '2^n-(-1)^n']],
  ['42', false, ['40+2', '\\frac{84}{2}'], ['41', 'x']],
];

const quiz: Quiz = {
  id: 'quiz-examen',
  categoryId: null,
  title: fr('Examen'),
  languages: ['fr'],
  tags: [],
  passThreshold: 0.5,
  scoring: 'partial',
  solutionVisibility: 'after_submit',
  shuffle: false,
  status: 'published',
  version: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  questions: [
    q('single', { choices: choices(false, true, false) }),
    q('multiple', { choices: choices(true, false, true, false) }),
    q('short', { expected: { accepted: ['went', 'did go'] } }),
    q('short', { expected: { accepted: ['Paris'], caseSensitive: true } }),
    q('short', { expected: { accepted: ['l’île'] } }),
    q('numeric', { expected: { value: 9.81, tolerance: 0.01, unit: 'm/s²' } }),
    q('numeric', { expected: { value: 0.3 } }),
    q('numeric', { expected: { value: 8388608, tolerance: 1 } }),
    q('cloze', {
      points: 2,
      expected: {
        text: fr('Il {{1}} hier, en {{2}}.'),
        gaps: [
          { kind: 'text', accepted: ['est parti', 'est allé'] },
          { kind: 'select', accepted: ['train'], options: ['avion', 'bateau'] },
        ],
      },
    }),
    q('flashcard', { explanation: fr('Verso de la carte') }),
    ...EXPRESSIONS.map(([latex, constant]) =>
      q('expression', { expected: { latex: constant ? stripConstant(latex) : latex, ...(constant ? { constant: true } : {}) } }),
    ),
    // Accents ignorés (« · accent-insensitive ») : réponse courte et trou à saisir.
    q('short', { expected: { accepted: ['Cléopâtre VII', 'l’île'], ignoreAccents: true } }),
    q('cloze', {
      expected: {
        text: fr('Il {{1}} hier, en {{2}}.'),
        gaps: [
          { kind: 'text', accepted: ['est parti', 'est allé'], ignoreAccents: true },
          { kind: 'select', accepted: ['train'], options: ['avion', 'bateau'] },
        ],
      },
    }),
  ],
};

const attempt: Attempt = {
  id: 'a1',
  quizId: quiz.id,
  mode: 'exam',
  status: 'in_progress',
  startedAt: '2026-01-01T00:00:00Z',
  finishedAt: null,
  elapsedSec: 0,
  questionOrder: quiz.questions.map((x) => x.id),
  currentIndex: 0,
  score: null,
  maxScore: null,
} as unknown as Attempt;

const answer = (questionId: string, a: Partial<Answer>): Answer => ({
  questionId,
  selected: [],
  correct: null,
  points: null,
  timeSec: 0,
  flagged: false,
  ...a,
});

/** Réponses à essayer, par question : justes, fausses, approchées, vides. */
function variants(x: Question): Partial<Answer>[] {
  switch (x.type) {
    case 'single':
      return [{ selected: ['c1'] }, { selected: ['c0'] }, { selected: ['c0', 'c1'] }, { selected: [] }, { selected: ['inconnu'] }];
    case 'multiple':
      return [{ selected: ['c0', 'c2'] }, { selected: ['c0'] }, { selected: ['c0', 'c1'] }, { selected: ['c0', 'c1', 'c2', 'c3'] }, { selected: ['c1', 'c3'] }, { selected: [] }];
    case 'short':
      return [{ text: 'went' }, { text: '  DID   go ' }, { text: 'goed' }, { text: 'paris' }, { text: 'Paris' }, { text: "l'île" }, { text: 'l’ile' }, { text: 'cleopatre vii' }, { text: 'CLÉOPATRE  VII' }, { text: 'Cléopâtre VII' }, { text: 'Cleopatra' }, { text: '' }, {}];
    case 'numeric':
      return [{ text: '9,81' }, { text: '9.8' }, { text: '9,82' }, { text: '9,83' }, { text: '0,3' }, { text: '.3' }, { text: '3e-1' }, { text: '8 388 608' }, { text: '8388609' }, { text: '8,4e6' }, { text: '−0,3' }, { text: 'abc' }, { text: '' }];
    case 'cloze':
      return [{ texts: ['est parti', 'train'] }, { texts: ['Est  Allé', 'train'] }, { texts: ['est parti', 'avion'] }, { texts: ['partit', 'Train'] }, { texts: ['est alle', 'train'] }, { texts: ['Est Allé', 'tràin'] }, { texts: [null as unknown as string, 'train'] }, { texts: [] }];
    case 'flashcard':
      return [{ text: 'known' }, { text: 'unknown' }, {}];
    case 'expression': {
      const [, , ok, ko] = EXPRESSIONS.find(([l, c]) => (c ? stripConstant(l) : l) === x.expected!.latex)!;
      return [...ok, ...ko, '', '\\frac{'].map((text) => ({ text }));
    }
  }
}

describe('examen corrigé par le serveur : site publié', () => {
  it('le QCM publié ne contient rien du corrigé', () => {
    const pub = publicQuiz(quiz);
    const json = JSON.stringify(pub);
    expect(json).not.toMatch(/"correct":true|secret|went|did go|Paris"|9\.81|"value"|est parti|"latex"|8388608/);
    expect(pub.questions.every((x) => x.choices.every((c) => !c.correct))).toBe(true);
    // Restent l'énoncé : unité, texte et listes des trous (triées), verso des cartes, points de test.
    expect(pub.questions[5].expected).toEqual({ unit: 'm/s²' });
    expect(pub.questions[8].expected?.gaps?.[1].options).toEqual(['avion', 'bateau', 'train']);
    expect(pub.questions[9].explanation).toEqual(fr('Verso de la carte'));
    const expr = pub.questions.filter((x) => x.type === 'expression');
    for (const e of expr) expect(e.expected?.samples?.length).toBeGreaterThan(0);
    expect(expr[3].expected?.constant).toBe(true);
  });

  it('archive du site : paquet sans réponses ni fiches, dossier examen/, examen seulement', async () => {
    const installed: InstalledModule[] = [{ manifest: demoModule, installedAt: 'x', updatedAt: 'x' }];
    const inModule = demoQuizzes.filter((x) => demoModule.quizzes.includes(x.id));
    const content = siteContent([...inModule, quiz], demoCategories, installed);
    const opts = { title: 'Examen', modes: 'both', solutions: 'never', server: true } as const;
    const data = await siteDataOf(content, new Map(), opts, '0.2.0');
    expect(data).toMatchObject({ modes: 'exam', server: true, solutions: 'never' });
    const p = await parsePackage(b64ToBytes(data.package));
    expect(p.problems).toEqual([]);
    const back = p.quizzes.find((x) => x.id === quiz.id)!;
    expect(back.questions.filter((x) => x.type === 'expression').every((x) => x.expected?.samples?.length)).toBe(true);
    expect(JSON.stringify(p.quizzes)).not.toMatch(/"correct":true|secret|"latex"/);
    expect(p.modules?.[0]?.manifest.sheets ?? p.module?.sheets).toBeUndefined();

    const zip = unzipSync(zipSite('examen', { 'index.html': new Uint8Array() }, data, examFiles(content.quizzes, opts.solutions, 'MotDePasse23')));
    expect(Object.keys(zip).sort()).toEqual(
      [
        'examen/LISEZMOI.txt',
        'examen/donnees.js',
        'examen/examen/.htaccess',
        'examen/examen/config.php',
        'examen/examen/enseignant.php',
        'examen/examen/copies/.htaccess',
        'examen/examen/copies/index.html',
        'examen/examen/corriger.php',
        'examen/examen/solutions.php',
        'examen/index.html',
        'examen/reglages.js',
      ].sort(),
    );
    expect(strFromU8(zip['examen/examen/config.php'])).toContain("'motDePasse' => 'MotDePasse23'");
    expect(strFromU8(zip['examen/examen/.htaccess'])).toContain('(solutions|config)\\.php');
    expect(strFromU8(zip['examen/LISEZMOI.txt'])).toContain('PHP');
    const settings = strFromU8(zip['examen/reglages.js']);
    expect(settings).toContain('corrige: "jamais"');
    // reglages.js ne rend pas l'entraînement possible.
    const w: { ABBON_SITE_SETTINGS?: unknown } = {};
    new Function('window', settings)(w);
    expect(resolveSettings(data, { ...(w.ABBON_SITE_SETTINGS as object), modes: 'les-deux' }).modes).toBe('exam');
    expect(settingsScript({ modes: 'exam', solutions: 'end' }, true)).toContain('corrige: "fin"');
    // Copies : oui par défaut, « non » dans reglages.js ; jamais sans correction par le serveur.
    expect(settings).toContain('copies: "oui"');
    expect(resolveCollect(data, w.ABBON_SITE_SETTINGS)).toBe(true);
    expect(resolveCollect(data, { copies: ' Non ' })).toBe(false);
    expect(resolveCollect({}, { copies: 'oui' })).toBe(false);
  });

  it('mot de passe des copies : 12 caractères sans ambiguïté, différent à chaque export', () => {
    const a = newPassword();
    expect(a).toMatch(/^[a-km-zA-HJ-NP-Z2-9]{12}$/);
    expect(newPassword()).not.toBe(a);
  });
});

describe('examen corrigé par le serveur : lecteur', () => {
  const pub = publicQuiz(quiz);
  const answers = [answer('q0', { selected: ['c1'] }), answer('q2', { text: 'goed' }), answer(pub.questions[10].id, { text: 'n^2+2n+1' })];

  it('demande : réponses données, formules évaluées aux points de test', () => {
    const r = gradeRequest(pub, attempt, answers, { name: 'Ada Lovelace', group: 'TG2' });
    expect(r.quiz).toBe(quiz.id);
    expect(r.attempt).toEqual({ id: 'a1', startedAt: attempt.startedAt, elapsedSec: 0 });
    expect(r.candidate).toEqual({ name: 'Ada Lovelace', group: 'TG2' });
    expect(gradeRequest(pub, attempt, answers).candidate).toBeUndefined();
    expect(parseCandidate('{"name":"Ada","group":3}')).toEqual({ name: 'Ada', group: '' });
    expect(parseCandidate(null)).toEqual({ name: '', group: '' });
    expect(r.questions).toHaveLength(quiz.questions.length);
    expect(Object.keys(r.answers)).toEqual(['q0', 'q2', pub.questions[10].id]);
    expect(r.answers[pub.questions[10].id].values?.length).toBe(pub.questions[10].expected?.samples?.length);
  });

  it('note du serveur → tentative close, résultat relu depuis les réponses enregistrées', () => {
    const perQuestion = Object.fromEntries(quiz.questions.map((x) => [x.id, { points: 0, correct: false }]));
    perQuestion.q0 = { points: 1, correct: true };
    const grade: GradeResponse = { score: 1, maxScore: 21, ratio: 1 / 21, passed: false, perQuestion };
    expect(isGradeResponse(grade, Object.keys(perQuestion))).toBe(true);
    expect(isGradeResponse({ ...grade, perQuestion: {} }, ['q0'])).toBe(false);
    expect(isGradeResponse('<?php …', ['q0'])).toBe(false);
    const done = finishWithGrade(pub, attempt, answers, grade);
    expect(done.attempt).toMatchObject({ status: 'finished', score: 1, maxScore: 21 });
    expect(done.answers.find((a) => a.questionId === 'q0')).toMatchObject({ correct: true, points: 1 });
    const again = resultOf(pub, done.attempt, done.answers, true);
    expect(again).toMatchObject({ score: 1, maxScore: 21, passed: false });
    expect(again.perQuestion.q0).toEqual({ points: 1, correct: true });
  });

  it('corrigé reçu : ajouté au QCM et gardé avec la progression', async () => {
    const full = serverSolutions([quiz], 'end').quizzes[quiz.id].questions;
    const sols = Object.fromEntries(
      Object.entries(full).map(([id, x]) => [id, { choices: x.choices, expected: x.expected, explanation: x.explanation }]),
    ) as Parameters<typeof withSolutions>[1];
    expect(withSolutions(pub, sols).questions[1].choices.map((c) => c.correct)).toEqual([true, false, true, false]);

    const installed: InstalledModule[] = [];
    const data = await siteDataOf(siteContent([quiz], [], installed), new Map(), { title: 'T', modes: 'exam', solutions: 'end', server: true }, '0.2.0');
    const m = new Map<string, string>();
    const storage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    const repo = new SiteRepository(data.id, storage);
    await repo.load(data);
    expect((await repo.getQuiz(quiz.id))?.questions[0].choices[1].correct).toBe(false);
    await repo.addSolutions(quiz.id, sols);
    await repo.flush();
    expect(readProgress(storage, data.id).solutions?.[quiz.id]?.q0).toBeTruthy();
    expect(m.has(progressKey(data.id))).toBe(true);
    const reloaded = new SiteRepository(data.id, storage);
    await reloaded.load(data);
    expect((await reloaded.getQuiz(quiz.id))?.questions[0].choices[1].correct).toBe(true);
  });
});

const hasPhp = spawnSync('php', ['-v']).status === 0;

describe.skipIf(!hasPhp)('examen corrigé par le serveur : script PHP', () => {
  it('syntaxe valide', () => {
    const dir = mkdtempSync(join(tmpdir(), 'abbon-php-'));
    try {
      writeFileSync(join(dir, 'corriger.php'), CORRIGER_PHP);
      writeFileSync(join(dir, 'enseignant.php'), ENSEIGNANT_PHP);
      expect(execFileSync('php', ['-l', join(dir, 'corriger.php')]).toString()).toContain('No syntax errors');
      expect(execFileSync('php', ['-l', join(dir, 'enseignant.php')]).toString()).toContain('No syntax errors');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('même notation que l’application, question par question', () => {
    const pub = publicQuiz(quiz);
    // Une demande par variante : chaque question reçoit sa n-ième réponse possible.
    const max = Math.max(...quiz.questions.map((x) => variants(x).length));
    const requests: GradeRequest[] = [];
    const expected: Record<string, QuestionScore>[] = [];
    for (let i = 0; i < max; i++) {
      const answers = quiz.questions.map((x) => {
        const v = variants(x);
        return answer(x.id, v[i % v.length]);
      });
      requests.push(gradeRequest(pub, attempt, answers));
      expected.push(
        Object.fromEntries(quiz.questions.map((x, k) => [x.id, scoreQuestion(x, answers[k].selected, quiz.scoring, answers[k].text, answers[k].texts)])),
      );
    }
    const dir = mkdtempSync(join(tmpdir(), 'abbon-php-'));
    try {
      writeFileSync(join(dir, 'corriger.php'), CORRIGER_PHP);
      writeFileSync(join(dir, 'solutions.php'), solutionsPhp(serverSolutions([quiz], 'end')));
      writeFileSync(join(dir, 'demandes.json'), JSON.stringify(requests));
      writeFileSync(
        join(dir, 'test.php'),
        `<?php
define('ABBON_CORRIGER_BIBLIOTHEQUE', true);
require __DIR__ . '/corriger.php';
$solutions = require __DIR__ . '/solutions.php';
$out = array();
foreach (json_decode(file_get_contents(__DIR__ . '/demandes.json'), true) as $r) $out[] = abbon_corriger($solutions, $r);
echo json_encode($out, JSON_PRESERVE_ZERO_FRACTION);
`,
      );
      const results = JSON.parse(execFileSync('php', [join(dir, 'test.php')]).toString()) as GradeResponse[];
      results.forEach((r, i) => {
        for (const x of quiz.questions) {
          const label = `${x.id} (${x.type}) ${JSON.stringify(requests[i].answers[x.id])}`;
          expect([label, r.perQuestion![x.id]]).toEqual([label, expected[i][x.id]]);
        }
        const total = Math.round(Object.values(expected[i]).reduce((s, v) => s + v.points, 0) * 100) / 100;
        expect(r.score).toBe(total);
        expect(r.solutions?.q1.choices.map((c) => c.correct)).toEqual([true, false, true, false]);
      });
      // Les expressions justes et fausses ont bien été essayées.
      const exprOk = results.flatMap((r) => quiz.questions.filter((x) => x.type === 'expression').map((x) => r.perQuestion![x.id].correct));
      expect(exprOk).toContain(true);
      expect(exprOk).toContain(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('copies : enregistrées une fois, réglages relus, consultation protégée, CSV', () => {
    const dir = mkdtempSync(join(tmpdir(), 'abbon-php-'));
    try {
      for (const [f, text] of Object.entries(examFiles([quiz], 'end', 'Secret23abcd'))) {
        mkdirSync(dirname(join(dir, f)), { recursive: true });
        writeFileSync(join(dir, f), text);
      }
      writeFileSync(join(dir, 'reglages.js'), settingsScript({ modes: 'exam', solutions: 'end' }, true).replace('corrige: "fin"', 'corrige: "jamais"'));
      const pub = publicQuiz(quiz);
      const request = gradeRequest(pub, attempt, [answer('q0', { selected: ['c1'] }), answer('q2', { text: 'went' })], {
        name: '=HYPERLINK("x") Ada\u0007 <b>',
        group: 'TG2',
      });
      writeFileSync(join(dir, 'demande.json'), JSON.stringify(request));
      writeFileSync(
        join(dir, 'test.php'),
        `<?php
define('ABBON_CORRIGER_BIBLIOTHEQUE', true);
require __DIR__ . '/examen/corriger.php';
$solutions = require __DIR__ . '/examen/solutions.php';
$r = json_decode(file_get_contents(__DIR__ . '/demande.json'), true);
$reglages = __DIR__ . '/reglages.js';
$out = abbon_corriger($solutions, $r);
$visible = abbon_visible($out, abbon_corrige('fin', $reglages), false);
$copies = __DIR__ . '/examen/copies';
$a = abbon_enregistrer($copies, abbon_copie($solutions, $r, $out, 1795000000));
$b = abbon_enregistrer($copies, abbon_copie($solutions, $r, $out)); // envoi répété : pas de doublon
echo json_encode(array('corrige' => abbon_corrige('fin', $reglages), 'collecte' => abbon_collecte($reglages), 'solutions' => isset($visible['solutions']), 'detail' => isset($visible['perQuestion']), 'ok' => $a && $b, 'copies' => abbon_lire_copies($copies), 'fichier' => file_get_contents($copies . '/copies.php')), JSON_UNESCAPED_UNICODE);
`,
      );
      const r = JSON.parse(execFileSync('php', [join(dir, 'test.php')]).toString());
      expect(r).toMatchObject({ corrige: 'jamais', collecte: true, solutions: false, detail: true, ok: true });
      expect(r.copies).toHaveLength(1);
      expect(r.copies[0]).toMatchObject({ id: 'a1', date: '2026-11-18T11:06:40Z', nom: '=HYPERLINK("x") Ada <b>', groupe: 'TG2', qcm: quiz.id, titre: 'Examen', note: 2, reussi: false });
      expect(r.copies[0].reponses).toEqual({ q0: { cases: ['c1'] }, q2: { texte: 'went' } });
      expect(r.fichier.startsWith('<?php exit; ?>\n')).toBe(true);

      // Consultation : mot de passe exigé, noms échappés, cellules CSV neutralisées.
      const view = (post: Record<string, string>) => {
        writeFileSync(join(dir, 'vue.php'), `<?php $_POST = json_decode(${JSON.stringify(JSON.stringify(post))}, true); include __DIR__ . '/examen/enseignant.php';`);
        return execFileSync('php', [join(dir, 'vue.php')]).toString();
      };
      expect(view({})).toContain('type="password"');
      expect(view({})).not.toContain('Ada');
      const html = view({ motdepasse: 'Secret23abcd' });
      expect(html).toContain('1 copie,');
      // reglages.js dit « jamais » : pas de publication à faire.
      expect(html).toContain('corrige "jamais"');
      expect(html).toContain('&lt;b&gt;');
      expect(html).not.toContain('<b>');
      const csv = view({ motdepasse: 'Secret23abcd', format: 'csv' });
      expect(csv.split('\r\n')[0]).toBe('﻿"Date";"Nom";"Classe ou groupe";"QCM";"Note";"Sur";"Pourcentage";"Réussi";"Durée";"Remarques";"Identifiant"');
      expect(csv).toContain(`"'=HYPERLINK(""x"") Ada <b>";"TG2";"Examen";"2";"21";"9,52";"non";"0:00";"";"a1"`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('corrigé publié par l’enseignant : la note seule, puis le détail et le corrigé', () => {
    const dir = mkdtempSync(join(tmpdir(), 'abbon-php-'));
    try {
      for (const [f, text] of Object.entries(examFiles([quiz], 'teacher', 'Secret23abcd'))) {
        mkdirSync(dirname(join(dir, f)), { recursive: true });
        writeFileSync(join(dir, f), text);
      }
      writeFileSync(join(dir, 'reglages.js'), settingsScript({ modes: 'exam', solutions: 'teacher' }, true));
      const request = gradeRequest(publicQuiz(quiz), attempt, [answer('q0', { selected: ['c1'] })]);
      writeFileSync(join(dir, 'demande.json'), JSON.stringify(request));
      writeFileSync(
        join(dir, 'test.php'),
        `<?php
define('ABBON_CORRIGER_BIBLIOTHEQUE', true);
require __DIR__ . '/examen/corriger.php';
$solutions = require __DIR__ . '/examen/solutions.php';
$out = abbon_corriger($solutions, json_decode(file_get_contents(__DIR__ . '/demande.json'), true));
$corrige = abbon_corrige($solutions['corrige'], __DIR__ . '/reglages.js');
$published = abbon_publication(__DIR__ . '/examen/copies');
echo json_encode(array(
  'corrige' => $corrige,
  'avant' => abbon_visible($out, $corrige, isset($published['quiz-examen'])),
  'apres' => abbon_visible($out, $corrige, true),
  'fin' => array_keys(abbon_visible($out, 'fin', false)),
  'jamais' => array_keys(abbon_visible($out, 'jamais', false)),
));
`,
      );
      const before = JSON.parse(execFileSync('php', [join(dir, 'test.php')]).toString());
      expect(before.corrige).toBe('enseignant');
      expect(before.avant).toEqual({ score: 1, maxScore: 21, ratio: 1 / 21, passed: false, locked: true });
      expect(before.apres.perQuestion.q0).toEqual({ points: 1, correct: true });
      expect(before.apres.solutions.q0.choices[1].correct).toBe(true);
      expect(before.fin).toEqual(['score', 'maxScore', 'ratio', 'passed', 'perQuestion', 'solutions']);
      expect(before.jamais).toEqual(['score', 'maxScore', 'ratio', 'passed', 'perQuestion']);

      // Espace enseignant : publication protégée par le mot de passe, puis retrait.
      const view = (post: Record<string, string>) => {
        writeFileSync(join(dir, 'vue.php'), `<?php $_POST = json_decode(${JSON.stringify(JSON.stringify(post))}, true); include __DIR__ . '/examen/enseignant.php';`);
        return execFileSync('php', [join(dir, 'vue.php')]).toString();
      };
      expect(view({ action: 'publier', cible: quiz.id })).not.toContain('publié le');
      const published = view({ motdepasse: 'Secret23abcd', action: 'publier', cible: quiz.id });
      expect(published).toContain('Corrigé publié.');
      expect(published).toMatch(/publié le \d\d\/\d\d\/\d{4}/);
      expect(JSON.parse(execFileSync('php', [join(dir, 'test.php')]).toString()).avant.perQuestion.q0.correct).toBe(true);
      expect(view({ motdepasse: 'Secret23abcd', action: 'retirer', cible: quiz.id })).toContain('Corrigé retiré.');
      expect(JSON.parse(execFileSync('php', [join(dir, 'test.php')]).toString()).avant.locked).toBe(true);
      expect(view({ motdepasse: 'Secret23abcd', action: 'publier', cible: 'inconnu' })).not.toContain('Corrigé publié.');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('corrigé publié par l’enseignant : lecteur', () => {
  const pub = publicQuiz(quiz);
  const answers = [answer('q0', { selected: ['c1'] })];
  const locked: GradeResponse = { score: 1, maxScore: 21, ratio: 1 / 21, passed: false, locked: true };

  it('la note seule : réponses sans détail, résultat relu depuis la tentative', () => {
    expect(isGradeResponse(locked, ['q0', 'q1'])).toBe(true);
    const done = finishWithGrade(pub, attempt, answers, locked);
    expect(done.attempt).toMatchObject({ status: 'finished', score: 1, maxScore: 21 });
    expect(done.answers.every((a) => a.points === null && a.correct === null)).toBe(true);
    expect(detailLocked(pub, done.attempt, done.answers)).toBe(true);
    expect(resultOf(pub, done.attempt, done.answers, true)).toEqual({ score: 1, maxScore: 21, ratio: 1 / 21, passed: false, perQuestion: {} });
    // Détail publié : réponses notées, plus de verrou.
    const perQuestion = Object.fromEntries(quiz.questions.map((x) => [x.id, { points: x.id === 'q0' ? 1 : 0, correct: x.id === 'q0' }]));
    const graded = withDetail(pub, done.attempt, done.answers, perQuestion);
    expect(detailLocked(pub, done.attempt, graded)).toBe(false);
    expect(resultOf(pub, done.attempt, graded, true).perQuestion.q0).toEqual({ points: 1, correct: true });
    expect(detailLocked(pub, attempt, answers)).toBe(false); // tentative en cours
  });

  it('réglages : « enseignant » dans reglages.js ; sans serveur, il vaut « jamais »', async () => {
    expect(resolveSettings({ modes: 'exam', solutions: 'end' }, { corrige: 'Enseignant' }).solutions).toBe('teacher');
    expect(settingsScript({ modes: 'exam', solutions: 'teacher' }, true)).toContain('corrige: "enseignant"');
    expect(settingsScript({ modes: 'exam', solutions: 'teacher' })).toContain('corrige: "jamais"');
    for (const [server, visibility] of [[true, 'after_submit'], [false, 'never']] as const) {
      const data = await siteDataOf(siteContent([quiz], [], []), new Map(), { title: 'T', modes: 'exam', solutions: 'teacher', server }, '0.2.0');
      const repo = new SiteRepository(data.id, null);
      await repo.load(data, resolveSettings(data));
      expect((await repo.getQuiz(quiz.id))?.solutionVisibility).toBe(visibility);
    }
  });

  it('ouverture, code d’accès, début enregistré, hors délai, après fermeture, seuil, suppression', () => {
    const dir = mkdtempSync(join(tmpdir(), 'abbon-php-'));
    try {
      for (const [f, text] of Object.entries(examFiles([{ ...quiz, timeLimitSec: 600 }], 'teacher', 'Secret23abcd'))) {
        mkdirSync(dirname(join(dir, f)), { recursive: true });
        writeFileSync(join(dir, f), text);
      }
      writeFileSync(join(dir, 'reglages.js'), settingsScript({ modes: 'exam', solutions: 'teacher' }, true).replace('seuil: ""', 'seuil: "4"'));
      const pub = publicQuiz(quiz);
      const copy = (id: string, name: string) => ({
        ...gradeRequest(pub, { ...attempt, id }, [answer('q0', { selected: ['c1'] })], { name, group: '' }),
      });
      // Demandes successives, avec l'heure simulée du serveur.
      const steps: [number, Record<string, unknown>][] = [
        [1000, { action: 'etat' }],
        [1000, { action: 'debut', quiz: quiz.id, attempt: { id: 'a1' }, code: '' }],
        [1000, { ...copy('a1', 'Ada') }],
        [1000, { action: 'OUVRIR' }],
        [1000, { action: 'etat' }],
        [1000, { action: 'debut', quiz: quiz.id, attempt: { id: 'a1' }, code: 'faux' }],
        [1000, { action: 'debut', quiz: quiz.id, attempt: { id: 'a1' }, code: ' b7 x ', candidate: { name: 'Ada', group: 'TG2' } }],
        [1000, { action: 'debut', quiz: quiz.id, attempt: { id: 'a2' }, code: 'B7X', candidate: { name: 'Ada', group: 'TG2' } }],
        [1000, { action: 'debut', quiz: quiz.id, attempt: { id: 'a3' }, code: 'B7X', candidate: { name: 'Bob', group: '' } }],
        [1500, { ...copy('a1', 'Ada') }], // 500 s : dans les temps (durée du QCM : 600 s)
        [1700, { ...copy('a2', 'Ada') }], // 700 s : hors délai (600 s + 60 s de marge)
        [1700, { action: 'FERMER' }],
        [1000, { action: 'debut', quiz: quiz.id, attempt: { id: 'a4' }, code: 'B7X' }],
      ];
      writeFileSync(join(dir, 'etapes.json'), JSON.stringify(steps));
      writeFileSync(
        join(dir, 'test.php'),
        `<?php
define('ABBON_CORRIGER_BIBLIOTHEQUE', true);
require __DIR__ . '/examen/corriger.php';
$solutions = require __DIR__ . '/examen/solutions.php';
$dir = __DIR__ . '/examen/copies';
$out = array();
foreach (json_decode(file_get_contents(__DIR__ . '/etapes.json'), true) as $step) {
  list($now, $r) = $step;
  if (isset($r['action']) && $r['action'] === 'OUVRIR') { $out[] = abbon_ecrire_etat($dir, 'ouverture', array('ouvert' => true, 'code' => 'B7X', 'duree' => null)); continue; }
  if (isset($r['action']) && $r['action'] === 'FERMER') { $out[] = abbon_ecrire_etat($dir, 'ouverture', array('ouvert' => false, 'code' => 'B7X')); continue; }
  $out[] = abbon_traiter($solutions, $r, $dir, __DIR__ . '/reglages.js', $now);
}
$out[] = abbon_lire_copies($dir);
echo json_encode($out, JSON_UNESCAPED_UNICODE);
`,
      );
      const r = JSON.parse(execFileSync('php', [join(dir, 'test.php')]).toString());
      expect(r[0]).toEqual([200, { ouvert: false, code: false, duree: null, classe: false }]); // fermé par défaut
      expect(r[1]).toEqual([403, { error: 'ferme' }]);
      expect(r[2]).toEqual([403, { error: 'debut' }]); // copie sans début : refusée
      expect(r[4]).toEqual([200, { ouvert: true, code: true, duree: null, classe: false }]); // le code n'est jamais renvoyé
      expect(r[5]).toEqual([403, { error: 'code' }]);
      expect(r[6]).toEqual([200, { ok: true, limitSec: 600, questions: null }]); // code sans majuscules ni espaces
      expect(r[7][0]).toBe(200);
      // Seuil de reglages.js (4 %) : 1 point sur 21 suffit ; corrigé pas publié : la note seule.
      expect(r[9]).toEqual([200, { score: 1, maxScore: 21, ratio: 1 / 21, passed: true, locked: true, recorded: true }]);
      expect(r[10][0]).toBe(200);
      expect(r[12]).toEqual([403, { error: 'ferme' }]);
      const copies = r[13];
      expect(copies.map((c: { id: string }) => c.id)).toEqual(['a2', 'a1']);
      expect(copies[1]).toMatchObject({ dureeServeur: 500, horsDelai: false, apresFermeture: false, debut: '1970-01-01T00:16:40Z' });
      expect(copies[0]).toMatchObject({ dureeServeur: 700, horsDelai: true });

      // Espace enseignant : en cours, remarques, ouverture avec durée, suppression confirmée.
      const view = (post: Record<string, string>) => {
        writeFileSync(join(dir, 'vue.php'), `<?php $_POST = json_decode(${JSON.stringify(JSON.stringify(post))}, true); include __DIR__ . '/examen/enseignant.php';`);
        return execFileSync('php', [join(dir, 'vue.php')]).toString();
      };
      const html = view({ motdepasse: 'Secret23abcd' });
      expect(html).toContain('<strong>Fermé</strong>');
      expect(html).toContain('1 élève en cours');
      expect(html).toContain('Bob');
      expect(html).toContain('hors délai, 2 copies à ce nom');
      expect(html).toContain('8:20'); // durée mesurée par le serveur (500 s)
      const opened = view({ motdepasse: 'Secret23abcd', action: 'ouvrir', code: '<K9>', duree: '45' });
      expect(opened).toContain('Examen ouvert.');
      expect(opened).toContain('durée : 45 min');
      expect(opened).toContain('&lt;K9&gt;');
      expect(view({ action: 'fermer' })).not.toContain('Examen fermé');
      expect(view({ motdepasse: 'Secret23abcd', action: 'supprimer-copies' })).toContain('Cocher « Je confirme »');
      const cleared = view({ motdepasse: 'Secret23abcd', action: 'supprimer-copies', confirmer: '1' });
      expect(cleared).toContain('Copies supprimées.');
      expect(cleared).toContain('0 copie,');
      expect(cleared).not.toContain('élève en cours');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('ouverture, durée et seuil : lecteur', () => {
  it('seuil de reglages.js', () => {
    expect(resolveThreshold({ seuil: '50' })).toBe(0.5);
    expect(resolveThreshold({ seuil: ' 62,5 ' })).toBe(0.625);
    expect(resolveThreshold({ seuil: 75 })).toBe(0.75);
    for (const v of ['', '0', '101', 'abc', null]) expect(resolveThreshold({ seuil: v })).toBeNull();
    expect(resolveThreshold(null)).toBeNull();
    expect(settingsScript({ modes: 'both', solutions: 'end' })).toContain('seuil: ""');
  });

  it('seuil appliqué au chargement ; durée donnée par le serveur gardée avec la progression', async () => {
    const data = await siteDataOf(siteContent([quiz], [], []), new Map(), { title: 'T', modes: 'exam', solutions: 'teacher', server: true }, '0.2.0');
    const m = new Map<string, string>();
    const storage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    const repo = new SiteRepository(data.id, storage);
    await repo.load(data, resolveSettings(data), 0.4);
    expect((await repo.getQuiz(quiz.id))?.passThreshold).toBe(0.4);
    await repo.saveAttempt({ ...attempt, quizSnapshot: await repo.getQuiz(quiz.id) });
    await repo.setTimeLimit(quiz.id, 2700);
    expect((await repo.getQuiz(quiz.id))?.timeLimitSec).toBe(2700);
    expect((await repo.getAttempt(attempt.id))?.quizSnapshot?.timeLimitSec).toBe(2700);
    await repo.flush();
    const again = new SiteRepository(data.id, storage);
    await again.load(data, resolveSettings(data));
    expect((await again.getQuiz(quiz.id))?.timeLimitSec).toBe(2700);
    expect((await again.getQuiz(quiz.id))?.passThreshold).toBe(0.5);
  });

  it('demandes au serveur : état, début, erreurs', async () => {
    const reply = (status: number, body: unknown) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
    expect(await examState(reply(200, { ouvert: true, code: true, duree: 45, classe: true }))).toEqual({ open: true, code: true, minutes: 45, classList: true });
    await expect(startOnServer('q', 'a', undefined, '', reply(403, { error: 'nom' }))).rejects.toMatchObject({ reason: 'name' });
    expect(await startOnServer('q', 'a', undefined, 'X', reply(200, { ok: true, limitSec: 600, questions: null }))).toEqual({ limitSec: 600, questions: null });
    expect(await startOnServer('q', 'a', undefined, 'X', reply(200, { ok: true, limitSec: null, questions: ['q1', 'q3'] }))).toEqual({
      limitSec: null,
      questions: ['q1', 'q3'],
    });
    for (const [error, reason] of [['ferme', 'closed'], ['code', 'code'], ['copie', 'record']] as const) {
      await expect(startOnServer('q', 'a', undefined, '', reply(403, { error }))).rejects.toMatchObject({ reason });
    }
    await expect(gradeOnServer(quiz, attempt, [], undefined, reply(403, { error: 'debut' }))).rejects.toMatchObject({ reason: 'start' });
    const html = (async () => new Response('<?php', { status: 200 })) as unknown as typeof fetch;
    await expect(examState(html)).rejects.toMatchObject({ reason: 'server' });
  });

  it('liste de classe, détail d’une copie, statistiques par question, CSV par question', () => {
    const dir = mkdtempSync(join(tmpdir(), 'abbon-php-'));
    try {
      for (const [f, text] of Object.entries(examFiles([quiz], 'teacher', 'Secret23abcd'))) {
        mkdirSync(dirname(join(dir, f)), { recursive: true });
        writeFileSync(join(dir, f), text);
      }
      writeFileSync(join(dir, 'reglages.js'), settingsScript({ modes: 'exam', solutions: 'teacher' }, true));
      const view = (post: Record<string, string>) => {
        writeFileSync(join(dir, 'vue.php'), `<?php $_POST = json_decode(${JSON.stringify(JSON.stringify(post))}, true); include __DIR__ . '/examen/enseignant.php';`);
        return execFileSync('php', [join(dir, 'vue.php')]).toString();
      };
      const pw = { motdepasse: 'Secret23abcd' };
      const saved = view({ ...pw, action: 'classe', classe: 'Lovelace Ada ; TG2\nTuring Alan\n\nlovelace ada\nHopper Grace ; TG1' });
      expect(saved).toContain('Liste de classe enregistrée : 3 élèves.');
      view({ ...pw, action: 'ouvrir', code: '', duree: '' });
      const pub = publicQuiz(quiz);
      const answers = [
        answer('q0', { selected: ['c1'] }),
        answer('q1', { selected: ['c0'] }),
        answer('q2', { text: 'goed' }),
        answer('q8', { texts: ['est parti', 'avion'] }),
      ];
      const steps = [
        { action: 'etat' },
        { action: 'debut', quiz: quiz.id, attempt: { id: 'a1' }, candidate: { name: 'Ada Lovelace', group: '' } }, // ordre et majuscules libres
        { action: 'debut', quiz: quiz.id, attempt: { id: 'a2' }, candidate: { name: 'Lovelase Ada', group: '' } }, // faute : refusé
        { action: 'debut', quiz: quiz.id, attempt: { id: 'a3' }, candidate: { name: 'TURING alan', group: 'autre' } },
        { ...gradeRequest(pub, { ...attempt, id: 'a1' }, answers, { name: 'Ada Lovelace', group: '' }) },
        { ...gradeRequest(pub, { ...attempt, id: 'a3' }, [answer('q0', { selected: ['c1'] })], { name: 'TURING alan', group: 'autre' }) },
      ];
      writeFileSync(join(dir, 'etapes.json'), JSON.stringify(steps));
      writeFileSync(
        join(dir, 'test.php'),
        `<?php
define('ABBON_CORRIGER_BIBLIOTHEQUE', true);
require __DIR__ . '/examen/corriger.php';
$solutions = require __DIR__ . '/examen/solutions.php';
$out = array();
foreach (json_decode(file_get_contents(__DIR__ . '/etapes.json'), true) as $r) $out[] = abbon_traiter($solutions, $r, __DIR__ . '/examen/copies', __DIR__ . '/reglages.js', 1000);
$out[] = abbon_lire_copies(__DIR__ . '/examen/copies');
$out[] = array(abbon_cle_nom('  Élodie   DE LA Tour-Pin '), abbon_cle_nom('tour pin elodie de la'));
echo json_encode($out, JSON_UNESCAPED_UNICODE);
`,
      );
      const r = JSON.parse(execFileSync('php', [join(dir, 'test.php')]).toString());
      expect(r[0][1].classe).toBe(true);
      expect(r[1][0]).toBe(200);
      expect(r[2]).toEqual([403, { error: 'nom' }]);
      expect(r[3][0]).toBe(200);
      const copies = r[6];
      // Nom et groupe de la liste ; groupe donné par l'élève gardé.
      expect(copies.map((c: { nom: string; groupe: string }) => [c.nom, c.groupe])).toEqual([['Turing Alan', 'autre'], ['Lovelace Ada', 'TG2']]);
      expect(r[7][0]).toBe(r[7][1]);

      const html = view(pw);
      expect(html).toContain('1 élève de la liste sans copie commencée : Hopper Grace.');
      expect(html).toContain('Lovelace Ada ; TG2\nTuring Alan\nHopper Grace ; TG1</textarea>');
      expect(html).toContain('Choisir un QCM pour voir les statistiques');

      // Statistiques du QCM : q0 réussie par les deux copies, q1 par aucune (sans réponse dans l'une).
      const stats = view({ ...pw, qcm: quiz.id });
      const rows = [...stats.matchAll(/<tr>\s*<td class="num">(\d+)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td class="num">([^<]*)<\/td>\s*<td class="num">([^<]*)<\/td>\s*<td class="num">([^<]*)<\/td>/g)].map((m) => m.slice(1));
      expect(rows[0]).toEqual(['1', 'Question 0', 'choix 1', '100 %', '1 / 1', '0']);
      expect(rows[1]).toEqual(['2', 'Question 1', 'choix 0 ; choix 2', '0 %', '0,25 / 1', '1']); // notation partielle : 0,5 et 0
      expect(rows[2][2]).toBe('went / did go');
      expect(rows[8][2]).toBe('est parti / est allé · train');

      // Détail d'une copie : réponses de l'élève, réponses attendues, points.
      const detail = view({ ...pw, action: 'copie', id: 'a1' });
      expect(detail).toContain('Copie de Lovelace Ada (TG2)');
      expect(detail).toContain('<td>choix 0</td>');
      expect(detail).toContain('<td>goed</td>');
      expect(detail).toContain('<td>est parti · avion</td>');
      expect(detail).toContain('(sans réponse)');
      expect(detail).toMatch(/class="num ok">1 \/ 1/);
      expect(detail).toMatch(/class="num ko">1 \/ 2/); // texte à trous : un trou sur deux (notation partielle)

      const csv = view({ ...pw, qcm: quiz.id, format: 'csv' }).split('\r\n');
      expect(csv[0]).toContain('"Identifiant";"Q1 (/1)";"Q2 (/1)"');
      expect(csv[0]).toContain('"Q9 (/2)"');
      expect(csv[2]).toContain('"a1";"1";"0,5";"0";');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('textes pour l’espace enseignant', () => {
  it('énoncé, choix et réponse attendue de chaque question', () => {
    const d = (i: number) => displayOf(quiz.questions[i], 'fr');
    expect(d(0)).toEqual({ prompt: 'Question 0', choices: { c0: 'choix 0', c1: 'choix 1', c2: 'choix 2' }, expected: 'choix 1' });
    expect(d(5).expected).toBe(plainMath(expectedText(quiz.questions[5], 'fr')));
    expect(d(5).expected).toContain('m/s²');
    expect(d(9).expected).toBe('(autoévaluation)');
    expect(d(10).expected).toBe('(n+1)^2');
    expect(serverSolutions([quiz], 'end').quizzes[quiz.id].questions.q0.display).toEqual(d(0));
  });

  it('formules lisibles en texte simple', () => {
    expect(plainMath('Calculez \\displaystyle\\int_0^2 3x^2\\,\\mathrm{d}x.')).toBe('Calculez ∫_0^2 3x^2 dx.');
    expect(plainMath('x \\mapsto \\dfrac{x^{n+1}}{n+1}')).toBe('x ↦ (x^(n+1))/(n+1)');
    expect(plainMath('Pour n \\neq -1, sur ]0\\,;+\\infty[ et \\mathbb{R}')).toBe('Pour n ≠ -1, sur ]0 ;+∞[ et ℝ');
    expect(plainMath('\\frac12 \\ln(2x+1)')).toBe('\\frac12 ln(2x+1)');
  });
});

describe('tirage de N questions parmi M', () => {
  it('réglage « tirage » de reglages.js, désactivé par défaut', () => {
    expect(resolveDraw({ tirage: '10' })).toBe(10);
    expect(resolveDraw({ tirage: 5 })).toBe(5);
    for (const v of ['', '0', 'dix', '-3', null]) expect(resolveDraw({ tirage: v })).toBeNull();
    expect(resolveDraw(null)).toBeNull();
    expect(settingsScript({ modes: 'exam', solutions: 'end' })).toContain('tirage: ""');
    // Points d'un QCM réussi en examen : aucun pour l'examen corrigé par le serveur, comme à l'entraînement sinon.
    expect(settingsScript({ modes: 'exam', solutions: 'end' }, true)).toContain('points: "0"');
    expect(settingsScript({ modes: 'both', solutions: 'end' })).toContain('points: ""');
    expect([resolveExamPoints({ points: '0' }), resolveExamPoints({ points: ' 5 ' }), resolveExamPoints({ points: 2 }), resolveExamPoints({ points: '' }), resolveExamPoints({ points: '-1' }), resolveExamPoints(null)]).toEqual([0, 5, 2, null, null, null]);
  });

  it('questions tirées : nombre demandé, ordre du QCM, au hasard selon la tentative', () => {
    const all = quiz.questions.map((q) => q.id);
    expect(drawQuestionIds(quiz, null, 'x')).toEqual(all);
    expect(drawQuestionIds(quiz, 99, 'x')).toEqual(all);
    const a = drawQuestionIds(quiz, 5, 'tentative-1');
    expect(a).toHaveLength(5);
    expect(a).toEqual(all.filter((id) => a.includes(id)));
    expect(drawQuestionIds(quiz, 5, 'tentative-1')).toEqual(a);
    const draws = new Set(Array.from({ length: 20 }, (_, i) => drawQuestionIds(quiz, 5, `t${i}`).join()));
    expect(draws.size).toBeGreaterThan(10);
    const attemptDrawn = startAttempt({ ...quiz, shuffle: false }, 'exam', { onlyQuestionIds: a });
    expect(attemptDrawn.questionOrder).toEqual(a);
  });

  it.skipIf(!hasPhp)('serveur : tirage au début, seules les questions tirées sont notées', () => {
    const dir = mkdtempSync(join(tmpdir(), 'abbon-php-'));
    try {
      for (const [f, text] of Object.entries(examFiles([quiz], 'end', 'Secret23abcd'))) {
        mkdirSync(dirname(join(dir, f)), { recursive: true });
        writeFileSync(join(dir, f), text);
      }
      writeFileSync(join(dir, 'reglages.js'), settingsScript({ modes: 'exam', solutions: 'end' }, true).replace('tirage: ""', 'tirage: "3"'));
      const pub = publicQuiz(quiz);
      // Le lecteur envoie toutes les questions, toutes justes pour q0 : seules les 3 tirées comptent.
      const all = quiz.questions.map((q) => answer(q.id, { selected: ['c1'] }));
      writeFileSync(join(dir, 'demande.json'), JSON.stringify(gradeRequest(pub, attempt, all)));
      writeFileSync(
        join(dir, 'test.php'),
        `<?php
define('ABBON_CORRIGER_BIBLIOTHEQUE', true);
require __DIR__ . '/examen/corriger.php';
$solutions = require __DIR__ . '/examen/solutions.php';
$dir = __DIR__ . '/examen/copies';
$reglages = __DIR__ . '/reglages.js';
abbon_ecrire_etat($dir, 'ouverture', array('ouvert' => true, 'code' => ''));
$debut = abbon_traiter($solutions, array('action' => 'debut', 'quiz' => 'quiz-examen', 'attempt' => array('id' => 'a1')), $dir, $reglages, 1000);
$copie = abbon_traiter($solutions, json_decode(file_get_contents(__DIR__ . '/demande.json'), true), $dir, $reglages, 1100);
$tirages = array();
for ($i = 0; $i < 30; $i++) $tirages[implode(',', abbon_tirer($solutions['quizzes']['quiz-examen'], 3))] = true;
echo json_encode(array($debut, $copie, abbon_lire_copies($dir), count($tirages), abbon_tirer($solutions['quizzes']['quiz-examen'], 99)));
`,
      );
      const [debut, copie, copies, distinct, none] = JSON.parse(execFileSync('php', [join(dir, 'test.php')]).toString());
      const drawn: string[] = debut[1].questions;
      expect(drawn).toHaveLength(3);
      const order = quiz.questions.map((q) => q.id);
      expect(drawn).toEqual(order.filter((id) => drawn.includes(id)));
      expect(Object.keys(copie[1].perQuestion)).toEqual(drawn);
      const max = quiz.questions.filter((q) => drawn.includes(q.id)).reduce((t, q) => t + q.points, 0);
      expect(copie[1].maxScore).toBe(max);
      expect(Object.keys(copies[0].points)).toEqual(drawn);
      expect(distinct).toBeGreaterThan(5);
      expect(none).toBeNull();
      writeFileSync(join(dir, 'vue.php'), `<?php $_POST = array('motdepasse' => 'Secret23abcd'); include __DIR__ . '/examen/enseignant.php';`);
      expect(execFileSync('php', [join(dir, 'vue.php')]).toString()).toContain('Tirage au sort (reglages.js) : 3 questions par élève');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

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
import { resultOf } from '$lib/domain/session';
import type { Answer, Attempt, InstalledModule, Question, Quiz } from '$lib/domain/types';
import { parsePackage } from '$lib/interchange/qcmPackage';
import { siteContent, siteDataOf, zipSite } from '$lib/interchange/siteExport';
import { parseCandidate, resolveCollect, resolveSettings, settingsScript } from '$lib/site';
import { detailLocked, finishWithGrade, gradeRequest, isGradeResponse, withDetail, withSolutions } from './client';
import { publicQuiz, serverSolutions, solutionsPhp } from './publish';
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
      return [{ text: 'went' }, { text: '  DID   go ' }, { text: 'goed' }, { text: 'paris' }, { text: 'Paris' }, { text: "l'île" }, { text: 'l’ile' }, { text: '' }, {}];
    case 'numeric':
      return [{ text: '9,81' }, { text: '9.8' }, { text: '9,82' }, { text: '9,83' }, { text: '0,3' }, { text: '.3' }, { text: '3e-1' }, { text: '8 388 608' }, { text: '8388609' }, { text: '8,4e6' }, { text: '−0,3' }, { text: 'abc' }, { text: '' }];
    case 'cloze':
      return [{ texts: ['est parti', 'train'] }, { texts: ['Est  Allé', 'train'] }, { texts: ['est parti', 'avion'] }, { texts: ['partit', 'Train'] }, { texts: [null as unknown as string, 'train'] }, { texts: [] }];
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
    const grade: GradeResponse = { score: 1, maxScore: 19, ratio: 1 / 19, passed: false, perQuestion };
    expect(isGradeResponse(grade, Object.keys(perQuestion))).toBe(true);
    expect(isGradeResponse({ ...grade, perQuestion: {} }, ['q0'])).toBe(false);
    expect(isGradeResponse('<?php …', ['q0'])).toBe(false);
    const done = finishWithGrade(pub, attempt, answers, grade);
    expect(done.attempt).toMatchObject({ status: 'finished', score: 1, maxScore: 19 });
    expect(done.answers.find((a) => a.questionId === 'q0')).toMatchObject({ correct: true, points: 1 });
    const again = resultOf(pub, done.attempt, done.answers, true);
    expect(again).toMatchObject({ score: 1, maxScore: 19, passed: false });
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
      expect(csv.split('\r\n')[0]).toBe('﻿"Date";"Nom";"Classe ou groupe";"QCM";"Note";"Sur";"Pourcentage";"Réussi";"Durée";"Identifiant"');
      expect(csv).toContain(`"'=HYPERLINK(""x"") Ada <b>";"TG2";"Examen";"2";"19";"10,53";"non";"0:00";"a1"`);
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
      expect(before.avant).toEqual({ score: 1, maxScore: 19, ratio: 1 / 19, passed: false, locked: true });
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
  const locked: GradeResponse = { score: 1, maxScore: 19, ratio: 1 / 19, passed: false, locked: true };

  it('la note seule : réponses sans détail, résultat relu depuis la tentative', () => {
    expect(isGradeResponse(locked, ['q0', 'q1'])).toBe(true);
    const done = finishWithGrade(pub, attempt, answers, locked);
    expect(done.attempt).toMatchObject({ status: 'finished', score: 1, maxScore: 19 });
    expect(done.answers.every((a) => a.points === null && a.correct === null)).toBe(true);
    expect(detailLocked(pub, done.attempt, done.answers)).toBe(true);
    expect(resultOf(pub, done.attempt, done.answers, true)).toEqual({ score: 1, maxScore: 19, ratio: 1 / 19, passed: false, perQuestion: {} });
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
});

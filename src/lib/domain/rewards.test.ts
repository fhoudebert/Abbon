import { describe, expect, it } from 'vitest';
import { MemoryRepository } from '$lib/data/memory';
import type { Repository } from '$lib/data/repository';
import { demoQuizzes } from '$lib/data/seed';
import { SqliteRepository } from '$lib/data/sqlite';
import { nodeDriver } from '$lib/data/sqlite.testing';
import { buildPackage, parsePackage } from '$lib/interchange/qcmPackage';
import { dueCards, newCard, reviewCard, type LeitnerCard } from './leitner';
import {
  attemptRewards,
  BELTS,
  collectRewards,
  DAN_STEP,
  examRewards,
  localDay,
  POINTS,
  promotion,
  rankOf,
  reviewRewards,
  rewardKey,
  totalPoints,
  type Reward,
} from './rewards';

const quiz = demoQuizzes[0];
const [q1, q2] = quiz.questions;
const now = new Date(2026, 10, 21, 10, 0);
const day = (n: number, h = 9) => new Date(2026, 10, 21 + n, h, 0);

describe('ceintures', () => {
  it('suivent les seuils du judo, puis un dan tous les 3 000 points', () => {
    expect(BELTS.map((b) => b.min)).toEqual([0, 100, 300, 700, 1500, 3000, 5000]);
    expect(rankOf(0)).toMatchObject({ belt: 'white', dan: 0, floor: 0, next: 100 });
    expect(rankOf(99).belt).toBe('white');
    expect(rankOf(100).belt).toBe('yellow');
    expect(rankOf(1499)).toMatchObject({ belt: 'green', next: 1500 });
    expect(rankOf(5000)).toMatchObject({ belt: 'black', dan: 1, floor: 5000, next: 5000 + DAN_STEP });
    expect(rankOf(5000 + 2 * DAN_STEP + 1)).toMatchObject({ belt: 'black', dan: 3 });
  });

  it('annoncent un passage de ceinture ou de dan, pas une simple progression', () => {
    expect(promotion(90, 99)).toBeNull();
    expect(promotion(95, 105)?.belt).toBe('yellow');
    expect(promotion(7990, 8010)).toMatchObject({ belt: 'black', dan: 2 });
  });
});

describe('récompenses de révision', () => {
  const card = newCard(quiz, q1, now);

  it('1 point par révision d’une carte due, 2 si la réponse est juste', () => {
    const ok = reviewRewards(card, reviewCard(card, true, now), true, 3, now);
    expect(ok).toEqual([{ kind: 'review', ref: `${q1.id}@${localDay(now)}`, points: 2, at: now.toISOString() }]);
    expect(reviewRewards(card, reviewCard(card, false, now), false, 3, now)[0].points).toBe(1);
  });

  it('rien pour une carte révisée avant sa date ou déjà acquise', () => {
    const later = reviewCard(card, true, now); // due dans 2 jours
    expect(reviewRewards(later, reviewCard(later, true, now), true, 0, now)).toEqual([]);
    const acquired = { ...card, box: 5, acquiredAt: now.toISOString() };
    expect(reviewRewards(acquired, reviewCard(acquired, true, day(1)), true, 0, day(1))).toEqual([]);
  });

  it('carte acquise : 10 points ; journée à jour : 10 points, une fois par jour', () => {
    const last = { ...card, box: 5 };
    const r = reviewRewards(last, reviewCard(last, true, now), true, 0, now);
    expect(r.map((x) => [x.kind, x.ref, x.points])).toEqual([
      ['review', `${q1.id}@2026-11-21`, 2],
      ['acquired', q1.id, POINTS.acquired],
      ['day', '2026-11-21', POINTS.day],
    ]);
  });

  it('collecte : 1 point seulement pour une question échouée', () => {
    expect(collectRewards(q1.id, true, now)).toEqual([{ kind: 'collect', ref: q1.id, points: 1, at: now.toISOString() }]);
    expect(collectRewards(q1.id, false, now)).toEqual([]);
  });

  it('QCM réussi : 2 points ; module terminé quand tous ses QCM sont réussis', () => {
    const q = { id: 'm_a', moduleId: 'org.m' };
    expect(attemptRewards(q, false, true, false, ['m_a'], new Set(), now)).toEqual([]);
    expect(attemptRewards(q, true, false, false, ['m_a'], new Set(), now)).toEqual([]); // « refaire les erreurs »
    expect(attemptRewards(q, true, true, false, ['m_a', 'm_b'], new Set(), now).map((r) => r.kind)).toEqual(['quiz']);
    expect(attemptRewards(q, true, true, false, ['m_a', 'm_b'], new Set(['m_b']), now).map((r) => [r.kind, r.ref, r.points])).toEqual([
      ['quiz', 'm_a', 2],
      ['module', 'org.m', 10],
    ]);
    expect(attemptRewards({ id: 'perso' }, true, true, false, [], new Set(), now).map((r) => r.kind)).toEqual(['quiz']);
  });

  it('sans faute : 3 points de plus, une seule fois par QCM (clé perfect:<id>)', () => {
    const q = { id: 'm_a', moduleId: 'org.m' };
    const first = attemptRewards(q, true, true, true, ['m_a', 'm_b'], new Set(), now);
    expect(first.map((r) => [r.kind, r.ref, r.points])).toEqual([
      ['quiz', 'm_a', 2],
      ['perfect', 'm_a', POINTS.perfect],
    ]);
    // QCM déjà réussi, refait jusqu'à 100 % : seul « perfect » est nouveau ; refait encore : rien de nouveau.
    const keys = new Set([rewardKey(first[0])]);
    const redo = attemptRewards(q, true, true, true, ['m_a', 'm_b'], new Set(['m_a']), now).filter((r) => !keys.has(rewardKey(r)));
    expect(redo.map((r) => r.kind)).toEqual(['perfect']);
    keys.add(rewardKey(redo[0]));
    expect(attemptRewards(q, true, true, true, ['m_a', 'm_b'], new Set(['m_a']), now).filter((r) => !keys.has(rewardKey(r)))).toEqual([]);
    // Tentative partielle (« refaire les erreurs ») : rien, même à 100 %.
    expect(attemptRewards(q, true, false, true, ['m_a'], new Set(), now)).toEqual([]);
  });
});

/**
 * Simulation qui a servi à caler les seuils (feuille de route, lot 15) : on ajoute des questions
 * échouées chaque jour et on révise tout ce qui est dû, avec une probabilité de bonne réponse qui
 * croît avec le compartiment. Hasard reproductible.
 */
function simulate(perDay: number, daysCount: number, skipEvery = 0) {
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const success = [0.65, 0.75, 0.85, 0.9, 0.93];
  let cards: LeitnerCard[] = [];
  const keys = new Set<string>();
  let points = 0;
  let collected = 0;
  let reviews = 0;
  const reached = new Map<string, number>();
  const grant = (rs: Reward[]) => {
    for (const r of rs) if (!keys.has(`${r.kind}:${r.ref}`)) (keys.add(`${r.kind}:${r.ref}`), (points += r.points));
  };
  let id = 0;
  for (let d = 0; d < daysCount; d++) {
    const when = day(d, 20);
    for (let k = 0; k < perDay; k++) {
      const c = newCard(quiz, { ...q1, id: `q${id++}` }, day(d, 8));
      cards.push(c);
      const before = points;
      grant(collectRewards(c.questionId, true, when));
      collected += points - before;
    }
    if (!(skipEvery && d % skipEvery === skipEvery - 1)) {
      for (const c of dueCards(cards, when)) {
        reviews++;
        const ok = rand() < success[c.box - 1];
        const next = reviewCard(c, ok, when);
        cards = cards.map((x) => (x.questionId === c.questionId ? next : x));
        grant(reviewRewards(c, next, ok, dueCards(cards, when).length, when));
      }
    }
    const belt = rankOf(points).belt;
    if (!reached.has(belt)) reached.set(belt, d + 1);
  }
  return { points, collected, reviewsPerDay: reviews / daysCount, reached, inPlan: cards.filter((c) => !c.acquiredAt).length };
}

describe('calage du barème (simulation)', () => {
  it('une question par jour, révisions quotidiennes : ceinture noire vers 5 mois, charge stable', () => {
    const s = simulate(1, 400);
    expect(s.reached.get('green')).toBeGreaterThan(25);
    expect(s.reached.get('green')).toBeLessThan(45);
    expect(s.reached.get('black')).toBeGreaterThan(120);
    expect(s.reached.get('black')).toBeLessThan(190);
    expect(s.reviewsPerDay).toBeLessThan(10); // les cartes acquises sortent du planning
    expect(s.inPlan).toBeLessThan(60);
    expect(s.collected / s.points).toBeLessThan(0.06); // la collecte pèse peu
  });

  it('sauter un jour sur trois retarde la progression', () => {
    expect(simulate(1, 400, 3).reached.get('black')!).toBeGreaterThan(simulate(1, 400).reached.get('black')!);
  });
});

describe.each([
  ['mémoire', () => new MemoryRepository() as Repository],
  ['SQLite', () => new SqliteRepository(nodeDriver()) as Repository],
])('récompenses enregistrées (%s)', (_name, make) => {
  const r = (kind: Reward['kind'], ref: string, points: number): Reward => ({ kind, ref, points, at: now.toISOString() });

  it('ne comptent qu’une fois chaque événement', async () => {
    const repo = make();
    expect(await repo.addRewards([r('collect', 'a', 1), r('day', '2026-11-21', 10)])).toHaveLength(2);
    const again = await repo.addRewards([r('collect', 'a', 1), r('collect', 'b', 1), r('collect', 'b', 1)]);
    expect(again.map((x) => x.ref)).toEqual(['b']);
    expect(totalPoints(await repo.listRewards())).toBe(12);
  });

  it('gardent la date d’acquisition des cartes et sont remplacées par une sauvegarde', async () => {
    const repo = make();
    const acquired = { ...newCard(quiz, q2, now), box: 5, acquiredAt: now.toISOString() };
    await repo.saveCard(acquired);
    expect((await repo.listCards())[0].acquiredAt).toBe(now.toISOString());
    await repo.addRewards([r('quiz', 'x', 2)]);
    await repo.replaceAll({ categories: [], quizzes: [], attempts: [], answers: [], settings: {}, media: [], cards: [], rewards: [r('module', 'm', 10)] });
    expect(await repo.listRewards()).toEqual([r('module', 'm', 10)]);
  });
});

describe('récompenses dans la sauvegarde complète', () => {
  it('aller-retour de rewards.json', async () => {
    const rewards: Reward[] = [
      { kind: 'review', ref: `${q1.id}@2026-11-21`, points: 2, at: now.toISOString() },
      { kind: 'day', ref: '2026-11-21', points: 10, at: now.toISOString() },
    ];
    const cards = [{ ...newCard(quiz, q1, now), acquiredAt: now.toISOString() }];
    const bytes = buildPackage(
      { quizzes: [], categories: [], media: new Map(), attempts: [], answers: [], settings: {}, cards, rewards },
      { kind: 'backup', solutions: true, appVersion: '0.2.0' },
    );
    const p = await parsePackage(bytes);
    expect(p.problems).toEqual([]);
    expect(p.rewards).toEqual(rewards);
    expect(p.cards).toEqual(cards);
  });
});

describe('points en mode examen (réglage « points » d\'un site)', () => {
  const rewards = attemptRewards({ id: 'q1', moduleId: 'm' }, true, true, true, ['q1', 'q2'], new Set(['q2']), new Date('2026-01-01'));
  it('null : comme à l\'entraînement ; 0 : aucun point ; n : n points pour le QCM, bonus gardés', () => {
    expect(examRewards(rewards, null)).toEqual(rewards);
    expect(examRewards(rewards, 0)).toEqual([]);
    expect(examRewards(rewards, 3).map((r) => [r.kind, r.points])).toEqual([
      ['quiz', 3],
      ['perfect', POINTS.perfect],
      ['module', POINTS.module],
    ]);
  });
});

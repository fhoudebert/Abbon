import { describe, expect, it } from 'vitest';
import { MemoryRepository } from '$lib/data/memory';
import type { Repository } from '$lib/data/repository';
import { demoQuizzes } from '$lib/data/seed';
import { SqliteRepository } from '$lib/data/sqlite';
import { nodeDriver } from '$lib/data/sqlite.testing';
import { buildPackage, cardMedia, parsePackage } from '$lib/interchange/qcmPackage';
import {
  boxCounts,
  cardQuestion,
  dueAfter,
  dueCards,
  isCorrect,
  isAcquired,
  isDue,
  LEITNER_BOXES,
  LEITNER_INTERVALS,
  newCard,
  restoreCard,
  reviewCard,
} from './leitner';

const quiz = demoQuizzes[0];
const [q1, q2] = quiz.questions;
const now = new Date(2026, 10, 16, 10, 30); // 16 novembre 2026, 10 h 30 (heure locale)
const days = (n: number) => new Date(2026, 10, 16 + n, 8, 0);

describe('boîte de Leitner', () => {
  it('range une nouvelle carte dans le premier compartiment, à revoir tout de suite', () => {
    const c = newCard(quiz, q1, now);
    expect([c.box, c.reviews, c.lapses, c.lastAt]).toEqual([1, 0, 0, null]);
    expect(isDue(c, now)).toBe(true);
    expect(c.snapshot.question).toEqual(q1);
    expect(c.snapshot.question).not.toBe(q1);
  });

  it('avance d’un compartiment à chaque bonne réponse, avec des délais qui doublent, puis est acquise', () => {
    let c = newCard(quiz, q1, now);
    const seen: [number, string][] = [];
    let when = now;
    for (let i = 0; i < 4; i++) {
      c = reviewCard(c, true, when);
      seen.push([c.box, c.dueAt]);
      when = new Date(c.dueAt); // révisée le jour prévu
    }
    expect(seen.map(([b]) => b)).toEqual([2, 3, 4, 5]);
    const gaps = seen.map(([, d], i) => Math.round((Date.parse(d) - Date.parse(i ? seen[i - 1][1] : dueAfter(now, 0))) / 86_400_000));
    expect(gaps).toEqual([2, 4, 8, 16]);
    expect(LEITNER_INTERVALS).toHaveLength(LEITNER_BOXES);
    // Juste au dernier compartiment : acquise, hors du planning, 30 jours après le premier passage.
    c = reviewCard(c, true, when);
    expect(isAcquired(c)).toBe(true);
    expect(Math.round((Date.parse(c.acquiredAt!) - Date.parse(dueAfter(now, 0))) / 86_400_000)).toBe(30);
    expect(isDue(c, days(400))).toBe(false);
    expect(dueCards([c], days(400))).toEqual([]);
    expect(boxCounts([c])).toEqual([0, 0, 0, 0, 0]);
    expect(c.reviews).toBe(5);
  });

  it('une carte acquise ne bouge pas si elle est juste, revient au premier compartiment sur une erreur', () => {
    const acquired = { ...newCard(quiz, q1, now), box: 5, acquiredAt: now.toISOString() };
    expect(reviewCard(acquired, true, days(1))).toMatchObject({ box: 5, acquiredAt: now.toISOString(), reviews: 1 });
    const back = reviewCard(acquired, false, days(1));
    expect([back.box, back.acquiredAt, back.lapses, isDue(back, days(2))]).toEqual([1, null, 1, true]);
  });

  it('« Remettre en révision » replace une carte acquise au premier compartiment, à revoir tout de suite', () => {
    const r = restoreCard({ ...newCard(quiz, q1, now), box: 5, acquiredAt: now.toISOString() }, days(3));
    expect([r.box, r.acquiredAt, isDue(r, days(3))]).toEqual([1, null, true]);
  });

  it('renvoie la carte dans le premier compartiment à la moindre erreur', () => {
    const c = reviewCard({ ...newCard(quiz, q1, now), box: 4 }, false, now);
    expect([c.box, c.lapses, c.dueAt]).toEqual([1, 1, dueAfter(now, 1)]);
  });

  it('révisée avant sa date, une carte juste ne monte pas ; une erreur compte quand même', () => {
    const early = reviewCard(newCard(quiz, q1, now), true, now); // compartiment 2, due dans 2 jours
    const again = reviewCard(early, true, now);
    expect([again.box, again.dueAt, again.reviews]).toEqual([2, early.dueAt, 2]);
    expect(reviewCard(early, false, now).box).toBe(1);
  });

  it('rend la carte due le matin du jour prévu, pas avant', () => {
    const c = reviewCard(newCard(quiz, q1, now), true, now); // compartiment 2 : dans 2 jours
    expect(isDue(c, now)).toBe(false);
    expect(isDue(c, days(1))).toBe(false);
    expect(isDue(c, days(2))).toBe(true);
    expect(new Date(c.dueAt).getHours()).toBe(0);
  });

  it('propose d’abord les cartes les moins sues', () => {
    const a = { ...newCard(quiz, q1, now), box: 3, dueAt: dueAfter(now, -2) };
    const b = { ...newCard(quiz, q2, now), box: 1, dueAt: dueAfter(now, -1) };
    const later = { ...newCard(quiz, quiz.questions[2], now), dueAt: dueAfter(now, 3) };
    expect(dueCards([a, later, b], now).map((c) => c.questionId)).toEqual([q2.id, q1.id]);
    expect(boxCounts([a, b, later])).toEqual([2, 0, 1, 0, 0]);
  });

  it('corrige une réponse quel que soit le type de question', () => {
    const right = q1.choices.filter((c) => c.correct).map((c) => c.id);
    expect(isCorrect(q1, { selected: right })).toBe(true);
    expect(isCorrect(q1, { selected: [] })).toBe(false);
    const typed = demoQuizzes.find((x) => x.id === 'demo-typed')!.questions;
    expect(isCorrect(typed[0], { selected: [], text: 'roma' })).toBe(true);
    expect(isCorrect(typed[2], { selected: [], texts: ['Soleil', '365'] })).toBe(true);
    expect(isCorrect(typed[2], { selected: [], texts: ['Soleil', '28'] })).toBe(false);
  });

  it('affiche la version actuelle de la question si le QCM existe encore, sinon la copie', () => {
    const c = newCard(quiz, q1, now);
    const edited = structuredClone(quiz);
    edited.questions[0].prompt = { fr: 'Énoncé corrigé' };
    expect(cardQuestion(c, edited).question.prompt.fr).toBe('Énoncé corrigé');
    expect(cardQuestion(c, null).question).toEqual(q1);
    expect(cardQuestion(c, { ...edited, questions: [] }).question).toEqual(q1);
  });
});

describe.each<[string, () => Repository]>([
  ['SQLite', () => new SqliteRepository(nodeDriver())],
  ['mémoire', () => new MemoryRepository()],
])('boîte de révision en base (%s)', (_name, make) => {
  it('enregistre, met à jour et retire une carte ; survit à la suppression du QCM', async () => {
    const repo = make();
    await repo.saveQuiz({ ...quiz, categoryId: null });
    const c = newCard(quiz, q1, now);
    await repo.saveCard(c);
    await repo.saveCard(newCard(quiz, q2, new Date(now.getTime() + 1000)));
    expect(await repo.listCards()).toHaveLength(2);
    expect((await repo.listCards())[0]).toEqual(c);

    const next = reviewCard(c, true, now);
    await repo.saveCard(next);
    expect((await repo.listCards())[0]).toEqual(next);

    await repo.deleteQuiz(quiz.id);
    expect((await repo.listCards()).map((x) => x.questionId)).toEqual([q1.id, q2.id]);
    await repo.deleteCard(q1.id);
    expect((await repo.listCards()).map((x) => x.questionId)).toEqual([q2.id]);
  });

  it('est remplacée par celle d’une sauvegarde', async () => {
    const repo = make();
    await repo.saveCard(newCard(quiz, q1, now));
    const cards = [newCard(quiz, q2, now)];
    await repo.replaceAll({ categories: [], quizzes: [], attempts: [], answers: [], settings: {}, media: [], cards });
    expect(await repo.listCards()).toEqual(cards);
  });
});

describe('boîte de révision dans la sauvegarde complète', () => {
  it('aller-retour de leitner.json', async () => {
    const cards = [reviewCard(newCard(quiz, q1, now), true, now), newCard(quiz, q2, now)];
    const bytes = buildPackage(
      { quizzes: [], categories: [], media: new Map(), attempts: [], answers: [], settings: {}, cards },
      { kind: 'backup', solutions: true, appVersion: '0.2.0' },
    );
    const p = await parsePackage(bytes);
    expect(p.problems).toEqual([]);
    expect(p.cards).toEqual(cards);
    expect(cardMedia(cards)).toEqual([]);
  });
});

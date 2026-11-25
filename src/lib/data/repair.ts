/**
 * Entretien des données : réparations au démarrage (application installée), remise à zéro des questionnaires.
 */
import { cardMedia } from '$lib/interchange/qcmPackage';
import type { Media, Repository } from './repository';

/**
 * Copies « Dupliquer pour modifier » faites avant la correction de `cloneQuiz` : elles gardaient le module du QCM
 * d'origine, restaient donc protégées (pas d'édition possible) et auraient disparu avec le module. Un QCM rattaché à
 * un module qui ne le compte pas parmi ses QCM redevient un QCM personnel. Renvoie le nombre de QCM réparés.
 */
export async function releaseModuleCopies(repo: Repository): Promise<number> {
  const modules = new Map((await repo.listModules()).map((m) => [m.manifest.id, new Set(m.manifest.quizzes)]));
  let n = 0;
  for (const summary of await repo.listQuizzes()) {
    if (!summary.moduleId) continue;
    const own = modules.get(summary.moduleId);
    if (own?.has(summary.id)) continue;
    const quiz = await repo.getQuiz(summary.id);
    if (!quiz) continue;
    await repo.saveQuiz({ ...quiz, moduleId: null });
    n++;
  }
  return n;
}

/**
 * Retire tous les questionnaires : QCM personnels et modules, catégories, images, tentatives (et historique mis de
 * côté). Réglages et code PIN gardés (les QCM de démonstration ne reviennent pas) ; points et ceinture aussi, sauf
 * `dropRewards` ; boîte de révision avec `keepCards`, avec les images de ses cartes.
 */
export async function clearContent(repo: Repository, dropRewards = false, keepCards = false): Promise<void> {
  const settings = await repo.listSettings();
  const rewards = dropRewards ? [] : await repo.listRewards();
  const cards = keepCards ? await repo.listCards() : [];
  const media = (await Promise.all(cardMedia(cards).map((h) => repo.getMedia(h)))).filter((m): m is Media => !!m);
  await repo.replaceAll({ categories: [], quizzes: [], attempts: [], answers: [], settings, media, modules: [], cards, rewards });
}

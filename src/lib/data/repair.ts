/**
 * Réparations des données au démarrage (application installée).
 */
import type { Repository } from './repository';

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

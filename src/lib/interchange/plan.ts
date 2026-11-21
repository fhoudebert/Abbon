/**
 * Plan d'import : que faire de chaque QCM du fichier, compte tenu de ce qui existe déjà.
 * Fonctions pures ; l'écriture en base se fait dans app.svelte.ts.
 */
import { cloneQuiz } from '$lib/domain/factory';
import type { Category, Quiz, QuizSummary } from '$lib/domain/types';

export type ImportAction = 'add' | 'replace' | 'duplicate' | 'skip';

export interface PlanItem {
  quiz: Quiz;
  existing?: Pick<QuizSummary, 'id' | 'version' | 'title' | 'updatedAt' | 'status' | 'questionCount' | 'moduleId'>;
  action: ImportAction;
}

/**
 * Action proposée par défaut :
 * - QCM inconnu : ajouter ;
 * - même identifiant, version plus récente dans le fichier : remplacer ;
 * - même identifiant, version identique ou plus ancienne : ignorer ;
 * - même identifiant qu'un QCM de module installé (contenu protégé) : ignorer, ou ajouter une copie.
 */
export function planImport(incoming: readonly Quiz[], existing: readonly QuizSummary[]): PlanItem[] {
  const byId = new Map(existing.map((q) => [q.id, q]));
  return incoming.map((quiz) => {
    const ex = byId.get(quiz.id);
    if (!ex) return { quiz, action: 'add' as const };
    const { id, version, title, updatedAt, status, questionCount, moduleId } = ex;
    return {
      quiz,
      existing: { id, version, title, updatedAt, status, questionCount, moduleId },
      action: !moduleId && quiz.version > ex.version ? ('replace' as const) : ('skip' as const),
    };
  });
}

/** Actions possibles pour un élément du plan. */
export const actionsFor = (item: PlanItem): ImportAction[] =>
  !item.existing ? ['add', 'skip'] : item.existing.moduleId ? ['duplicate', 'skip'] : ['replace', 'duplicate', 'skip'];

export interface ResolvedImport {
  quizzes: Quiz[];
  categories: Category[];
  report: { added: string[]; replaced: string[]; duplicated: string[]; skipped: string[] };
}

/**
 * Applique les choix : QCM à enregistrer (copies avec nouveaux identifiants pour « dupliquer »),
 * catégories manquantes à créer. Les catégories existantes ne sont pas modifiées.
 */
export function resolveImport(
  plan: readonly PlanItem[],
  incomingCategories: readonly Category[],
  existingCategories: readonly Category[],
  copySuffix: string,
  now = new Date(),
): ResolvedImport {
  const report: ResolvedImport['report'] = { added: [], replaced: [], duplicated: [], skipped: [] };
  const quizzes: Quiz[] = [];

  for (const item of plan) {
    const ts = now.toISOString();
    switch (item.action) {
      case 'add':
        quizzes.push({ ...item.quiz, updatedAt: ts });
        report.added.push(item.quiz.id);
        break;
      case 'replace': {
        // La version augmente toujours : les tentatives passées gardent leur copie de l'ancienne.
        const version = Math.max(item.quiz.version, (item.existing?.version ?? 0) + 1);
        quizzes.push({ ...item.quiz, version, updatedAt: ts });
        report.replaced.push(item.quiz.id);
        break;
      }
      case 'duplicate': {
        const copy = cloneQuiz(item.quiz, copySuffix, now);
        quizzes.push(copy);
        report.duplicated.push(copy.id);
        break;
      }
      default:
        report.skipped.push(item.quiz.id);
    }
  }

  // Catégories : celles du fichier qui manquent ; un parent inconnu est retiré.
  const known = new Set(existingCategories.map((c) => c.id));
  const incomingIds = new Set(incomingCategories.map((c) => c.id));
  const categories = incomingCategories
    .filter((c) => !known.has(c.id))
    .map((c) => ({ ...c, parentId: c.parentId && (known.has(c.parentId) || incomingIds.has(c.parentId)) ? c.parentId : null }));
  const available = new Set([...known, ...categories.map((c) => c.id)]);
  for (const q of quizzes) if (q.categoryId && !available.has(q.categoryId)) q.categoryId = null;

  return { quizzes, categories, report };
}

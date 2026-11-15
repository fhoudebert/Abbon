/**
 * Modules : un fichier `.qcm` ordinaire qui contient en plus `module.json`.
 *
 * Le manifeste du paquet (`manifest.json`) n'est pas modifié : une version d'Abbon qui ne connaît
 * pas les modules ignore `module.json` et importe les QCM comme un export ordinaire.
 * Fonctions pures ; l'écriture en base se fait dans le dépôt de données (`installModule`).
 */
import { z } from 'zod';
import { compareSemver, isSemver, satisfiesMin } from '$lib/domain/semver';
import type { Category, InstalledModule, ModuleManifest, Quiz, QuizSummary } from '$lib/domain/types';
import { I18nRichSchema, I18nTextSchema } from './format';

export const MODULE_FORMAT = 'abbon-module';
export const MODULE_FORMAT_VERSION = 1;
export const MODULE_FILE = 'module.json';

/**
 * Fonctions de rendu que cette version sait afficher (`requires.features`).
 * `math` et `svg` arriveront avec le lot 7 : d'ici là, un module qui les demande est signalé.
 */
export const SUPPORTED_FEATURES: readonly string[] = [];

const itemId = z.string().min(1).max(100).regex(/^[\w-]+$/, 'identifiant invalide');

/** Notation inversée, en minuscules : « org.abbon.informatique ». */
export const MODULE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/;

export const ModuleSchema = z.object({
  format: z.literal(MODULE_FORMAT),
  formatVersion: z.number().int().min(1),
  id: z.string().max(100).regex(MODULE_ID_RE, 'identifiant de module invalide'),
  version: z.string().max(60).refine(isSemver, 'version SemVer attendue (ex. 1.0.0)'),
  title: I18nTextSchema,
  description: I18nTextSchema.nullable().optional(),
  level: z.string().max(100).nullable().optional(),
  /** Identifiant SPDX, ex. « CC-BY-NC-SA-4.0 ». */
  license: z.string().min(1).max(100),
  authors: z.array(z.string().max(200)).max(50),
  homepage: z.string().max(500).regex(/^https:\/\//, 'adresse https attendue').nullable().optional(),
  requires: z
    .object({
      app: z.string().max(40).optional(),
      features: z.array(z.string().max(40)).max(20).optional(),
    })
    .nullable()
    .optional(),
  categories: z.array(itemId).max(500),
  quizzes: z.array(itemId).max(5000),
  /** Fiches de révision : identifiant de catégorie → contenu riche par langue. */
  sheets: z.record(itemId, I18nRichSchema).nullable().optional(),
});

/** Préfixe commun des identifiants de QCM et de catégories d'un module : « org.abbon.x » → « org-abbon-x_ ». */
export const modulePrefix = (moduleId: string) => `${moduleId.replaceAll('.', '-')}_`;

// ---- Prérequis ---------------------------------------------------------------

export interface Requirements {
  ok: boolean;
  /** Version minimale d'Abbon demandée, si la version courante ne suffit pas. */
  appTooOld?: string;
  /** Fonctions demandées que cette version ne sait pas afficher. */
  missingFeatures: string[];
}

export function checkRequirements(
  m: Pick<ModuleManifest, 'requires'>,
  appVersion: string,
  features: readonly string[] = SUPPORTED_FEATURES,
): Requirements {
  const app = m.requires?.app;
  const appTooOld = app && !satisfiesMin(appVersion, app) ? app : undefined;
  const missingFeatures = (m.requires?.features ?? []).filter((f) => !features.includes(f));
  return { ok: !appTooOld && missingFeatures.length === 0, appTooOld, missingFeatures };
}

// ---- Plan d'installation -----------------------------------------------------

export type ModuleStatus = 'new' | 'update' | 'same' | 'older';

export interface ModulePlan {
  status: ModuleStatus;
  installedVersion?: string;
  /** QCM et catégories qui seront enregistrés (appartenance au module posée). */
  quizzes: Quiz[];
  categories: Category[];
  /** QCM du module déjà installés mais absents de la nouvelle version : ils seront retirés. */
  removedQuizIds: string[];
  /** Identifiants déjà pris par un QCM personnel ou par un autre module : jamais écrasés. */
  conflicts: string[];
  /** QCM annoncés par le module mais absents ou invalides dans le fichier. */
  missing: string[];
  manifest: ModuleManifest;
}

/**
 * Prépare l'installation ou la mise à jour d'un module.
 * - Seuls les QCM annoncés par `module.json` sont pris ; ils deviennent du contenu protégé.
 * - Un QCM personnel (ou d'un autre module) qui porte le même identifiant n'est jamais remplacé :
 *   un fichier malveillant ne peut pas écraser le contenu de l'utilisateur.
 * - Les catégories du module sont créées ou mises à jour ; une catégorie personnelle de même
 *   identifiant est laissée telle quelle.
 */
export function planModule(
  manifest: ModuleManifest,
  incoming: { quizzes: readonly Quiz[]; categories: readonly Category[] },
  existing: {
    modules: readonly InstalledModule[];
    quizzes: readonly Pick<QuizSummary, 'id' | 'moduleId'>[];
    categories: readonly Pick<Category, 'id' | 'moduleId'>[];
  },
  now = new Date(),
): ModulePlan {
  const installed = existing.modules.find((m) => m.manifest.id === manifest.id);
  const cmp = installed ? compareSemver(manifest.version, installed.manifest.version) : 1;
  const status: ModuleStatus = !installed ? 'new' : cmp > 0 ? 'update' : cmp === 0 ? 'same' : 'older';

  const ownerOf = new Map(existing.quizzes.map((q) => [q.id, q.moduleId ?? null]));
  const byId = new Map(incoming.quizzes.map((q) => [q.id, q]));
  const ts = now.toISOString();

  const conflicts: string[] = [];
  const missing: string[] = [];
  const quizzes: Quiz[] = [];
  for (const id of new Set(manifest.quizzes)) {
    const quiz = byId.get(id);
    if (!quiz) {
      missing.push(id);
      continue;
    }
    if (ownerOf.has(id) && ownerOf.get(id) !== manifest.id) {
      conflicts.push(id);
      continue;
    }
    quizzes.push({ ...quiz, moduleId: manifest.id, updatedAt: ts });
  }

  // Catégories : celles du module (annoncées), sauf si l'identifiant appartient déjà à l'utilisateur.
  const catOwner = new Map(existing.categories.map((c) => [c.id, c.moduleId ?? null]));
  const declared = new Set(manifest.categories);
  const categories = incoming.categories
    .filter((c) => declared.has(c.id) && (!catOwner.has(c.id) || catOwner.get(c.id) === manifest.id))
    .map((c) => ({ ...c, moduleId: manifest.id }));
  const available = new Set([...existing.categories.map((c) => c.id), ...categories.map((c) => c.id)]);
  for (const c of categories) if (c.parentId && !available.has(c.parentId)) c.parentId = null;
  for (const q of quizzes) if (q.categoryId && !available.has(q.categoryId)) q.categoryId = null;

  const kept = new Set(quizzes.map((q) => q.id));
  const removedQuizIds = existing.quizzes.filter((q) => q.moduleId === manifest.id && !kept.has(q.id)).map((q) => q.id);

  // Le manifeste enregistré ne garde que ce qui est réellement installé.
  const stored: ModuleManifest = {
    ...manifest,
    quizzes: quizzes.map((q) => q.id),
    categories: categories.map((c) => c.id),
  };
  return { status, installedVersion: installed?.manifest.version, quizzes, categories, removedQuizIds, conflicts, missing, manifest: stored };
}

/** Schéma JSON publié (docs/format-qcm/module.schema.json). */
export const moduleJsonSchema = () => z.toJSONSchema(ModuleSchema, { unrepresentable: 'any', cycles: 'ref' });

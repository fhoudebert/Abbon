/**
 * Format d'échange `.qcm` (version 1) — schémas de validation.
 *
 * Une archive `.qcm` est un ZIP :
 *   manifest.json          description du paquet (ce fichier fait foi)
 *   categories.json        catégories utilisées
 *   quizzes/<id>.json      un fichier par QCM
 *   media/<sha256>.<ext>   images référencées (nom = empreinte du contenu)
 *   (sauvegarde complète uniquement) attempts.json, answers.json, settings.json
 *
 * Tout contenu importé est considéré comme non fiable : il est validé ici, puis affiché
 * par liste blanche (RichContent) — aucun HTML n'est jamais interprété.
 * Le JSON Schema publié (docs/format-qcm/) est généré à partir de ces schémas.
 */
import { z } from 'zod';

export const FORMAT_NAME = 'abbon-qcm';
export const FORMAT_VERSION = 1;

/** Limites contre les fichiers malformés ou malveillants. */
export const LIMITS = {
  maxEntries: 5000,
  maxTotalBytes: 200 * 1024 * 1024,
  maxJsonBytes: 20 * 1024 * 1024,
  maxMediaBytes: 5 * 1024 * 1024,
  maxDepth: 30,
};

const id = z.string().min(1).max(100).regex(/^[\w-]+$/, 'identifiant invalide');
const lang = z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/, 'code de langue invalide');
const isoDate = z.string().max(40);

export const I18nTextSchema = z.record(lang, z.string().max(5000));

export type RichNodeInput = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNodeInput[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

const attrValue = z.union([z.string().max(2000), z.number(), z.boolean(), z.null()]);
const attrs = z.record(z.string().max(40), attrValue);

export const RichNodeSchema: z.ZodType<RichNodeInput> = z.lazy(() =>
  z.object({
    type: z.string().min(1).max(40),
    attrs: attrs.optional(),
    content: z.array(RichNodeSchema).max(2000).optional(),
    text: z.string().max(50_000).optional(),
    marks: z.array(z.object({ type: z.string().max(40), attrs: attrs.optional() })).max(10).optional(),
  }),
);

export const RichDocSchema = RichNodeSchema.refine((n) => n.type === 'doc', 'document attendu');
export const RichValueSchema = z.union([z.string().max(50_000), RichDocSchema]);
export const I18nRichSchema = z.record(lang, RichValueSchema);

export const ChoiceSchema = z.object({
  id,
  content: I18nRichSchema,
  /** Absent dans un export « sans corrigé ». */
  correct: z.boolean().optional(),
  position: z.number().int().min(0),
  feedback: I18nRichSchema.nullable().optional(),
});

/** Réponse attendue d'une question à saisie (absente d'un export « sans corrigé », sauf l'unité). */
export const ExpectedSchema = z.object({
  /** Réponse courte : formes acceptées. */
  accepted: z.array(z.string().max(500)).max(50).optional(),
  caseSensitive: z.boolean().optional(),
  /** Réponse numérique : valeur, écart toléré (absolu), unité affichée. */
  value: z.number().optional(),
  tolerance: z.number().min(0).optional(),
  unit: z.string().max(30).nullable().optional(),
});

export const QuestionSchema = z.object({
  id,
  /** single, multiple : réponses à cocher ; short, numeric : réponse à saisir (`expected`). */
  type: z.enum(['single', 'multiple', 'short', 'numeric']),
  prompt: I18nRichSchema,
  points: z.number().positive().max(1000),
  position: z.number().int().min(0),
  explanation: I18nRichSchema.nullable().optional(),
  choices: z.array(ChoiceSchema).max(50),
  expected: ExpectedSchema.nullable().optional(),
});

export const QuizSchema = z.object({
  id,
  categoryId: id.nullable(),
  title: I18nTextSchema,
  description: I18nTextSchema.nullable().optional(),
  languages: z.array(lang).min(1).max(20),
  level: z.string().max(100).nullable().optional(),
  tags: z.array(z.string().max(100)).max(50),
  timeLimitSec: z.number().int().positive().max(24 * 3600).nullable().optional(),
  passThreshold: z.number().min(0).max(1),
  scoring: z.enum(['all_or_nothing', 'partial']),
  solutionVisibility: z.enum(['never', 'after_submit', 'after_pass']),
  shuffle: z.boolean(),
  status: z.enum(['draft', 'published']),
  version: z.number().int().min(1),
  author: z.string().max(200).nullable().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
  questions: z.array(QuestionSchema).max(1000),
});

export const CategorySchema = z.object({
  id,
  parentId: id.nullable(),
  name: I18nTextSchema,
  position: z.number().int().min(0),
  color: z.string().max(30).nullable().optional(),
});

export const ManifestSchema = z.object({
  format: z.literal(FORMAT_NAME),
  formatVersion: z.number().int().min(1),
  kind: z.enum(['content', 'backup']),
  app: z.object({ name: z.string().max(50), version: z.string().max(30) }),
  exportedAt: isoDate,
  /** Faux si les bonnes réponses et explications ont été retirées. */
  solutions: z.boolean(),
  quizzes: z.array(z.object({ id, file: z.string().max(200), version: z.number().int().min(1) })).max(5000),
  media: z.array(z.string().regex(/^[0-9a-f]{64}$/)).max(LIMITS.maxEntries),
});

// ---- Sauvegarde complète --------------------------------------------------

export const AttemptSchema = z.object({
  id,
  quizId: id,
  quizVersion: z.number().int().min(1),
  mode: z.enum(['training', 'exam']),
  status: z.enum(['in_progress', 'finished', 'abandoned']),
  startedAt: isoDate,
  finishedAt: isoDate.nullable().optional(),
  elapsedSec: z.number().int().min(0),
  currentIndex: z.number().int().min(0),
  questionOrder: z.array(id),
  score: z.number().nullable().optional(),
  maxScore: z.number().nullable().optional(),
  quizSnapshot: QuizSchema.nullable().optional(),
});

export const AnswerRowSchema = z.object({
  attemptId: id,
  questionId: id,
  selected: z.array(id),
  text: z.string().max(2000).nullable().optional(),
  correct: z.boolean().nullable().optional(),
  points: z.number().nullable().optional(),
  timeSec: z.number().int().min(0),
  flagged: z.boolean(),
});

export const SettingsSchema = z.record(z.string().max(50), z.string().max(1000));

export type Manifest = z.infer<typeof ManifestSchema>;
export type AnswerRow = z.infer<typeof AnswerRowSchema>;

/** Profondeur maximale d'imbrication d'un JSON (avant validation, pour éviter un débordement de pile). */
export function jsonDepth(value: unknown, limit = LIMITS.maxDepth): number {
  const stack: [unknown, number][] = [[value, 1]];
  let max = 0;
  while (stack.length) {
    const [v, d] = stack.pop()!;
    if (d > max) max = d;
    if (max > limit) return max;
    if (v && typeof v === 'object') for (const child of Object.values(v)) stack.push([child, d + 1]);
  }
  return max;
}

/** Schémas publiés au format JSON Schema (documentation et outils tiers) ; celui des modules est dans module.ts. */
export function jsonSchemas() {
  return {
    manifest: z.toJSONSchema(ManifestSchema, { unrepresentable: 'any' }),
    quiz: z.toJSONSchema(QuizSchema, { unrepresentable: 'any', cycles: 'ref' }),
    category: z.toJSONSchema(CategorySchema, { unrepresentable: 'any' }),
  };
}

/**
 * Construction et lecture des archives `.qcm` (ZIP), en fonctions pures.
 */
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import { mediaHashes } from '$lib/domain/rich';
import type { Attempt, Category, Quiz, RichValue } from '$lib/domain/types';
import {
  AnswerRowSchema,
  AttemptSchema,
  CategorySchema,
  FORMAT_NAME,
  FORMAT_VERSION,
  jsonDepth,
  LIMITS,
  ManifestSchema,
  QuizSchema,
  SettingsSchema,
  type AnswerRow,
  type Manifest,
} from './format';

export interface MediaFile {
  mime: string;
  bytes: Uint8Array;
}

export interface ContentBundle {
  quizzes: Quiz[];
  categories: Category[];
  media: Map<string, MediaFile>;
}

export interface BackupBundle extends ContentBundle {
  attempts: Attempt[];
  answers: AnswerRow[];
  settings: Record<string, string>;
}

/** Problème non bloquant relevé à la lecture (l'élément concerné est ignoré ou corrigé). */
export interface Problem {
  code: 'quiz_invalid' | 'media_invalid' | 'media_missing' | 'no_solutions' | 'history_invalid' | 'category_invalid';
  ref?: string;
  detail?: string;
}

/** Erreur bloquante : le fichier ne peut pas être lu. */
export class PackageError extends Error {
  constructor(
    readonly code: 'not_zip' | 'too_big' | 'no_manifest' | 'bad_manifest' | 'unsupported_version' | 'not_backup',
    detail?: string,
  ) {
    super(detail ? `${code}: ${detail}` : code);
  }
}

// ---- Médias ----------------------------------------------------------------

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};
const MIME_BY_EXT: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };

/** Vérifie la signature du fichier (les premiers octets), pas seulement son extension. */
export function sniffMime(b: Uint8Array): string | null {
  const at = (i: number, ...v: number[]) => v.every((x, k) => b[i + k] === x);
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return 'image/gif';
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'image/webp';
  return null;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// ---- Contenu ---------------------------------------------------------------

function richValues(q: Quiz): (RichValue | null | undefined)[] {
  return q.questions.flatMap((x) => [
    ...Object.values(x.prompt),
    ...Object.values(x.explanation ?? {}),
    ...x.choices.flatMap((c) => [...Object.values(c.content), ...Object.values(c.feedback ?? {})]),
  ]);
}

/** Empreintes des images utilisées par des QCM. */
export const quizMedia = (quizzes: readonly Quiz[]) => mediaHashes(quizzes.flatMap(richValues));

/** Retire bonnes réponses, explications et retours (export « sans corrigé »). */
export function stripSolutions(quiz: Quiz): Quiz {
  const q = structuredClone(quiz);
  q.questions = q.questions.map((x) => ({
    ...x,
    explanation: null,
    choices: x.choices.map(({ correct: _c, feedback: _f, ...c }) => c as Quiz['questions'][number]['choices'][number]),
  }));
  return q;
}

/** Catégories utilisées par les QCM, avec leurs parents. */
export function categoriesFor(quizzes: readonly Quiz[], all: readonly Category[]): Category[] {
  const byId = new Map(all.map((c) => [c.id, c]));
  const keep = new Set<string>();
  for (const q of quizzes) {
    let cur = q.categoryId ? byId.get(q.categoryId) : undefined;
    while (cur && !keep.has(cur.id)) {
      keep.add(cur.id);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
  }
  return all.filter((c) => keep.has(c.id));
}

export interface BuildOptions {
  kind: 'content' | 'backup';
  solutions: boolean;
  appVersion: string;
  now?: Date;
}

const json = (v: unknown) => strToU8(JSON.stringify(v, null, 2));

/** Construit l'archive. Seules les images réellement utilisées sont incluses. */
export function buildPackage(bundle: ContentBundle | BackupBundle, opts: BuildOptions): Uint8Array {
  const quizzes = opts.solutions ? bundle.quizzes : bundle.quizzes.map(stripSolutions);
  const isBackup = opts.kind === 'backup' && 'attempts' in bundle;
  const snapshots = isBackup ? bundle.attempts.map((a) => a.quizSnapshot).filter((q): q is Quiz => !!q) : [];
  const used = quizMedia([...quizzes, ...snapshots]).filter((h) => bundle.media.has(h));

  const manifest: Manifest = {
    format: FORMAT_NAME,
    formatVersion: FORMAT_VERSION,
    kind: opts.kind,
    app: { name: 'Abbon', version: opts.appVersion },
    exportedAt: (opts.now ?? new Date()).toISOString(),
    solutions: opts.solutions,
    quizzes: quizzes.map((q) => ({ id: q.id, file: `quizzes/${q.id}.json`, version: q.version })),
    media: used,
  };

  const files: Zippable = {
    'manifest.json': json(manifest),
    'categories.json': json(isBackup ? bundle.categories : categoriesFor(quizzes, bundle.categories)),
  };
  for (const q of quizzes) files[`quizzes/${q.id}.json`] = json(q);
  for (const h of used) {
    const m = bundle.media.get(h)!;
    // Images déjà compressées : stockées sans recompression.
    files[`media/${h}.${EXT_BY_MIME[m.mime] ?? 'bin'}`] = [m.bytes, { level: 0 }];
  }
  if (isBackup) {
    files['attempts.json'] = json(bundle.attempts);
    files['answers.json'] = json(bundle.answers);
    files['settings.json'] = json(bundle.settings);
  }
  return zipSync(files, { level: 6 });
}

// ---- Lecture ---------------------------------------------------------------

export interface ParsedPackage {
  manifest: Manifest;
  quizzes: Quiz[];
  categories: Category[];
  media: Map<string, MediaFile>;
  attempts?: Attempt[];
  answers?: AnswerRow[];
  settings?: Record<string, string>;
  problems: Problem[];
}

function unzip(bytes: Uint8Array): Record<string, Uint8Array> {
  let entries = 0;
  let total = 0;
  try {
    return unzipSync(bytes, {
      filter: (f) => {
        entries++;
        total += f.originalSize;
        if (entries > LIMITS.maxEntries || total > LIMITS.maxTotalBytes) throw new PackageError('too_big');
        // Pas de chemins absolus ni de remontée de dossier.
        return !f.name.startsWith('/') && !f.name.split('/').includes('..');
      },
    });
  } catch (e) {
    if (e instanceof PackageError) throw e;
    throw new PackageError('not_zip');
  }
}

function readJson(files: Record<string, Uint8Array>, name: string): unknown {
  const b = files[name];
  if (!b) return undefined;
  if (b.length > LIMITS.maxJsonBytes) throw new Error('too large');
  const v = JSON.parse(strFromU8(b));
  if (jsonDepth(v) > LIMITS.maxDepth) throw new Error('nested too deeply');
  return v;
}

const issueText = (e: unknown) =>
  e && typeof e === 'object' && 'issues' in e
    ? (e as { issues: { path: PropertyKey[]; message: string }[] }).issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join(' ; ')
    : e instanceof Error
      ? e.message
      : String(e);

/** Lit et valide une archive. Les éléments invalides sont écartés et signalés dans `problems`. */
export async function parsePackage(bytes: Uint8Array): Promise<ParsedPackage> {
  const files = unzip(bytes);
  if (!files['manifest.json']) throw new PackageError('no_manifest');

  let manifest: Manifest;
  try {
    const raw = readJson(files, 'manifest.json') as { format?: unknown; formatVersion?: unknown };
    if (raw?.format === FORMAT_NAME && typeof raw.formatVersion === 'number' && raw.formatVersion > FORMAT_VERSION)
      throw new PackageError('unsupported_version', String(raw.formatVersion));
    manifest = ManifestSchema.parse(raw);
  } catch (e) {
    if (e instanceof PackageError) throw e;
    throw new PackageError('bad_manifest', issueText(e));
  }

  const problems: Problem[] = [];

  // Catégories
  const categories: Category[] = [];
  try {
    const raw = readJson(files, 'categories.json');
    for (const c of Array.isArray(raw) ? raw : []) {
      const r = CategorySchema.safeParse(c);
      if (r.success) categories.push(r.data as Category);
      else problems.push({ code: 'category_invalid', detail: issueText(r.error) });
    }
  } catch (e) {
    problems.push({ code: 'category_invalid', detail: issueText(e) });
  }

  // QCM
  const quizzes: Quiz[] = [];
  for (const entry of manifest.quizzes) {
    try {
      const r = QuizSchema.safeParse(readJson(files, entry.file));
      if (!r.success) {
        problems.push({ code: 'quiz_invalid', ref: entry.id, detail: issueText(r.error) });
        continue;
      }
      const quiz = r.data as unknown as Quiz;
      for (const q of quiz.questions) for (const c of q.choices) c.correct ??= false;
      if (!manifest.solutions) {
        quiz.status = 'draft'; // sans bonnes réponses, le QCM ne peut pas être passé tel quel
        problems.push({ code: 'no_solutions', ref: quiz.id });
      }
      quizzes.push(quiz);
    } catch (e) {
      problems.push({ code: 'quiz_invalid', ref: entry.id, detail: issueText(e) });
    }
  }

  // Images : nom = empreinte, signature cohérente, taille raisonnable
  const media = new Map<string, MediaFile>();
  for (const [name, b] of Object.entries(files)) {
    const m = /^media\/([0-9a-f]{64})\.(png|jpe?g|gif|webp)$/.exec(name);
    if (!m) continue;
    const [, hash, ext] = m;
    const mime = sniffMime(b);
    if (b.length > LIMITS.maxMediaBytes || mime !== MIME_BY_EXT[ext] || (await sha256Hex(b)) !== hash) {
      problems.push({ code: 'media_invalid', ref: hash });
      continue;
    }
    media.set(hash, { mime, bytes: b });
  }

  // Sauvegarde complète : historique
  let attempts: Attempt[] | undefined;
  let answers: AnswerRow[] | undefined;
  let settings: Record<string, string> | undefined;
  if (manifest.kind === 'backup') {
    attempts = [];
    answers = [];
    try {
      for (const a of (readJson(files, 'attempts.json') as unknown[]) ?? []) {
        const r = AttemptSchema.safeParse(a);
        if (r.success) attempts.push(r.data as unknown as Attempt);
        else problems.push({ code: 'history_invalid', detail: issueText(r.error) });
      }
      for (const a of (readJson(files, 'answers.json') as unknown[]) ?? []) {
        const r = AnswerRowSchema.safeParse(a);
        if (r.success) answers.push(r.data);
        else problems.push({ code: 'history_invalid', detail: issueText(r.error) });
      }
      const s = SettingsSchema.safeParse(readJson(files, 'settings.json') ?? {});
      settings = s.success ? s.data : {};
    } catch (e) {
      problems.push({ code: 'history_invalid', detail: issueText(e) });
    }
  }

  // Images référencées mais absentes : affichées comme emplacement vide
  for (const h of quizMedia(quizzes)) if (!media.has(h)) problems.push({ code: 'media_missing', ref: h });

  return { manifest, quizzes, categories, media, attempts, answers, settings, problems };
}

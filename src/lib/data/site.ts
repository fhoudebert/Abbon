import { b64ToBytes, bytesToB64 } from '$lib/data/bytes';
import type { LeitnerCard } from '$lib/domain/leitner';
import type { Reward } from '$lib/domain/rewards';
import type { Answer, Attempt, InstalledModule } from '$lib/domain/types';
import { withSolutions } from '$lib/exam/client';
import type { QuestionSolution } from '$lib/exam/types';
import { parsePackage } from '$lib/interchange/qcmPackage';
import { resolveSettings, siteData, siteSettings, type SiteData, type SiteSettings } from '$lib/site';
import { MemoryRepository } from './memory';
import type { AnswerRow } from './repository';

/** Progression du visiteur, gardée dans le navigateur. */
export interface SiteProgress {
  attempts: Attempt[];
  answers: AnswerRow[];
  cards: LeitnerCard[];
  rewards: Reward[];
  settings: Record<string, string>;
  /** Examen corrigé par le serveur : corrigés reçus après l'envoi des copies, par QCM puis question. */
  solutions?: Record<string, Record<string, QuestionSolution>>;
}

export const progressKey = (siteId: string) => `abbon.site.${siteId}`;

/** Lit la progression enregistrée (vide si absente, illisible, ou stockage indisponible). */
export function readProgress(storage: Pick<Storage, 'getItem'> | null, siteId: string): SiteProgress {
  const empty: SiteProgress = { attempts: [], answers: [], cards: [], rewards: [], settings: {} };
  try {
    const raw = storage?.getItem(progressKey(siteId));
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<SiteProgress>;
    return {
      attempts: Array.isArray(p.attempts) ? p.attempts : [],
      answers: Array.isArray(p.answers) ? p.answers : [],
      cards: Array.isArray(p.cards) ? p.cards : [],
      rewards: Array.isArray(p.rewards) ? p.rewards : [],
      settings: p.settings && typeof p.settings === 'object' ? p.settings : {},
      solutions: p.solutions && typeof p.solutions === 'object' ? p.solutions : {},
    };
  } catch {
    return empty;
  }
}

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * Stockage du site web : les contenus en mémoire (relus à chaque visite depuis `donnees.js`), la progression
 * (tentatives, réponses, boîte de révision, points, réglages) recopiée dans le stockage local après chaque
 * changement. Les copies de QCM des tentatives ne sont pas gardées : elles sont reconstituées au chargement.
 */
export class SiteRepository extends MemoryRepository {
  #timer: ReturnType<typeof setTimeout> | null = null;
  #ready = false;
  #solutions: Record<string, Record<string, QuestionSolution>> = {};

  constructor(
    private readonly siteId: string,
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null = browserStorage(),
  ) {
    super();
  }

  /** Charge les contenus du site et la progression du visiteur ; en examen seul, applique le réglage du corrigé. */
  async load(data: SiteData, settings: SiteSettings = resolveSettings(data)) {
    const p = await parsePackage(b64ToBytes(data.package));
    const now = new Date().toISOString();
    const modules: InstalledModule[] = p.modules ?? (p.module ? [{ manifest: p.module, installedAt: now, updatedAt: now }] : []);
    const saved = readProgress(this.storage, this.siteId);
    this.#solutions = saved.solutions ?? {};
    const quizzes = p.quizzes.map((q) => ({
      ...(this.#solutions[q.id] ? withSolutions(q, this.#solutions[q.id]) : q),
      status: 'published' as const,
      ...(settings.modes === 'exam' ? { solutionVisibility: settings.solutions === 'end' ? ('after_submit' as const) : ('never' as const) } : {}),
    }));
    const byId = new Map(quizzes.map((q) => [q.id, q]));
    await this.replaceAll({
      categories: p.categories,
      quizzes,
      media: [...p.media].map(([hash, m]) => ({ hash, mime: m.mime, sizeBytes: m.bytes.length, data: bytesToB64(m.bytes) })),
      modules,
      attempts: saved.attempts.map((a) => ({ ...a, quizSnapshot: byId.get(a.quizId) ?? null })),
      answers: saved.answers,
      cards: saved.cards,
      rewards: saved.rewards,
      settings: saved.settings,
    });
    this.#ready = true;
  }

  /** Enregistre la progression (regroupe les écritures rapprochées). */
  #persist() {
    if (!this.#ready || !this.storage) return;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void this.flush(), 200);
  }

  async flush() {
    if (!this.storage) return;
    this.#timer = null;
    const history = await this.exportHistory();
    const { admin_pin: _pin, ...settings } = await this.listSettings();
    const progress: SiteProgress = {
      attempts: history.attempts.map((a) => ({ ...a, quizSnapshot: undefined })),
      answers: history.answers,
      cards: await this.listCards(),
      rewards: await this.listRewards(),
      settings,
      solutions: this.#solutions,
    };
    try {
      this.storage.setItem(progressKey(this.siteId), JSON.stringify(progress));
    } catch {
      /* stockage plein ou refusé : la progression ne dure que le temps de la visite */
    }
  }

  /**
   * Examen corrigé par le serveur : ajoute le corrigé reçu au QCM et aux tentatives qui en gardent une copie ;
   * il est conservé avec la progression du visiteur.
   */
  async addSolutions(quizId: string, solutions: Record<string, QuestionSolution>) {
    this.#solutions[quizId] = { ...this.#solutions[quizId], ...solutions };
    const quiz = await this.getQuiz(quizId);
    if (quiz) await this.saveQuiz(withSolutions(quiz, solutions));
    for (const { id } of await this.listAttempts(quizId)) {
      const a = await this.getAttempt(id);
      if (a?.quizSnapshot) await super.saveAttempt({ ...a, quizSnapshot: withSolutions(a.quizSnapshot, solutions) });
    }
    this.#persist();
  }

  override async saveAttempt(attempt: Attempt) {
    await super.saveAttempt(attempt);
    this.#persist();
  }
  override async saveAnswer(attemptId: string, answer: Answer) {
    await super.saveAnswer(attemptId, answer);
    this.#persist();
  }
  override async saveCard(card: LeitnerCard) {
    await super.saveCard(card);
    this.#persist();
  }
  override async deleteCard(questionId: string) {
    await super.deleteCard(questionId);
    this.#persist();
  }
  override async addRewards(rewards: Reward[]) {
    const added = await super.addRewards(rewards);
    this.#persist();
    return added;
  }
  override async setSetting(key: string, value: string) {
    await super.setSetting(key, value);
    this.#persist();
  }
  override async deleteSetting(key: string) {
    await super.deleteSetting(key);
    this.#persist();
  }
}

/** Ouvre le stockage du site (vide si `donnees.js` manque). */
export async function openSite(): Promise<SiteRepository> {
  const data = siteData();
  const repo = new SiteRepository(data?.id ?? 'sans-donnees');
  if (data) await repo.load(data, siteSettings());
  return repo;
}

<script lang="ts">
  import { CANDIDATE_SETTING, collectCopies, examOnly, parseCandidate, serverGrading, siteDraw, to, trainingOnly } from '$lib/site';
  import { examState, GradeError, startOnServer, type ExamState } from '$lib/exam/client';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { app } from '$lib/app.svelte';
  import { progressOf } from '$lib/domain/progress';
  import { drawQuestionIds, formatDuration } from '$lib/domain/session';
  import { localize } from '$lib/domain/text';
  import type { AttemptMode, Quiz } from '$lib/domain/types';
  import { fmtDate, fmtNum, i18n, pct, t } from '$lib/i18n/index.svelte';

  const id = $derived(page.params.id ?? '');
  let quiz = $state<Quiz | null | undefined>(undefined);
  let busy = $state(false);

  $effect(() => {
    const quizId = id;
    app.repo().then((r) => r.getQuiz(quizId)).then((q) => (quiz = q));
  });

  const attempts = $derived(app.attempts.filter((a) => a.quizId === id));
  const info = $derived(progressOf(attempts, quiz?.questions.length));
  const finished = $derived(attempts.filter((a) => a.status === 'finished'));
  const lang = $derived(i18n.lang);
  const category = $derived(app.categories.find((c) => c.id === quiz?.categoryId));
  const hasSheet = $derived(!!app.sheetOf(quiz?.categoryId));

  // Examen corrigé par le serveur, copies gardées : nom de l'élève (rappelé d'un examen à l'autre).
  const askName = collectCopies();
  let candidate = $state({ name: '', group: '' });
  if (askName) app.repo().then(async (r) => (candidate = parseCandidate(await r.getSetting(CANDIDATE_SETTING))));
  const named = $derived(!askName || candidate.name.trim().length > 0);

  // Examen corrigé par le serveur : ouvert ou non par le surveillant, code d'accès, une seule copie par QCM.
  const server = serverGrading();
  const draw = siteDraw();
  const drawn = $derived(quiz && draw && draw < quiz.questions.length ? draw : null);
  let exam = $state<ExamState | null>(null);
  let examError = $state<string | null>(null);
  let accessCode = $state('');
  let startError = $state<string | null>(null);
  async function refreshExam() {
    examError = null;
    try {
      exam = await examState();
    } catch (e) {
      exam = null;
      examError = t(`site.grade.${e instanceof GradeError ? e.reason : 'server'}`);
    }
  }
  if (server) refreshExam();
  const submitted = $derived(server && attempts.some((a) => a.mode === 'exam' && a.status === 'finished'));
  const canStartExam = $derived(!server || (!!exam?.open && !submitted && (!exam.code || accessCode.trim().length > 0)));

  async function start(mode: AttemptMode) {
    if (!quiz || busy) return;
    if (mode === 'exam' && (!named || !canStartExam)) return;
    busy = true;
    startError = null;
    try {
      const c = { name: candidate.name.trim(), group: candidate.group.trim() };
      if (mode === 'exam' && askName) await (await app.repo()).setSetting(CANDIDATE_SETTING, JSON.stringify(c));
      if (info.resumable) await app.abandon(info.resumable.id);
      // Tirage (reglages.js) : questions tirées au hasard pour cet examen ; par le serveur s'il corrige.
      const only = mode === 'exam' && draw && !server ? drawQuestionIds(quiz, draw, crypto.randomUUID()) : undefined;
      const attemptId = await app.startQuiz(quiz.id, mode, only);
      if (server && mode === 'exam') {
        // Le serveur enregistre le début (examen ouvert, bon code) ; sa durée et son tirage font foi.
        try {
          const started = await startOnServer(quiz.id, attemptId, askName ? c : undefined, accessCode.trim());
          const repo = (await app.repo()) as Partial<{ setTimeLimit(quizId: string, sec: number | null): Promise<void> }>;
          await repo.setTimeLimit?.(quiz.id, started.limitSec);
          if (started.questions) await app.restrictAttempt(attemptId, started.questions);
        } catch (e) {
          await app.abandon(attemptId);
          startError = t(`site.grade.${e instanceof GradeError ? e.reason : 'server'}`);
          if (e instanceof GradeError && e.reason === 'closed') await refreshExam();
          return;
        }
      }
      await goto(to(`/attempt/${attemptId}`));
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>{quiz ? localize(quiz.title, lang, quiz.languages[0]) : t('app.name')} — Abbon</title></svelte:head>

<a class="back" href={to('/')}>← {t('common.back')}</a>

{#if quiz === undefined}
  <p aria-busy="true">{t('home.loading')}</p>
{:else if quiz === null}
  <p>{t('quiz.notFound')}</p>
{:else}
  {@const fallback = quiz.languages[0]}
  <header>
    {#if category}<p class="category">{localize(category.name, lang)}</p>{/if}
    <h1 lang={quiz.title[lang] ? lang : fallback}>{localize(quiz.title, lang, fallback)}</h1>
    {#if quiz.description}<p class="muted">{localize(quiz.description, lang, fallback)}</p>{/if}
    <p class="facts muted">
      <span>{t('quiz.questions', { n: quiz.questions.length })}</span>
      <span>{t('quiz.threshold', { pct: pct(quiz.passThreshold) })}</span>
      {#if info.bestScore !== undefined && info.maxScore}
        <span>{t('quiz.bestScore', { score: pct(info.bestScore / info.maxScore) })}</span>
      {/if}
    </p>
    {#if hasSheet}<p><a class="button secondary" href={to(`/sheet/${quiz.categoryId}`)}>{t('sheet.open')}</a></p>{/if}
  </header>

  {#if info.resumable}
    <section class="panel resume">
      <p>{t('quiz.inProgressSince', { date: fmtDate(info.resumable.startedAt) })}</p>
      <div class="actions">
        <a class="button" href={to(`/attempt/${info.resumable.id}`)}>{t('quiz.resume')}</a>
      </div>
    </section>
  {/if}

  <section class="modes">
    {#if !examOnly()}<div class="panel">
      <h2>{t('quiz.training')}</h2>
      <p class="muted">{t('quiz.training.hint')}</p>
      <button
        class={info.resumable ? 'secondary' : ''}
        disabled={busy || !quiz.questions.length}
        onclick={() => start('training')}
      >
        {info.resumable ? t('quiz.restart') : t('quiz.start')}
      </button>
    </div>{/if}
    {#if !trainingOnly()}<div class="panel">
      <h2>{t('quiz.exam')}</h2>
      <p class="muted">
        {quiz.timeLimitSec
          ? t('quiz.exam.hintTimed', { time: formatDuration(quiz.timeLimitSec) })
          : t('quiz.exam.hint')}
      </p>
      {#if drawn && quiz}<p class="muted">{t('site.exam.draw', { n: drawn, total: quiz.questions.length })}</p>{/if}
      {#if server}
        {#if submitted}
          <p class="note">{t('site.exam.submitted')}</p>
        {:else if examError}
          <p class="note" role="alert">{examError}</p>
        {:else if exam && !exam.open}
          <p class="note">{t('site.exam.closed')}</p>
          <button class="secondary" onclick={refreshExam}>{t('site.exam.refresh')}</button>
        {:else if exam?.minutes}
          <p class="muted">{t('site.exam.duration', { n: exam.minutes })}</p>
        {/if}
      {/if}
      {#if askName && !submitted}
        <div class="candidate">
          <label>
            {t('site.candidate.name')}
            <input type="text" bind:value={candidate.name} maxlength="100" autocomplete="name" required aria-describedby="candidate-hint" />
          </label>
          <label>
            {t('site.candidate.group')}
            <input type="text" bind:value={candidate.group} maxlength="60" />
          </label>
          <p id="candidate-hint" class="muted small">{t(server && exam?.classList ? 'site.candidate.listHint' : 'site.candidate.hint')}</p>
        </div>
      {/if}
      {#if server && exam?.open && exam.code && !submitted}
        <div class="candidate">
          <label>
            {t('site.exam.code')}
            <input type="text" bind:value={accessCode} maxlength="30" autocomplete="off" required />
          </label>
        </div>
      {/if}
      {#if startError}<p class="note" role="alert">{startError}</p>{/if}
      <button
        class={info.resumable ? 'secondary' : ''}
        disabled={busy || !quiz.questions.length || !named || !canStartExam}
        hidden={submitted}
        onclick={() => start('exam')}
      >
        {info.resumable ? t('quiz.restart') : t('quiz.start')}
      </button>
    </div>{/if}
  </section>

  <section>
    <h2>{t('quiz.history')}</h2>
    {#if finished.length}
      <ul class="history">
        {#each finished as a (a.id)}
          <li>
            <span>{fmtDate(a.finishedAt ?? a.startedAt)}</span>
            <span class="muted">{a.mode === 'exam' ? t('quiz.exam') : t('quiz.training')}</span>
            <span>
              {pct(a.maxScore ? (a.score ?? 0) / a.maxScore : 0)}
              <span class="muted">({t('result.points', { score: fmtNum(a.score ?? 0), max: fmtNum(a.maxScore ?? 0) })})</span>
            </span>
            <a href={to(`/attempt/${a.id}/result`)}>{t('quiz.history.result')}</a>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">{t('quiz.history.empty')}</p>
    {/if}
  </section>
{/if}

<style>
  .candidate {
    display: grid;
    gap: 0.5rem;
    margin-block: 0.75rem;
  }
  .candidate label {
    display: grid;
    gap: 0.25rem;
    font-weight: 600;
  }
  .candidate p {
    margin: 0;
  }
  .note {
    font-weight: 600;
  }
  .category {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--accent);
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.25rem;
  }
  .resume {
    margin-block: 1rem;
    border-color: var(--accent);
  }
  .resume p {
    margin-block-start: 0;
  }
  .modes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
    gap: 1rem;
    margin-block: 1.5rem 2rem;
  }
  .modes h2 {
    font-size: 1.1rem;
  }
  .history {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .history li {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 0.25rem 1rem;
    align-items: center;
    padding-block: 0.6rem;
    border-block-end: 1px solid var(--border);
  }
  @media (max-width: 560px) {
    .history li {
      grid-template-columns: 1fr auto;
    }
  }
</style>

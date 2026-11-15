<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { app } from '$lib/app.svelte';
  import { progressOf } from '$lib/domain/progress';
  import { formatDuration } from '$lib/domain/session';
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

  async function start(mode: AttemptMode) {
    if (!quiz || busy) return;
    busy = true;
    try {
      if (info.resumable) await app.abandon(info.resumable.id);
      const attemptId = await app.startQuiz(quiz.id, mode);
      await goto(`/attempt/${attemptId}`);
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>{quiz ? localize(quiz.title, lang, quiz.languages[0]) : t('app.name')} — Abbon</title></svelte:head>

<a class="back" href="/">← {t('common.back')}</a>

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
  </header>

  {#if info.resumable}
    <section class="panel resume">
      <p>{t('quiz.inProgressSince', { date: fmtDate(info.resumable.startedAt) })}</p>
      <div class="actions">
        <a class="button" href="/attempt/{info.resumable.id}">{t('quiz.resume')}</a>
      </div>
    </section>
  {/if}

  <section class="modes">
    <div class="panel">
      <h2>{t('quiz.training')}</h2>
      <p class="muted">{t('quiz.training.hint')}</p>
      <button
        class={info.resumable ? 'secondary' : ''}
        disabled={busy || !quiz.questions.length}
        onclick={() => start('training')}
      >
        {info.resumable ? t('quiz.restart') : t('quiz.start')}
      </button>
    </div>
    <div class="panel">
      <h2>{t('quiz.exam')}</h2>
      <p class="muted">
        {quiz.timeLimitSec
          ? t('quiz.exam.hintTimed', { time: formatDuration(quiz.timeLimitSec) })
          : t('quiz.exam.hint')}
      </p>
      <button
        class={info.resumable ? 'secondary' : ''}
        disabled={busy || !quiz.questions.length}
        onclick={() => start('exam')}
      >
        {info.resumable ? t('quiz.restart') : t('quiz.start')}
      </button>
    </div>
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
            <a href="/attempt/{a.id}/result">{t('quiz.history.result')}</a>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">{t('quiz.history.empty')}</p>
    {/if}
  </section>
{/if}

<style>
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

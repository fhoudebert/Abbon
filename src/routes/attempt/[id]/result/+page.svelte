<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { app } from '$lib/app.svelte';
  import {
    canSeeSolution,
    formatDuration,
    missedQuestionIds,
    outcomeOf,
    resultOf,
  } from '$lib/domain/session';
  import { localize } from '$lib/domain/text';
  import { fmtNum, i18n, pct, t } from '$lib/i18n/index.svelte';
  import { AttemptSession } from '$lib/session.svelte';

  const session = new AttemptSession();
  const id = page.params.id ?? '';
  let busy = $state(false);

  onMount(async () => {
    await session.load(id);
    if (session.attempt?.status === 'in_progress') goto(`/attempt/${id}`, { replaceState: true });
  });

  const lang = $derived(i18n.lang);
  const quiz = $derived(session.quiz);
  const attempt = $derived(session.attempt);
  const result = $derived(quiz && attempt ? resultOf(quiz, attempt, Object.values(session.answers)) : null);
  const solution = $derived(quiz && attempt && result ? canSeeSolution(quiz, attempt, result.passed) : false);
  const missed = $derived(result ? missedQuestionIds(result) : []);
  const fallback = $derived(quiz?.languages[0]);

  async function retry(onlyMissed: boolean) {
    if (!quiz || !attempt || busy) return;
    busy = true;
    try {
      const newId = await app.startQuiz(quiz.id, attempt.mode, onlyMissed ? missed : undefined);
      await goto(`/attempt/${newId}`);
    } finally {
      busy = false;
    }
  }
</script>

{#if session.error}
  <p role="alert">{t('common.error', { error: session.error })}</p>
{:else if !quiz || !attempt || !result}
  <p aria-busy="true">{t('home.loading')}</p>
{:else}
  <a class="back" href="/quiz/{quiz.id}">← {localize(quiz.title, lang, fallback)}</a>

  <section class="panel summary {result.passed ? 'passed' : 'failed'}">
    <h1>{t('result.title')}</h1>
    <p class="big">{pct(result.ratio)}</p>
    <p class="verdict">{result.passed ? t('result.passed') : t('result.failed')}</p>
    <p class="facts muted">
      <span>{t('result.points', { score: fmtNum(result.score), max: fmtNum(result.maxScore) })}</span>
      <span>{t('result.time', { time: formatDuration(attempt.elapsedSec) })}</span>
      <span>{t('result.threshold', { pct: pct(quiz.passThreshold) })}</span>
      <span>{attempt.mode === 'exam' ? t('quiz.exam') : t('quiz.training')}</span>
    </p>
    <div class="actions">
      {#if solution}
        <a class="button" href="/attempt/{id}/review">{t('result.review')}</a>
      {/if}
      {#if missed.length > 0 && missed.length < Object.keys(result.perQuestion).length}
        <button class="secondary" disabled={busy} onclick={() => retry(true)}>
          {t('result.retryMissed')} ({missed.length})
        </button>
      {/if}
      <button class="secondary" disabled={busy} onclick={() => retry(false)}>{t('result.retry')}</button>
    </div>
    {#if !solution}
      <p class="muted">
        {quiz.solutionVisibility === 'after_pass' ? t('result.solutionAfterPass') : t('result.noSolution')}
      </p>
    {/if}
  </section>

  <section>
    <h2>{t('result.details')}</h2>
    <ol class="details">
      {#each session.questions as q, i (q.id)}
        {@const outcome = outcomeOf(session.answers[q.id], result.perQuestion[q.id])}
        <li>
          <span class="num">{i + 1}</span>
          <span class="prompt">{localize(q.prompt, lang, fallback)}</span>
          <span class="badge {outcome}">{t(`outcome.${outcome}`)}</span>
          <span class="muted pts">
            {fmtNum(result.perQuestion[q.id]?.points ?? 0)} / {fmtNum(q.points)}
          </span>
        </li>
      {/each}
    </ol>
  </section>
{/if}

<style>
  .summary {
    text-align: center;
    margin-block-end: 2rem;
    border-block-start: 6px solid var(--bad);
  }
  .summary.passed {
    border-block-start-color: var(--ok);
  }
  .summary h1 {
    font-size: 1.1rem;
    color: var(--muted);
  }
  .big {
    font-size: 3rem;
    font-weight: 800;
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
  .verdict {
    font-size: 1.2rem;
    font-weight: 700;
    margin-block: 0 0.5rem;
    color: var(--bad);
  }
  .passed .verdict {
    color: var(--ok);
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 1.25rem;
  }
  .summary .actions {
    justify-content: center;
    margin-block: 1rem 0.5rem;
  }
  .details {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .details li {
    display: grid;
    grid-template-columns: 2rem 1fr auto auto;
    gap: 0.75rem;
    align-items: center;
    padding-block: 0.6rem;
    border-block-end: 1px solid var(--border);
  }
  .num {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .prompt {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.1em 0.6em;
    border-radius: 999px;
    border: 1px solid var(--border);
  }
  .badge.correct {
    color: var(--ok);
    background: var(--ok-soft);
    border-color: var(--ok);
  }
  .badge.wrong {
    color: var(--bad);
    background: var(--bad-soft);
    border-color: var(--bad);
  }
  .badge.partial {
    color: var(--warn);
    border-color: var(--warn);
  }
  .pts {
    font-variant-numeric: tabular-nums;
  }
  @media (max-width: 560px) {
    .pts {
      display: none;
    }
    .details li {
      grid-template-columns: 2rem 1fr auto;
    }
  }
</style>

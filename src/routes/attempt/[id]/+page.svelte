<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { formatDuration, showsInstantFeedback } from '$lib/domain/session';
  import { localize } from '$lib/domain/text';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import { AttemptSession } from '$lib/session.svelte';

  const session = new AttemptSession();
  const id = page.params.id ?? '';
  let dialog = $state<HTMLDialogElement | null>(null);

  const lang = $derived(i18n.lang);
  const quiz = $derived(session.quiz);
  const attempt = $derived(session.attempt);
  const question = $derived(session.question);
  const answer = $derived(session.answer);
  const total = $derived(session.questions.length);
  const isLast = $derived(session.index >= total - 1);
  const fallback = $derived(quiz?.languages[0]);
  const instant = $derived(quiz && attempt ? showsInstantFeedback(quiz, attempt) : false);
  /** Correction affichée pour la question courante (entraînement, après « Valider »). */
  const checked = $derived(instant && answer?.correct != null);
  const needsValidation = $derived(attempt?.mode === 'training' && !checked && instant);
  const unanswered = $derived(total - session.answeredCount);
  const flagged = $derived(session.questions.filter((q) => session.answers[q.id]?.flagged).length);

  onMount(async () => {
    await session.load(id);
    if (session.attempt?.status === 'in_progress') {
      session.startClock();
      document.addEventListener('visibilitychange', onVisibility);
    }
  });

  onDestroy(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    session.stopClock();
  });

  // Fin de tentative (bouton Terminer ou temps écoulé) → récapitulatif.
  $effect(() => {
    if (attempt && attempt.status !== 'in_progress') goto(`/attempt/${id}/result`, { replaceState: true });
  });

  /** Application en arrière-plan (Android, fenêtre réduite) : le chrono s'arrête. */
  function onVisibility() {
    if (document.hidden) session.stopClock();
    else if (session.attempt?.status === 'in_progress') session.startClock();
  }

  function askFinish() {
    if (unanswered > 0 || flagged > 0) dialog?.showModal();
    else session.finish();
  }

  async function quit() {
    await session.stopClock();
    await goto('/');
  }

  async function primary() {
    if (needsValidation && answer?.selected.length) return session.validate();
    if (isLast) return askFinish();
    return session.go(session.index + 1);
  }

  function onKey(e: KeyboardEvent) {
    if (dialog?.open || e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, select, textarea')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= session.choices.length) {
      e.preventDefault();
      session.choose(session.choices[n - 1].id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      primary();
    }
  }

  function choiceState(choiceId: string, correct: boolean): string {
    if (!checked) return '';
    const picked = answer?.selected.includes(choiceId);
    if (correct) return 'is-correct';
    return picked ? 'is-wrong' : '';
  }

  function mapState(qid: string): string {
    const a = session.answers[qid];
    const parts: string[] = [];
    if (a?.selected.length) parts.push('answered');
    if (a?.flagged) parts.push('flagged');
    if (instant && a?.correct != null) parts.push(a.correct ? 'ok' : 'ko');
    return parts.join(' ');
  }
</script>

<svelte:window onkeydown={onKey} />

{#if session.error}
  <p role="alert">{t('common.error', { error: session.error })}</p>
{:else if !quiz || !attempt || !question}
  <p aria-busy="true">{t('home.loading')}</p>
{:else}
  <div class="top">
    <a class="back" href="/quiz/{quiz.id}" onclick={(e) => { e.preventDefault(); session.stopClock().then(() => goto(`/quiz/${quiz.id}`)); }}>
      ← {localize(quiz.title, lang, fallback)}
    </a>
    <span class="mode">{attempt.mode === 'exam' ? t('quiz.exam') : t('quiz.training')}</span>
    <span class="clock" class:urgent={session.remaining !== null && session.remaining <= 60} role="timer" aria-live="off">
      {session.remaining !== null
        ? t('play.remaining', { time: formatDuration(session.remaining) })
        : t('play.elapsed', { time: formatDuration(attempt.elapsedSec) })}
    </span>
  </div>

  <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={session.answeredCount}>
    <span style="inline-size: {(session.answeredCount / Math.max(1, total)) * 100}%"></span>
  </div>

  <article class="panel question">
    <div class="qhead">
      <p class="muted">{t('play.questionOf', { n: session.index + 1, total })}</p>
      <button
        class="ghost flag"
        aria-pressed={answer?.flagged ?? false}
        onclick={() => session.toggleFlag()}
      >
        {answer?.flagged ? '★' : '☆'} {t('play.flag')}
      </button>
    </div>

    <!-- Pas de fieldset/legend : WebKitGTK y ajoute un espace parasite au premier rendu. -->
    <div class="prompt-block">
      <p class="prompt" id="prompt-{question.id}" lang={question.prompt[lang] ? lang : fallback}>
        {localize(question.prompt, lang, fallback)}
      </p>
      <p class="hint muted">{question.type === 'single' ? t('play.single') : t('play.multiple')}</p>

      <div
        class="choices"
        role={question.type === 'single' ? 'radiogroup' : 'group'}
        aria-labelledby="prompt-{question.id}"
      >
        {#each session.choices as choice, i (choice.id)}
          <label class="choice {choiceState(choice.id, choice.correct)}" class:locked={session.locked}>
            <input
              type={question.type === 'single' ? 'radio' : 'checkbox'}
              name="q-{question.id}"
              disabled={session.locked}
              checked={answer?.selected.includes(choice.id) ?? false}
              onchange={() => session.choose(choice.id)}
            />
            <span class="key" aria-hidden="true">{i + 1}</span>
            <span class="text" lang={choice.content[lang] ? lang : fallback}>{localize(choice.content, lang, fallback)}</span>
          </label>
        {/each}
      </div>
    </div>

    {#if checked && answer}
      <div class="feedback {answer.correct ? 'ok' : (answer.points ?? 0) > 0 ? 'partial' : 'ko'}" role="status">
        <strong>
          {answer.correct ? t('play.correct') : (answer.points ?? 0) > 0 ? t('play.partial') : t('play.wrong')}
        </strong>
        {#if question.explanation}
          <p><span class="muted">{t('play.explanation')} :</span> {localize(question.explanation, lang, fallback)}</p>
        {/if}
      </div>
    {/if}

    <div class="nav">
      <button class="secondary" disabled={session.index === 0} onclick={() => session.go(session.index - 1)}>
        ← {t('play.prev')}
      </button>
      {#if needsValidation}
        <button disabled={!answer?.selected.length} onclick={() => session.validate()}>{t('play.validate')}</button>
      {:else if isLast}
        <button onclick={askFinish}>{t('play.finish')}</button>
      {:else}
        <button onclick={() => session.go(session.index + 1)}>{t('play.next')} →</button>
      {/if}
    </div>
  </article>

  <nav class="map" aria-label={t('play.map')}>
    <ol>
      {#each session.questions as q, i (q.id)}
        <li>
          <button
            class="cell {mapState(q.id)}"
            aria-current={i === session.index ? 'step' : undefined}
            onclick={() => session.go(i)}
          >
            {i + 1}
          </button>
        </li>
      {/each}
    </ol>
    <p class="muted">{t('play.answered', { n: session.answeredCount })} / {total}</p>
    <div class="actions">
      <button class="secondary" onclick={quit}>{t('play.quit')}</button>
      <button class="secondary" onclick={askFinish}>{t('play.finish')}</button>
    </div>
  </nav>

  <dialog bind:this={dialog} aria-labelledby="confirm-title">
    <h2 id="confirm-title">{t('play.confirm.title')}</h2>
    {#if unanswered > 0}<p>{t('play.confirm.unanswered', { n: unanswered })}</p>{/if}
    {#if flagged > 0}<p>{t('play.confirm.flagged', { n: flagged })}</p>{/if}
    <div class="actions">
      <button class="secondary" onclick={() => dialog?.close()}>{t('play.confirm.cancel')}</button>
      <button onclick={() => { dialog?.close(); session.finish(); }}>{t('play.confirm.ok')}</button>
    </div>
  </dialog>
{/if}

<style>
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem 1rem;
  }
  .top .back {
    margin: 0;
    margin-inline-end: auto;
  }
  .mode {
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.1em 0.7em;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .clock {
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  .clock.urgent {
    color: var(--bad);
    font-weight: 700;
  }
  .progress {
    block-size: 6px;
    border-radius: 999px;
    background: var(--border);
    margin-block: 0.75rem 1rem;
    overflow: hidden;
  }
  .progress span {
    display: block;
    block-size: 100%;
    background: var(--accent);
    transition: inline-size 0.2s;
  }
  .question {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .qhead {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .qhead p {
    margin: 0;
  }
  .flag[aria-pressed='true'] {
    color: var(--warn);
  }
  .prompt {
    font-size: 1.2rem;
    font-weight: 600;
    white-space: pre-wrap;
    margin: 0;
  }
  .hint {
    margin-block: 0.25rem 0.75rem;
    font-size: 0.9rem;
  }
  .choices {
    display: grid;
    gap: 0.5rem;
  }
  .choice {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-block-size: var(--tap);
    padding: 0.6rem 0.9rem;
    border: 2px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    background: var(--surface);
  }
  .choice:has(input:checked) {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  /* Spécificité plus forte que :has(input:checked) : la correction l'emporte sur la sélection. */
  .choices .choice.is-correct {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .choices .choice.is-wrong {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .choice.locked {
    cursor: default;
  }
  .choice input {
    inline-size: 1.2rem;
    block-size: 1.2rem;
    accent-color: var(--accent);
    flex: none;
  }
  .key {
    font-size: 0.75rem;
    color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0 0.35em;
  }
  .text {
    white-space: pre-wrap;
  }
  .feedback {
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border-inline-start: 4px solid;
  }
  .feedback p {
    margin-block: 0.4rem 0;
  }
  .feedback.ok {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .feedback.ko {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .feedback.partial {
    border-color: var(--warn);
    background: var(--accent-soft);
  }
  .nav {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    margin-block-start: 0.5rem;
  }
  .map {
    margin-block-start: 1.5rem;
  }
  .map ol {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
    padding: 0;
    margin: 0 0 0.5rem;
  }
  .cell {
    min-inline-size: var(--tap);
    padding: 0;
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    font-weight: 500;
  }
  .cell.answered {
    background: var(--accent-soft);
    border-color: var(--accent);
  }
  .cell.ok {
    background: var(--ok-soft);
    border-color: var(--ok);
  }
  .cell.ko {
    background: var(--bad-soft);
    border-color: var(--bad);
  }
  .cell.flagged {
    box-shadow: inset 0 -3px 0 var(--warn);
  }
  .cell[aria-current='step'] {
    outline: 2px solid var(--text);
    outline-offset: 1px;
  }
  dialog {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    max-inline-size: min(28rem, 92vw);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.4);
  }
</style>

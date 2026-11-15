<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { canSeeSolution, choicesOf, outcomeOf, resultOf } from '$lib/domain/session';
  import ClozeText from '$lib/components/ClozeText.svelte';
  import { gapResults } from '$lib/domain/cloze';
  import { pick } from '$lib/domain/rich';
  import { expectedText, isTyped } from '$lib/domain/typed';
  import { localize } from '$lib/domain/text';
  import RichContent from '$lib/rich/RichContent.svelte';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import { app } from '$lib/app.svelte';
  import { AttemptSession } from '$lib/session.svelte';

  const session = new AttemptSession();
  const id = page.params.id ?? '';
  let onlyErrors = $state(false);

  const lang = $derived(i18n.lang);
  const quiz = $derived(session.quiz);
  const attempt = $derived(session.attempt);
  const result = $derived(quiz && attempt ? resultOf(quiz, attempt, Object.values(session.answers)) : null);
  const fallback = $derived(quiz?.languages[0]);
  const hasSheet = $derived(!!app.sheetOf(quiz?.categoryId));

  onMount(async () => {
    await session.load(id);
    const q = session.quiz;
    const a = session.attempt;
    if (!q || !a) return;
    // Corrigé non autorisé (tentative en cours, QCM sans corrigé ou pas encore réussi) : retour au résultat.
    if (!canSeeSolution(q, a, resultOf(q, a, Object.values(session.answers)).passed)) {
      goto(a.status === 'in_progress' ? `/attempt/${id}` : `/attempt/${id}/result`, { replaceState: true });
    }
  });

  const items = $derived(
    !quiz || !attempt || !result
      ? []
      : session.questions
          .map((q, i) => ({ q, i, outcome: outcomeOf(session.answers[q.id], result.perQuestion[q.id]) }))
          .filter((it) => !onlyErrors || it.outcome !== 'correct'),
  );
</script>

<svelte:head><title>{t('review.title')} — Abbon</title></svelte:head>

{#if session.error}
  <p role="alert">{t('common.error', { error: session.error })}</p>
{:else if !quiz || !attempt || !result}
  <p aria-busy="true">{t('home.loading')}</p>
{:else}
  <a class="back" href="/attempt/{id}/result">← {t('result.title')}</a>
  <div class="head">
    <h1>{t('review.title')} — {localize(quiz.title, lang, fallback)}</h1>
    {#if hasSheet}<a class="button secondary" href="/sheet/{quiz.categoryId}">{t('sheet.open')}</a>{/if}
    <label class="toggle">
      <input type="checkbox" bind:checked={onlyErrors} />
      {t('review.onlyErrors')}
    </label>
  </div>

  {#if items.length === 0}
    <p class="muted">{t('review.allGood')}</p>
  {/if}

  {#each items as { q, i, outcome } (q.id)}
    {@const selected = session.answers[q.id]?.selected ?? []}
    <article class="panel item {outcome}">
      <header>
        <span class="muted">{t('play.questionOf', { n: i + 1, total: session.questions.length })}</span>
        <span class="badge {outcome}">{t(`outcome.${outcome}`)}</span>
      </header>
      <div class="prompt" lang={q.prompt[lang] ? lang : fallback}><RichContent value={pick(q.prompt, lang, fallback)} /></div>
      {#if q.type === 'cloze'}
        {@const texts = session.answers[q.id]?.texts ?? []}
        <ClozeText question={q} {lang} {fallback} values={texts} locked results={gapResults(q, texts)} />
      {:else if isTyped(q)}
        {@const given = session.answers[q.id]?.text?.trim()}
        <dl class="typed">
          <dt>{t('review.yourAnswer')}</dt>
          <dd class:wrong={outcome !== 'correct' && !!given}>{given || t('review.noAnswer')}</dd>
          <dt>{t('review.expected')}</dt>
          <dd class="right">{expectedText(q, lang)}</dd>
        </dl>
      {:else}
      <ul class="choices">
        {#each choicesOf(quiz, attempt, q) as c (c.id)}
          {@const picked = selected.includes(c.id)}
          <li class:correct={c.correct} class:wrong={picked && !c.correct}>
            <span class="mark" aria-hidden="true">{c.correct ? '✓' : picked ? '✗' : ''}</span>
            <span class="text"><RichContent value={pick(c.content, lang, fallback)} inline /></span>
            {#if picked}<span class="tag">{t('review.yourAnswer')}</span>{/if}
            {#if c.correct}<span class="tag ok">{t('review.expected')}</span>{/if}
          </li>
        {/each}
      </ul>
      {#if selected.length === 0}<p class="muted">{t('review.noAnswer')}</p>{/if}
      {/if}
      {#if q.explanation}
        <div class="explanation"><strong>{t('play.explanation')} :</strong> <RichContent value={pick(q.explanation, lang, fallback)} /></div>
      {/if}
    </article>
  {/each}
{/if}

<style>
  .typed {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 1rem;
    margin-block: 0.75rem;
  }
  .typed dt {
    color: var(--muted);
  }
  .typed dd {
    margin: 0;
    font-weight: 600;
  }
  .typed .wrong {
    color: var(--bad);
    text-decoration: line-through;
  }
  .typed .right {
    color: var(--ok);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    margin-block-end: 1rem;
  }
  .head h1 {
    font-size: 1.3rem;
    margin: 0;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-block-size: var(--tap);
  }
  .item {
    margin-block-end: 1rem;
    border-inline-start: 5px solid var(--border);
  }
  .item.correct {
    border-inline-start-color: var(--ok);
  }
  .item.wrong,
  .item.unanswered {
    border-inline-start-color: var(--bad);
  }
  .item.partial {
    border-inline-start-color: var(--warn);
  }
  .item header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .item .prompt {
    font-size: 1.1rem;
    font-weight: 600;
    margin-block: 0.5rem;
  }
  .text {
    flex: 1;
    min-inline-size: 0;
  }
  .choices {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.35rem;
  }
  .choices li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding: 0.45rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .choices li.correct {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .choices li.wrong {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .mark {
    inline-size: 1em;
    font-weight: 700;
  }
  .tag {
    margin-inline-start: auto;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .tag.ok {
    color: var(--ok);
  }
  .tag + .tag {
    margin-inline-start: 0.5rem;
  }
  .explanation {
    margin-block: 0.75rem 0;
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
    border-color: var(--ok);
  }
  .badge.wrong,
  .badge.unanswered {
    color: var(--bad);
    border-color: var(--bad);
  }
  .badge.partial {
    color: var(--warn);
    border-color: var(--warn);
  }
</style>

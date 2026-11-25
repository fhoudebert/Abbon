<script lang="ts">
  import { SITE, to } from '$lib/site';
  import { app, MY_CARDS_ID } from '$lib/app.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import QuestionPlayer from '$lib/components/QuestionPlayer.svelte';
  import RankCard from '$lib/components/RankCard.svelte';
  import {
    boxCounts,
    cardQuestion,
    dueCards,
    isAcquired,
    isDue,
    LEITNER_INTERVALS,
    LEITNER_SESSION_SIZE,
    type LeitnerCard,
  } from '$lib/domain/leitner';
  import { pick, richToPlain } from '$lib/domain/rich';
  import { localize } from '$lib/domain/text';
  import type { Quiz } from '$lib/domain/types';
  import { i18n, t } from '$lib/i18n/index.svelte';

  /**
   * Boîte de révision (Leitner) : une seule pour tous les QCM. On y range les questions à retenir
   * (bouton « Ma boîte » pendant un QCM ou dans son corrigé) ; elles reviennent ici à intervalles
   * de plus en plus longs.
   */
  const lang = $derived(i18n.lang);
  const counts = $derived(boxCounts(app.cards));
  const due = $derived(dueCards(app.cards));
  const planned = $derived(app.cards.filter((c) => !isAcquired(c)));
  const acquired = $derived(app.cards.filter(isAcquired).sort((a, b) => (b.acquiredAt ?? '').localeCompare(a.acquiredAt ?? '')));
  const fmtDate = (iso: string) => new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(iso));

  // ---- Session ---------------------------------------------------------------
  let queue = $state.raw<LeitnerCard[]>([]);
  let index = $state(0);
  let good = $state(0);
  let reviewed = $state(0);
  /** Points gagnés pendant la séance, et bonus « journée à jour » gagné pendant la séance. */
  let gained = $state(0);
  let dayDoneNow = $state(false);
  let answeredCurrent = $state(false);
  let running = $state(false);
  let finished = $state(false);
  /** Version actuelle des QCM des cartes de la session (un module mis à jour corrige ses cartes). */
  let live = $state.raw(new Map<string, Quiz | null>());

  const card = $derived(running ? queue[index] : undefined);
  const shown = $derived(card ? cardQuestion(card, live.get(card.quizId)) : undefined);

  async function start(cards: LeitnerCard[]) {
    const picked = cards.slice(0, LEITNER_SESSION_SIZE);
    const repo = await app.repo();
    const quizzes = new Map<string, Quiz | null>();
    for (const id of new Set(picked.map((c) => c.quizId))) quizzes.set(id, await repo.getQuiz(id));
    live = quizzes;
    queue = picked;
    index = 0;
    good = 0;
    reviewed = 0;
    gained = 0;
    dayDoneNow = false;
    answeredCurrent = false;
    finished = false;
    running = picked.length > 0;
  }

  async function record(correct: boolean) {
    if (!card || answeredCurrent) return;
    answeredCurrent = true;
    reviewed++;
    if (correct) good++;
    const hadDay = app.dayDone();
    const { points } = await app.recordReview(card, correct);
    gained += points;
    if (!hadDay && app.dayDone()) dayDoneNow = true;
  }

  function next() {
    answeredCurrent = false;
    if (index + 1 < queue.length) index++;
    else {
      running = false;
      finished = true;
    }
  }

  // ---- Retrait d'une carte ---------------------------------------------------
  let toRemove = $state<LeitnerCard | null>(null);
  let confirm: ConfirmDialog;
  const promptOf = (c: LeitnerCard) => richToPlain(pick(c.snapshot.question.prompt, lang, c.snapshot.languages[0])) || '—';
  function askRemove(c: LeitnerCard) {
    toRemove = c;
    queueMicrotask(() => confirm.open());
  }

  // ---- Cartes dont le QCM a disparu -----------------------------------------
  /** Questions de la boîte qui n'existent plus dans aucun QCM : révisables par leur copie, plus modifiables. */
  let orphans = $state.raw(new Set<string>());
  let orphanStatus = $state('');
  let removeOrphans: ConfirmDialog;
  let orphanRun = 0;
  $effect(() => {
    // Recalculé quand la boîte ou la liste des QCM change ; seul le dernier calcul compte.
    void app.cards;
    void app.quizzes;
    if (!app.ready) return;
    const run = ++orphanRun;
    void app.orphanCards().then((s) => {
      if (run === orphanRun) orphans = s;
    });
  });
  const orphanIds = $derived(app.cards.filter((c) => orphans.has(c.questionId)).map((c) => c.questionId));
  async function keep(ids: string[]) {
    const n = await app.keepInMyCards(ids);
    orphanStatus = t('leitner.kept', { n });
  }
</script>

<svelte:head><title>{t('leitner.title')} — Abbon</title></svelte:head>

<h1>{t('leitner.title')}</h1>

{#if !app.ready}
  <p aria-busy="true">{t('home.loading')}</p>
{:else if running && card && shown}
  <p class="muted progress">
    {t('play.questionOf', { n: index + 1, total: queue.length })} · {t('leitner.box', { n: card.box })} · {localize(shown.quizTitle, lang, shown.languages[0])}
  </p>
  <article class="panel">
    {#key card.questionId}
      <QuestionPlayer
        question={shown.question}
        {lang}
        fallback={shown.languages[0]}
        seed="{card.questionId}:{card.reviews}"
        nextLabel={index + 1 < queue.length ? `${t('play.next')} →` : t('leitner.finish')}
        onresult={record}
        onnext={next}
      />
    {/key}
  </article>
  <p class="session-tools">
    <button class="secondary" onclick={() => ((running = false), (finished = reviewed > 0))}>{t('leitner.stop')}</button>
    <button class="ghost danger" onclick={() => askRemove(card)}>{t('leitner.removeCurrent')}</button>
  </p>
{:else}
  {#if finished}
    <section class="panel done" role="status">
      <h2>{t('leitner.done')}</h2>
      <p>{t('leitner.doneScore', { n: good, good, total: reviewed })}</p>
      {#if app.showRewards && gained}<p class="gain">{t('leitner.points', { n: gained })}</p>{/if}
      {#if dayDoneNow}<p>{t('leitner.dayDone')}</p>{/if}
    </section>
  {/if}

  {#if app.showRewards}<RankCard explain />{/if}

  <p class="muted intro">{t('leitner.intro')}</p>

  <p class="tools">
    {#if !SITE}<a class="button secondary" href={to('/leitner/new')}>+ {t('leitner.newCard')}</a>{/if}
    {#if app.cards.length}<a class="button secondary" href={to('/leitner/recap')}>{t('leitner.recap')}</a>{/if}
  </p>

  {#if app.cards.length === 0}
    <p class="panel">{t('leitner.empty')}</p>
  {:else}
    <ol class="boxes" aria-label={t('leitner.boxes')}>
      {#each counts as n, i (i)}
        <li class="panel">
          <span class="name">{t('leitner.box', { n: i + 1 })}</span>
          <strong>{t('leitner.cards', { n })}</strong>
          <span class="muted small">{t('leitner.every', { n: LEITNER_INTERVALS[i] })}</span>
        </li>
      {/each}
    </ol>

    <div class="actions">
      {#if due.length}
        <button onclick={() => start(due)}>{t('leitner.review', { n: Math.min(due.length, LEITNER_SESSION_SIZE) })}</button>
        {#if due.length > LEITNER_SESSION_SIZE}<span class="muted">{t('leitner.dueTotal', { n: due.length })}</span>{/if}
      {:else}
        <p>{t('leitner.nothingDue')}</p>
        <button class="secondary" disabled={!planned.length} onclick={() => start([...planned].sort((a, b) => a.box - b.box || a.dueAt.localeCompare(b.dueAt)))}>
          {t('leitner.reviewAnyway')}
        </button>
        <span class="muted small">{t('leitner.anywayHint')}</span>
      {/if}
    </div>

    {#if orphanIds.length}
      <section class="panel orphans" aria-labelledby="h-orphans">
        <p id="h-orphans">{t('leitner.orphans', { n: orphanIds.length })}</p>
        <p class="actions">
          {#if !SITE}<button class="secondary" onclick={() => keep(orphanIds)}>{t('leitner.keepAll', { n: orphanIds.length })}</button>{/if}
          <button class="ghost danger" onclick={() => removeOrphans.open()}>{t('leitner.removeAll', { n: orphanIds.length })}</button>
        </p>
      </section>
    {/if}
    <p class="status" role="status">{orphanStatus}</p>

    <h2>{t('leitner.list', { n: planned.length })}</h2>
    <ul class="cards">
      {#each [...planned].sort((a, b) => a.dueAt.localeCompare(b.dueAt)) as c (c.questionId)}
        <li class="panel">
          <div class="info">
            <span class="q">{promptOf(c)}</span>
            <span class="muted small">
              {localize(c.snapshot.quizTitle, lang, c.snapshot.languages[0])}{#if orphans.has(c.questionId)}{' '}<span class="orphan">({t('leitner.orphan')})</span>{/if} · {t('leitner.box', { n: c.box })} ·
              {isDue(c) ? t('leitner.dueNow') : t('leitner.dueOn', { date: fmtDate(c.dueAt) })}
            </span>
          </div>
          {#if orphans.has(c.questionId) && !SITE}<button class="ghost" onclick={() => keep([c.questionId])}>{t('leitner.keep')}</button>{/if}
          <button class="ghost danger" onclick={() => askRemove(c)}>{t('leitner.remove')}</button>
        </li>
      {/each}
    </ul>

    {#if acquired.length}
      <h2>{t('leitner.acquired', { n: acquired.length })}</h2>
      <p class="muted small intro">{t('leitner.acquiredHint')}</p>
      <ul class="cards">
        {#each acquired as c (c.questionId)}
          <li class="panel">
            <div class="info">
              <span class="q">{promptOf(c)}</span>
              <span class="muted small">
                {localize(c.snapshot.quizTitle, lang, c.snapshot.languages[0])}{#if orphans.has(c.questionId)}{' '}<span class="orphan">({t('leitner.orphan')})</span>{/if} · {t('leitner.acquiredOn', { date: fmtDate(c.acquiredAt ?? c.dueAt) })}
              </span>
            </div>
            {#if orphans.has(c.questionId) && !SITE}<button class="ghost" onclick={() => keep([c.questionId])}>{t('leitner.keep')}</button>{/if}
            <button class="ghost" onclick={() => app.restoreCard(c.questionId)}>{t('leitner.restore')}</button>
            <button class="ghost danger" onclick={() => askRemove(c)}>{t('leitner.remove')}</button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
{/if}

<ConfirmDialog
  bind:this={confirm}
  title={t('leitner.remove.title')}
  body={toRemove ? promptOf(toRemove) + (toRemove.quizId === MY_CARDS_ID ? `\n\n${t('leitner.remove.custom')}` : '') : ''}
  confirmLabel={t('leitner.remove')}
  danger
  onconfirm={async () => {
    if (toRemove) {
      const id = toRemove.questionId;
      await app.removeCard(id);
      // Pendant une séance : la carte retirée quitte la file, on passe à la suivante.
      if (running && queue.some((c) => c.questionId === id)) {
        const at = queue.findIndex((c) => c.questionId === id);
        queue = queue.filter((c) => c.questionId !== id);
        if (at < index) index--;
        answeredCurrent = false;
        if (index >= queue.length) {
          running = false;
          finished = reviewed > 0;
        }
      }
    }
    toRemove = null;
  }}
/>

<ConfirmDialog
  bind:this={removeOrphans}
  title={t('leitner.removeAll.title', { n: orphanIds.length })}
  body={t('leitner.removeAll.body')}
  confirmLabel={t('leitner.removeAll', { n: orphanIds.length })}
  danger
  onconfirm={() => app.removeCards(orphanIds)}
/>

<style>
  .orphans {
    margin-block-start: 1rem;
    border-inline-start: 4px solid var(--warn, var(--accent));
  }
  .orphans p:first-child {
    margin-block-start: 0;
  }
  .orphans .actions {
    margin-block-end: 0;
  }
  .orphan {
    font-style: italic;
  }
  .status:empty {
    margin: 0;
  }
  h1 {
    font-size: 1.5rem;
  }
  h2 {
    font-size: 1.1rem;
    margin-block: 1.5rem 0.5rem;
  }
  .intro {
    max-inline-size: 60ch;
  }
  .progress {
    margin-block-end: 0.5rem;
  }
  .boxes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin-block: 1rem;
  }
  .boxes li {
    display: grid;
    gap: 0.15rem;
    padding: 0.75rem 1rem;
  }
  .boxes strong {
    font-size: 1.15rem;
  }
  .name {
    font-weight: 600;
  }
  .small {
    font-size: 0.85rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
  .actions p {
    margin: 0;
    flex-basis: 100%;
  }
  .cards {
    display: grid;
    gap: 0.5rem;
    list-style: none;
    padding: 0;
  }
  .cards li {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.6rem 1rem;
  }
  .info {
    display: grid;
    gap: 0.15rem;
    flex: 1;
    min-inline-size: 0;
  }
  .q {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .done {
    margin-block-end: 1rem;
    border-color: var(--ok);
  }
  .done h2 {
    margin-block-start: 0;
  }
  .gain {
    font-weight: 600;
    color: var(--accent);
  }
  .cards li {
    flex-wrap: wrap;
  }
  .cards .info {
    flex: 1 1 14rem;
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .session-tools {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
  }
</style>

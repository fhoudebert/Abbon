<script lang="ts">
  /**
   * Récapitulatif de la boîte de révision (lot 16) : toutes les cartes par compartiment, puis les acquises,
   * avec ou sans les réponses. À imprimer (ou enregistrer en PDF) sur ordinateur, ou à enregistrer en
   * fichier HTML autonome (Android, où la WebView n'imprime pas).
   */
  import { onMount } from 'svelte';
  import { app } from '$lib/app.svelte';
  import ClozeText from '$lib/components/ClozeText.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { richToPlain } from '$lib/domain/rich';
  import { MY_CARDS_ID } from '$lib/app.svelte';
  import { cardQuestion, isAcquired, LEITNER_BOXES, type LeitnerCard } from '$lib/domain/leitner';
  import { pick } from '$lib/domain/rich';
  import { localize } from '$lib/domain/text';
  import { expectedText, isTyped } from '$lib/domain/typed';
  import type { Question, Quiz } from '$lib/domain/types';
  import { saveFile } from '$lib/files';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import RichContent from '$lib/rich/RichContent.svelte';
  import { renderMath } from '$lib/rich/math';
  import { standaloneHtml } from '$lib/standalone';

  const lang = $derived(i18n.lang);
  const fmtDate = (iso: string) => new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(iso));
  const android = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

  let withAnswers = $state(true);
  let message = $state<string | null>(null);
  let root = $state<HTMLElement | null>(null);
  /** Version actuelle des QCM des cartes (un module mis à jour corrige ses cartes). */
  let live = $state.raw(new Map<string, Quiz | null>());
  let loaded = $state(false);

  onMount(async () => {
    const repo = await app.repo();
    const map = new Map<string, Quiz | null>();
    for (const id of new Set(app.cards.map((c) => c.quizId))) map.set(id, await repo.getQuiz(id));
    live = map;
    loaded = true;
  });

  const byOrder = (a: LeitnerCard, b: LeitnerCard) => a.dueAt.localeCompare(b.dueAt) || a.addedAt.localeCompare(b.addedAt);
  const groups = $derived([
    ...Array.from({ length: LEITNER_BOXES }, (_, i) => ({
      title: t('recap.box', { n: i + 1 }),
      cards: app.cards.filter((c) => !isAcquired(c) && c.box === i + 1).sort(byOrder),
      acquired: false,
    })),
    {
      title: t('recap.acquired'),
      cards: app.cards.filter(isAcquired).sort((a, b) => (a.acquiredAt ?? '').localeCompare(b.acquiredAt ?? '')),
      acquired: true,
    },
  ].filter((g) => g.cards.length));

  const shown = (c: LeitnerCard) => cardQuestion(c, live.get(c.quizId));
  const correctChoices = (q: Question) => [...q.choices].filter((c) => c.correct).sort((a, b) => a.position - b.position);

  // ---- Retrait d'une carte ----
  let toRemove = $state<LeitnerCard | null>(null);
  let confirm: ConfirmDialog;
  function askRemove(c: LeitnerCard) {
    toRemove = c;
    queueMicrotask(() => confirm.open());
  }
  const removeBody = (c: LeitnerCard) => {
    const s = shown(c);
    const text = richToPlain(pick(s.question.prompt, lang, s.languages[0])) || '—';
    return c.quizId === MY_CARDS_ID ? `${text}\n\n${t('leitner.remove.custom')}` : text;
  };

  async function print() {
    message = null;
    try {
      await (window.print() as unknown as Promise<void> | undefined);
    } catch {
      message = t('recap.printFailed');
    }
  }

  async function saveHtml() {
    if (!root) return;
    message = null;
    const extra = `.standalone{max-width:48rem;margin:1rem auto;padding:0 1rem}`;
    const html = await standaloneHtml(root, t('recap.title'), lang, extra);
    const day = new Date().toISOString().slice(0, 10);
    const path = await saveFile(`abbon-recapitulatif-${day}.html`, new TextEncoder().encode(html), [{ name: 'HTML', extensions: ['html'] }]);
    if (path) message = t('recap.saved', { path });
  }
</script>

<div class="recap" bind:this={root}>
  <h1>{t('recap.title')}</h1>
  <p class="muted">{t('recap.count', { n: app.cards.length })} · {fmtDate(new Date().toISOString())}</p>

  <div class="tools" data-no-export>
    <label class="check">
      <input type="checkbox" bind:checked={withAnswers} />
      {t('recap.withAnswers')}
    </label>
    <span class="buttons">
      {#if !android}<button onclick={print}>{t('recap.print')}</button>{/if}
      <button class={android ? '' : 'secondary'} onclick={saveHtml} title={t('recap.htmlHint')}>{t('recap.html')}</button>
      <a class="button secondary" href="/leitner">{t('common.back')}</a>
    </span>
  </div>
  {#if message}<p class="message" role="status" data-no-export>{message}</p>{/if}

  {#if !loaded}
    <p aria-busy="true">{t('home.loading')}</p>
  {:else if !groups.length}
    <p class="panel">{t('recap.empty')}</p>
  {:else}
    {#each groups as g (g.title)}
      <section class="group" aria-labelledby="recap-{g.title}">
        <h2 id="recap-{g.title}">{g.title} <span class="muted count">({t('recap.count', { n: g.cards.length })})</span></h2>
        <ol class="cards">
          {#each g.cards as c (c.questionId)}
            {@const s = shown(c)}
            {@const q = s.question}
            {@const fb = s.languages[0]}
            <li class="card">
              <div class="prompt" lang={q.prompt[lang] ? lang : fb}><RichContent value={pick(q.prompt, lang, fb)} /></div>
              {#if withAnswers}
                <div class="answer">
                  <span class="label">{q.type === 'flashcard' ? t('recap.backLabel') : t('recap.answerLabel')}</span>
                  {#if q.type === 'flashcard'}
                    <RichContent value={pick(q.explanation ?? {}, lang, fb)} />
                  {:else if q.type === 'cloze'}
                    <ClozeText question={q} {lang} fallback={fb} locked values={(q.expected?.gaps ?? []).map((gap) => gap.accepted[0] ?? '')} />
                  {:else if q.type === 'expression'}
                    {@html renderMath(expectedText(q, lang))}
                  {:else if isTyped(q)}
                    <strong>{expectedText(q, lang)}</strong>
                  {:else}
                    <ul class="right">
                      {#each correctChoices(q) as ch (ch.id)}<li><RichContent value={pick(ch.content, lang, fb)} inline /></li>{/each}
                    </ul>
                  {/if}
                </div>
                {#if q.explanation && q.type !== 'flashcard'}
                  <div class="expl muted"><RichContent value={pick(q.explanation, lang, fb)} /></div>
                {/if}
              {/if}
              <p class="meta muted">
                {localize(s.quizTitle, lang, fb)} ·
                {g.acquired ? t('recap.acquiredOn', { date: fmtDate(c.acquiredAt ?? c.dueAt) }) : t('recap.next', { date: fmtDate(c.dueAt) })}
                <button class="ghost danger remove" data-no-export onclick={() => askRemove(c)}>{t('leitner.remove')}</button>
              </p>
            </li>
          {/each}
        </ol>
      </section>
    {/each}
  {/if}
</div>

<ConfirmDialog
  bind:this={confirm}
  title={t('leitner.remove.title')}
  body={toRemove ? removeBody(toRemove) : ''}
  confirmLabel={t('leitner.remove')}
  danger
  onconfirm={async () => {
    if (toRemove) await app.removeCard(toRemove.questionId);
    toRemove = null;
  }}
/>

<style>
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-block: 1rem;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .group h2 {
    font-size: 1.2rem;
    margin-block: 1.5rem 0.5rem;
  }
  .count {
    font-size: 0.9rem;
    font-weight: 400;
  }
  .cards {
    padding-inline-start: 1.5rem;
    display: grid;
    gap: 0.75rem;
  }
  .card {
    break-inside: avoid;
    border-block-end: 1px solid var(--border);
    padding-block-end: 0.75rem;
  }
  .prompt {
    font-weight: 600;
  }
  .answer {
    margin-block-start: 0.35rem;
  }
  .label {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .right {
    margin: 0.2rem 0;
    padding-inline-start: 1.2rem;
  }
  .expl {
    font-size: 0.95rem;
    margin-block-start: 0.3rem;
  }
  .meta {
    font-size: 0.85rem;
    margin: 0.35rem 0 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.5rem;
  }
  .remove {
    margin-inline-start: auto;
    font-size: 0.85rem;
  }
  .message {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  /* Impression : seulement le récapitulatif, en clair. */
  @media print {
    :global(:root) {
      --bg: #fff;
      --surface: #fff;
      --text: #000;
      --muted: #444;
      --border: #bbb;
      color-scheme: light;
    }
    :global(header.top),
    :global(.promo-region),
    :global(.skip),
    [data-no-export] {
      display: none !important;
    }
    .group h2 {
      break-after: avoid;
    }
  }
</style>

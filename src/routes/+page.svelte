<script lang="ts">
  import { app, type QuizEntry } from '$lib/app.svelte';
  import { categoryTree, withDescendants } from '$lib/domain/categories';
  import QuizCard from '$lib/components/QuizCard.svelte';
  import RankCard from '$lib/components/RankCard.svelte';
  import { POINTS } from '$lib/domain/rewards';
  import type { Progress } from '$lib/domain/progress';
  import { localize } from '$lib/domain/text';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import type { MessageKey } from '$lib/i18n/fr';

  let search = $state('');
  let categoryId = $state('');

  const normalize = (s: string) =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  /** Filtre : la catégorie choisie et ses descendantes (« Physique » montre tous les QCM de physique). */
  const allowed = $derived(categoryId ? withDescendants(categoryId, app.categories) : null);
  /** Catégories proposées : en arbre, seulement celles qui contiennent des QCM. */
  const tree = $derived(
    categoryTree(app.categories, new Set(app.entries.map((e) => e.quiz.categoryId).filter((id): id is string => !!id))),
  );
  const indent = (depth: number) => '\u00a0\u00a0\u00a0'.repeat(depth);

  const visible = $derived(
    app.entries.filter((e) => {
      if (allowed && !(e.quiz.categoryId && allowed.has(e.quiz.categoryId))) return false;
      if (!search.trim()) return true;
      const hay = normalize(
        [...Object.values(e.quiz.title), ...Object.values(e.quiz.description ?? {}), ...e.quiz.tags].join(' '),
      );
      return hay.includes(normalize(search.trim()));
    }),
  );

  const sections: { key: Progress; title: MessageKey; empty: MessageKey }[] = [
    { key: 'in_progress', title: 'home.inProgress', empty: 'home.empty.inProgress' },
    { key: 'todo', title: 'home.todo', empty: 'home.empty.todo' },
    { key: 'done', title: 'home.done', empty: 'home.empty.done' },
  ];

  const byProgress = (p: Progress): QuizEntry[] => visible.filter((e) => e.info.progress === p);
  const due = $derived(app.dueCount());
  const dayDone = $derived(app.dayDone());
</script>

<svelte:head><title>{t('nav.home')} — Abbon</title></svelte:head>

{#if app.error}
  <p role="alert" class="error">{t('home.error', { error: app.error })}</p>
{:else if !app.ready}
  <p aria-busy="true">{t('home.loading')}</p>
{:else}
  {#if app.cards.length || app.showRewards}
    <div class="today">
      {#if app.cards.length}
        <section class="panel due" aria-labelledby="h-today">
          <h2 id="h-today" class="visually-hidden">{t('leitner.title')}</h2>
          {#if due}
            <p>
              <strong>{t('home.dueToday', { n: due })}</strong>
              {#if app.showRewards && !dayDone}<span class="muted"> · {t('home.dayBonus', { n: POINTS.day })}</span>{/if}
            </p>
            <a class="button" href="/leitner">{t('home.review')}</a>
          {:else}
            <p>{app.showRewards && dayDone ? t('home.dayDone') : t('home.nothingDue')}</p>
          {/if}
        </section>
      {/if}
      {#if app.showRewards}<RankCard />{/if}
    </div>
  {/if}

  <div class="filters">
    <label>
      <span class="visually-hidden">{t('home.search')}</span>
      <input type="search" placeholder={t('home.search')} bind:value={search} />
    </label>
    <label>
      <span class="visually-hidden">{t('home.allCategories')}</span>
      <select bind:value={categoryId}>
        <option value="">{t('home.allCategories')}</option>
        {#each tree as n (n.category.id)}
          <option value={n.category.id}>{indent(n.depth)}{localize(n.category.name, i18n.lang)}</option>
        {/each}
      </select>
    </label>
  </div>

  {#each sections as s (s.key)}
    {@const list = byProgress(s.key)}
    <section aria-labelledby="h-{s.key}">
      <h2 id="h-{s.key}">{t(s.title)} <span class="count">{list.length}</span></h2>
      {#if list.length}
        <div class="grid">
          {#each list as entry (entry.quiz.id)}
            <QuizCard {entry} />
          {/each}
        </div>
      {:else}
        <p class="empty">{t(s.empty)}</p>
      {/if}
    </section>
  {/each}
{/if}

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block-end: 1.5rem;
  }
  .filters label:first-child {
    flex: 1 1 16rem;
  }
  .filters input {
    inline-size: 100%;
  }
  section {
    margin-block-end: 2rem;
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
  }
  .count {
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0 0.6em;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
    gap: 1rem;
  }
  .empty {
    color: var(--muted);
  }
  .error {
    color: var(--warn);
  }
  .today {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
    gap: 0.75rem;
    margin-block-end: 1.25rem;
  }
  .today > :global(.panel) {
    margin: 0;
  }
  .due {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }
  .due p {
    margin: 0;
  }
</style>

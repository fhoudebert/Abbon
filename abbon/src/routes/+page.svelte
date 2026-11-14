<script lang="ts">
  import { app, type QuizEntry } from '$lib/app.svelte';
  import QuizCard from '$lib/components/QuizCard.svelte';
  import type { Progress } from '$lib/domain/progress';
  import { localize } from '$lib/domain/text';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import type { MessageKey } from '$lib/i18n/fr';

  let search = $state('');
  let categoryId = $state('');

  const normalize = (s: string) =>
    s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  const visible = $derived(
    app.entries.filter((e) => {
      if (categoryId && e.quiz.categoryId !== categoryId) return false;
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
</script>

{#if app.error}
  <p role="alert" class="error">{t('home.error', { error: app.error })}</p>
{:else if !app.ready}
  <p aria-busy="true">{t('home.loading')}</p>
{:else}
  <div class="filters">
    <label>
      <span class="visually-hidden">{t('home.search')}</span>
      <input type="search" placeholder={t('home.search')} bind:value={search} />
    </label>
    <label>
      <span class="visually-hidden">{t('home.allCategories')}</span>
      <select bind:value={categoryId}>
        <option value="">{t('home.allCategories')}</option>
        {#each app.categories as c (c.id)}
          <option value={c.id}>{localize(c.name, i18n.lang)}</option>
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
</style>

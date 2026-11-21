<script lang="ts">
  import { app } from '$lib/app.svelte';
  import { rankOf, type Rank } from '$lib/domain/rewards';
  import { t } from '$lib/i18n/index.svelte';
  import Belt from './Belt.svelte';

  /** Ceinture, points et progression vers le rang suivant. */
  let { explain = false }: { explain?: boolean } = $props();

  const rank = $derived(rankOf(app.points));
  const next = $derived(rankOf(rank.next));
</script>

<script module lang="ts">
  import { t as tr } from '$lib/i18n/index.svelte';
  /** Nom d'un rang (« ceinture verte », « ceinture noire, 2e dan »). */
  export const rankName = (r: Rank) => (r.dan ? tr('rank.dan', { n: r.dan }) : tr(`belt.${r.belt}`));
  export const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
</script>

<section class="panel rank" aria-labelledby="rank-title">
  <h2 id="rank-title" class="visually-hidden">{t('rank.title')}</h2>
  <Belt belt={rank.belt} />
  <div class="body">
    <p class="name"><strong>{capitalize(rankName(rank))}</strong> <span class="muted">· {t('rank.points', { n: rank.points })}</span></p>
    <progress max={rank.next - rank.floor} value={rank.points - rank.floor} aria-label={t('rank.progress')}></progress>
    <p class="muted small">{t('rank.next', { n: rank.next - rank.points, next: rankName(next) })}</p>
    {#if explain}<p class="muted small">{t('rank.how')}</p>{/if}
  </div>
</section>

<style>
  .rank {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
  }
  .body {
    display: grid;
    gap: 0.3rem;
    flex: 1;
    min-inline-size: 0;
  }
  p {
    margin: 0;
  }
  .small {
    font-size: 0.85rem;
  }
  progress {
    inline-size: 100%;
    block-size: 0.5rem;
    accent-color: var(--accent);
  }
</style>

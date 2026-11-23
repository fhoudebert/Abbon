<script lang="ts">
  import 'katex/dist/katex.min.css';
  import FormulaWorkshop from '$lib/atelier/FormulaWorkshop.svelte';
  import { t } from '$lib/i18n/index.svelte';
  import { ATELIER_URL, openExternal } from '$lib/links';
  import { to } from '$lib/site';
</script>

<svelte:head><title>{t('atelier.title')} — Abbon</title></svelte:head>

<a class="back" href={to('/tools')}>← {t('tools.title')}</a>
<h1>{t('atelier.title')}</h1>
<p class="muted">{t('atelier.intro')}</p>

<FormulaWorkshop />

<p class="muted standalone">
  {t('atelier.standalone')}
  <a href={ATELIER_URL} target="_blank" rel="noopener noreferrer" onclick={(e) => openExternal(e, ATELIER_URL)}>
    {ATELIER_URL.replace('https://', '').replace(/\/$/, '')}
  </a>
</p>

<style>
  .standalone {
    margin-block-start: 1.5rem;
    font-size: 0.9rem;
  }
</style>

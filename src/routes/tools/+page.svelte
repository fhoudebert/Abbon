<script lang="ts">
  import { to } from '$lib/site';
  import { t } from '$lib/i18n/index.svelte';
</script>

<svelte:head><title>{t('tools.title')} — Abbon</title></svelte:head>

<h1>{t('tools.title')}</h1>
<p class="muted">{t('tools.intro')}</p>

<ul class="tools">
  <li class="panel">
    <h2><a href={to('/tools/formulas')}>{t('atelier.title')}</a></h2>
    <p>{t('atelier.summary')}</p>
  </li>
</ul>

<style>
  .tools {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  }
  h2 {
    font-size: 1.15rem;
  }
  p {
    margin: 0;
  }
</style>

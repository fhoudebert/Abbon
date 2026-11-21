<script lang="ts">
  import { isTauri } from '@tauri-apps/api/core';
  import { app } from '$lib/app.svelte';
  import { t } from '$lib/i18n/index.svelte';
  import { openExternal, REPO_URL } from '$lib/links';

  const version = __APP_VERSION__;
  const platform = isTauri() ? 'Tauri' : 'Web';
</script>

<svelte:head><title>{t('about.title')} — Abbon</title></svelte:head>

<h1>{t('about.title')}</h1>

<img src="/abbon.png" alt="" width="96" height="96" />

<dl>
  <dt>{t('about.version')}</dt>
  <dd>{version}</dd>
  <dt>{t('about.storage')}</dt>
  <dd>
    {#if app.backend === 'sqlite'}{t('about.storage.sqlite')}{:else if app.backend === 'memory'}{t('about.storage.memory')}{:else}—{/if}
  </dd>
  <dt>{t('about.platform')}</dt>
  <dd>{platform}</dd>
  <dt>{t('about.source')}</dt>
  <dd>
    <a href={REPO_URL} target="_blank" rel="noopener noreferrer" onclick={(e) => openExternal(e, REPO_URL)}>
      {REPO_URL.replace('https://', '')}
    </a>
    <span class="muted">— {t('about.sourceHint')}</span>
  </dd>
</dl>

<p>{t('about.license')}</p>
<p class="muted">{t('about.demo')}</p>

<style>
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.25rem 1rem;
  }
  dt {
    font-weight: 600;
  }
  dd {
    margin: 0;
  }
  .muted {
    color: var(--muted);
  }
</style>

<script lang="ts">
  import { isTauri } from '@tauri-apps/api/core';
  import { app } from '$lib/app.svelte';
  import { t } from '$lib/i18n/index.svelte';

  const version = __APP_VERSION__;
  const platform = isTauri() ? 'Tauri' : 'Web';
</script>

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

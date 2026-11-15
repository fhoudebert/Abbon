<script lang="ts">
  import type { Snippet } from 'svelte';
  import { app } from '$lib/app.svelte';
  import { t } from '$lib/i18n/index.svelte';

  /** Affiche le contenu d'administration, ou demande le code PIN s'il y en a un. */
  /** `inline` : formulaire sans titre, à l'intérieur d'une section (Paramètres). */
  let { children, inline = false }: { children: Snippet; inline?: boolean } = $props();

  let pin = $state('');
  let wrong = $state(false);
  let busy = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    busy = true;
    wrong = !(await app.unlockAdmin(pin));
    busy = false;
    pin = '';
  }
</script>

{#if !app.ready}
  <p aria-busy="true">{t('home.loading')}</p>
{:else if app.adminOpen}
  {@render children()}
{:else}
  <form class="panel gate" onsubmit={submit}>
    {#if !inline}<h1>{t('admin.title')}</h1>{/if}
    <p>{t('pin.locked')}</p>
    <label>
      {t('pin.enter')}
      <!-- svelte-ignore a11y_autofocus -->
      <input type="password" inputmode="numeric" autocomplete="off" bind:value={pin} autofocus />
    </label>
    {#if wrong}<p class="error" role="alert">{t('pin.wrong')}</p>{/if}
    <button disabled={busy || pin.length < 4}>{t('pin.unlock')}</button>
  </form>
{/if}

<style>
  .gate {
    max-inline-size: 24rem;
    margin: 2rem auto;
    display: grid;
    gap: 0.75rem;
  }
  label {
    display: grid;
    gap: 0.25rem;
  }
  input {
    min-block-size: var(--tap);
    padding-inline: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    font-size: 1.2rem;
    letter-spacing: 0.3em;
  }
  .error {
    color: var(--bad);
    margin: 0;
  }
</style>

<script lang="ts">
  import { app } from '$lib/app.svelte';
  import { isValidPin } from '$lib/domain/pin';
  import { i18n, t, SUPPORTED } from '$lib/i18n/index.svelte';
  import { languageName } from '$lib/i18n/languages';
  import AdminGate from '$lib/components/AdminGate.svelte';

  let pin = $state('');
  let pin2 = $state('');
  let message = $state<string | null>(null);
  let error = $state<string | null>(null);
  let busy = $state(false);

  async function savePin(e: SubmitEvent) {
    e.preventDefault();
    error = message = null;
    if (!isValidPin(pin)) return (error = t('pin.invalid'));
    if (pin !== pin2) return (error = t('pin.mismatch'));
    busy = true;
    await app.setPin(pin);
    busy = false;
    pin = pin2 = '';
    message = t('common.saved');
  }

  async function removePin() {
    await app.setPin(null);
    message = t('common.saved');
  }
</script>

<h1>{t('settings.title')}</h1>

<section class="panel">
  <label class="row">
    {t('settings.language')}
    <select value={i18n.lang} onchange={(e) => app.changeLang(e.currentTarget.value)}>
      {#each SUPPORTED as code (code)}<option value={code}>{languageName(code)}</option>{/each}
    </select>
  </label>
</section>

<section class="panel">
  <h2>{t('pin.title')}</h2>
  <!-- Modifier le PIN exige d'être déjà déverrouillé. -->
  <AdminGate>
    <p>{app.pinSet ? t('pin.active') : t('pin.none')}</p>
    <form class="pin" onsubmit={savePin}>
      <label>
        {t('pin.new')}
        <input type="password" inputmode="numeric" autocomplete="new-password" bind:value={pin} />
      </label>
      <label>
        {t('pin.confirm')}
        <input type="password" inputmode="numeric" autocomplete="new-password" bind:value={pin2} />
      </label>
      <div class="actions">
        <button disabled={busy || !pin}>{app.pinSet ? t('pin.change') : t('pin.set')}</button>
        {#if app.pinSet}
          <button type="button" class="secondary" onclick={removePin}>{t('pin.remove')}</button>
          <button type="button" class="ghost" onclick={() => app.lockAdmin()}>{t('pin.lock')}</button>
        {/if}
      </div>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
      {#if message}<p class="ok" role="status">{message}</p>{/if}
    </form>
    <p class="muted small">{t('pin.note')}</p>
  </AdminGate>
</section>

<style>
  section {
    margin-block-end: 1rem;
  }
  h2 {
    font-size: 1.1rem;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .pin {
    display: grid;
    gap: 0.75rem;
    max-inline-size: 24rem;
  }
  .pin label {
    display: grid;
    gap: 0.25rem;
  }
  .pin input {
    min-block-size: var(--tap);
    padding-inline: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }
  .error {
    color: var(--bad);
    margin: 0;
  }
  .ok {
    color: var(--ok);
    margin: 0;
  }
  .small {
    font-size: 0.85rem;
  }
  section :global(.gate) {
    margin: 0;
    box-shadow: none;
    border: 0;
    padding: 0;
  }
</style>

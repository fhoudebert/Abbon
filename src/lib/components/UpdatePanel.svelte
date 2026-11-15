<script lang="ts">
  import { isValidServer, releaseNotes } from '$lib/domain/release';
  import { fmtDate, fmtSize, i18n, pct, t } from '$lib/i18n/index.svelte';
  import { updates } from '$lib/update.svelte';

  let serverInput = $state(updates.server);
  let serverError = $state(false);

  $effect(() => {
    serverInput = updates.server;
  });

  async function saveServer() {
    const v = serverInput.trim();
    serverError = !!v && !isValidServer(v);
    if (!serverError && v.replace(/\/+$/, '') !== updates.server) await updates.setServer(v);
  }

  const u = updates;
  const platform = $derived(u.support?.platform ?? '');
  const notes = $derived(u.release ? releaseNotes(u.release, i18n.lang) : '');
</script>

<p>{t('update.current', { version: u.current })}</p>

{#if !u.enabled}
  <p class="muted">{t('update.unavailable')}</p>
{:else}
  <label class="field">
    {t('update.server')}
    <input
      type="url"
      inputmode="url"
      placeholder="https://"
      bind:value={serverInput}
      onchange={saveServer}
      aria-invalid={serverError}
      aria-describedby="server-hint"
    />
    <small id="server-hint" class:error={serverError} class="muted">
      {serverError ? t('update.serverInvalid') : t('update.serverHint')}
    </small>
  </label>

  <label class="check">
    <input type="checkbox" checked={u.auto} onchange={(e) => u.setAuto(e.currentTarget.checked)} />
    {t('update.auto')}
  </label>

  <div class="actions">
    <button class="secondary" disabled={!u.server || u.status === 'checking' || u.status === 'installing'} onclick={() => u.check()}>
      {u.status === 'checking' ? t('update.checking') : t('update.check')}
    </button>
    {#if u.server}
      <button class="ghost" onclick={() => u.openDownloadPage()}>{t('update.page')}</button>
    {/if}
  </div>

  <div role="status" aria-live="polite">
    {#if u.status === 'uptodate'}
      <p class="ok">{t('update.uptodate')}</p>
    {:else if u.status === 'error'}
      <p class="error">{t('update.error', { error: u.error ?? '' })}</p>
    {:else if u.status === 'installError'}
      <p class="error">{t('update.installError', { error: u.error ?? '' })}</p>
    {:else if (u.status === 'available' || u.status === 'installing') && u.release}
      <div class="panel available">
        <p><strong>{t('update.available', { version: u.release.version })}</strong></p>
        {#if notes}
          <p class="muted small">{t('update.notes')}</p>
          <p class="notes">{notes}</p>
        {/if}
        {#if u.status === 'installing'}
          <progress max={u.total ?? undefined} value={u.total ? u.received : undefined}></progress>
          <p class="small">
            {u.total ? t('update.installing', { pct: pct(u.received / u.total) }) : t('update.installingUnknown')}
          </p>
        {:else if u.support?.selfUpdate}
          <button onclick={() => u.install()}>{t('update.install')}</button>
          {#if platform === 'linux'}<p class="muted small">{t('update.linuxHint')}</p>{/if}
        {:else if u.file}
          <button onclick={() => u.install()}>
            {platform === 'android' ? t('update.downloadApk', { size: fmtSize(u.file.size) }) : t('update.download', { size: fmtSize(u.file.size) })}
          </button>
          {#if platform === 'android'}
            <p class="muted small">{t('update.apkHint')}</p>
          {:else}
            <p class="muted small">{t('update.noSelfUpdate')}</p>
          {/if}
        {/if}
      </div>
    {/if}
    {#if u.lastCheck}<p class="muted small">{t('update.lastCheck', { date: fmtDate(u.lastCheck) })}</p>{/if}
  </div>
{/if}

<style>
  .field {
    display: grid;
    gap: 0.25rem;
    max-inline-size: 32rem;
    margin-block-end: 0.75rem;
  }
  .field input {
    min-block-size: var(--tap);
    padding-inline: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }
  .field input[aria-invalid='true'] {
    border-color: var(--bad);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-block-end: 0.75rem;
  }
  .available {
    margin-block: 0.75rem;
    border-color: var(--accent);
  }
  .available p {
    margin-block: 0 0.5rem;
  }
  .notes {
    white-space: pre-wrap;
  }
  progress {
    inline-size: 100%;
    accent-color: var(--accent);
  }
  .ok {
    color: var(--ok);
  }
  .error {
    color: var(--bad);
  }
  .small {
    font-size: 0.85rem;
  }
</style>

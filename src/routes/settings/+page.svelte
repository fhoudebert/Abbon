<script lang="ts">
  import { app } from '$lib/app.svelte';
  import { isValidPin } from '$lib/domain/pin';
  import { i18n, t, SUPPORTED } from '$lib/i18n/index.svelte';
  import { languageName } from '$lib/i18n/languages';
  import AdminGate from '$lib/components/AdminGate.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import UpdatePanel from '$lib/components/UpdatePanel.svelte';
  import { prefs, TEXT_SIZES, THEMES, type TextSize, type Theme } from '$lib/prefs.svelte';
  import { readPicked, saveFile } from '$lib/files';
  import type { MessageKey } from '$lib/i18n/fr';
  import { PackageError, parsePackage, type ParsedPackage } from '$lib/interchange/qcmPackage';
  import { fmtDate } from '$lib/i18n/index.svelte';

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

  // ---- Sauvegarde ----
  let backupMsg = $state<string | null>(null);
  let backupErr = $state<string | null>(null);
  let pending = $state<ParsedPackage | null>(null);
  let restoreDialog: ConfirmDialog;

  async function createBackup() {
    backupMsg = backupErr = null;
    try {
      const date = new Date().toISOString().slice(0, 10);
      const path = await saveFile(`abbon-sauvegarde-${date}.qcm`, await app.exportBackup(), [{ name: 'Abbon', extensions: ['qcm'] }]);
      if (path) backupMsg = t('io.saved', { path });
    } catch (e) {
      backupErr = t('common.error', { error: e instanceof Error ? e.message : String(e) });
    }
  }

  async function pickBackup(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    backupMsg = backupErr = null;
    try {
      const p = await parsePackage(await readPicked(file));
      if (p.manifest.kind !== 'backup') throw new PackageError('not_backup');
      pending = p;
      queueMicrotask(() => restoreDialog.open());
    } catch (err) {
      backupErr = err instanceof PackageError ? t(`import.err.${err.code}` as MessageKey) : String(err);
    }
  }

  async function doRestore() {
    if (!pending) return;
    try {
      const name = await app.autoBackup();
      await app.restore(pending);
      await prefs.load();
      backupMsg = t('backup.restored') + (name ? ` ${t('backup.autoBefore', { name })}` : '');
    } catch (e) {
      backupErr = t('common.error', { error: e instanceof Error ? e.message : String(e) });
    } finally {
      pending = null;
    }
  }

  async function clean() {
    backupMsg = t('backup.cleaned', { n: await app.cleanMedia() });
  }

  async function removePin() {
    await app.setPin(null);
    message = t('common.saved');
  }
</script>

<svelte:head><title>{t('settings.title')} — Abbon</title></svelte:head>

<h1>{t('settings.title')}</h1>

<section class="panel">
  <h2>{t('settings.display')}</h2>
  <label class="row">
    {t('settings.language')}
    <select value={i18n.lang} onchange={(e) => app.changeLang(e.currentTarget.value)}>
      {#each SUPPORTED as code (code)}<option value={code}>{languageName(code)}</option>{/each}
    </select>
  </label>
  <label class="row">
    {t('settings.theme')}
    <select value={prefs.theme} onchange={(e) => prefs.setTheme(e.currentTarget.value as Theme)}>
      {#each THEMES as th (th)}<option value={th}>{t(`settings.theme.${th}`)}</option>{/each}
    </select>
  </label>
  <label class="row">
    {t('settings.textSize')}
    <select value={prefs.textSize} onchange={(e) => prefs.setTextSize(e.currentTarget.value as TextSize)}>
      {#each TEXT_SIZES as sz (sz)}<option value={sz}>{t(`settings.textSize.${sz}`)}</option>{/each}
    </select>
  </label>
  <label class="check">
    <input type="checkbox" checked={app.rewardsSetting} onchange={(e) => app.setShowRewards(e.currentTarget.checked)} />
    <span>{t('settings.rewards')} <span class="muted small">— {t('settings.rewardsHint')}</span></span>
  </label>
</section>

<section class="panel">
  <h2>{t('pin.title')}</h2>
  <!-- Modifier le PIN exige d'être déjà déverrouillé. -->
  <AdminGate inline>
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

<section class="panel" id="updates">
  <h2>{t('update.title')}</h2>
  <UpdatePanel />
</section>

<section class="panel">
  <h2>{t('backup.title')}</h2>
  <AdminGate inline>
    <p>{t('backup.hint')}</p>
    <div class="actions">
      <button onclick={createBackup}>{t('backup.create')}</button>
      <label class="button secondary picker">
        {t('backup.restore')}
        <input type="file" accept=".qcm,application/zip" onchange={pickBackup} />
      </label>
      <button class="ghost" onclick={clean}>{t('backup.clean')}</button>
    </div>
    {#if backupMsg}<p class="ok" role="status">{backupMsg}</p>{/if}
    {#if backupErr}<p class="error" role="alert">{backupErr}</p>{/if}
    <p class="muted small">{t('backup.auto')}</p>
  </AdminGate>
</section>

<ConfirmDialog
  bind:this={restoreDialog}
  title={t('backup.confirm.title')}
  body={pending
    ? t('backup.confirm.body', {
        date: fmtDate(pending.manifest.exportedAt),
        quizzes: pending.quizzes.length,
        attempts: pending.attempts?.length ?? 0,
      })
    : ''}
  confirmLabel={t('backup.confirm.ok')}
  danger
  onconfirm={doRestore}
/>

<style>
  .picker {
    position: relative;
    cursor: pointer;
  }
  .picker input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  section {
    margin-block-end: 1rem;
  }
  h2 {
    font-size: 1.1rem;
  }
  .row + .row {
    margin-block-start: 0.75rem;
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
  .check {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-block-start: 0.75rem;
  }
</style>

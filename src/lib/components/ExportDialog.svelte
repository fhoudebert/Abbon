<script lang="ts">
  import { strToU8 } from 'fflate';
  import { app } from '$lib/app.svelte';
  import { localize } from '$lib/domain/text';
  import type { QuizSummary } from '$lib/domain/types';
  import { fileSafe, saveFile } from '$lib/files';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import { languageName } from '$lib/i18n/languages';

  /** Export d'un QCM (format .qcm ou GIFT) ou de tous les QCM (.qcm). */
  let dialog: HTMLDialogElement;
  let quiz = $state<QuizSummary | null>(null); // null = tous les QCM
  let format = $state<'qcm' | 'gift'>('qcm');
  let solutions = $state(true);
  let lang = $state('fr');
  let busy = $state(false);
  let message = $state<string | null>(null);

  const title = $derived(quiz ? localize(quiz.title, i18n.lang, quiz.languages[0]) || t('admin.untitled') : '');

  export function open(q: QuizSummary | null) {
    quiz = q;
    format = 'qcm';
    solutions = true;
    lang = q?.languages.includes(i18n.lang) ? i18n.lang : (q?.languages[0] ?? i18n.lang);
    message = null;
    dialog.showModal();
  }

  async function run() {
    busy = true;
    message = null;
    try {
      const date = new Date().toISOString().slice(0, 10);
      let path: string | null;
      if (format === 'gift' && quiz) {
        const text = await app.exportGift(quiz.id, lang);
        path = await saveFile(`${fileSafe(title)}.gift`, strToU8(text), [{ name: 'GIFT', extensions: ['gift', 'txt'] }]);
      } else {
        const bytes = await app.exportQcm(quiz ? [quiz.id] : undefined, solutions);
        const name = quiz ? fileSafe(title) : `abbon-qcm-${date}`;
        path = await saveFile(`${name}${solutions ? '' : '-sans-corrige'}.qcm`, bytes, [{ name: 'Abbon', extensions: ['qcm'] }]);
      }
      if (path) {
        message = t('io.saved', { path });
        setTimeout(() => dialog.open && dialog.close(), 1500);
      }
    } catch (e) {
      message = t('common.error', { error: e instanceof Error ? e.message : String(e) });
    } finally {
      busy = false;
    }
  }
</script>

<dialog bind:this={dialog} aria-labelledby="export-title">
  <h2 id="export-title">{quiz ? t('io.export.title', { title }) : t('io.exportAll.title')}</h2>

  {#if quiz}
    <fieldset>
      <legend>{t('io.format')}</legend>
      <label><input type="radio" bind:group={format} value="qcm" /> {t('io.format.qcm')}</label>
      <label><input type="radio" bind:group={format} value="gift" /> {t('io.format.gift')}</label>
    </fieldset>
  {/if}

  {#if format === 'qcm'}
    <label class="check">
      <input type="checkbox" bind:checked={solutions} />
      <span>{t('io.solutions')}<br /><small class="muted">{t('io.solutions.hint')}</small></span>
    </label>
  {:else if quiz && quiz.languages.length > 1}
    <label class="row">
      {t('io.giftLang')}
      <select bind:value={lang}>
        {#each quiz.languages as l (l)}<option value={l}>{languageName(l)}</option>{/each}
      </select>
    </label>
  {/if}

  {#if message}<p class="msg" role="status">{message}</p>{/if}

  <div class="actions">
    <button class="secondary" onclick={() => dialog.close()}>{t('common.cancel')}</button>
    <button disabled={busy} onclick={run}>{t('io.export')}</button>
  </div>
</dialog>

<style>
  dialog {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    inline-size: min(32rem, 92vw);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.4);
  }
  h2 {
    font-size: 1.15rem;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0 0 1rem;
    display: grid;
    gap: 0.5rem;
  }
  legend {
    font-weight: 600;
    margin-block-end: 0.4rem;
  }
  label {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
  }
  .check {
    margin-block: 0.5rem 1rem;
  }
  .row {
    align-items: center;
    margin-block-end: 1rem;
  }
  .msg {
    color: var(--ok);
    overflow-wrap: anywhere;
  }
  .actions {
    justify-content: flex-end;
  }
</style>

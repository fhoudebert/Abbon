<script lang="ts">
  import { strToU8 } from 'fflate';
  import { app } from '$lib/app.svelte';
  import { localize } from '$lib/domain/text';
  import type { QuizSummary } from '$lib/domain/types';
  import { fileSafe, saveFile } from '$lib/files';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import { languageName } from '$lib/i18n/languages';

  /** Export d'un QCM (.qcm, GIFT ou site web) ou de tous les QCM (.qcm ou site web). */
  let dialog: HTMLDialogElement;
  let quiz = $state<QuizSummary | null>(null); // null = tous les QCM
  let format = $state<'qcm' | 'gift' | 'site'>('qcm');
  // Site web : étendue (ce QCM ou tout son module), titre, mode examen.
  let scope = $state<'quiz' | 'module'>('quiz');
  let siteTitle = $state('');
  let examOnly = $state(false);
  let solutionsAtEnd = $state(true);
  const module = $derived(quiz?.moduleId ? app.moduleOf(quiz.moduleId) : undefined);
  const moduleTitle = $derived(module ? localize(module.manifest.title, i18n.lang) : '');
  let solutions = $state(true);
  let lang = $state('fr');
  let busy = $state(false);
  let message = $state<string | null>(null);

  const title = $derived(quiz ? localize(quiz.title, i18n.lang, quiz.languages[0]) || t('admin.untitled') : '');

  export function open(q: QuizSummary | null) {
    quiz = q;
    format = 'qcm';
    scope = 'quiz';
    examOnly = false;
    solutionsAtEnd = true;
    siteTitle = q ? localize(q.title, i18n.lang, q.languages[0]) || t('admin.untitled') : t('io.site.defaultTitle');
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
      if (format === 'site') {
        const ids = quiz ? (scope === 'module' && quiz.moduleId ? app.quizzes.filter((q) => q.moduleId === quiz!.moduleId).map((q) => q.id) : [quiz.id]) : undefined;
        const name = siteTitle.trim() || t('io.site.defaultTitle');
        const bytes = await app.exportSite(ids, { title: name, examOnly, solutionsAtEnd });
        path = await saveFile(`${fileSafe(name, 'abbon-site')}-site.zip`, bytes, [{ name: 'ZIP', extensions: ['zip'] }]);
      } else if (format === 'gift' && quiz) {
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

  <fieldset>
    <legend>{t('io.format')}</legend>
    <label><input type="radio" bind:group={format} value="qcm" /> {t('io.format.qcm')}</label>
    {#if quiz}<label><input type="radio" bind:group={format} value="gift" /> {t('io.format.gift')}</label>{/if}
    <label><input type="radio" bind:group={format} value="site" /> {t('io.format.site')}</label>
  </fieldset>

  {#if format === 'site'}
    <p class="muted small">{t('io.site.hint')}</p>
    {#if module}
      <fieldset>
        <legend>{t('io.site.scope')}</legend>
        <label><input type="radio" bind:group={scope} value="quiz" /> {t('io.site.scope.quiz')}</label>
        <label><input type="radio" bind:group={scope} value="module" /> {t('io.site.scope.module', { title: moduleTitle })}</label>
      </fieldset>
    {/if}
    <label class="field">
      {t('io.site.title')}
      <input type="text" bind:value={siteTitle} maxlength="120" />
    </label>
    <label class="check">
      <input type="checkbox" bind:checked={examOnly} />
      <span>{t('io.site.examOnly')}<br /><small class="muted">{t('io.site.examOnly.hint')}</small></span>
    </label>
    {#if examOnly}
      <label class="check">
        <input type="checkbox" bind:checked={solutionsAtEnd} />
        <span>{t('io.site.solutionsAtEnd')}</span>
      </label>
    {/if}
  {:else if format === 'qcm'}
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
  .field {
    flex-direction: column;
    align-items: stretch;
    gap: 0.3rem;
    margin-block-end: 0.75rem;
  }
  .small {
    font-size: 0.9rem;
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

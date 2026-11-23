<script lang="ts">
  import { goto } from '$app/navigation';
  import { app } from '$lib/app.svelte';
  import AdminGate from '$lib/components/AdminGate.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import ExportDialog from '$lib/components/ExportDialog.svelte';
  import { localize } from '$lib/domain/text';
  import type { InstalledModule, QuizSummary } from '$lib/domain/types';
  import { fmtDate, i18n, t } from '$lib/i18n/index.svelte';

  let toDelete = $state<QuizSummary | null>(null);
  let confirm: ConfirmDialog;
  let exporter: ExportDialog;
  let toUninstall = $state<InstalledModule | null>(null);
  let uninstaller: ConfirmDialog;
  let clearer: ConfirmDialog;
  let cleared = $state<string | null>(null);

  async function clearAll(dropRewards: boolean) {
    const n = app.quizzes.length;
    // Sauvegarde automatique d'abord (application installée) : sans elle, rien n'est retiré.
    let backup: string | null;
    try {
      backup = await app.autoBackup();
    } catch (e) {
      cleared = t('common.error', { error: e instanceof Error ? e.message : String(e) });
      return;
    }
    await app.clearAllQuizzes(dropRewards);
    cleared = [t('admin.clearAll.done', { n }), backup ? t('import.backupDone', { name: backup }) : ''].filter(Boolean).join(' ');
  }

  const lang = $derived(i18n.lang);
  const title = (q: QuizSummary) => localize(q.title, lang, q.languages[0]) || t('admin.untitled');
  const categoryName = (id: string | null) => {
    const c = app.categories.find((c) => c.id === id);
    return c ? localize(c.name, lang) : '';
  };

  async function duplicate(q: QuizSummary) {
    const id = await app.duplicateQuiz(q.id, t('admin.copySuffix'));
    await goto(`/admin/quiz/${id}?copie`);
  }

  const moduleTitle = (m: InstalledModule | undefined | null) => (m ? localize(m.manifest.title, lang) || m.manifest.id : '');
  const countOf = (m: InstalledModule) => app.quizzes.filter((q) => q.moduleId === m.manifest.id);

  function askUninstall(m: InstalledModule) {
    toUninstall = m;
    queueMicrotask(() => uninstaller.open());
  }

  async function uninstall(keepHistory: boolean) {
    if (toUninstall) await app.uninstallModule(toUninstall.manifest.id, keepHistory);
    toUninstall = null;
  }

  function askDelete(q: QuizSummary) {
    toDelete = q;
    // Laisser Svelte mettre à jour le titre avant d'ouvrir.
    queueMicrotask(() => confirm.open());
  }
</script>

<svelte:head><title>{t('admin.title')} — Abbon</title></svelte:head>

<AdminGate>
  <div class="head">
    <h1>{t('admin.title')}</h1>
    <div class="actions">
      <a class="button secondary" href="/admin/categories">{t('admin.categories')}</a>
      <a class="button secondary" href="/admin/import">{t('io.import')}</a>
      <button class="secondary" disabled={!app.quizzes.length} onclick={() => exporter.open(null)}>{t('io.exportAll')}</button>
      <a class="button" href="/admin/quiz/new">{t('admin.newQuiz')}</a>
    </div>
  </div>

  {#if app.modules.length}
    <section aria-labelledby="h-modules" class="modules">
      <h2 id="h-modules">{t('module.title')}</h2>
      <ul class="list">
        {#each app.modules as m (m.manifest.id)}
          {@const quizzes = countOf(m)}
          <li class="panel">
            <div class="info">
              <span class="title">{moduleTitle(m)}</span>
              <span class="muted small">
                {[
                  t('module.version', { version: m.manifest.version }),
                  t('module.quizzes', { n: quizzes.length }),
                  t('quiz.questions', { n: quizzes.reduce((n, q) => n + q.questionCount, 0) }),
                  t('module.license', { license: m.manifest.license }),
                  t('module.installedOn', { date: fmtDate(m.updatedAt) }),
                ].join(' · ')}
              </span>
            </div>
            <span class="status module">{t('module.badge')}</span>
            <div class="actions">
              <button class="ghost danger" onclick={() => askUninstall(m)}>{t('module.uninstall')}</button>
            </div>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if app.quizzes.length === 0}
    <p class="muted">{t('admin.empty')}</p>
  {:else}
    <ul class="list">
      {#each app.quizzes as q (q.id)}
        <li class="panel">
          <div class="info">
            <a class="title" href="/admin/quiz/{q.id}">{title(q)}</a>
            <span class="muted small">
              {[categoryName(q.categoryId), t('quiz.questions', { n: q.questionCount }), t('admin.updated', { date: fmtDate(q.updatedAt) })]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
          {#if q.moduleId}
            <span class="status module" title={t('module.quizOf', { title: moduleTitle(app.moduleOf(q.moduleId)) })}>{t('module.badge')}</span>
            <div class="actions">
              <a class="button secondary" href="/admin/quiz/{q.id}/preview">{t('preview.title')}</a>
              <button class="ghost" onclick={() => exporter.open(q)}>{t('io.export')}</button>
              <button class="ghost" onclick={() => duplicate(q)}>{t('module.duplicateToEdit')}</button>
            </div>
          {:else}
            <span class="status {q.status}">{t(`admin.status.${q.status}`)}</span>
            <div class="actions">
              <a class="button secondary" href="/admin/quiz/{q.id}">{t('common.edit')}</a>
              <button class="ghost" onclick={() => exporter.open(q)}>{t('io.export')}</button>
              <button class="ghost" onclick={() => duplicate(q)}>{t('common.duplicate')}</button>
              <button class="ghost danger" onclick={() => askDelete(q)}>{t('common.delete')}</button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  <!-- Repartir de zéro : tous les QCM, catégories, modules et l'historique, après confirmation. -->
  <section class="danger-zone" aria-labelledby="h-clear">
    <h2 id="h-clear">{t('admin.clearAll.heading')}</h2>
    <p class="muted small">{t('admin.clearAll.hint')}</p>
    {#if cleared}<p role="status">{cleared}</p>{/if}
    <button class="ghost danger" disabled={!app.quizzes.length && !app.modules.length} onclick={() => clearer.open()}>{t('admin.clearAll.button')}</button>
  </section>
</AdminGate>

<ExportDialog bind:this={exporter} />

<ConfirmDialog
  bind:this={confirm}
  title={t('admin.deleteQuiz.title', { title: toDelete ? title(toDelete) : '' })}
  body={t('admin.deleteQuiz.body')}
  confirmLabel={t('common.delete')}
  danger
  onconfirm={async () => {
    if (toDelete) await app.deleteQuiz(toDelete.id);
    toDelete = null;
  }}
/>

<ConfirmDialog
  bind:this={uninstaller}
  title={t('module.uninstall.title', { title: moduleTitle(toUninstall) })}
  body={t('module.uninstall.body')}
  confirmLabel={t('module.uninstall.keep')}
  onconfirm={() => uninstall(true)}
>
  {#snippet extra(close)}
    <button
      class="danger-button"
      onclick={async () => {
        close();
        await uninstall(false);
      }}>{t('module.uninstall.drop')}</button
    >
  {/snippet}
</ConfirmDialog>

<ConfirmDialog
  bind:this={clearer}
  title={t('admin.clearAll.title', { n: app.quizzes.length })}
  body={t('admin.clearAll.body')}
  confirmLabel={t('admin.clearAll.keepPoints')}
  danger
  onconfirm={() => clearAll(false)}
>
  {#snippet extra(close)}
    <button
      class="danger-button"
      onclick={async () => {
        close();
        await clearAll(true);
      }}>{t('admin.clearAll.dropPoints')}</button
    >
  {/snippet}
</ConfirmDialog>

<style>
  .danger-zone {
    margin-block-start: 2.5rem;
    padding-block-start: 1rem;
    border-block-start: 1px solid var(--border);
  }
  .danger-zone h2 {
    font-size: 1.1rem;
  }
  .modules {
    margin-block-end: 1.5rem;
  }
  .modules h2 {
    font-size: 1.1rem;
  }
  .status.module {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .danger-button {
    background: var(--bad);
    border-color: var(--bad);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-block-end: 1rem;
  }
  .head h1 {
    margin: 0;
  }
  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.6rem;
  }
  .list li {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 0.5rem 1rem;
  }
  .info {
    display: grid;
    min-inline-size: 0;
  }
  .title {
    font-weight: 600;
    color: var(--text);
    text-decoration: none;
  }
  .small {
    font-size: 0.85rem;
  }
  .status {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.1em 0.7em;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .status.published {
    color: var(--ok);
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .danger {
    color: var(--bad);
  }
  @media (max-width: 640px) {
    .list li {
      grid-template-columns: 1fr auto;
    }
    .list li .actions {
      grid-column: 1 / -1;
      flex-wrap: nowrap;
      gap: 0;
      justify-content: space-between;
    }
    .list li .actions > * {
      padding-inline: 0.6rem;
    }
  }
</style>

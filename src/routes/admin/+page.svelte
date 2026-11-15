<script lang="ts">
  import { goto } from '$app/navigation';
  import { app } from '$lib/app.svelte';
  import AdminGate from '$lib/components/AdminGate.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import ExportDialog from '$lib/components/ExportDialog.svelte';
  import { localize } from '$lib/domain/text';
  import type { QuizSummary } from '$lib/domain/types';
  import { fmtDate, i18n, t } from '$lib/i18n/index.svelte';

  let toDelete = $state<QuizSummary | null>(null);
  let confirm: ConfirmDialog;
  let exporter: ExportDialog;

  const lang = $derived(i18n.lang);
  const title = (q: QuizSummary) => localize(q.title, lang, q.languages[0]) || t('admin.untitled');
  const categoryName = (id: string | null) => {
    const c = app.categories.find((c) => c.id === id);
    return c ? localize(c.name, lang) : '';
  };

  async function duplicate(q: QuizSummary) {
    const id = await app.duplicateQuiz(q.id, t('admin.copySuffix'));
    await goto(`/admin/quiz/${id}`);
  }

  function askDelete(q: QuizSummary) {
    toDelete = q;
    // Laisser Svelte mettre à jour le titre avant d'ouvrir.
    queueMicrotask(() => confirm.open());
  }
</script>

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
          <span class="status {q.status}">{t(`admin.status.${q.status}`)}</span>
          <div class="actions">
            <a class="button secondary" href="/admin/quiz/{q.id}">{t('common.edit')}</a>
            <button class="ghost" onclick={() => exporter.open(q)}>{t('io.export')}</button>
            <button class="ghost" onclick={() => duplicate(q)}>{t('common.duplicate')}</button>
            <button class="ghost danger" onclick={() => askDelete(q)}>{t('common.delete')}</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
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

<style>
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
    }
  }
</style>

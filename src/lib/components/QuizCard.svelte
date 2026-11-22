<script lang="ts">
  import { to } from '$lib/site';
  import type { QuizEntry } from '$lib/app.svelte';
  import { localize } from '$lib/domain/text';
  import { i18n, pct, t } from '$lib/i18n/index.svelte';

  let { entry }: { entry: QuizEntry } = $props();

  const quiz = $derived(entry.quiz);
  const info = $derived(entry.info);
  const lang = $derived(i18n.lang);
  const fallback = $derived(quiz.languages[0]);

  const action = $derived(
    info.progress === 'in_progress' ? t('quiz.resume') : info.progress === 'done' ? t('quiz.retry') : t('quiz.start'),
  );
  /** Reprendre va directement à la question ; sinon la fiche du QCM (choix du mode). */
  const href = $derived(info.resumable ? `/attempt/${info.resumable.id}` : `/quiz/${quiz.id}`);
  const ratio = (score?: number) => (info.maxScore ? (score ?? 0) / info.maxScore : 0);
</script>

<article class="card">
  {#if entry.category}
    <p class="category">{localize(entry.category.name, lang)}</p>
  {/if}
  <h3 lang={quiz.title[lang] ? lang : fallback}>
    <a class="title" href={to(`/quiz/${quiz.id}`)}>{localize(quiz.title, lang, fallback)}</a>
  </h3>
  {#if quiz.description}
    <p class="desc">{localize(quiz.description, lang, fallback)}</p>
  {/if}

  <p class="meta">
    <span>{t('quiz.questions', { n: quiz.questionCount })}</span>
    {#if info.progress === 'done' || info.lastScore !== undefined}
      <span>{t('quiz.lastScore', { score: pct(ratio(info.lastScore)) })}</span>
      <span>{t('quiz.bestScore', { score: pct(ratio(info.bestScore)) })}</span>
    {/if}
  </p>

  <a class="button {info.progress === 'done' ? 'secondary' : ''}" href={href}>{action}</a>
</article>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .category {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--accent);
  }
  h3 {
    margin: 0;
    font-size: 1.1rem;
  }
  .desc {
    margin: 0;
    color: var(--muted);
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    margin: 0.25rem 0 0.75rem;
    font-size: 0.9rem;
    color: var(--muted);
  }
  .button {
    align-self: flex-start;
    margin-block-start: auto;
  }
  .title {
    color: inherit;
    text-decoration: none;
  }
  .title:hover {
    text-decoration: underline;
  }
</style>

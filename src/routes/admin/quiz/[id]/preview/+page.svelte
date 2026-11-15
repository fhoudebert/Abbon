<script lang="ts">
  import { page } from '$app/state';
  import { app } from '$lib/app.svelte';
  import AdminGate from '$lib/components/AdminGate.svelte';
  import { localize } from '$lib/domain/text';
  import type { Quiz } from '$lib/domain/types';
  import { pick } from '$lib/domain/rich';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import { languageName } from '$lib/i18n/languages';
  import RichContent from '$lib/rich/RichContent.svelte';

  /** Le QCM tel que l'apprenant le verra (sans mélange), avec les réponses à la demande. */
  const id = $derived(page.params.id ?? '');
  let quiz = $state<Quiz | null | undefined>(undefined);
  let lang = $state('fr');
  let showAnswers = $state(false);

  $effect(() => {
    const quizId = id;
    app
      .repo()
      .then((r) => r.getQuiz(quizId))
      .then((q) => {
        if (q) {
          q.questions.sort((a, b) => a.position - b.position);
          lang = q.languages.includes(i18n.lang) ? i18n.lang : q.languages[0];
        }
        quiz = q;
      });
  });

  const main = $derived(quiz?.languages[0] ?? 'fr');
</script>

<AdminGate>
  {#if quiz === undefined}
    <p aria-busy="true">{t('home.loading')}</p>
  {:else if quiz === null}
    <p>{t('quiz.notFound')}</p>
  {:else}
    <a class="back" href="/admin/quiz/{quiz.id}">← {t('common.edit')}</a>
    <div class="head">
      <h1>{t('preview.title')} — {localize(quiz.title, lang, main) || t('admin.untitled')}</h1>
      <div class="actions">
        {#if quiz.languages.length > 1}
          <select bind:value={lang} aria-label={t('qe.editLang')}>
            {#each quiz.languages as l (l)}<option value={l}>{languageName(l)}</option>{/each}
          </select>
        {/if}
        <label class="toggle"><input type="checkbox" bind:checked={showAnswers} /> {t('preview.showAnswers')}</label>
      </div>
    </div>
    {#if quiz.status === 'draft'}<p class="note">{t('preview.draftNote')}</p>{/if}

    {#each quiz.questions as q, i (q.id)}
      <article class="panel q">
        <p class="muted">
          {t('play.questionOf', { n: i + 1, total: quiz.questions.length })} ·
          {q.type === 'single' ? t('play.single') : t('play.multiple')}
        </p>
        <div class="prompt" lang={q.prompt[lang] ? lang : main}><RichContent value={pick(q.prompt, lang, main)} /></div>
        <ul class="choices">
          {#each [...q.choices].sort((a, b) => a.position - b.position) as c (c.id)}
            <li class:correct={showAnswers && c.correct}>
              <input type={q.type === 'single' ? 'radio' : 'checkbox'} name="p-{q.id}" aria-hidden="true" tabindex="-1" />
              <div lang={c.content[lang] ? lang : main}><RichContent value={pick(c.content, lang, main)} inline /></div>
            </li>
          {/each}
        </ul>
        {#if showAnswers && q.explanation && pick(q.explanation, lang, main)}
          <div class="explanation">
            <strong>{t('play.explanation')} :</strong>
            <RichContent value={pick(q.explanation, lang, main)} />
          </div>
        {/if}
      </article>
    {/each}
  {/if}
</AdminGate>

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
  .head h1 {
    font-size: 1.3rem;
    margin: 0;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .note {
    color: var(--warn);
  }
  .q {
    margin-block: 1rem;
  }
  .q > p {
    margin-block-start: 0;
  }
  .prompt {
    font-size: 1.1rem;
    font-weight: 600;
    margin-block-end: 0.75rem;
  }
  .choices {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.4rem;
  }
  .choices li {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.5rem 0.8rem;
    border: 2px solid var(--border);
    border-radius: 10px;
  }
  .choices li.correct {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .explanation {
    margin-block-start: 0.75rem;
    padding: 0.6rem 0.9rem;
    border-inline-start: 4px solid var(--accent);
    background: var(--accent-soft);
    border-radius: 8px;
  }
</style>

<script lang="ts">
  /**
   * Nouvelle carte personnelle : une question saisie ici rejoint le QCM « Mes cartes de révision » et entre
   * au compartiment 1 de la boîte, après les cartes déjà saisies (lot 16).
   */
  import { goto } from '$app/navigation';
  import { app } from '$lib/app.svelte';
  import QuestionEditor from '$lib/components/QuestionEditor.svelte';
  import { newQuestion, newQuiz } from '$lib/domain/factory';
  import type { Lang, QuestionType } from '$lib/domain/types';
  import { validateQuiz } from '$lib/domain/validate';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import { languageName } from '$lib/i18n/languages';
  import { flushEdits } from '$lib/rich/pending';

  /** Types utiles pour une carte : recto-verso d'abord. */
  const TYPES: QuestionType[] = ['flashcard', 'short', 'numeric', 'expression', 'single'];

  const lang = $derived(i18n.lang as Lang);
  let question = $state(newQuestion('flashcard', 0));
  let errors = $state<string[]>([]);
  let saved = $state(0);
  let busy = $state(false);
  let errorBox = $state<HTMLElement | null>(null);

  async function save(another: boolean) {
    if (busy) return;
    // Dernières frappes comprises (un clic ne retire pas le focus de l'éditeur sous WebKit) ; sans cela,
    // l'éditeur détruit au passage à la carte suivante y écrirait la fin de la saisie précédente.
    flushEdits();
    const draft = { ...newQuiz(lang), title: { [lang]: '—' }, questions: [$state.snapshot(question)] };
    const problems = validateQuiz(draft).filter((i) => i.level === 'error' && i.questionNumber);
    if (problems.length) {
      errors = problems.map((i) => t(`issue.${i.code}`, { n: 1, lang: i.lang ? languageName(i.lang) : languageName(lang), detail: i.detail ?? '' }));
      queueMicrotask(() => errorBox?.focus());
      return;
    }
    busy = true;
    try {
      await app.addCustomCard(question);
      errors = [];
      if (another) {
        saved++;
        question = newQuestion(question.type, 0);
      } else await goto('/leitner');
    } finally {
      busy = false;
    }
  }
</script>

<h1>{t('custom.title')}</h1>
<p class="muted">{t('custom.intro')}</p>

{#if errors.length}
  <div class="panel error-box" role="alert" tabindex="-1" bind:this={errorBox}>
    <ul>
      {#each errors as e (e)}<li>{e}</li>{/each}
    </ul>
  </div>
{/if}
{#if saved}<p class="saved" role="status">{t('custom.saved')}</p>{/if}

{#key question.id}
  <div class="panel">
    <QuestionEditor bind:question number={1} {lang} types={TYPES} showPoints={false} />
  </div>
{/key}

<div class="actions">
  <a class="button secondary" href="/leitner">{t('common.cancel')}</a>
  <button class="secondary" disabled={busy} onclick={() => save(true)}>{t('custom.saveNext')}</button>
  <button disabled={busy} onclick={() => save(false)}>{t('custom.save')}</button>
</div>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-block: 1rem;
  }
  .error-box {
    border-color: var(--bad);
  }
  .error-box ul {
    margin: 0;
    padding-inline-start: 1.2rem;
  }
  .saved {
    font-weight: 600;
    color: var(--ok);
  }
</style>

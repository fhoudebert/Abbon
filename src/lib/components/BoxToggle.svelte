<script lang="ts">
  import { app } from '$lib/app.svelte';
  import type { Question, Quiz } from '$lib/domain/types';
  import { t } from '$lib/i18n/index.svelte';

  /** Met une question dans la boîte de révision (Leitner), ou l'en retire. */
  let { quiz, question }: { quiz: Pick<Quiz, 'id' | 'title' | 'languages'>; question: Question } = $props();
  const inBox = $derived(app.inBox(question.id));
</script>

<button class="ghost box" aria-pressed={inBox} title={t('leitner.toggleHint')} onclick={() => app.toggleCard(quiz, question)}>
  <span aria-hidden="true">{inBox ? '▣' : '▢'}</span>
  {t('leitner.toggle')}
</button>

<style>
  .box {
    white-space: nowrap;
  }
  .box[aria-pressed='true'] {
    color: var(--accent);
    font-weight: 600;
  }
</style>

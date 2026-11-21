<script lang="ts">
  import ClozeText from '$lib/components/ClozeText.svelte';
  import { gapResults } from '$lib/domain/cloze';
  import { isCorrect } from '$lib/domain/leitner';
  import { mathLabel, pick } from '$lib/domain/rich';
  import { isAnswered, shuffled } from '$lib/domain/session';
  import { expectedText, FLASH_KNOWN, FLASH_UNKNOWN, isTyped } from '$lib/domain/typed';
  import type { Question } from '$lib/domain/types';
  import { t } from '$lib/i18n/index.svelte';
  import RichContent from '$lib/rich/RichContent.svelte';
  import MathInput from '$lib/rich/MathInput.svelte';
  import { renderMath } from '$lib/rich/math';

  /**
   * Une question seule, avec correction immédiate : répondre, valider, lire le corrigé, continuer.
   * Sert à la révision (boîte de Leitner), hors de toute tentative. L'état est remis à zéro par
   * le parent avec {#key}.
   */
  let {
    question,
    lang,
    fallback,
    seed,
    nextLabel,
    onresult,
    onnext,
  }: {
    question: Question;
    lang: string;
    fallback?: string;
    /** Graine du mélange des réponses. */
    seed: string;
    nextLabel: string;
    /** Appelé une fois, à la validation. */
    onresult: (correct: boolean) => void;
    onnext: () => void;
  } = $props();

  let selected = $state<string[]>([]);
  let text = $state('');
  let texts = $state<string[]>([]);
  let correct = $state<boolean | null>(null);
  let nextButton = $state<HTMLButtonElement | null>(null);
  /** Recto-verso : la carte est-elle retournée ? */
  let flipped = $state(false);
  let knewButton = $state<HTMLButtonElement | null>(null);

  function flip() {
    flipped = true;
    queueMicrotask(() => knewButton?.focus());
  }

  /** Recto-verso : l'élève dit s'il savait. */
  function grade(knew: boolean) {
    text = knew ? FLASH_KNOWN : FLASH_UNKNOWN;
    validate();
  }

  const checked = $derived(correct !== null);
  const choices = $derived(shuffled([...question.choices].sort((a, b) => a.position - b.position), seed));
  const answered = $derived(isAnswered({ selected, text, texts }));

  function choose(id: string) {
    if (checked) return;
    if (question.type === 'single') selected = [id];
    else selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
  }

  function validate() {
    if (checked || !answered) return;
    correct = isCorrect(question, { selected, text, texts });
    onresult(correct);
    queueMicrotask(() => nextButton?.focus());
  }

  function choiceState(id: string, isRight: boolean) {
    if (!checked) return '';
    if (isRight) return 'is-correct';
    return selected.includes(id) ? 'is-wrong' : '';
  }

  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Enter' || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.target as HTMLElement | null)?.closest('button, a, select, textarea')) return;
    e.preventDefault();
    if (checked) onnext();
    else if (question.type === 'flashcard' && !flipped) flip();
    else validate();
  }

  function focusIfDesktop(node: HTMLInputElement) {
    if (!matchMedia('(pointer: coarse)').matches) node.focus();
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="prompt" id="lp-{question.id}" lang={question.prompt[lang] ? lang : fallback}>
  <RichContent value={pick(question.prompt, lang, fallback)} />
</div>
<p class="hint muted">{t(`play.${question.type}`)}</p>

{#if question.type === 'cloze'}
  <ClozeText
    {question}
    {lang}
    {fallback}
    values={texts}
    locked={checked}
    results={checked ? gapResults(question, texts) : null}
    {seed}
    labelledby="lp-{question.id}"
    onchange={(i, v) => {
      const next = Array.from({ length: question.expected?.gaps?.length ?? 0 }, (_, k) => texts[k] ?? '');
      next[i] = v;
      texts = next;
    }}
  />
{:else if question.type === 'flashcard'}
  {#if flipped}
    <section class="back" aria-labelledby="lp-back-{question.id}" lang={question.explanation?.[lang] ? lang : fallback}>
      <h3 id="lp-back-{question.id}" class="muted">{t('play.back')}</h3>
      <RichContent value={pick(question.explanation ?? {}, lang, fallback)} />
    </section>
  {/if}
{:else if question.type === 'expression'}
  <div class="typed expr" class:is-correct={correct === true} class:is-wrong={correct === false}>
    <MathInput
      value={text}
      readonly={checked}
      label={t('play.yourAnswer')}
      describedby="lp-{question.id}"
      autofocus
      oninput={(v) => (text = v)}
      onenter={() => (checked ? onnext() : validate())}
    />
    {#if question.expected?.constant}<p class="muted hint">{t('play.constant')}</p>{/if}
  </div>
{:else if isTyped(question)}
  <label class="typed" class:is-correct={correct === true} class:is-wrong={correct === false}>
    <span class="visually-hidden">{t('play.yourAnswer')}</span>
    <input
      type="text"
      inputmode={question.type === 'numeric' ? 'decimal' : 'text'}
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      aria-describedby="lp-{question.id}"
      placeholder={t('play.yourAnswer')}
      readonly={checked}
      bind:value={text}
      {@attach focusIfDesktop}
    />
    {#if question.type === 'numeric' && question.expected?.unit}<span class="unit">{question.expected.unit}</span>{/if}
  </label>
{:else}
  <div class="choices" role={question.type === 'single' ? 'radiogroup' : 'group'} aria-labelledby="lp-{question.id}">
    {#each choices as choice (choice.id)}
      <label class="choice {choiceState(choice.id, choice.correct)}" class:locked={checked}>
        <input
          type={question.type === 'single' ? 'radio' : 'checkbox'}
          name="lp-{question.id}"
          disabled={checked}
          aria-label={mathLabel(pick(choice.content, lang, fallback))}
          checked={selected.includes(choice.id)}
          onchange={() => choose(choice.id)}
        />
        <span class="text" lang={choice.content[lang] ? lang : fallback}><RichContent value={pick(choice.content, lang, fallback)} inline /></span>
      </label>
    {/each}
  </div>
{/if}

{#if checked}
  <div class="feedback {correct ? 'ok' : 'ko'}" role="status">
    {#if question.type === 'flashcard'}
      <strong>{correct ? t('play.knewDone') : t('play.toReviewDone')}</strong>
    {:else}
    <strong>{correct ? t('play.correct') : t('play.wrong')}</strong>
    {#if question.type === 'expression' && !correct}
      <p class="expected">{@html t('play.expected', { answer: renderMath(expectedText(question, lang)) })}</p>
    {:else if isTyped(question) && question.type !== 'cloze' && !correct}<p class="expected">{t('play.expected', { answer: expectedText(question, lang) })}</p>{/if}
    {#if question.explanation}
      <div class="expl"><span class="muted">{t('play.explanation')} :</span> <RichContent value={pick(question.explanation, lang, fallback)} /></div>
    {/if}
    {/if}
  </div>
{/if}

<div class="nav">
  {#if checked}
    <button bind:this={nextButton} onclick={onnext}>{nextLabel}</button>
  {:else if question.type === 'flashcard'}
    {#if flipped}
      <button class="secondary" onclick={() => grade(false)}>{t('play.toReview')}</button>
      <button bind:this={knewButton} onclick={() => grade(true)}>{t('play.knew')}</button>
    {:else}
      <button onclick={flip}>{t('play.flip')}</button>
    {/if}
  {:else}
    <button disabled={!answered} onclick={validate}>{t('play.validate')}</button>
  {/if}
</div>

<style>
  .prompt {
    font-size: 1.15rem;
    font-weight: 600;
  }
  .hint {
    font-size: 0.9rem;
    margin-block: 0.25rem 0.75rem;
  }
  .choices {
    display: grid;
    gap: 0.5rem;
  }
  .choice {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-block-size: var(--tap);
    padding: 0.6rem 0.9rem;
    border: 2px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    background: var(--surface);
  }
  .choice:has(input:checked) {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .choices .choice.is-correct {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .choices .choice.is-wrong {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .choice.locked {
    cursor: default;
  }
  .choice input {
    inline-size: 1.2rem;
    block-size: 1.2rem;
    accent-color: var(--accent);
    flex: none;
  }
  .text {
    flex: 1;
  }
  .typed {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .typed input {
    flex: 1 1 auto;
    min-inline-size: 0;
    max-inline-size: 28rem;
    min-block-size: var(--tap);
    padding: 0.5rem 0.9rem;
    font: inherit;
    font-size: 1.1rem;
    color: var(--text);
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: 10px;
  }
  .typed.is-correct input {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .typed.is-wrong input {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .feedback {
    margin-block-start: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border-inline-start: 4px solid;
  }
  .feedback .expl {
    margin-block: 0.4rem 0;
  }
  .feedback.ok {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .feedback.ko {
    border-color: var(--bad);
    background: var(--bad-soft);
  }
  .expected {
    margin-block: 0.35rem 0;
    font-weight: 600;
  }
  .nav {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-block-start: 1rem;
  }
  .typed.expr {
    flex-direction: column;
    align-items: stretch;
  }
  .typed.expr.is-correct :global(.math-input) {
    border-color: var(--ok);
    box-shadow: 0 0 0 1px var(--ok);
  }
  .typed.expr.is-wrong :global(.math-input) {
    border-color: var(--bad);
    box-shadow: 0 0 0 1px var(--bad);
  }
  .typed.expr .hint {
    margin: 0;
    font-size: 0.9rem;
  }
  .back {
    border: 1px solid var(--border);
    border-inline-start: 4px solid var(--accent);
    border-radius: var(--radius);
    padding: 0.5rem 1rem;
    margin-block: 0.75rem;
  }
  .back h3 {
    margin: 0 0 0.25rem;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
</style>

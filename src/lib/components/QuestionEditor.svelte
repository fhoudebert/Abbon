<script lang="ts">
  import { tick } from 'svelte';
  import { move, newChoice, renumber, setQuestionType, toggleCorrect } from '$lib/domain/factory';
  import { removeMarker } from '$lib/domain/cloze';
  import { parseNumber } from '$lib/domain/typed';
  import type { ClozeGap, ExpectedAnswer, Question, QuestionType, RichDoc } from '$lib/domain/types';
  import { t } from '$lib/i18n/index.svelte';
  import RichEditor from '$lib/rich/RichEditor.svelte';
  import MathFieldDialog from '$lib/rich/MathFieldDialog.svelte';
  import { renderMath } from '$lib/rich/math';
  import { expressionProblem } from '$lib/domain/expr';

  /** Édition d'une question dans une langue donnée. */
  let {
    question = $bindable(),
    number,
    lang,
  }: { question: Question; number: number; lang: string } = $props();

  /** Réponse à mettre au point après « Entrée » (nouvelle réponse). */
  let focusChoice = $state<string | null>(null);

  const setPrompt = (doc: RichDoc) => (question.prompt = { ...question.prompt, [lang]: doc });
  const setExplanation = (doc: RichDoc) => (question.explanation = { ...(question.explanation ?? {}), [lang]: doc });

  async function addChoice(after?: number) {
    const c = newChoice(0);
    const at = after === undefined ? question.choices.length : after + 1;
    question.choices.splice(at, 0, c);
    renumber(question.choices);
    focusChoice = c.id;
    await tick();
  }

  const TYPES: QuestionType[] = ['single', 'multiple', 'short', 'numeric', 'cloze', 'expression'];

  // ---- Réponse attendue (réponse courte, réponse numérique) ----------------
  const expected = $derived<ExpectedAnswer>(question.expected ?? {});
  const accepted = $derived(expected.accepted?.length ? expected.accepted : ['']);
  const patchExpected = (p: Partial<ExpectedAnswer>) => (question.expected = { ...expected, ...p });

  // ---- Expression -----------------------------------------------------------
  let mathDialog = $state<MathFieldDialog>();
  const exprProblem = $derived(
    question.type === 'expression' && expected.latex?.trim() ? expressionProblem(expected.latex, { constant: expected.constant }) : null,
  );

  const setAccepted = (i: number, v: string) => patchExpected({ accepted: accepted.map((a, k) => (k === i ? v : a)) });
  /** Champ numérique libre (virgule acceptée) → nombre, ou champ vidé si illisible. */
  function setNumber(key: 'value' | 'tolerance', input: HTMLInputElement) {
    const n = parseNumber(input.value);
    if (n === null) {
      const { [key]: _removed, ...rest } = expected;
      question.expected = key === 'tolerance' ? { ...rest, tolerance: 0 } : rest;
      input.value = '';
    } else patchExpected({ [key]: key === 'tolerance' ? Math.abs(n) : n });
  }
  const shown = (n: number | undefined) => (typeof n === 'number' ? String(n).replace('.', lang === 'fr' ? ',' : '.') : '');

  // ---- Texte à trous -----------------------------------------------------
  const gaps = $derived<ClozeGap[]>(expected.gaps ?? []);
  const clozeText = $derived(expected.text?.[lang] ?? '');
  let clozeArea = $state<HTMLTextAreaElement | null>(null);
  const setClozeText = (v: string) => patchExpected({ text: { ...(expected.text ?? {}), [lang]: v } });
  const patchGap = (i: number, p: Partial<ClozeGap>) => patchExpected({ gaps: gaps.map((g, k) => (k === i ? { ...g, ...p } : g)) });
  const list = (v: string) => v.split('|').map((x) => x.trim()).filter(Boolean);

  /** Ajoute un trou et son repère « {{n}} » à l'endroit du curseur, dans le texte de la langue en cours. */
  async function insertGap() {
    const marker = `{{${gaps.length + 1}}}`;
    const at = clozeArea?.selectionStart ?? clozeText.length;
    const end = clozeArea?.selectionEnd ?? at;
    question.expected = {
      ...expected,
      text: { ...(expected.text ?? {}), [lang]: clozeText.slice(0, at) + marker + clozeText.slice(end) },
      gaps: [...gaps, { kind: 'text', accepted: [] }],
    };
    await tick();
    clozeArea?.focus();
    clozeArea?.setSelectionRange(at + marker.length, at + marker.length);
  }

  /** Supprime un trou : son repère disparaît de chaque langue et les suivants sont renumérotés. */
  function removeGap(i: number) {
    question.expected = {
      ...expected,
      text: Object.fromEntries(Object.entries(expected.text ?? {}).map(([l, v]) => [l, removeMarker(v, i)])),
      gaps: gaps.filter((_, k) => k !== i),
    };
  }

  function removeChoice(i: number) {
    question.choices.splice(i, 1);
    renumber(question.choices);
  }
</script>

<div class="qe">
  <div class="row">
    <h2>{t('qe.question', { n: number })}</h2>
    <fieldset class="type">
      <legend class="visually-hidden">{t('qe.type')}</legend>
      {#each TYPES as type (type)}
        <label>
          <input type="radio" name="type-{question.id}" checked={question.type === type} onchange={() => setQuestionType(question, type)} />
          {t(`qe.type.${type}`)}
        </label>
      {/each}
    </fieldset>
    <label class="points">
      {t('qe.points')}
      <input type="number" min="0.5" step="0.5" bind:value={question.points} />
    </label>
  </div>

  <div class="field">
    <span class="label">{t('qe.prompt')}</span>
    {#key `${question.id}:${lang}`}
      <RichEditor value={question.prompt[lang]} onchange={setPrompt} label={t('qe.prompt')} {lang} />
    {/key}
  </div>

  {#if question.type === 'short'}
    <div class="field">
      <span class="label">{t('qe.accepted')}</span>
      <p class="hint muted">{t('qe.acceptedHint')}</p>
      <ol class="accepted">
        {#each accepted as a, i (i)}
          <li>
            <input type="text" value={a} aria-label={t('qe.acceptedN', { n: i + 1 })} autocomplete="off" spellcheck="false" oninput={(e) => setAccepted(i, e.currentTarget.value)} />
            <button
              type="button"
              class="ghost danger"
              aria-label={t('common.delete')}
              title={t('common.delete')}
              disabled={accepted.length === 1}
              onclick={() => patchExpected({ accepted: accepted.filter((_, k) => k !== i) })}>✕</button
            >
          </li>
        {/each}
      </ol>
      <div class="row">
        <button type="button" class="secondary" onclick={() => patchExpected({ accepted: [...accepted, ''] })}>{t('qe.addAccepted')}</button>
        <label class="check">
          <input type="checkbox" checked={expected.caseSensitive ?? false} onchange={(e) => patchExpected({ caseSensitive: e.currentTarget.checked })} />
          {t('qe.caseSensitive')}
        </label>
      </div>
    </div>
  {:else if question.type === 'cloze'}
    <div class="field">
      <label class="label" for="cloze-{question.id}">{t('qe.clozeText')}</label>
      <p class="hint muted">{t('qe.clozeHint')}</p>
      {#key lang}
        <textarea id="cloze-{question.id}" bind:this={clozeArea} rows="4" {lang} spellcheck="true" value={clozeText} oninput={(e) => setClozeText(e.currentTarget.value)}></textarea>
      {/key}
      <div class="row"><button type="button" class="secondary" onclick={insertGap}>{t('qe.insertGap')}</button></div>
    </div>
    <div class="field">
      <span class="label">{t('qe.gaps')}</span>
      {#if gaps.length === 0}<p class="muted">{t('qe.noGap')}</p>{/if}
      <ol class="gaps">
        {#each gaps as g, i (i)}
          <li>
            <strong>{t('qe.gap', { n: i + 1 })}</strong>
            <select aria-label={t('qe.gapKind', { n: i + 1 })} value={g.kind} onchange={(e) => patchGap(i, { kind: e.currentTarget.value as ClozeGap['kind'], accepted: g.accepted.slice(0, e.currentTarget.value === 'select' ? 1 : undefined) })}>
              <option value="text">{t('qe.gapKind.text')}</option>
              <option value="select">{t('qe.gapKind.select')}</option>
            </select>
            {#if g.kind === 'select'}
              <label>{t('qe.gapAnswer')} <input type="text" value={g.accepted[0] ?? ''} onchange={(e) => patchGap(i, { accepted: list(e.currentTarget.value).slice(0, 1) })} /></label>
              <label>{t('qe.gapOptions')} <input type="text" value={(g.options ?? []).join(' | ')} onchange={(e) => patchGap(i, { options: list(e.currentTarget.value) })} /></label>
            {:else}
              <label>{t('qe.gapAccepted')} <input type="text" value={g.accepted.join(' | ')} onchange={(e) => patchGap(i, { accepted: list(e.currentTarget.value) })} /></label>
              <label class="check"><input type="checkbox" checked={g.caseSensitive ?? false} onchange={(e) => patchGap(i, { caseSensitive: e.currentTarget.checked })} /> {t('qe.caseSensitive')}</label>
            {/if}
            <button type="button" class="ghost danger" aria-label={t('qe.gapDelete', { n: i + 1 })} title={t('qe.gapDelete', { n: i + 1 })} onclick={() => removeGap(i)}>✕</button>
          </li>
        {/each}
      </ol>
    </div>
  {:else if question.type === 'expression'}
    <div class="field">
      <label class="label" for="expr-{question.id}">{t('qe.expected')}</label>
      <p class="hint muted" id="expr-hint-{question.id}">{t('qe.expressionHint')}</p>
      <div class="row expr">
        <input
          id="expr-{question.id}"
          class="mono"
          type="text"
          autocomplete="off"
          spellcheck="false"
          aria-describedby="expr-hint-{question.id}"
          value={expected.latex ?? ''}
          oninput={(e) => patchExpected({ latex: e.currentTarget.value })}
        />
        <button type="button" class="secondary" onclick={() => mathDialog?.open(expected.latex ?? '', false, (latex) => patchExpected({ latex }))}>
          {t('editor.mathVisual')}
        </button>
      </div>
      {#if expected.latex?.trim()}
        <p class="expr-preview">
          <span class="muted">{t('editor.mathPreview')} :</span>
          {@html renderMath(expected.constant ? `${expected.latex} + C` : expected.latex)}
        </p>
      {/if}
      {#if exprProblem}<p class="error" role="status">{t('qe.expressionProblem', { detail: exprProblem })}</p>{/if}
      <label class="check">
        <input type="checkbox" checked={expected.constant ?? false} onchange={(e) => patchExpected({ constant: e.currentTarget.checked || undefined })} />
        {t('qe.expressionConstant')}
      </label>
      <MathFieldDialog bind:this={mathDialog} />
    </div>
  {:else if question.type === 'numeric'}
    <div class="field">
      <span class="label">{t('qe.expected')}</span>
      <p class="hint muted">{t('qe.numericHint')}</p>
      <div class="row numeric">
        <label>{t('qe.value')} <input type="text" inputmode="decimal" value={shown(expected.value)} onchange={(e) => setNumber('value', e.currentTarget)} /></label>
        <label>{t('qe.tolerance')} <input type="text" inputmode="decimal" value={shown(expected.tolerance)} onchange={(e) => setNumber('tolerance', e.currentTarget)} /></label>
        <label>{t('qe.unit')} <input type="text" value={expected.unit ?? ''} maxlength="30" oninput={(e) => patchExpected({ unit: e.currentTarget.value.trim() || null })} /></label>
      </div>
    </div>
  {:else}
  <div class="field">
    <span class="label">{t('qe.choices')}</span>
    <p class="hint muted">{t('qe.choiceHint')}</p>
    <ol class="choices">
      {#each question.choices as c, i (c.id)}
        <li class:correct={c.correct}>
          <label class="ok" title={t('qe.correct')}>
            <input
              type={question.type === 'single' ? 'radio' : 'checkbox'}
              name="correct-{question.id}"
              checked={c.correct}
              onchange={() => toggleCorrect(question, c.id)}
              aria-label={t('qe.correct')}
            />
          </label>
          <div class="choice-editor">
            {#key `${c.id}:${lang}`}
              <RichEditor
                compact
                value={c.content[lang]}
                onchange={(doc) => (c.content = { ...c.content, [lang]: doc })}
                onenter={() => addChoice(i)}
                label={t('qe.choice', { n: i + 1 })}
                {lang}
                autofocus={focusChoice === c.id}
              />
            {/key}
          </div>
          <div class="tools">
            <button type="button" class="ghost" aria-label={t('common.moveUp')} title={t('common.moveUp')} disabled={i === 0} onclick={() => move(question.choices, i, -1)}>↑</button>
            <button type="button" class="ghost" aria-label={t('common.moveDown')} title={t('common.moveDown')} disabled={i === question.choices.length - 1} onclick={() => move(question.choices, i, 1)}>↓</button>
            <button type="button" class="ghost danger" aria-label={t('common.delete')} title={t('common.delete')} onclick={() => removeChoice(i)}>✕</button>
          </div>
        </li>
      {/each}
    </ol>
    <button type="button" class="secondary" onclick={() => addChoice()}>{t('qe.addChoice')}</button>
  </div>
  {/if}

  <div class="field">
    <span class="label">{t('qe.explanation')}</span>
    {#key `${question.id}:${lang}:expl`}
      <RichEditor value={question.explanation?.[lang]} onchange={setExplanation} label={t('qe.explanation')} {lang} />
    {/key}
  </div>
</div>

<style>
  .qe {
    display: grid;
    gap: 1.1rem;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1.25rem;
  }
  h2 {
    margin: 0;
    font-size: 1.15rem;
    margin-inline-end: auto;
  }
  textarea {
    inline-size: 100%;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
    resize: vertical;
  }
  .gaps {
    display: grid;
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .gaps li {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 0.5rem 1rem;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .gaps strong {
    align-self: center;
  }
  .gaps label:not(.check) {
    display: grid;
    gap: 0.2rem;
    flex: 1 1 14rem;
    font-size: 0.9rem;
  }
  .gaps input[type='text'],
  .gaps select {
    min-block-size: 2.4rem;
    padding-inline: 0.6rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
  }
  .accepted {
    display: grid;
    gap: 0.4rem;
    margin: 0;
    padding-inline-start: 1.5rem;
  }
  .accepted li {
    padding-inline-start: 0.25rem;
  }
  .accepted li::marker {
    color: var(--muted);
  }
  .accepted li > input,
  .numeric input {
    min-block-size: 2.4rem;
    padding-inline: 0.6rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font: inherit;
  }
  .accepted li > input {
    inline-size: min(100%, 24rem);
  }
  .numeric label {
    display: grid;
    gap: 0.2rem;
  }
  .numeric input {
    inline-size: 9rem;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .type {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    border: 0;
    padding: 0;
    margin: 0;
  }
  .type label,
  .points {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .points input {
    inline-size: 5rem;
    min-block-size: 2.2rem;
    padding-inline: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }
  .field {
    display: grid;
    gap: 0.35rem;
  }
  .label {
    font-weight: 600;
  }
  .hint {
    margin: 0;
    font-size: 0.8rem;
  }
  .choices {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.4rem;
  }
  .choices li {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.4rem;
    align-items: start;
    padding: 0.3rem;
    border-radius: 10px;
    border: 2px solid transparent;
  }
  .choices li.correct {
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .ok {
    display: flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--tap);
    min-block-size: var(--tap);
    cursor: pointer;
  }
  .ok input {
    inline-size: 1.25rem;
    block-size: 1.25rem;
    accent-color: var(--ok);
  }
  .choice-editor {
    min-inline-size: 0;
  }
  .tools {
    display: flex;
  }
  .tools button {
    min-inline-size: 2.2rem;
    padding: 0;
  }
  .danger {
    color: var(--bad);
  }
  .expr input {
    flex: 1 1 14rem;
    font-family: var(--mono, ui-monospace, monospace);
  }
  .expr-preview {
    overflow-x: auto;
    margin-block: 0.5rem;
  }
</style>

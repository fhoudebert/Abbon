<script lang="ts">
  /**
   * Champ de réponse d'une question « expression » : saisie visuelle d'une formule (MathLive), avec le
   * clavier mathématique sur écran tactile. La valeur est la source LaTeX. MathLive est chargé à la
   * première question de ce type ; s'il ne se charge pas, un champ texte (LaTeX) le remplace.
   */
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n/index.svelte';
  import { loadMathLive, mathKeyboard, type MathField } from './mathlive';

  let {
    value = '',
    readonly = false,
    label,
    describedby,
    autofocus = false,
    oninput,
    onenter,
    onblur,
  }: {
    value?: string;
    readonly?: boolean;
    label: string;
    describedby?: string;
    autofocus?: boolean;
    oninput?: (latex: string) => void;
    /** Touche Entrée (clavier physique ou virtuel). */
    onenter?: () => void;
    onblur?: () => void;
  } = $props();

  let phase = $state<'loading' | 'ready' | 'fallback'>('loading');
  let field = $state<MathField | null>(null);

  onMount(() => {
    loadMathLive().then(
      () => (phase = 'ready'),
      () => (phase = 'fallback'),
    );
    return () => mathKeyboard()?.hide();
  });

  /** Réglages du champ une fois créé (valeur initiale, focus, Entrée). */
  function setup(el: HTMLElement) {
    const mf = el as MathField;
    field = mf;
    mf.value = value;
    mf.readOnly = readonly;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        onenter?.();
      }
    };
    const onInput = () => oninput?.(mf.value);
    const onBlur = () => onblur?.();
    mf.addEventListener('keydown', onKey, { capture: true });
    mf.addEventListener('input', onInput);
    mf.addEventListener('focusout', onBlur);
    if (autofocus && !readonly && !matchMedia('(pointer: coarse)').matches) queueMicrotask(() => mf.focus());
    return () => {
      mf.removeEventListener('keydown', onKey, { capture: true });
      mf.removeEventListener('input', onInput);
      mf.removeEventListener('focusout', onBlur);
    };
  }

  // Lecture seule après correction ; valeur changée de l'extérieur (nouvelle question).
  $effect(() => {
    if (!field) return;
    field.readOnly = readonly;
    if (readonly) mathKeyboard()?.hide();
  });
  $effect(() => {
    if (field && field.value !== value) field.value = value;
  });
</script>

{#if phase === 'ready'}
  <math-field
    class="math-input"
    aria-label={label}
    aria-describedby={describedby}
    math-virtual-keyboard-policy="auto"
    {@attach setup}
  ></math-field>
{:else if phase === 'fallback'}
  <input
    class="math-input"
    type="text"
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    aria-label={label}
    aria-describedby={describedby}
    placeholder="LaTeX"
    {value}
    {readonly}
    oninput={(e) => oninput?.(e.currentTarget.value)}
    onkeydown={(e) => e.key === 'Enter' && onenter?.()}
    onblur={() => onblur?.()}
  />
{:else}
  <span class="math-input loading muted" role="status">{t('editor.mathVisualLoading')}</span>
{/if}

<style>
  .math-input {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 3rem;
    font-size: 1.4rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
  }
  math-field.math-input {
    --caret-color: var(--accent);
    --selection-background-color: color-mix(in srgb, var(--accent) 30%, transparent);
    --selection-color: var(--text);
    --contains-highlight-background-color: color-mix(in srgb, var(--accent) 12%, transparent);
    --primary: var(--accent);
  }
  math-field.math-input:focus-within {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .loading {
    font-size: 1rem;
    display: flex;
    align-items: center;
  }
  :global(.ML__keyboard) {
    --keyboard-accent-color: var(--keyboard-accent);
    --keyboard-toolbar-text-active: var(--keyboard-accent);
  }
</style>

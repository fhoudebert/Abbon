<script lang="ts">
  /**
   * Saisie visuelle d'une formule avec MathLive (clavier virtuel sur écran tactile).
   *
   * MathLive pèse environ 800 Ko : il n'est chargé qu'à la première ouverture. Il lit et produit le LaTeX
   * que contiennent déjà les nœuds de formule ; une formule ouverte puis validée sans modification garde
   * sa source exacte (MathLive normalise parfois l'écriture).
   */
  import { onDestroy, tick } from 'svelte';
  import { t } from '$lib/i18n/index.svelte';
  import { loadMathLive, mathKeyboard } from './mathlive';
  import { renderMath } from './math';

  type MathField = HTMLElement & { value: string };

  let dialog: HTMLDialogElement;
  let field = $state<MathField | null>(null);
  let ready = $state(false);
  let failed = $state<string | null>(null);
  let display = $state(false);
  let latex = $state('');
  let initial = '';
  let source = '';
  let onsave: ((latex: string) => void) | null = null;

  const load = loadMathLive;
  const keyboard = mathKeyboard;

  /** Ouvre la saisie sur `src` ; `save` reçoit le LaTeX validé. */
  export async function open(src: string, block: boolean, save: (latex: string) => void) {
    source = src;
    display = block;
    onsave = save;
    failed = null;
    dialog.showModal();
    try {
      await load();
      ready = true;
      // Le clavier virtuel doit vivre dans la fenêtre modale, sinon il passe dessous.
      const kb = keyboard();
      if (kb) kb.container = dialog;
      await tick();
      if (!field) return;
      field.value = src;
      initial = field.value;
      latex = initial;
      field.focus();
    } catch (e) {
      failed = e instanceof Error ? e.message : String(e);
    }
  }

  function close() {
    const kb = keyboard();
    kb?.hide();
    if (kb) kb.container = document.body;
    dialog.close();
  }

  function validate() {
    const value = field?.value ?? source;
    // Inchangée : la source d'origine est gardée telle quelle.
    onsave?.(value === initial ? source : value);
    close();
  }

  onDestroy(() => {
    if (dialog?.open) close();
  });
</script>

<dialog bind:this={dialog} aria-labelledby="mf-title" onclose={() => keyboard()?.hide()}>
  <h2 id="mf-title">{t('editor.mathVisualTitle')}</h2>
  {#if failed}
    <p class="error" role="alert">{failed}</p>
  {:else if !ready}
    <p class="muted" role="status">{t('editor.mathVisualLoading')}</p>
  {:else}
    <math-field
      bind:this={field}
      class:block={display}
      aria-label={t('editor.mathVisualField')}
      math-virtual-keyboard-policy="auto"
      oninput={() => (latex = field?.value ?? '')}
    ></math-field>
    <details>
      <summary>{t('editor.mathVisualSource')}</summary>
      <code class="src">{latex}</code>
      <div class="preview" aria-hidden="true">{@html renderMath(latex, display)}</div>
    </details>
    <p class="muted hint">{t('editor.mathVisualHint')}</p>
  {/if}
  <div class="actions">
    <button type="button" class="secondary" onclick={close}>{t('common.cancel')}</button>
    <button type="button" disabled={!ready || !!failed} onclick={validate}>{t('editor.mathVisualApply')}</button>
  </div>
</dialog>

<style>
  dialog {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    inline-size: min(40rem, 94vw);
    max-block-size: 94vh;
  }
  /* Clavier virtuel de MathLive, placé dans la fenêtre (couche supérieure) : collé au bas de l'écran,
     la fenêtre remontant en haut pour lui laisser la place. */
  dialog :global(.ML__keyboard) {
    --keyboard-accent-color: var(--accent);
    --keyboard-toolbar-text-active: var(--accent);
    position: fixed;
    inset: auto 0 0 0;
    overflow: visible;
  }
  dialog:has(:global(.ML__keyboard.is-visible)) {
    margin-block-start: 0.5rem;
    max-block-size: calc(100vh - var(--keyboard-height, 0px) - 1rem);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.4);
  }
  h2 {
    font-size: 1.15rem;
  }
  math-field {
    display: block;
    inline-size: 100%;
    box-sizing: border-box;
    font-size: 1.4rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
    --caret-color: var(--accent);
    --selection-background-color: color-mix(in srgb, var(--accent) 30%, transparent);
    --selection-color: var(--text);
    --contains-highlight-background-color: color-mix(in srgb, var(--accent) 12%, transparent);
    --primary: var(--accent);
  }
  math-field:focus-within {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  math-field.block {
    font-size: 1.6rem;
  }
  details {
    margin-block: 0.6rem;
  }
  .src {
    display: block;
    white-space: pre-wrap;
    word-break: break-all;
    margin-block: 0.4rem;
  }
  .preview {
    overflow-x: auto;
  }
  .hint {
    font-size: 0.9rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-block-start: 0.8rem;
  }
</style>

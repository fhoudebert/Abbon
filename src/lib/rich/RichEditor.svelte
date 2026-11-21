<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Editor, Extension, mergeAttributes, Node as TipTapNode } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Image } from '@tiptap/extension-image';
  import { TableKit } from '@tiptap/extension-table';
  import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
  import { toDoc } from '$lib/domain/rich';
  import type { RichDoc, RichValue } from '$lib/domain/types';
  import { t } from '$lib/i18n/index.svelte';
  import { CODE_LANGUAGES, lowlight } from './lowlight';
  import { mathError, renderMath } from './math';
  import MathFieldDialog from './MathFieldDialog.svelte';
  import { ACCEPTED_IMAGES, addImage, mediaUrlSync } from './media.svelte';
  import { registerFlush } from './pending';

  /**
   * Éditeur de contenu riche (TipTap). Produit un document JSON, jamais de HTML.
   * - complet : énoncés et explications (listes, code coloré, tableaux, images) ;
   * - compact : réponses (gras, italique, code, images) ; Entrée appelle `onenter`.
   */
  let {
    value,
    onchange,
    compact = false,
    onenter,
    label,
    lang,
    autofocus = false,
  }: {
    value: RichValue | null | undefined;
    onchange: (doc: RichDoc) => void;
    compact?: boolean;
    onenter?: () => void;
    label: string;
    lang?: string;
    autofocus?: boolean;
  } = $props();

  let element: HTMLDivElement;
  let fileInput = $state<HTMLInputElement | null>(null);
  let editor = $state<Editor | null>(null);
  let version = $state(0); // rafraîchit la barre d'outils à chaque transaction
  let error = $state<string | null>(null);

  /** Image référencée par empreinte : le fichier est dans la table `media`, pas dans le document. */
  const MediaImage = Image.extend({
    addAttributes() {
      return { hash: { default: null }, alt: { default: '' } };
    },
    parseHTML() {
      return [{ tag: 'img[data-hash]', getAttrs: (el) => ({ hash: (el as HTMLElement).dataset.hash, alt: (el as HTMLImageElement).alt }) }];
    },
    renderHTML({ HTMLAttributes }) {
      const { hash, alt } = HTMLAttributes as { hash?: string; alt?: string };
      return ['img', mergeAttributes({ src: mediaUrlSync(hash) ?? '', alt: alt ?? '', 'data-hash': hash ?? '' })];
    },
  });

  /**
   * Formules : le nœud contient sa source LaTeX comme texte (une version d'Abbon qui ne connaît pas
   * les formules affiche donc cette source). Dans l'éditeur on écrit la source ; l'aperçu est en dessous.
   */
  const MathInline = TipTapNode.create({
    name: 'math',
    group: 'inline',
    inline: true,
    content: 'text*',
    marks: '',
    code: true,
    parseHTML: () => [{ tag: 'span[data-math]' }],
    renderHTML: () => ['span', { 'data-math': '', class: 'math-src', spellcheck: 'false' }, 0],
  });
  const MathBlock = TipTapNode.create({
    name: 'mathBlock',
    group: 'block',
    content: 'text*',
    marks: '',
    code: true,
    defining: true,
    parseHTML: () => [{ tag: 'div[data-math-block]' }],
    renderHTML: () => ['div', { 'data-math-block': '', class: 'math-src block', spellcheck: 'false' }, 0],
  });

  const EnterKey = Extension.create({
    name: 'abbonEnter',
    addKeyboardShortcuts() {
      return {
        Enter: () => {
          onenter?.();
          return true;
        },
      };
    },
  });

  onMount(() => {
    const extensions = compact
      ? [
          StarterKit.configure({
            heading: false,
            bulletList: false,
            orderedList: false,
            listItem: false,
            listKeymap: false,
            blockquote: false,
            codeBlock: false,
            horizontalRule: false,
            link: false,
          }),
          MediaImage,
          MathInline,
          ...(onenter ? [EnterKey] : []),
        ]
      : [
          StarterKit.configure({ heading: false, codeBlock: false, link: false }),
          CodeBlockLowlight.configure({ lowlight, defaultLanguage: null }),
          TableKit.configure({ table: { resizable: false } }),
          MediaImage,
          MathInline,
          MathBlock,
        ];
    editor = new Editor({
      element,
      extensions,
      content: toDoc(value),
      autofocus: autofocus ? 'end' : false,
      editorProps: {
        attributes: {
          class: 'editor-surface',
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-label': label,
          ...(lang ? { lang } : {}),
        },
      },
      onUpdate: schedule,
      onBlur: flush,
      // Différé : une transaction peut survenir pendant une mise à jour de l'affichage (perte du focus quand
      // l'éditeur est retiré de la page), où Svelte interdit de modifier un état.
      onTransaction: () => queueMicrotask(() => version++),
    });
  });

  const unregister = registerFlush(() => flush());

  onDestroy(() => {
    unregister();
    // Changement de question ou de langue : ne pas perdre la fin de la saisie.
    try {
      flush();
    } catch {
      // Page en cours de fermeture : les saisies ont déjà été transmises (flushEdits).
    }
    editor?.destroy();
  });

  /*
   * Les changements sont transmis après une courte pause de frappe (ou à la sortie du champ,
   * ou avant Ctrl+S) : revalider tout le QCM à chaque touche ralentit la saisie sur les
   * appareils modestes, au point de perdre des caractères.
   */
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending = false;
  function schedule() {
    pending = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 250);
  }
  function flush() {
    if (timer) clearTimeout(timer);
    timer = null;
    if (pending && editor && !editor.isDestroyed) {
      pending = false;
      onchange(editor.getJSON() as RichDoc);
    }
  }
  function onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') flush();
  }

  const active = (name: string, attrs?: Record<string, unknown>) => {
    void version;
    return editor?.isActive(name, attrs) ?? false;
  };
  const chain = () => editor!.chain().focus();
  const inTable = $derived.by(() => active('table'));
  const inCode = $derived.by(() => active('codeBlock'));
  const imageSelected = $derived.by(() => active('image'));
  const codeLang = $derived.by(() => {
    void version;
    return (editor?.getAttributes('codeBlock').language as string | null) ?? '';
  });
  const imageAlt = $derived.by(() => {
    void version;
    return (editor?.getAttributes('image').alt as string | null) ?? '';
  });

  const inMath = $derived.by(() => active('math') || active('mathBlock'));
  /** Source de la formule sous le curseur (pour l'aperçu). */
  const mathLatex = $derived.by(() => {
    void version;
    if (!editor || !inMath) return '';
    const pos = editor.state.selection.$from;
    for (let d = pos.depth; d >= 0; d--) {
      const n = pos.node(d);
      if (n.type.name === 'math' || n.type.name === 'mathBlock') return n.textContent;
    }
    return '';
  });

  let mathDialog = $state<MathFieldDialog>();
  /** Ouvre l'éditeur visuel sur la formule sous le curseur ; la validation remplace sa source. */
  function openVisualMath() {
    if (!editor) return;
    const at = editor.state.selection.$from;
    let depth = at.depth;
    while (depth >= 0 && !['math', 'mathBlock'].includes(at.node(depth).type.name)) depth--;
    if (depth < 0) return;
    const node = at.node(depth);
    const start = at.before(depth);
    mathDialog?.open(node.textContent, node.type.name === 'mathBlock', (latex) => {
      if (!editor || latex === node.textContent) return;
      const current = editor.state.doc.nodeAt(start);
      if (!current || current.type !== node.type) return;
      const tr = editor.state.tr;
      const from = start + 1;
      const to = start + current.nodeSize - 1;
      if (latex) tr.replaceWith(from, to, editor.state.schema.text(latex));
      else tr.delete(from, to);
      editor.view.dispatch(tr);
      editor.commands.focus();
    });
  }

  /** Insère une formule ; le texte sélectionné devient sa source. */
  function insertMath(type: 'math' | 'mathBlock') {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const latex = editor.state.doc.textBetween(from, to, ' ').trim() || 'x';
    chain()
      .insertContent({ type, content: [{ type: 'text', text: latex }] })
      .run();
  }

  async function onFile(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    (e.currentTarget as HTMLInputElement).value = '';
    if (!file || !editor) return;
    error = null;
    try {
      const hash = await addImage(file);
      chain().insertContent({ type: 'image', attrs: { hash, alt: '' } }).run();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }
</script>

<!-- Capture : Ctrl+S transmet le contenu avant que la page n'enregistre. -->
<div class="rich-editor" class:compact onkeydowncapture={onKeydown} role="presentation">
  {#if editor}
    <div class="toolbar" role="toolbar" aria-label={label}>
      <button type="button" class="tb" aria-pressed={active('bold')} title={t('editor.bold')} onclick={() => chain().toggleBold().run()}><b>G</b></button>
      <button type="button" class="tb" aria-pressed={active('italic')} title={t('editor.italic')} onclick={() => chain().toggleItalic().run()}><i>I</i></button>
      <button type="button" class="tb" aria-pressed={active('underline')} title={t('editor.underline')} onclick={() => chain().toggleUnderline().run()}><u>S</u></button>
      <button type="button" class="tb mono" aria-pressed={active('code')} title={t('editor.code')} onclick={() => chain().toggleCode().run()}>&lt;/&gt;</button>
      {#if !compact}
        <span class="sep"></span>
        <button type="button" class="tb" aria-pressed={active('bulletList')} title={t('editor.bulletList')} onclick={() => chain().toggleBulletList().run()}>•</button>
        <button type="button" class="tb" aria-pressed={active('orderedList')} title={t('editor.orderedList')} onclick={() => chain().toggleOrderedList().run()}>1.</button>
        <button type="button" class="tb mono" aria-pressed={inCode} title={t('editor.codeBlock')} onclick={() => chain().toggleCodeBlock().run()}>{'{ }'}</button>
        <button type="button" class="tb" aria-pressed={inTable} title={t('editor.table')} onclick={() => chain().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}>▦</button>
      {/if}
      <span class="sep"></span>
      <button type="button" class="tb" aria-pressed={active('math')} title={t('editor.math')} aria-label={t('editor.math')} onclick={() => insertMath('math')}>∑</button>
      {#if !compact}
        <button type="button" class="tb" aria-pressed={active('mathBlock')} title={t('editor.mathBlock')} aria-label={t('editor.mathBlock')} onclick={() => insertMath('mathBlock')}>∑▭</button>
      {/if}
      <button type="button" class="tb" title={t('editor.image')} onclick={() => fileInput?.click()}>🖼</button>
      <input bind:this={fileInput} type="file" accept={ACCEPTED_IMAGES} hidden onchange={onFile} />
      <span class="sep"></span>
      <button type="button" class="tb" title={t('editor.undo')} disabled={!editor.can().undo()} onclick={() => chain().undo().run()}>↶</button>
      <button type="button" class="tb" title={t('editor.redo')} disabled={!editor.can().redo()} onclick={() => chain().redo().run()}>↷</button>
    </div>

    {#if inCode}
      <div class="contextbar">
        <label>
          {t('editor.language')}
          <select value={codeLang} onchange={(e) => chain().updateAttributes('codeBlock', { language: e.currentTarget.value || null }).run()}>
            <option value="">{t('editor.plainText')}</option>
            {#each CODE_LANGUAGES as l (l)}<option value={l}>{l}</option>{/each}
          </select>
        </label>
      </div>
    {/if}
    {#if inMath}
      {@const problem = mathError(mathLatex)}
      <div class="contextbar math-bar">
        <span class="muted">{t('editor.mathPreview')} :</span>
        <span class="math-preview">{@html renderMath(mathLatex, active('mathBlock'))}</span>
        <button type="button" class="tb wide" onclick={openVisualMath}>{t('editor.mathVisual')}</button>
        {#if problem}<span class="error" role="status">{problem}</span>{/if}
        <span class="muted hint">{t('editor.mathHint')}</span>
      </div>
    {/if}
    {#if inTable}
      <div class="contextbar">
        <button type="button" class="tb wide" onclick={() => chain().addRowAfter().run()}>+ {t('editor.row')}</button>
        <button type="button" class="tb wide" onclick={() => chain().addColumnAfter().run()}>+ {t('editor.column')}</button>
        <button type="button" class="tb wide" onclick={() => chain().deleteRow().run()}>− {t('editor.row')}</button>
        <button type="button" class="tb wide" onclick={() => chain().deleteColumn().run()}>− {t('editor.column')}</button>
        <button type="button" class="tb wide" onclick={() => chain().deleteTable().run()}>{t('editor.deleteTable')}</button>
      </div>
    {/if}
    {#if imageSelected}
      <div class="contextbar">
        <label class="grow">
          {t('editor.alt')}
          <input
            type="text"
            value={imageAlt}
            placeholder={t('editor.altPlaceholder')}
            oninput={(e) => editor?.commands.updateAttributes('image', { alt: e.currentTarget.value })}
          />
        </label>
      </div>
    {/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
  {/if}
  <div bind:this={element} class="surface-host"></div>
  <MathFieldDialog bind:this={mathDialog} />
</div>

<style>
  .math-bar {
    gap: 0.25rem 0.75rem;
    padding: 0.4rem 0.6rem;
  }
  .math-preview {
    max-inline-size: 100%;
    overflow-x: auto;
  }
  .math-bar .hint {
    flex-basis: 100%;
    font-size: 0.8rem;
  }
  .rich-editor :global(.math-src) {
    font-family: ui-monospace, 'Cascadia Code', 'DejaVu Sans Mono', monospace;
    font-size: 0.9em;
    padding: 0.05em 0.35em;
    border: 1px dashed var(--accent);
    border-radius: 4px;
    background: var(--accent-soft);
  }
  .rich-editor :global(.math-src.block) {
    display: block;
    margin-block: 0 0.6em;
    padding: 0.4em 0.6em;
    white-space: pre-wrap;
  }
  .rich-editor {
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
  }
  .rich-editor:focus-within {
    border-color: var(--accent);
  }
  .toolbar,
  .contextbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.15rem;
    padding: 0.25rem;
    border-block-end: 1px solid var(--border);
  }
  .contextbar {
    gap: 0.4rem;
    background: var(--bg);
    font-size: 0.85rem;
  }
  .contextbar label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .contextbar .grow {
    flex: 1;
  }
  .contextbar .grow input {
    flex: 1;
    min-block-size: 2rem;
    padding-inline: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
  }
  .contextbar select {
    min-block-size: 2rem;
  }
  .tb {
    min-block-size: 2rem;
    min-inline-size: 2rem;
    padding: 0 0.4rem;
    border-radius: 6px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text);
    font-weight: 500;
  }
  .tb.wide {
    border-color: var(--border);
  }
  .tb[aria-pressed='true'] {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
  }
  .tb.mono {
    font-family: ui-monospace, monospace;
    font-size: 0.8rem;
  }
  .sep {
    inline-size: 1px;
    block-size: 1.2rem;
    background: var(--border);
    margin-inline: 0.2rem;
  }
  .error {
    color: var(--bad);
    margin: 0.25rem 0.5rem;
    font-size: 0.85rem;
  }
  .surface-host :global(.editor-surface) {
    min-block-size: 4.5rem;
    padding: 0.6rem 0.8rem;
    outline: none;
  }
  .compact .surface-host :global(.editor-surface) {
    min-block-size: 2.2rem;
    padding-block: 0.4rem;
  }
  .surface-host :global(.editor-surface p) {
    margin-block: 0 0.4em;
  }
  .surface-host :global(.editor-surface > :last-child) {
    margin-block-end: 0;
  }
  .surface-host :global(.editor-surface ul),
  .surface-host :global(.editor-surface ol) {
    padding-inline-start: 1.4em;
    margin-block: 0 0.4em;
  }
  .surface-host :global(.editor-surface code) {
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
    background: var(--accent-soft);
    padding: 0.05em 0.3em;
    border-radius: 4px;
  }
  .surface-host :global(.editor-surface pre) {
    padding: 0.6em 0.9em;
    border-radius: 8px;
    background: var(--code-bg);
    color: var(--code-fg);
    overflow-x: auto;
  }
  .surface-host :global(.editor-surface pre code) {
    background: none;
    padding: 0;
  }
  .surface-host :global(.editor-surface img) {
    display: block;
    max-inline-size: 100%;
    max-block-size: 16rem;
    border-radius: 6px;
  }
  .surface-host :global(.editor-surface img.ProseMirror-selectednode) {
    outline: 3px solid var(--accent);
  }
  .surface-host :global(.editor-surface table) {
    border-collapse: collapse;
    margin-block: 0.4em;
  }
  .surface-host :global(.editor-surface th),
  .surface-host :global(.editor-surface td) {
    border: 1px solid var(--border);
    padding: 0.25em 0.5em;
    min-inline-size: 4em;
    vertical-align: top;
  }
  .surface-host :global(.editor-surface th) {
    background: var(--accent-soft);
  }
  .surface-host :global(.editor-surface .selectedCell) {
    background: var(--accent-soft);
  }
</style>

<script lang="ts">
  /**
   * Atelier de formules : saisie (éditeur visuel MathLive et LaTeX, ou chimie en notation mhchem), aperçu,
   * copie pour Word, LibreOffice, en LaTeX ou en image, et carnet de formules (stockage local + Markdown).
   * Utilisé par l'écran Outils de l'application et par la page autonome (tools/atelier).
   */
  import { tick } from 'svelte';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import MathInput from '$lib/rich/MathInput.svelte';
  import { standardLatex } from '$lib/rich/macros';
  import { fileSafe, saveFile } from '$lib/files';
  import { formulaError, fromMarkdown, renderFormula, toLatex, toLibreOfficeMathML, toMarkdown, toMathML, type Entry } from './formulas';
  import { formulaPng } from './image';

  const KEY = 'abbon-atelier';
  interface Saved {
    entries?: Entry[];
    current?: { source: string; chem: boolean; title: string };
  }

  function read(): Saved {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Saved;
    } catch {
      return {};
    }
  }
  const saved = read();

  let chem = $state(saved.current?.chem ?? false);
  let mathSource = $state(saved.current && !saved.current.chem ? saved.current.source : '\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}');
  let chemSource = $state(saved.current?.chem ? saved.current.source : '2H2 + O2 -> 2H2O');
  let title = $state(saved.current?.title ?? '');
  let entries = $state<Entry[]>(saved.entries ?? []);
  let editing = $state<string | null>(null);
  let white = $state(false);
  let status = $state('');
  let fallback = $state<{ label: string; text: string } | null>(null);

  const source = $derived(chem ? chemSource : mathSource);
  const latex = $derived(toLatex(source, chem));
  const error = $derived(source.trim() ? formulaError(latex) : null);
  const ready = $derived(!!source.trim() && !error);
  const preview = $derived(ready ? renderFormula(latex, true) : '');
  const isEditing = $derived(!!editing && entries.some((e) => e.id === editing));

  let chemInput = $state<HTMLTextAreaElement>();
  let fallbackArea = $state<HTMLTextAreaElement>();

  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ entries, current: { source, chem, title } } satisfies Saved));
    } catch {
      /* stockage indisponible : le carnet vit le temps de la page */
    }
  });

  // Langue du clavier mathématique (MathLive chargé par MathInput).
  $effect(() => {
    const mf = customElements.get('math-field') as unknown as { locale: string; decimalSeparator: string } | undefined;
    if (!mf) return;
    mf.locale = i18n.lang;
    mf.decimalSeparator = i18n.lang === 'fr' ? ',' : '.';
  });

  function say(message: string) {
    status = '';
    void tick().then(() => (status = message));
  }

  /** Copie de texte, avec repli (vieux navigateur, contexte non sécurisé) : sélection + Ctrl+C. */
  async function copyText(text: string, label: string) {
    fallback = null;
    try {
      await navigator.clipboard.writeText(text);
      return say(t('atelier.copied', { what: label }));
    } catch {
      /* repli ci-dessous */
    }
    const area = Object.assign(document.createElement('textarea'), { value: text });
    area.style.cssText = 'position:fixed;left:-10000px';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (ok) return say(t('atelier.copied', { what: label }));
    fallback = { label, text };
    await tick();
    fallbackArea?.focus();
    fallbackArea?.select();
    say(t('atelier.copyFailed'));
  }

  const copyWord = () => copyText(toMathML(latex), t('atelier.copyWord'));
  const copyLibre = () => copyText(toLibreOfficeMathML(toMathML(latex)), t('atelier.copyLibre'));
  const copyLatex = () => copyText(latex, t('atelier.copyLatex'));

  const png = () => formulaPng(latex, { scale: 3, background: white ? '#ffffff' : undefined });

  async function copyImage() {
    fallback = null;
    try {
      // La promesse est passée telle quelle : Safari exige que l'écriture parte du clic.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png() })]);
      say(t('atelier.copied', { what: t('atelier.copyImage') }));
    } catch {
      say(t('atelier.imageFailed'));
    }
  }

  async function saveImage() {
    const bytes = new Uint8Array(await (await png()).arrayBuffer());
    await saveFile(`${fileSafe(title, t('atelier.fileName'))}.png`, bytes, [{ name: 'PNG', extensions: ['png'] }]);
  }

  /**
   * Sortie de l'éditeur visuel : LaTeX standard dans le champ LaTeX (`\mathrm{e}` au lieu de `\exponentialE`).
   * Pas pendant la saisie (le curseur sauterait) : le clavier virtuel garde le focus dans le champ.
   */
  function leaveVisual() {
    setTimeout(() => {
      if (!document.activeElement?.closest('math-field')) mathSource = standardLatex(mathSource);
    }, 0);
  }

  // ---- saisie chimie ----
  const CHEM_PALETTE = $derived<readonly [string, string][]>([
    ['->', '→'],
    ['<=>', '⇌'],
    ['<-', '←'],
    ['->[\\Delta]', '→ Δ'],
    ['(s)', '(s)'],
    ['(l)', '(l)'],
    ['(g)', '(g)'],
    ['(aq)', '(aq)'],
    ['^+', 'X⁺'],
    ['^-', 'X⁻'],
    ['^{2+}', 'X²⁺'],
    ['^{2-}', 'X²⁻'],
    [' ^', `↑ ${t('atelier.gas')}`],
    [' v', `↓ ${t('atelier.precipitate')}`],
    ['*', '·'],
  ]);

  async function insert(text: string) {
    const el = chemInput;
    if (!el) return;
    const start = el.selectionStart ?? chemSource.length;
    const end = el.selectionEnd ?? start;
    chemSource = chemSource.slice(0, start) + text + chemSource.slice(end);
    await tick();
    el.focus();
    el.setSelectionRange(start + text.length, start + text.length);
  }

  // ---- carnet ----
  function addOrUpdate() {
    const entry: Entry = { id: editing ?? crypto.randomUUID(), title: title.trim() || t('atelier.untitled'), source: source.trim(), chem };
    entries = isEditing ? entries.map((e) => (e.id === editing ? entry : e)) : [...entries, entry];
    editing = entry.id;
    title = entry.title;
    say(t('atelier.added', { title: entry.title }));
  }

  function openEntry(e: Entry) {
    chem = e.chem;
    if (e.chem) chemSource = e.source;
    else mathSource = e.source;
    title = e.title;
    editing = e.id;
    document.getElementById('atelier-top')?.scrollIntoView({ behavior: 'smooth' });
  }

  function newFormula() {
    editing = null;
    title = '';
    if (chem) chemSource = '';
    else mathSource = '';
  }

  function removeEntry(e: Entry) {
    entries = entries.filter((x) => x.id !== e.id);
    if (editing === e.id) editing = null;
  }

  async function saveNotebook() {
    const bytes = new TextEncoder().encode(toMarkdown(entries, t('atelier.notebook')));
    await saveFile(`${t('atelier.notebookFile')}.md`, bytes, [{ name: 'Markdown', extensions: ['md'] }]);
  }

  async function loadNotebook(ev: Event) {
    const input = ev.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const found = fromMarkdown(await file.text());
    entries = [...entries, ...found];
    say(found.length ? t('atelier.loaded', { n: found.length }) : t('atelier.nothingLoaded'));
  }

  const entryHtml = (e: Entry) => {
    const l = toLatex(e.source, e.chem);
    return formulaError(l) ? '' : renderFormula(l, false);
  };
</script>

<div class="workshop">
  <section class="panel" id="atelier-top" aria-labelledby="atelier-h-edit">
    <h2 id="atelier-h-edit" class="visually-hidden">{t('atelier.mode')}</h2>
    <fieldset class="modes">
      <legend>{t('atelier.mode')}</legend>
      <label><input type="radio" name="atelier-mode" value={false} bind:group={chem} /> {t('atelier.math')}</label>
      <label><input type="radio" name="atelier-mode" value={true} bind:group={chem} /> {t('atelier.chem')}</label>
    </fieldset>

    {#if !chem}
      <p class="label">{t('atelier.visual')}</p>
      <MathInput
        label={t('atelier.visual')}
        describedby="atelier-visual-help"
        value={mathSource}
        oninput={(v) => (mathSource = v)}
        onblur={leaveVisual}
      />
      <p id="atelier-visual-help" class="help">{t('editor.mathVisualHint')}</p>
      <label class="label" for="atelier-latex">{t('atelier.latex')}</label>
      <textarea id="atelier-latex" class="code" rows="2" spellcheck="false" autocapitalize="off" bind:value={mathSource}></textarea>
    {:else}
      <label class="label" for="atelier-chem">{t('atelier.chemSource')}</label>
      <textarea
        id="atelier-chem"
        class="code"
        rows="2"
        spellcheck="false"
        autocapitalize="off"
        aria-describedby="atelier-chem-help"
        bind:this={chemInput}
        bind:value={chemSource}
      ></textarea>
      <p id="atelier-chem-help" class="help">{t('atelier.chemHelp')}</p>
      <div class="palette" role="group" aria-label={t('atelier.palette')}>
        {#each CHEM_PALETTE as [code, label] (code)}
          <button type="button" class="secondary chip" onclick={() => insert(code)} title={code}>{label}</button>
        {/each}
      </div>
    {/if}

    <h3 class="label">{t('atelier.preview')}</h3>
    <div class="preview">
      {#if error}
        <p class="error" role="alert"><strong>{t('atelier.error')}</strong> : {error}</p>
      {:else if preview}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- rendu KaTeX, trust:false -->
        {@html preview}
      {:else}
        <p class="muted">{t('atelier.empty')}</p>
      {/if}
    </div>
  </section>

  <section class="panel" aria-labelledby="atelier-h-copy">
    <h2 id="atelier-h-copy">{t('atelier.copy')}</h2>
    <ul class="copies">
      <li>
        <button type="button" disabled={!ready} onclick={copyWord}>{t('atelier.copyWord')}</button>
        <span class="help">{t('atelier.copyWordHelp')}</span>
      </li>
      <li>
        <button type="button" class="secondary" disabled={!ready} onclick={copyLibre}>{t('atelier.copyLibre')}</button>
        <span class="help">{t('atelier.copyLibreHelp')}</span>
      </li>
      <li>
        <button type="button" class="secondary" disabled={!ready} onclick={copyLatex}>{t('atelier.copyLatex')}</button>
        <span class="help">{t('atelier.copyLatexHelp')}</span>
      </li>
      <li class="image">
        <span class="actions">
          <button type="button" class="secondary" disabled={!ready} onclick={copyImage}>{t('atelier.copyImage')}</button>
          <button type="button" class="secondary" disabled={!ready} onclick={saveImage}>{t('atelier.downloadImage')}</button>
          <label class="inline"><input type="checkbox" bind:checked={white} /> {t('atelier.white')}</label>
        </span>
        <span class="help">{t('atelier.copyImageHelp')}</span>
      </li>
    </ul>
    <p class="status" role="status">{status}</p>
    {#if fallback}
      <label class="label" for="atelier-fallback">{fallback.label}</label>
      <textarea id="atelier-fallback" class="code" rows="4" readonly bind:this={fallbackArea} value={fallback.text}></textarea>
    {/if}
  </section>

  <section class="panel" aria-labelledby="atelier-h-notebook">
    <h2 id="atelier-h-notebook">{t('atelier.notebook')}</h2>
    <p class="help">{t('atelier.notebookHelp')}</p>
    <div class="actions">
      <label class="grow">
        <span class="visually-hidden">{t('atelier.entryTitle')}</span>
        <input type="text" placeholder={t('atelier.entryTitle')} bind:value={title} />
      </label>
      <button type="button" disabled={!ready} onclick={addOrUpdate}>{isEditing ? t('atelier.update') : t('atelier.add')}</button>
      <button type="button" class="secondary" onclick={newFormula}>{t('atelier.newFormula')}</button>
    </div>

    {#if entries.length}
      <ul class="entries">
        {#each entries as e (e.id)}
          <li class:current={e.id === editing}>
            <span class="entry-title">{e.title}</span>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- rendu KaTeX, trust:false -->
            <span class="entry-math">{@html entryHtml(e)}</span>
            <span class="actions">
              <button type="button" class="secondary small" onclick={() => openEntry(e)} aria-label={t('atelier.openEntry', { title: e.title })}>
                {t('atelier.open')}
              </button>
              <button type="button" class="ghost small" onclick={() => removeEntry(e)} aria-label={t('atelier.removeEntry', { title: e.title })}>
                {t('atelier.remove')}
              </button>
            </span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">{t('atelier.noEntries')}</p>
    {/if}

    <div class="actions">
      <button type="button" class="secondary" disabled={!entries.length} onclick={saveNotebook}>{t('atelier.save')}</button>
      <label class="button secondary">
        {t('atelier.load')}
        <input class="visually-hidden" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onchange={loadNotebook} />
      </label>
    </div>
  </section>
</div>

<style>
  .workshop {
    display: grid;
    gap: 1rem;
  }
  h2 {
    font-size: 1.15rem;
  }
  .modes {
    border: none;
    padding: 0;
    margin: 0 0 0.5rem;
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
  }
  .modes legend {
    font-weight: 600;
    padding: 0;
    margin-block-end: 0.25rem;
  }
  .modes label,
  .inline {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    min-block-size: var(--tap);
  }
  .label {
    display: block;
    font-weight: 600;
    font-size: 1rem;
    margin: 0.75rem 0 0.3rem;
  }
  textarea,
  input[type='text'] {
    font: inherit;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.4rem 0.6rem;
    inline-size: 100%;
    min-block-size: var(--tap);
  }
  textarea {
    resize: vertical;
  }
  .code {
    font-family: ui-monospace, 'Cascadia Mono', 'DejaVu Sans Mono', Menlo, monospace;
    font-size: 0.95rem;
    background: var(--code-bg);
    color: var(--code-fg);
  }
  .help {
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0.3rem 0;
  }
  .palette {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .chip,
  .small {
    padding-inline: 0.75rem;
    font-weight: 500;
  }
  .preview {
    min-block-size: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border: 1px dashed var(--border);
    border-radius: 8px;
    overflow-x: auto;
    font-size: 1.25rem;
  }
  .preview :global(.katex-display) {
    margin: 0;
  }
  .error {
    color: var(--bad);
    font-size: 1rem;
    margin: 0;
  }
  .preview .muted {
    font-size: 1rem;
    margin: 0;
  }
  .copies {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.75rem;
  }
  .copies li {
    display: grid;
    grid-template-columns: minmax(11rem, max-content) 1fr;
    gap: 0.75rem;
    align-items: center;
  }
  .copies li.image {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
  .copies .help {
    margin: 0;
  }
  .status {
    min-block-size: 1.5rem;
    margin: 0.75rem 0 0;
    color: var(--accent);
    font-weight: 600;
  }
  .grow {
    flex: 1 1 14rem;
  }
  .entries {
    list-style: none;
    padding: 0;
    margin: 0.75rem 0;
    display: grid;
    gap: 0.5rem;
  }
  .entries li {
    display: grid;
    grid-template-columns: minmax(8rem, 12rem) 1fr auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.5rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .entries li.current {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .entry-title {
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .entry-math {
    overflow-x: auto;
    font-size: 1.1rem;
  }
  @media (max-width: 560px) {
    .copies li,
    .entries li {
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }
  }
</style>

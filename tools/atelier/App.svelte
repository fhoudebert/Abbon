<script lang="ts">
  /**
   * Atelier de formules : saisie (éditeur visuel MathLive, LaTeX, ou chimie en notation mhchem), aperçu KaTeX,
   * copie pour Word, LibreOffice, LaTeX ou en image, et carnet de formules (navigateur + fichier Markdown).
   */
  import { tick } from 'svelte';
  import { formulaError, fromMarkdown, renderFormula, toLatex, toLibreOfficeMathML, toMarkdown, toMathML, type Entry } from '$lib/atelier/formulas';
  import { formulaPng } from '$lib/atelier/image';
  import { defaultLang, texts, type Lang } from './i18n';

  /** Feuille de style de KaTeX, polices incluses (pour l'image). */
  let { katexCss }: { katexCss: string } = $props();

  const KEY = 'abbon-atelier';
  type Theme = 'system' | 'light' | 'dark';
  interface Saved {
    lang?: Lang;
    theme?: Theme;
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

  let lang = $state<Lang>(saved.lang ?? defaultLang());
  let theme = $state<Theme>(saved.theme ?? 'system');
  let chem = $state(saved.current?.chem ?? false);
  let mathSource = $state(saved.current && !saved.current.chem ? saved.current.source : '\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}');
  let chemSource = $state(saved.current?.chem ? saved.current.source : '2H2 + O2 -> 2H2O');
  let title = $state(saved.current?.title ?? '');
  let entries = $state<Entry[]>(saved.entries ?? []);
  let editing = $state<string | null>(null);
  let white = $state(false);
  let status = $state('');
  let fallback = $state<{ label: string; text: string } | null>(null);

  const t = $derived(texts[lang]);
  const source = $derived(chem ? chemSource : mathSource);
  const latex = $derived(toLatex(source, chem));
  const error = $derived(source.trim() ? formulaError(latex) : null);
  const ready = $derived(!!source.trim() && !error);
  const preview = $derived(ready ? renderFormula(latex, true) : '');

  let field = $state<HTMLElement & { value: string; mathVirtualKeyboardPolicy: string }>();
  let chemInput = $state<HTMLTextAreaElement>();
  let fallbackArea = $state<HTMLTextAreaElement>();

  $effect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ lang, theme, entries, current: { source, chem, title } } satisfies Saved));
    } catch {
      /* stockage indisponible : le carnet vit le temps de la page */
    }
  });
  $effect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = theme;
    document.title = `${t.title} — Abbon`;
    // MathLive est chargé par main.ts, avant la page.
    const mf = customElements.get('math-field') as unknown as { locale: string; decimalSeparator: string } | undefined;
    if (mf) {
      mf.locale = lang;
      mf.decimalSeparator = lang === 'fr' ? ',' : '.';
    }
  });
  // LaTeX tapé à la main → éditeur visuel.
  $effect(() => {
    if (field && field.value !== mathSource) field.value = mathSource;
  });

  function say(message: string) {
    status = '';
    void tick().then(() => (status = message));
  }

  /** Copie de texte, avec repli (page ouverte depuis un fichier, vieux navigateur) : sélection + Ctrl+C. */
  async function copyText(text: string, label: string) {
    fallback = null;
    try {
      await navigator.clipboard.writeText(text);
      say(`${label} : ${t.copied}`);
      return;
    } catch {
      /* repli ci-dessous */
    }
    const area = Object.assign(document.createElement('textarea'), { value: text });
    area.style.cssText = 'position:fixed;left:-10000px';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (ok) return say(`${label} : ${t.copied}`);
    fallback = { label, text };
    await tick();
    fallbackArea?.focus();
    fallbackArea?.select();
    say(t.copyFailed);
  }

  const copyWord = () => copyText(toMathML(latex), t.copyWord);
  const copyLibre = () => copyText(toLibreOfficeMathML(toMathML(latex)), t.copyLibre);
  const copyLatex = () => copyText(latex, t.copyLatex);

  const png = () => formulaPng(latex, katexCss, { scale: 3, background: white ? '#ffffff' : undefined });

  async function copyImage() {
    fallback = null;
    try {
      // La promesse est passée telle quelle : Safari exige que l'écriture parte du clic.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png() })]);
      say(`${t.copyImage} : ${t.copied}`);
    } catch {
      say(t.imageFailed);
    }
  }

  function download(blob: Blob, name: string) {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  }

  const fileName = (s: string, ext: string) =>
    (s.trim() || t.title)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\w-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() + ext;

  async function downloadImage() {
    download(await png(), fileName(title || 'formule', '.png'));
  }

  // ---- saisie chimie ----
  const CHEM_PALETTE: readonly [string, string][] = [
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
    [' ^', '↑ gaz'],
    [' v', '↓ précipité'],
    ['*', '·'],
  ];

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
    const entry: Entry = { id: editing ?? crypto.randomUUID(), title: title.trim() || t.untitled, source: source.trim(), chem };
    if (editing && entries.some((e) => e.id === editing)) entries = entries.map((e) => (e.id === editing ? entry : e));
    else entries = [...entries, entry];
    editing = entry.id;
    title = entry.title;
    say(`« ${entry.title} » ✓`);
  }

  function openEntry(e: Entry) {
    chem = e.chem;
    if (e.chem) chemSource = e.source;
    else mathSource = e.source;
    title = e.title;
    editing = e.id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  function saveNotebook() {
    download(new Blob([toMarkdown(entries, t.notebook)], { type: 'text/markdown;charset=utf-8' }), fileName(t.notebook, '.md'));
  }

  async function loadNotebook(ev: Event) {
    const input = ev.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const found = fromMarkdown(await file.text());
    entries = [...entries, ...found];
    say(found.length ? t.loaded(found.length) : t.nothingLoaded);
  }

  const entryHtml = (e: Entry) => {
    const l = toLatex(e.source, e.chem);
    return formulaError(l) ? '' : renderFormula(l, false);
  };
</script>

<header>
  <h1>{t.title}</h1>
  <p class="intro">{t.intro}</p>
  <div class="prefs">
    <label>
      {t.lang}
      <select bind:value={lang}>
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </label>
    <label>
      {t.theme}
      <select bind:value={theme}>
        <option value="system">{t.themeSystem}</option>
        <option value="light">{t.themeLight}</option>
        <option value="dark">{t.themeDark}</option>
      </select>
    </label>
  </div>
</header>

<main>
  <section class="card" aria-labelledby="h-edit">
    <h2 id="h-edit" class="sr-only">{t.mode}</h2>
    <fieldset class="modes">
      <legend>{t.mode}</legend>
      <label><input type="radio" name="mode" value={false} bind:group={chem} /> {t.math}</label>
      <label><input type="radio" name="mode" value={true} bind:group={chem} /> {t.chem}</label>
    </fieldset>

    {#if !chem}
      <label class="block" for="visual">{t.visual}</label>
      <math-field
        id="visual"
        bind:this={field}
        math-virtual-keyboard-policy="auto"
        oninput={(e: Event) => (mathSource = (e.currentTarget as HTMLElement & { value: string }).value)}
      ></math-field>
      <label class="block" for="latex">{t.latex}</label>
      <textarea id="latex" class="code" rows="2" spellcheck="false" autocapitalize="off" bind:value={mathSource}></textarea>
    {:else}
      <label class="block" for="chem">{t.chemSource}</label>
      <textarea
        id="chem"
        class="code"
        rows="2"
        spellcheck="false"
        autocapitalize="off"
        aria-describedby="chem-help"
        bind:this={chemInput}
        bind:value={chemSource}
      ></textarea>
      <p id="chem-help" class="help">{t.chemHelp}</p>
      <div class="palette" role="group" aria-label={t.palette}>
        {#each CHEM_PALETTE as [code, label] (code)}
          <button type="button" class="chip" onclick={() => insert(code)} title={code}>{label}</button>
        {/each}
      </div>
    {/if}

    <h2 class="block">{t.preview}</h2>
    <div class="preview" aria-live="polite">
      {#if error}
        <p class="error" role="alert"><strong>{t.error}</strong> : {error}</p>
      {:else if preview}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- rendu KaTeX, trust:false -->
        {@html preview}
      {:else}
        <p class="muted">{t.empty}</p>
      {/if}
    </div>
  </section>

  <section class="card" aria-labelledby="h-copy">
    <h2 id="h-copy">{t.copy}</h2>
    <ul class="copies">
      <li>
        <button type="button" class="primary" disabled={!ready} onclick={copyWord}>{t.copyWord}</button>
        <span class="help">{t.copyWordHelp}</span>
      </li>
      <li>
        <button type="button" disabled={!ready} onclick={copyLibre}>{t.copyLibre}</button>
        <span class="help">{t.copyLibreHelp}</span>
      </li>
      <li>
        <button type="button" disabled={!ready} onclick={copyLatex}>{t.copyLatex}</button>
        <span class="help">{t.copyLatexHelp}</span>
      </li>
      <li>
        <span class="row">
          <button type="button" disabled={!ready} onclick={copyImage}>{t.copyImage}</button>
          <button type="button" disabled={!ready} onclick={downloadImage}>{t.downloadImage}</button>
          <label class="inline"><input type="checkbox" bind:checked={white} /> {t.white}</label>
        </span>
        <span class="help">{t.copyImageHelp}</span>
      </li>
    </ul>
    <p class="status" role="status">{status}</p>
    {#if fallback}
      <label class="block" for="fallback">{fallback.label}</label>
      <textarea id="fallback" class="code" rows="4" readonly bind:this={fallbackArea} value={fallback.text}></textarea>
    {/if}
  </section>

  <section class="card" aria-labelledby="h-notebook">
    <h2 id="h-notebook">{t.notebook}</h2>
    <p class="help">{t.notebookHelp}</p>
    <div class="row">
      <label class="grow">
        <span class="sr-only">{t.entryTitle}</span>
        <input type="text" placeholder={t.entryTitle} bind:value={title} />
      </label>
      <button type="button" class="primary" disabled={!ready} onclick={addOrUpdate}>
        {editing && entries.some((e) => e.id === editing) ? t.update : t.add}
      </button>
      <button type="button" onclick={newFormula}>{t.newFormula}</button>
    </div>

    {#if entries.length}
      <ul class="entries">
        {#each entries as e (e.id)}
          <li class:current={e.id === editing}>
            <span class="entry-title">{e.title}</span>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- rendu KaTeX, trust:false -->
            <span class="entry-math">{@html entryHtml(e)}</span>
            <span class="row">
              <button type="button" class="small" onclick={() => openEntry(e)} aria-label="{t.open} : {e.title}">{t.open}</button>
              <button type="button" class="small" onclick={() => removeEntry(e)} aria-label="{t.remove} : {e.title}">{t.remove}</button>
            </span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">{t.noEntries}</p>
    {/if}

    <div class="row">
      <button type="button" disabled={!entries.length} onclick={saveNotebook}>{t.save}</button>
      <label class="button">
        {t.load}
        <input class="sr-only" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onchange={loadNotebook} />
      </label>
    </div>
  </section>
</main>

<footer>
  <p>{t.footer} <a href="https://github.com/fhoudebert/Abbon">github.com/fhoudebert/Abbon</a></p>
</footer>

<style>
  :global(:root) {
    --bg: #fbfcf9;
    --surface: #ffffff;
    --text: #1c2418;
    --muted: #5b6655;
    --border: #d5dccf;
    --accent: #2f6b1f;
    --accent-soft: #e6f1df;
    --bad: #b3261e;
    --code-bg: #f3f5f0;
    color-scheme: light;
  }
  :global(:root[data-theme='dark']) {
    --bg: #12160f;
    --surface: #1b2117;
    --text: #e8eee3;
    --muted: #a3ae9b;
    --border: #2e3729;
    --accent: #8fd16b;
    --accent-soft: #23301c;
    --bad: #ff8a80;
    --code-bg: #0d110b;
    color-scheme: dark;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root[data-theme='system']) {
      --bg: #12160f;
      --surface: #1b2117;
      --text: #e8eee3;
      --muted: #a3ae9b;
      --border: #2e3729;
      --accent: #8fd16b;
      --accent-soft: #23301c;
      --bad: #ff8a80;
      --code-bg: #0d110b;
      color-scheme: dark;
    }
  }
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }
  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, 'Noto Sans', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: var(--text);
    background: var(--bg);
  }
  header,
  main,
  footer {
    max-width: 52rem;
    margin: 0 auto;
    padding: 0 1rem;
  }
  header {
    padding-top: 1.25rem;
  }
  h1 {
    margin: 0 0 0.25rem;
    font-size: 1.6rem;
  }
  h2 {
    font-size: 1.1rem;
    margin: 0 0 0.5rem;
  }
  .intro {
    margin: 0 0 0.75rem;
    color: var(--muted);
  }
  .prefs {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .prefs label {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  .modes {
    border: none;
    padding: 0;
    margin: 0 0 0.75rem;
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
  }
  .modes legend {
    font-weight: 600;
    margin-bottom: 0.25rem;
    padding: 0;
  }
  .block {
    display: block;
    font-weight: 600;
    margin: 0.75rem 0 0.3rem;
  }
  h2.block {
    font-size: 1rem;
  }
  math-field {
    display: block;
    width: 100%;
    font-size: 1.5rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    --caret-color: var(--accent);
    --selection-background-color: var(--accent-soft);
    --primary-color: var(--accent);
  }
  @media (hover: hover) and (pointer: fine) {
    math-field::part(virtual-keyboard-toggle) {
      display: none;
    }
  }
  textarea,
  input[type='text'],
  select {
    font: inherit;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.4rem 0.6rem;
  }
  textarea {
    width: 100%;
    resize: vertical;
  }
  .code {
    font-family: ui-monospace, 'Cascadia Mono', 'DejaVu Sans Mono', Menlo, monospace;
    font-size: 0.95rem;
    background: var(--code-bg);
  }
  :is(textarea, input, select, button, math-field, .button):focus-visible,
  .button:focus-within {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
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
  .preview {
    min-height: 4rem;
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
  .muted {
    color: var(--muted);
    margin: 0;
    font-size: 1rem;
  }
  button,
  .button {
    font: inherit;
    cursor: pointer;
    color: var(--accent);
    background: var(--surface);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 0.4rem 0.9rem;
    min-height: 2.5rem;
    display: inline-flex;
    align-items: center;
  }
  button.primary {
    color: var(--surface);
    background: var(--accent);
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  button.chip,
  button.small {
    min-height: 2.25rem;
    padding: 0.2rem 0.6rem;
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
    grid-template-columns: minmax(10rem, max-content) 1fr;
    gap: 0.75rem;
    align-items: center;
  }
  .copies li:last-child {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
  .copies .help {
    margin: 0;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  .grow {
    flex: 1 1 14rem;
  }
  .grow input {
    width: 100%;
  }
  .inline {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
  }
  .status {
    min-height: 1.5rem;
    margin: 0.75rem 0 0;
    color: var(--accent);
    font-weight: 600;
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
  footer {
    color: var(--muted);
    font-size: 0.9rem;
    padding-bottom: 2rem;
  }
  footer a {
    color: var(--accent);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
  @media (max-width: 560px) {
    .copies li,
    .entries li {
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }
  }
</style>

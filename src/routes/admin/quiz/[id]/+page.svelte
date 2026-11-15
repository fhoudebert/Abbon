<script lang="ts">
  import { onMount } from 'svelte';
  import { beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { app } from '$lib/app.svelte';
  import AdminGate from '$lib/components/AdminGate.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import QuestionEditor from '$lib/components/QuestionEditor.svelte';
  import { cloneQuestion, move, newQuestion, renumber } from '$lib/domain/factory';
  import { mediaHashes } from '$lib/domain/rich';
  import { localize } from '$lib/domain/text';
  import type { Question, QuestionType, Quiz } from '$lib/domain/types';
  import { canPublish, validateQuiz, type Issue } from '$lib/domain/validate';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import { CONTENT_LANGUAGES, languageName } from '$lib/i18n/languages';
  import { preloadMedia } from '$lib/rich/media.svelte';
  import { flushEdits } from '$lib/rich/pending';

  const id = $derived(page.params.id ?? '');

  let draft = $state<Quiz | null>(null);
  let savedJson = $state('');
  let editLang = $state('fr');
  let selected = $state(0);
  let message = $state<string | null>(null);
  let busy = $state(false);
  let notFound = $state(false);
  /** QCM d'un module : contenu protégé, l'éditeur ne s'ouvre pas. */
  let locked = $state<Quiz | null>(null);
  /** Section « informations générales » ouverte au départ pour un QCM sans titre (non réactif ensuite). */
  let generalOpen = $state(false);
  let pendingUrl: URL | null = null;
  let leaving = false;
  let leaveDialog: ConfirmDialog;
  let deleteQuestionDialog: ConfirmDialog;

  const dirty = $derived(draft ? JSON.stringify(draft) !== savedJson : false);
  const issues = $derived(draft ? validateQuiz(draft) : []);
  const errors = $derived(issues.filter((i) => i.level === 'error'));
  const warnings = $derived(issues.filter((i) => i.level === 'warning'));
  const question = $derived(draft?.questions[selected]);
  const main = $derived(draft?.languages[0] ?? 'fr');

  onMount(async () => {
    if (id === 'new') {
      const newId = await app.createQuiz();
      await goto(`/admin/quiz/${newId}`, { replaceState: true });
    }
  });

  // Chargement (et rechargement si l'identifiant change).
  $effect(() => {
    const quizId = id;
    if (quizId === 'new') return;
    void (async () => {
      const quiz = await (await app.repo()).getQuiz(quizId);
      if (!quiz) return (notFound = true);
      if (quiz.moduleId) return (locked = quiz);
      locked = null;
      const values = quiz.questions.flatMap((q) => [
        ...Object.values(q.prompt),
        ...Object.values(q.explanation ?? {}),
        ...q.choices.flatMap((c) => Object.values(c.content)),
      ]);
      await preloadMedia(mediaHashes(values)); // l'éditeur affiche les images tout de suite
      quiz.questions.sort((a, b) => a.position - b.position);
      quiz.questions.forEach((q) => q.choices.sort((a, b) => a.position - b.position));
      generalOpen = !quiz.title[quiz.languages[0]];
      draft = quiz;
      savedJson = JSON.stringify(quiz);
      editLang = quiz.languages.includes(i18n.lang) ? i18n.lang : quiz.languages[0];
      selected = 0;
    })();
  });

  beforeNavigate(({ cancel, to, type }) => {
    flushEdits(); // dernières frappes comprises
    if (!dirty || leaving || type === 'leave' || !to) return;
    cancel();
    pendingUrl = to.url;
    leaveDialog.open();
  });

  // ---- Enregistrement ------------------------------------------------------

  async function save(status?: Quiz['status']): Promise<boolean> {
    flushEdits(); // un clic sur un bouton ne retire pas le focus de l'éditeur sous WebKit
    if (!draft) return false;
    busy = true;
    message = null;
    try {
      const next = $state.snapshot(draft) as Quiz;
      if (status) next.status = status;
      if (next.status === 'published' && !canPublish(validateQuiz(next))) {
        if (status === 'published') {
          message = t('qe.publishBlocked');
          return false;
        }
        next.status = 'draft';
        message = t('qe.backToDraft');
      }
      // Un QCM publié modifié change de version (les tentatives gardent leur copie).
      const wasPublished = JSON.parse(savedJson).status === 'published';
      if (wasPublished && JSON.stringify(next) !== savedJson) next.version += 1;
      next.updatedAt = new Date().toISOString();
      await app.saveQuiz(next);
      draft = next;
      savedJson = JSON.stringify(next);
      message ??= t('common.saved');
      return true;
    } catch (e) {
      message = t('common.error', { error: e instanceof Error ? e.message : String(e) });
      return false;
    } finally {
      busy = false;
    }
  }

  function onKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      flushEdits();
      if (dirty) save();
    }
  }

  // ---- Questions -----------------------------------------------------------

  function addQuestion(type: QuestionType) {
    if (!draft) return;
    draft.questions.push(newQuestion(type, draft.questions.length));
    selected = draft.questions.length - 1;
  }

  function duplicateQuestion(i: number) {
    if (!draft) return;
    draft.questions.splice(i + 1, 0, cloneQuestion($state.snapshot(draft.questions[i]) as Question, i + 1));
    renumber(draft.questions);
    selected = i + 1;
  }

  function deleteQuestion() {
    if (!draft) return;
    draft.questions.splice(selected, 1);
    renumber(draft.questions);
    selected = Math.max(0, Math.min(selected, draft.questions.length - 1));
  }

  function moveQuestion(delta: number) {
    if (!draft) return;
    const to = selected + delta;
    if (to < 0 || to >= draft.questions.length) return;
    move(draft.questions, selected, delta);
    selected = to;
  }

  // ---- Langues -------------------------------------------------------------

  function addLanguage(code: string) {
    if (!draft || !code || draft.languages.includes(code)) return;
    draft.languages.push(code);
    editLang = code;
  }
  function removeLanguage(code: string) {
    if (!draft || code === main) return;
    draft.languages = draft.languages.filter((l) => l !== code);
    if (editLang === code) editLang = main;
  }
  function makeMain(code: string) {
    if (!draft) return;
    draft.languages = [code, ...draft.languages.filter((l) => l !== code)];
  }

  // ---- Champs simples ------------------------------------------------------

  const tagsText = $derived(draft?.tags.join(', ') ?? '');
  const minutes = $derived(draft?.timeLimitSec ? Math.round(draft.timeLimitSec / 60) : '');

  function issueText(i: Issue): string {
    const params = { n: i.questionNumber ?? 0, lang: i.lang ? languageName(i.lang) : '' };
    if (i.code === 'translation_missing' && i.questionNumber) return t('issue.translation_missing_q', params);
    return t(`issue.${i.code}`, params);
  }
  const questionHasError = (qid: string) => errors.some((e) => e.questionId === qid);

  async function duplicateLocked() {
    if (!locked) return;
    const copyId = await app.duplicateQuiz(locked.id, t('admin.copySuffix'));
    await goto(`/admin/quiz/${copyId}`);
  }
</script>

<svelte:head><title>{`${draft ? localize(draft.title, editLang, main) || t('admin.untitled') : t('admin.title')}`} — Abbon</title></svelte:head>

<svelte:window onkeydown={onKey} />

<AdminGate>
  {#if notFound}
    <p>{t('quiz.notFound')}</p>
  {:else if locked}
    <a class="back" href="/admin">← {t('admin.title')}</a>
    <h1>{localize(locked.title, i18n.lang, locked.languages[0])}</h1>
    <p class="muted">{t('module.quizOf', { title: localize(app.moduleOf(locked.moduleId)?.manifest.title ?? {}, i18n.lang) })}</p>
    <p>{t('module.protected')}</p>
    <div class="actions">
      <a class="button secondary" href="/admin/quiz/{locked.id}/preview">{t('preview.title')}</a>
      <button onclick={duplicateLocked}>{t('module.duplicateToEdit')}</button>
    </div>
  {:else if !draft}
    <p aria-busy="true">{t('home.loading')}</p>
  {:else}
    <div class="bar">
      <a class="back" href="/admin">← {t('admin.title')}</a>
      <span class="status {draft.status}">{t(`admin.status.${draft.status}`)}</span>
      <span class="state muted" role="status">{dirty ? t('qe.unsaved') : (message ?? '')}</span>
      <div class="actions">
        {#if dirty}
          <span class="muted small">{t('qe.previewDirty')}</span>
        {:else}
          <a class="button secondary" href="/admin/quiz/{draft.id}/preview">{t('qe.preview')}</a>
        {/if}
        {#if draft.status === 'published'}
          <button class="secondary" disabled={busy} onclick={() => save('draft')}>{t('qe.unpublish')}</button>
        {:else}
          <button class="secondary" disabled={busy || errors.length > 0} title={errors.length ? t('qe.publishBlocked') : ''} onclick={() => save('published')}>{t('qe.publish')}</button>
        {/if}
        <button disabled={busy || !dirty} onclick={() => save()}>{t('common.save')}</button>
      </div>
    </div>
    {#if message && !dirty && message !== t('common.saved')}<p class="note" role="alert">{message}</p>{/if}

    <!-- Langue d'édition -->
    <div class="langs" role="tablist" aria-label={t('qe.editLang')}>
      <span class="muted small">{t('qe.editLang')} :</span>
      {#each draft.languages as l (l)}
        <button role="tab" class="tab" aria-selected={editLang === l} onclick={() => (editLang = l)}>
          {languageName(l)}{#if l === main}<span class="muted small"> · {t('qe.main')}</span>{/if}
        </button>
      {/each}
    </div>

    <details class="panel general" bind:open={generalOpen}>
      <summary><h2>{t('qe.general')}</h2></summary>
      <div class="grid">
        <label class="wide">
          {t('qe.titleField')} ({languageName(editLang)})
          <input type="text" lang={editLang} value={draft.title[editLang] ?? ''} oninput={(e) => (draft!.title = { ...draft!.title, [editLang]: e.currentTarget.value })} />
        </label>
        <label class="wide">
          {t('qe.description')} ({languageName(editLang)})
          <textarea rows="2" lang={editLang} value={draft.description?.[editLang] ?? ''} oninput={(e) => (draft!.description = { ...(draft!.description ?? {}), [editLang]: e.currentTarget.value })}></textarea>
        </label>
        <label>
          {t('qe.category')}
          <select bind:value={draft.categoryId}>
            <option value={null}>{t('common.none')}</option>
            {#each app.categories as c (c.id)}<option value={c.id}>{localize(c.name, i18n.lang)}</option>{/each}
          </select>
        </label>
        <label>
          {t('qe.level')}
          <input type="text" value={draft.level ?? ''} oninput={(e) => (draft!.level = e.currentTarget.value.trim() || null)} />
        </label>
        <label class="wide">
          {t('qe.tags')}
          <input type="text" value={tagsText} onchange={(e) => (draft!.tags = e.currentTarget.value.split(',').map((s) => s.trim()).filter(Boolean))} />
        </label>
        <div class="wide">
          <span>{t('qe.languages')}</span>
          <div class="chips">
            {#each draft.languages as l (l)}
              <span class="chip">
                {languageName(l)}
                {#if l === main}
                  <span class="muted small">({t('qe.main')})</span>
                {:else}
                  <button class="ghost small" onclick={() => makeMain(l)}>{t('qe.makeMain')}</button>
                  <button class="ghost small" aria-label="{t('qe.removeLanguage')} {languageName(l)}" onclick={() => removeLanguage(l)}>✕</button>
                {/if}
              </span>
            {/each}
            <select value="" onchange={(e) => { addLanguage(e.currentTarget.value); e.currentTarget.value = ''; }}>
              <option value="">{t('qe.addLanguage')}</option>
              {#each Object.keys(CONTENT_LANGUAGES).filter((l) => !draft!.languages.includes(l)) as l (l)}
                <option value={l}>{languageName(l)}</option>
              {/each}
            </select>
          </div>
        </div>
        <label>
          {t('qe.timeLimit')}
          <input type="number" min="1" value={minutes} onchange={(e) => (draft!.timeLimitSec = e.currentTarget.value ? Math.max(1, Number(e.currentTarget.value)) * 60 : null)} />
        </label>
        <label>
          {t('qe.threshold')}
          <input type="number" min="1" max="100" value={Math.round(draft.passThreshold * 100)} onchange={(e) => (draft!.passThreshold = Math.min(100, Math.max(1, Number(e.currentTarget.value) || 70)) / 100)} />
        </label>
        <label>
          {t('qe.scoring')}
          <select bind:value={draft.scoring}>
            <option value="all_or_nothing">{t('qe.scoring.all_or_nothing')}</option>
            <option value="partial">{t('qe.scoring.partial')}</option>
          </select>
        </label>
        <label>
          {t('qe.solution')}
          <select bind:value={draft.solutionVisibility}>
            <option value="after_submit">{t('qe.solution.after_submit')}</option>
            <option value="after_pass">{t('qe.solution.after_pass')}</option>
            <option value="never">{t('qe.solution.never')}</option>
          </select>
        </label>
        <label class="check wide">
          <input type="checkbox" bind:checked={draft.shuffle} />
          {t('qe.shuffle')}
        </label>
      </div>
    </details>

    {#if errors.length || warnings.length}
      <section class="panel issues" aria-live="polite">
        {#if errors.length}
          <h2>{t('qe.issues')}</h2>
          <ul>
            {#each errors as i, k (k)}
              <li class="err"><button class="link" onclick={() => i.questionNumber && (selected = i.questionNumber - 1)}>{issueText(i)}</button></li>
            {/each}
          </ul>
        {/if}
        {#if warnings.length}
          <h2>{t('qe.warnings')}</h2>
          <ul>
            {#each warnings as i, k (k)}
              <li class="warn"><button class="link" onclick={() => i.questionNumber && (selected = i.questionNumber - 1)}>{issueText(i)}</button></li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}

    <div class="layout">
      <nav class="qlist panel" aria-label={t('qe.questions')}>
        <h2>{t('qe.questions')}</h2>
        <ol>
          {#each draft.questions as q, i (q.id)}
            <li>
              <button class="qitem" aria-current={i === selected ? 'true' : undefined} onclick={() => (selected = i)}>
                <span class="n">{i + 1}</span>
                <span class="excerpt">{localize(q.prompt, editLang, main) || '…'}</span>
                {#if questionHasError(q.id)}<span class="dot" aria-hidden="true">●</span>{/if}
              </button>
            </li>
          {/each}
        </ol>
        {#if draft.questions.length === 0}<p class="muted small">{t('qe.noQuestion')}</p>{/if}
        <div class="add">
          <button class="secondary" onclick={() => addQuestion('single')}>{t('qe.addSingle')}</button>
          <button class="secondary" onclick={() => addQuestion('multiple')}>{t('qe.addMultiple')}</button>
          <button class="secondary" onclick={() => addQuestion('short')}>{t('qe.addShort')}</button>
          <button class="secondary" onclick={() => addQuestion('numeric')}>{t('qe.addNumeric')}</button>
        </div>
      </nav>

      <section class="panel editor">
        {#if question}
          <div class="qtools">
            <button class="ghost" disabled={selected === 0} onclick={() => moveQuestion(-1)}>↑ {t('common.moveUp')}</button>
            <button class="ghost" disabled={selected === draft.questions.length - 1} onclick={() => moveQuestion(1)}>↓ {t('common.moveDown')}</button>
            <button class="ghost" onclick={() => duplicateQuestion(selected)}>{t('common.duplicate')}</button>
            <button class="ghost danger" onclick={() => deleteQuestionDialog.open()}>{t('common.delete')}</button>
          </div>
          {#key question.id}
            <QuestionEditor bind:question={draft.questions[selected]} number={selected + 1} lang={editLang} />
          {/key}
        {:else}
          <p class="muted">{t('qe.noQuestion')}</p>
        {/if}
      </section>
    </div>
  {/if}
</AdminGate>

<ConfirmDialog
  bind:this={leaveDialog}
  title={t('qe.leave.title')}
  body={t('qe.leave.body')}
  confirmLabel={t('qe.leave.save')}
  onconfirm={async () => {
    if (await save()) {
      leaving = true;
      if (pendingUrl) await goto(pendingUrl);
    }
  }}
>
  {#snippet extra(close)}
    <button
      class="secondary"
      onclick={async () => {
        close();
        leaving = true;
        if (pendingUrl) await goto(pendingUrl);
      }}>{t('qe.leave.discard')}</button
    >
  {/snippet}
</ConfirmDialog>

<ConfirmDialog
  bind:this={deleteQuestionDialog}
  title={t('qe.deleteQuestion.title', { n: selected + 1 })}
  confirmLabel={t('common.delete')}
  danger
  onconfirm={deleteQuestion}
/>

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1rem;
    position: sticky;
    inset-block-start: 4.2rem;
    z-index: 1;
    background: var(--bg);
    padding-block: 0.4rem;
  }
  .bar .back {
    margin: 0;
  }
  .bar .actions {
    margin-inline-start: auto;
  }
  .state {
    font-size: 0.9rem;
  }
  .status {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.1em 0.7em;
    border-radius: 999px;
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .status.published {
    color: var(--ok);
    border-color: var(--ok);
    background: var(--ok-soft);
  }
  .note {
    color: var(--warn);
  }
  .small {
    font-size: 0.85rem;
  }
  .langs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-block: 0.5rem 1rem;
  }
  .tab {
    background: var(--surface);
    color: var(--text);
    border-color: var(--border);
    font-weight: 500;
  }
  .tab[aria-selected='true'] {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--surface);
  }
  .tab[aria-selected='true'] .muted {
    color: inherit;
  }
  .general summary {
    cursor: pointer;
    list-style: revert;
  }
  .general summary h2 {
    display: inline;
    font-size: 1.1rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
    gap: 0.75rem 1rem;
    margin-block-start: 1rem;
  }
  .grid label,
  .grid .wide {
    display: grid;
    gap: 0.25rem;
  }
  .grid .wide {
    grid-column: 1 / -1;
  }
  .grid input[type='text'],
  .grid input[type='number'],
  .grid textarea,
  .grid select {
    min-block-size: var(--tap);
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    font: inherit;
  }
  .grid .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.3rem 0.15rem 0.7rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .chip button {
    min-block-size: 1.8rem;
    padding-inline: 0.4rem;
  }
  .issues {
    margin-block: 1rem;
  }
  .issues h2 {
    font-size: 1rem;
    margin-block-end: 0.25rem;
  }
  .issues ul {
    margin: 0 0 0.5rem;
    padding-inline-start: 1.2rem;
  }
  .issues .err {
    color: var(--bad);
  }
  .issues .warn {
    color: var(--warn);
  }
  .link {
    all: unset;
    cursor: pointer;
    text-decoration: underline dotted;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(14rem, 18rem) 1fr;
    gap: 1rem;
    margin-block-start: 1rem;
    align-items: start;
  }
  .qlist h2 {
    font-size: 1rem;
  }
  .qlist ol {
    list-style: none;
    padding: 0;
    margin: 0 0 0.75rem;
    display: grid;
    gap: 0.25rem;
  }
  .qitem {
    all: unset;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1.6rem 1fr auto;
    gap: 0.4rem;
    align-items: center;
    inline-size: 100%;
    min-block-size: var(--tap);
    padding: 0.3rem 0.5rem;
    border-radius: 8px;
    cursor: pointer;
  }
  .qitem:hover {
    background: var(--bg);
  }
  .qitem[aria-current='true'] {
    background: var(--accent-soft);
    outline: 1px solid var(--accent);
  }
  .qitem:focus-visible {
    outline: 3px solid var(--accent);
  }
  .n {
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .excerpt {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dot {
    color: var(--bad);
    font-size: 0.7rem;
  }
  .add {
    display: grid;
    gap: 0.4rem;
  }
  .qtools {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    justify-content: flex-end;
    margin-block-end: 0.5rem;
  }
  .danger {
    color: var(--bad);
  }
  @media (max-width: 820px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .bar {
      position: static;
    }
  }
</style>

<script lang="ts">
  import { strFromU8 } from 'fflate';
  import { app } from '$lib/app.svelte';
  import AdminGate from '$lib/components/AdminGate.svelte';
  import { localize } from '$lib/domain/text';
  import { readPicked } from '$lib/files';
  import { parseGift, type GiftResult } from '$lib/interchange/gift';
  import { checkRequirements, planModule, type ModulePlan, type Requirements } from '$lib/interchange/module';
  import { actionsFor, planImport, resolveImport, type PlanItem } from '$lib/interchange/plan';
  import { MODULES_URL, openExternal } from '$lib/links';
  import { PackageError, parsePackage, type MediaFile, type Problem } from '$lib/interchange/qcmPackage';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import type { MessageKey } from '$lib/i18n/fr';

  type Stage = 'pick' | 'reading' | 'review' | 'running' | 'done';

  let stage = $state<Stage>('pick');
  let fileName = $state('');
  let error = $state<string | null>(null);
  let plan = $state<PlanItem[]>([]);
  let problems = $state<Problem[]>([]);
  let gift = $state<GiftResult | null>(null);
  let categories = $state<import('$lib/domain/types').Category[]>([]);
  let media: Map<string, MediaFile> = new Map();
  let backupName = $state<string | null>(null);
  let report = $state<{ added: number; replaced: number; duplicated: number; skipped: number } | null>(null);
  let failures = $state<{ title: string; error: string }[]>([]);
  /** Le fichier est un module : installation d'un bloc, sans choix QCM par QCM. */
  let modulePlan = $state.raw<ModulePlan | null>(null);
  let requirements = $state.raw<Requirements | null>(null);
  let installed = $state<{ title: string; version: string; quizzes: number } | null>(null);

  const lang = $derived(i18n.lang);
  const titleOf = (q: { title: Record<string, string>; languages: string[] }) =>
    localize(q.title, lang, q.languages[0]) || t('admin.untitled');
  const toImport = $derived(plan.filter((p) => p.action !== 'skip').length);

  function reset() {
    stage = 'pick';
    error = null;
    plan = [];
    problems = [];
    gift = null;
    report = null;
    failures = [];
    backupName = null;
    modulePlan = null;
    requirements = null;
    installed = null;
  }

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    reset();
    fileName = file.name;
    stage = 'reading';
    try {
      const bytes = await readPicked(file);
      const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b; // « PK »
      if (isZip) {
        const p = await parsePackage(bytes);
        if (p.manifest.kind === 'backup') throw new Error(t('import.err.backup'));
        problems = p.problems;
        categories = p.categories;
        media = p.media;
        if (p.module) {
          modulePlan = planModule(p.module, p, { modules: app.modules, quizzes: app.quizzes, categories: app.categories });
          requirements = checkRequirements(p.module, __APP_VERSION__);
          stage = 'review';
          return;
        }
        plan = planImport(p.quizzes, app.quizzes);
      } else {
        const title = file.name.replace(/\.(gift|txt)$/i, '');
        gift = parseGift(strFromU8(bytes), title, lang);
        plan = gift.quiz.questions.length ? planImport([gift.quiz], app.quizzes) : [];
        categories = [];
        media = new Map();
      }
      if (!plan.length) throw new Error(t('import.err.empty'));
      stage = 'review';
    } catch (err) {
      error =
        err instanceof PackageError
          ? t(`import.err.${err.code}` as MessageKey)
          : err instanceof Error
            ? err.message
            : String(err);
      stage = 'pick';
    }
  }

  async function run() {
    stage = 'running';
    try {
      backupName = await app.autoBackup();
      const resolved = resolveImport($state.snapshot(plan) as PlanItem[], categories, app.categories, t('import.copySuffix'));
      const { failed } = await app.applyImport(resolved, media);
      const r = resolved.report;
      report = { added: r.added.length, replaced: r.replaced.length, duplicated: r.duplicated.length, skipped: r.skipped.length };
      failures = failed.map((f) => ({
        title: titleOf(resolved.quizzes.find((q) => q.id === f.id) ?? { title: {}, languages: [] }),
        error: f.error,
      }));
      stage = 'done';
    } catch (err) {
      error = t('common.error', { error: err instanceof Error ? err.message : String(err) });
      stage = 'review';
    }
  }

  async function install() {
    if (!modulePlan) return;
    stage = 'running';
    try {
      backupName = await app.autoBackup();
      await app.installModule(modulePlan, media);
      installed = { title: moduleTitle, version: modulePlan.manifest.version, quizzes: modulePlan.quizzes.length };
      stage = 'done';
    } catch (err) {
      error = t('common.error', { error: err instanceof Error ? err.message : String(err) });
      stage = 'review';
    }
  }

  const moduleTitle = $derived(modulePlan ? localize(modulePlan.manifest.title, lang) : '');
  const installLabel = $derived(
    t(({ new: 'module.install', update: 'module.update', same: 'module.reinstall', older: 'module.downgrade' } as const)[modulePlan?.status ?? 'new']),
  );

  const problemText = (p: Problem) =>
    t(`problem.${p.code}` as MessageKey, { ref: p.ref ? (p.ref.length > 20 ? p.ref.slice(0, 12) + '…' : p.ref) : '', detail: p.detail ?? '' });
</script>

<svelte:head><title>{t('import.title')} — Abbon</title></svelte:head>

<AdminGate>
  <a class="back" href="/admin">← {t('admin.title')}</a>
  <h1>{t('import.title')}</h1>

  {#if stage === 'pick' || stage === 'reading'}
    <p class="muted">{t('import.intro')}</p>
    <label class="button picker">
      {t('import.pick')}
      <input type="file" accept=".qcm,.gift,.txt,application/zip,text/plain" onchange={onFile} disabled={stage === 'reading'} />
    </label>
    {#if stage === 'reading'}<p aria-busy="true">{t('import.reading')}</p>{/if}
    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <p class="get">
      <a href={MODULES_URL} target="_blank" rel="noopener noreferrer" onclick={(e) => openExternal(e, MODULES_URL)}>{t('module.get')}</a>
    </p>
  {:else if (stage === 'review' || stage === 'running') && modulePlan}
    {@const m = modulePlan.manifest}
    <p class="muted">{t('import.from', { name: fileName })}</p>

    <section class="panel module">
      <h2>{moduleTitle} <span class="badge">{t('module.badge')}</span></h2>
      {#if m.description}<p>{localize(m.description, lang)}</p>{/if}
      <ul class="facts muted">
        <li>{t('module.version', { version: m.version })}</li>
        <li>{t('module.quizzes', { n: modulePlan.quizzes.length })}</li>
        <li>{t('quiz.questions', { n: modulePlan.quizzes.reduce((n, q) => n + q.questions.length, 0) })}</li>
        <li>{t('module.license', { license: m.license })}</li>
        {#if m.authors.length}<li>{t('module.authors', { authors: m.authors.join(', ') })}</li>{/if}
      </ul>
      <p class:warn={modulePlan.status === 'older'}>
        {t(`module.status.${modulePlan.status}`, { from: modulePlan.installedVersion ?? '', to: m.version })}
      </p>
      {#if requirements?.appTooOld}<p class="error" role="alert">{t('module.req.app', { version: requirements.appTooOld })}</p>{/if}
      {#if requirements?.missingFeatures.length}
        <p class="error" role="alert">{t('module.req.features', { features: requirements.missingFeatures.join(', ') })}</p>
      {/if}
      {#if !modulePlan.quizzes.length}<p class="error" role="alert">{t('module.none')}</p>{/if}
    </section>

    {#if problems.length || modulePlan.conflicts.length || modulePlan.missing.length || modulePlan.removedQuizIds.length}
      <section class="panel problems">
        <h2>{t('import.problems')}</h2>
        <ul>
          {#if modulePlan.conflicts.length}<li>{t('module.conflicts', { n: modulePlan.conflicts.length })}</li>{/if}
          {#if modulePlan.missing.length}<li>{t('module.missing', { n: modulePlan.missing.length })}</li>{/if}
          {#if modulePlan.removedQuizIds.length}<li>{t('module.removed', { n: modulePlan.removedQuizIds.length })}</li>{/if}
          {#each problems as p, k (k)}<li>{problemText(p)}</li>{/each}
        </ul>
      </section>
    {/if}

    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <div class="actions">
      <button class="secondary" onclick={reset} disabled={stage === 'running'}>{t('common.cancel')}</button>
      <button onclick={install} disabled={stage === 'running' || !requirements?.ok || !modulePlan.quizzes.length}>
        {stage === 'running' ? t('module.installing') : installLabel}
      </button>
    </div>
  {:else if stage === 'review' || stage === 'running'}
    <p class="muted">{t('import.from', { name: fileName })}</p>

    <table class="plan">
      <thead>
        <tr><th>{t('import.col.quiz')}</th><th>{t('import.col.status')}</th><th>{t('import.col.action')}</th></tr>
      </thead>
      <tbody>
        {#each plan as item, i (item.quiz.id + i)}
          <tr>
            <td>
              <strong>{titleOf(item.quiz)}</strong><br />
              <small class="muted">{t('quiz.questions', { n: item.quiz.questions.length })}</small>
            </td>
            <td class="muted">
              {item.existing?.moduleId
                ? t('import.moduleQuiz')
                : item.existing
                  ? t('import.exists', { mine: item.existing.version, theirs: item.quiz.version })
                  : t('import.new')}
            </td>
            <td>
              <select bind:value={plan[i].action} disabled={stage === 'running'} aria-label={t('import.col.action')}>
                {#each actionsFor(item) as a (a)}<option value={a}>{t(`import.action.${a}`)}</option>{/each}
              </select>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if problems.length || gift?.skipped.length || gift?.categoriesIgnored}
      <section class="panel problems">
        <h2>{t('import.problems')}</h2>
        <ul>
          {#each problems as p, k (k)}<li>{problemText(p)}</li>{/each}
          {#each gift?.skipped ?? [] as s (s.index)}
            <li>{t('gift.skipped', { n: s.index, title: s.title, reason: t(`gift.reason.${s.reason}`) })}</li>
          {/each}
          {#if gift?.categoriesIgnored}<li>{t('gift.categories')}</li>{/if}
        </ul>
      </section>
    {/if}

    {#if error}<p class="error" role="alert">{error}</p>{/if}
    <div class="actions">
      <button class="secondary" onclick={reset} disabled={stage === 'running'}>{t('common.cancel')}</button>
      <button onclick={run} disabled={stage === 'running' || toImport === 0}>
        {stage === 'running' ? t('import.running') : `${t('import.run')} (${toImport})`}
      </button>
    </div>
  {:else if stage === 'done' && installed}
    <section class="panel done" role="status">
      <h2>{t('import.done')}</h2>
      <p>{t('module.installed', installed)}</p>
      {#if backupName}<p class="muted small">{t('import.backupDone', { name: backupName })}</p>{/if}
      <div class="actions">
        <a class="button" href="/">{t('nav.home')}</a>
        <a class="button secondary" href="/admin">{t('import.toAdmin')}</a>
        <button class="secondary" onclick={reset}>{t('import.again')}</button>
      </div>
    </section>
  {:else if stage === 'done' && report}
    <section class="panel done" role="status">
      <h2>{t('import.done')}</h2>
      <p>{t('import.report', report)}</p>
      {#each failures as f, k (k)}<p class="error">{t('import.failed', f)}</p>{/each}
      {#if backupName}<p class="muted small">{t('import.backupDone', { name: backupName })}</p>{/if}
      <div class="actions">
        <a class="button" href="/admin">{t('import.toAdmin')}</a>
        <button class="secondary" onclick={reset}>{t('import.again')}</button>
      </div>
    </section>
  {/if}
</AdminGate>

<style>
  .picker {
    position: relative;
    cursor: pointer;
  }
  .picker input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .error {
    color: var(--bad);
  }
  .plan {
    inline-size: 100%;
    border-collapse: collapse;
    margin-block: 1rem;
  }
  .plan th,
  .plan td {
    text-align: start;
    padding: 0.6rem 0.5rem;
    border-block-end: 1px solid var(--border);
    vertical-align: middle;
  }
  .plan select {
    min-block-size: var(--tap);
  }
  .get {
    margin-block-start: 1.5rem;
  }
  .module {
    margin-block: 1rem;
  }
  .module h2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
    margin-block-start: 0;
  }
  .badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.1em 0.7em;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.25rem;
    list-style: none;
    padding: 0;
    margin-block: 0 0.75rem;
  }
  .warn {
    color: var(--warn);
  }
  .problems {
    margin-block: 1rem;
    border-color: var(--warn);
  }
  .problems h2,
  .done h2 {
    font-size: 1.05rem;
  }
  .problems ul {
    margin: 0;
    padding-inline-start: 1.2rem;
  }
  .small {
    font-size: 0.85rem;
  }
  .actions {
    justify-content: flex-end;
  }
  @media (max-width: 640px) {
    .plan thead {
      display: none;
    }
    .plan tr {
      display: grid;
      gap: 0.25rem;
      padding-block: 0.5rem;
      border-block-end: 1px solid var(--border);
    }
    .plan td {
      border: 0;
      padding: 0;
    }
  }
</style>

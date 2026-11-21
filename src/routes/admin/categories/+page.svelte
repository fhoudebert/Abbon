<script lang="ts">
  import { app } from '$lib/app.svelte';
  import AdminGate from '$lib/components/AdminGate.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { newId } from '$lib/domain/text';
  import type { Category } from '$lib/domain/types';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import { localize } from '$lib/domain/text';

  let toDelete = $state<Category | null>(null);
  let confirm: ConfirmDialog;

  const lang = $derived(i18n.lang);
  const UI_LANGS = ['fr', 'en'];
  const name = (c: Category) => localize(c.name, lang) || '—';

  /** Sauvegarde d'un champ quand on quitte la zone de saisie. */
  async function update(c: Category, patch: Partial<Category>) {
    await app.saveCategory({ ...$state.snapshot(c), ...patch } as Category);
  }

  async function add() {
    const position = app.categories.length ? Math.max(...app.categories.map((c) => c.position)) + 1 : 0;
    await app.saveCategory({ id: newId(), parentId: null, name: { [lang]: t('cat.new') }, position });
  }

  async function swap(i: number, delta: number) {
    const list = app.categories;
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    const a = $state.snapshot(list[i]) as Category;
    const b = $state.snapshot(list[j]) as Category;
    await app.saveCategory({ ...a, position: j });
    await app.saveCategory({ ...b, position: i });
  }

  /** Une catégorie ne peut pas avoir pour parent elle-même ni une de ses descendantes. */
  function descendants(id: string): Set<string> {
    const out = new Set<string>([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of app.categories)
        if (c.parentId && out.has(c.parentId) && !out.has(c.id)) {
          out.add(c.id);
          grew = true;
        }
    }
    return out;
  }
</script>

<svelte:head><title>{t('cat.title')} — Abbon</title></svelte:head>

<AdminGate>
  <a class="back" href="/admin">← {t('admin.title')}</a>
  <div class="head">
    <h1>{t('cat.title')}</h1>
    <button onclick={add}>{t('cat.add')}</button>
  </div>

  {#if app.categories.length === 0}
    <p class="muted">{t('cat.empty')}</p>
  {/if}

  <ul class="list">
    {#each app.categories as c, i (c.id)}
      {@const excluded = descendants(c.id)}
      <li class="panel">
        {#each UI_LANGS as l (l)}
          <label>
            <span class="small muted">{t('cat.name', { lang: l.toUpperCase() })}</span>
            <input
              type="text"
              value={c.name[l] ?? ''}
              onchange={(e) => update(c, { name: { ...c.name, [l]: e.currentTarget.value.trim() } })}
            />
          </label>
        {/each}
        <label>
          <span class="small muted">{t('cat.parent')}</span>
          <select value={c.parentId ?? ''} onchange={(e) => update(c, { parentId: e.currentTarget.value || null })}>
            <option value="">{t('common.none')}</option>
            {#each app.categories.filter((p) => !excluded.has(p.id)) as p (p.id)}
              <option value={p.id}>{name(p)}</option>
            {/each}
          </select>
        </label>
        <div class="actions">
          <button class="ghost" title={t('common.moveUp')} aria-label={t('common.moveUp')} disabled={i === 0} onclick={() => swap(i, -1)}>↑</button>
          <button class="ghost" title={t('common.moveDown')} aria-label={t('common.moveDown')} disabled={i === app.categories.length - 1} onclick={() => swap(i, 1)}>↓</button>
          <button
            class="ghost danger"
            onclick={() => {
              toDelete = c;
              queueMicrotask(() => confirm.open());
            }}>{t('common.delete')}</button
          >
        </div>
      </li>
    {/each}
  </ul>
</AdminGate>

<ConfirmDialog
  bind:this={confirm}
  title={t('cat.delete.title', { name: toDelete ? name(toDelete) : '' })}
  body={t('cat.delete.body')}
  confirmLabel={t('common.delete')}
  danger
  onconfirm={async () => {
    if (toDelete) await app.deleteCategory(toDelete.id);
    toDelete = null;
  }}
/>

<style>
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-block-end: 1rem;
  }
  .head h1 {
    margin: 0;
  }
  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.6rem;
  }
  .list li {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 0.5rem 0.75rem;
    align-items: end;
  }
  label {
    display: grid;
    gap: 0.15rem;
  }
  input,
  select {
    min-block-size: var(--tap);
    padding-inline: 0.6rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }
  .small {
    font-size: 0.8rem;
  }
  .danger {
    color: var(--bad);
  }
  @media (max-width: 760px) {
    .list li {
      grid-template-columns: 1fr;
    }
  }
</style>

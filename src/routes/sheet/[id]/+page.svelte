<script lang="ts">
  import { page } from '$app/state';
  import { app } from '$lib/app.svelte';
  import { mediaHashes, pick } from '$lib/domain/rich';
  import { localize } from '$lib/domain/text';
  import { i18n, t } from '$lib/i18n/index.svelte';
  import { preloadMedia } from '$lib/rich/media.svelte';
  import RichContent from '$lib/rich/RichContent.svelte';

  /** Fiche de révision d'une catégorie (fournie par un module installé). */
  const id = $derived(page.params.id ?? '');
  const lang = $derived(i18n.lang);
  const category = $derived(app.categories.find((c) => c.id === id));
  const sheet = $derived(app.sheetOf(id));
  const name = $derived(category ? localize(category.name, lang) : '');
  /** Langue réellement affichée (celle de l'interface, sinon la première disponible). */
  const shown = $derived(sheet ? (sheet[lang] ? lang : Object.keys(sheet)[0]) : lang);

  $effect(() => {
    if (sheet) void preloadMedia(mediaHashes(Object.values(sheet)));
  });
</script>

<svelte:head><title>{t('sheet.title', { name })} — Abbon</title></svelte:head>

<button class="back link" onclick={() => history.back()}>← {t('common.back')}</button>

{#if !app.ready}
  <p aria-busy="true">{t('home.loading')}</p>
{:else if !sheet}
  <p>{t('sheet.notFound')}</p>
{:else}
  <h1>{t('sheet.title', { name })}</h1>
  <article class="panel sheet" lang={shown}>
    <RichContent value={pick(sheet, lang)} />
  </article>
{/if}

<style>
  .link {
    background: none;
    border: 0;
    padding: 0;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
    min-block-size: var(--tap);
  }
  h1 {
    font-size: 1.4rem;
  }
  .sheet {
    line-height: 1.6;
  }
  .sheet :global(h3) {
    font-size: 1.15rem;
    margin-block: 1.4em 0.5em;
  }
  .sheet :global(h3:first-child) {
    margin-block-start: 0;
  }
  .sheet :global(li) {
    margin-block-end: 0.3em;
  }
</style>

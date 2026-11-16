<script lang="ts">
  import '../app.css';
  import { onMount, type Snippet } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { app } from '$lib/app.svelte';
  import { prefs } from '$lib/prefs.svelte';
  import { updates } from '$lib/update.svelte';
  import { i18n, t, SUPPORTED } from '$lib/i18n/index.svelte';

  let { children }: { children: Snippet } = $props();

  /** Questions de la boîte de révision à revoir maintenant (pastille du menu). */
  const dueCount = $derived(app.ready ? app.dueCount() : 0);

  onMount(async () => {
    await app.init();
    await prefs.load();
    void updates.init(); // vérification éventuelle, sans bloquer l'affichage
  });

  // Changement d'écran : le focus va au contenu (lecteurs d'écran, clavier), comme un chargement de page.
  afterNavigate(({ type }) => {
    if (type !== 'enter') document.getElementById('main')?.focus();
  });

  const langNames: Record<string, string> = { fr: 'Français', en: 'English' };
</script>

<a class="skip" href="#main">{t('a11y.skip')}</a>

<header class="top">
  <a class="brand" href="/">
    <img src="/abbon.png" alt="" width="40" height="40" />
    <span>
      <strong>{t('app.name')}</strong>
      <small>{t('app.tagline')}</small>
    </span>
  </a>

  <nav>
    <a href="/" aria-current={page.url.pathname === '/' ? 'page' : undefined}>{t('nav.home')}</a>
    <a href="/leitner" aria-current={page.url.pathname === '/leitner' ? 'page' : undefined}>
      {t('nav.leitner')}{#if dueCount > 0}<span class="count" aria-hidden="true">{dueCount}</span><span class="visually-hidden"> ({t('nav.leitnerDue', { n: dueCount })})</span>{/if}
    </a>
    <a href="/admin" aria-current={page.url.pathname.startsWith('/admin') ? 'page' : undefined}>{t('nav.admin')}</a>
    <a href="/settings" aria-current={page.url.pathname === '/settings' ? 'page' : undefined}>{t('nav.settings')}</a>
    <a href="/about" aria-current={page.url.pathname === '/about' ? 'page' : undefined}>{t('nav.about')}</a>
  </nav>

  <label class="lang">
    <span class="visually-hidden">{t('lang.label')}</span>
    <select value={i18n.lang} onchange={(e) => app.changeLang(e.currentTarget.value)}>
      {#each SUPPORTED as code (code)}
        <option value={code}>{langNames[code]}</option>
      {/each}
    </select>
  </label>
</header>

{#if updates.status === 'available' && updates.release && page.url.pathname !== '/settings'}
  <div class="banner" role="status">
    {t('update.banner', { version: updates.release.version })}
    <a href="/settings#updates">{t('update.see')}</a>
  </div>
{/if}

<main id="main" tabindex="-1">
  {@render children()}
</main>

<style>
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 1.25rem;
    padding: max(0.75rem, env(safe-area-inset-top)) 1rem 0.75rem;
    border-block-end: 1px solid var(--border);
    background: var(--surface);
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: inherit;
    text-decoration: none;
    margin-inline-end: auto;
  }
  .brand span {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }
  .brand strong {
    font-size: 1.25rem;
  }
  .brand small {
    color: var(--muted);
  }
  nav {
    display: flex;
    gap: 1rem;
  }
  nav a {
    color: var(--muted);
    text-decoration: none;
    padding-block: 0.5rem;
    border-block-end: 2px solid transparent;
  }
  .count {
    display: inline-block;
    min-inline-size: 1.5em;
    margin-inline-start: 0.35em;
    padding: 0 0.4em;
    border-radius: 999px;
    background: var(--accent);
    color: var(--surface);
    font-size: 0.8em;
    font-weight: 600;
    text-align: center;
  }
  nav a[aria-current='page'] {
    color: var(--text);
    border-color: var(--accent);
  }
  .banner {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    padding: 0.5rem 1rem;
    background: var(--accent-soft);
    border-block-end: 1px solid var(--accent);
  }
  /* Téléphone : en-tête compact (la langue se choisit dans Paramètres), non collé en haut. */
  @media (max-width: 600px) {
    .top {
      position: static;
      padding-block-end: 0.25rem;
      gap: 0.25rem 1rem;
    }
    .lang {
      display: none;
    }
    nav {
      inline-size: 100%;
      justify-content: space-between;
    }
  }
  main {
    max-inline-size: 1100px;
    margin-inline: auto;
    padding: 1rem;
    padding-block-end: max(1rem, env(safe-area-inset-bottom));
  }
</style>

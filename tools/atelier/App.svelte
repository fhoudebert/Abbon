<script lang="ts">
  /** Page autonome de l'atelier de formules : en-tête (langue, thème) autour de l'écran de l'application. */
  import FormulaWorkshop from '$lib/atelier/FormulaWorkshop.svelte';
  import { i18n, setLang, t, SUPPORTED } from '$lib/i18n/index.svelte';
  import { REPO_URL } from '$lib/links';

  const KEY = 'abbon-atelier-prefs';
  type Theme = 'system' | 'light' | 'dark';
  let saved: { lang?: string; theme?: Theme } = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    /* rien de gardé */
  }
  if (saved.lang) setLang(saved.lang);
  let theme = $state<Theme>(saved.theme ?? 'system');
  const names: Record<string, string> = { fr: 'Français', en: 'English' };

  $effect(() => {
    document.documentElement.lang = i18n.lang;
    document.documentElement.dataset.theme = theme;
    document.title = `${t('atelier.title')} — Abbon`;
    try {
      localStorage.setItem(KEY, JSON.stringify({ lang: i18n.lang, theme }));
    } catch {
      /* stockage indisponible */
    }
  });
</script>

<header>
  <h1>{t('atelier.title')}</h1>
  <p class="muted">{t('atelier.intro')}</p>
  <div class="actions">
    <label>
      {t('lang.label')}
      <select value={i18n.lang} onchange={(e) => setLang(e.currentTarget.value)}>
        {#each SUPPORTED as code (code)}
          <option value={code}>{names[code]}</option>
        {/each}
      </select>
    </label>
    <label>
      {t('atelier.theme')}
      <select bind:value={theme}>
        <option value="system">{t('atelier.themeSystem')}</option>
        <option value="light">{t('atelier.themeLight')}</option>
        <option value="dark">{t('atelier.themeDark')}</option>
      </select>
    </label>
  </div>
</header>

<main>
  <FormulaWorkshop />
</main>

<footer>
  <p class="muted">{t('atelier.footer')} <a href={REPO_URL}>{REPO_URL.replace('https://', '')}</a></p>
</footer>

<style>
  header,
  main,
  footer {
    max-inline-size: 52rem;
    margin-inline: auto;
    padding-inline: 1rem;
  }
  header {
    padding-block-start: 1.25rem;
    margin-block-end: 1rem;
  }
  h1 {
    font-size: 1.6rem;
    margin-block-end: 0.25rem;
  }
  header p {
    margin-block: 0 0.75rem;
  }
  header label {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
  }
  footer {
    font-size: 0.9rem;
    padding-block: 1rem 2rem;
  }
</style>

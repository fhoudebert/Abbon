/**
 * Préférences d'affichage : thème et taille du texte.
 *
 * Appliquées sur <html> (data-theme, data-text-size). Une copie est gardée dans le stockage
 * local du navigateur pour s'appliquer dès le chargement, avant l'ouverture de la base ;
 * la base (table setting) fait foi et suit l'appareil dans les sauvegardes.
 */
import { app } from '$lib/app.svelte';

export type Theme = 'system' | 'light' | 'dark';
export type TextSize = 'normal' | 'large' | 'xlarge';

export const THEMES: Theme[] = ['system', 'light', 'dark'];
export const TEXT_SIZES: TextSize[] = ['normal', 'large', 'xlarge'];

const isTheme = (v: unknown): v is Theme => THEMES.includes(v as Theme);
const isSize = (v: unknown): v is TextSize => TEXT_SIZES.includes(v as TextSize);

function local(key: string): string | null {
  try {
    return localStorage.getItem(`abbon.${key}`);
  } catch {
    return null;
  }
}
function setLocal(key: string, value: string) {
  try {
    localStorage.setItem(`abbon.${key}`, value);
  } catch {
    /* stockage indisponible : la base suffit */
  }
}

class Prefs {
  theme = $state<Theme>('system');
  textSize = $state<TextSize>('normal');

  constructor() {
    const t = local('theme');
    const s = local('textSize');
    if (isTheme(t)) this.theme = t;
    if (isSize(s)) this.textSize = s;
    this.#apply();
  }

  /** Relit les préférences enregistrées en base (après ouverture ou restauration). */
  async load() {
    const repo = await app.repo();
    const t = await repo.getSetting('theme');
    const s = await repo.getSetting('text_size');
    if (isTheme(t)) this.theme = t;
    if (isSize(s)) this.textSize = s;
    this.#apply();
  }

  async setTheme(theme: Theme) {
    this.theme = theme;
    this.#apply();
    await (await app.repo()).setSetting('theme', theme);
  }

  async setTextSize(size: TextSize) {
    this.textSize = size;
    this.#apply();
    await (await app.repo()).setSetting('text_size', size);
  }

  #apply() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = this.theme;
    root.dataset.textSize = this.textSize;
    setLocal('theme', this.theme);
    setLocal('textSize', this.textSize);
  }
}

export const prefs = new Prefs();

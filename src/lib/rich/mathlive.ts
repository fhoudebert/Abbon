/**
 * Chargement de MathLive à la demande (environ 800 Ko, dans un morceau à part) : éditeur visuel de formules
 * et questions « expression ». Réglé une fois : polices de KaTeX (déjà chargées par l'application), sans son,
 * séparateur décimal de la langue de l'interface.
 */
import { i18n } from '$lib/i18n/index.svelte';

export type MathField = HTMLElement & {
  value: string;
  readOnly: boolean;
  mathVirtualKeyboardPolicy: string;
};

let loading: Promise<void> | null = null;

export function loadMathLive(): Promise<void> {
  loading ??= import('mathlive').then(({ MathfieldElement }) => {
    MathfieldElement.fontsDirectory = null;
    MathfieldElement.soundsDirectory = null;
    MathfieldElement.plonkSound = null;
    MathfieldElement.keypressSound = null;
    MathfieldElement.locale = i18n.lang;
    MathfieldElement.decimalSeparator = i18n.lang === 'fr' ? ',' : '.';
  });
  return loading;
}

/** Clavier virtuel de MathLive (global), s'il est chargé. */
export const mathKeyboard = () =>
  (globalThis as unknown as { mathVirtualKeyboard?: { container: HTMLElement | null; hide: () => void } }).mathVirtualKeyboard;

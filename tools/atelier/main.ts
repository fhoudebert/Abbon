import { mount } from 'svelte';
import katexCss from 'katex/dist/katex.min.css?inline';
import App from './App.svelte';

// Polices de KaTeX incorporées à la page : elles servent à l'aperçu, à l'éditeur visuel et à l'image.
const style = document.createElement('style');
style.textContent = katexCss;
document.head.append(style);

// MathLive cherche au chargement l'adresse de son script pour ses polices et ses sons, dont on n'a pas besoin.
// Page ouverte par double-clic (file://, script dans la page) : il ne la trouve pas et le signale ; message tu.
const error = console.error;
console.error = () => {};
const { MathfieldElement } = await import('mathlive').finally(() => (console.error = error));
MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;
MathfieldElement.plonkSound = null;
MathfieldElement.keypressSound = null;

mount(App, { target: document.getElementById('app')!, props: { katexCss } });

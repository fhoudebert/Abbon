import { mount } from 'svelte';
import '../../src/app.css';
import katexCss from 'katex/dist/katex.min.css?inline';
import { loadMathLive } from '$lib/rich/mathlive';
import App from './App.svelte';

// Feuille de style de KaTeX, polices incorporées (woff2 seulement, voir vite.config.ts).
const style = document.createElement('style');
style.textContent = katexCss;
document.head.append(style);

// MathLive cherche au chargement l'adresse de son script pour ses polices et ses sons, dont on n'a pas besoin.
// Page ouverte par double-clic (file://, script dans la page) : il ne la trouve pas et le signale ; message tu.
const error = console.error;
console.error = () => {};
await loadMathLive()
  .catch(() => {})
  .finally(() => (console.error = error));

mount(App, { target: document.getElementById('app')! });

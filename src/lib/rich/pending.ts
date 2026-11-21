/**
 * Saisies en attente dans les éditeurs riches.
 *
 * Les éditeurs transmettent leurs changements après une courte pause de frappe. Sous WebKit
 * (Linux, macOS), cliquer sur un bouton ou un lien ne retire pas le focus de l'éditeur : il faut
 * donc vider explicitement ces saisies avant d'enregistrer, de publier ou de quitter la page.
 */
const flushers = new Set<() => void>();

export function registerFlush(fn: () => void): () => void {
  flushers.add(fn);
  return () => flushers.delete(fn);
}

/** Transmet immédiatement toutes les saisies en attente. */
export function flushEdits() {
  for (const fn of flushers) fn();
}

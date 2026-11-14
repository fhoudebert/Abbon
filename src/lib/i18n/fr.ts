/**
 * Messages de l'interface — français (langue de référence).
 * Toute clé ajoutée ici doit l'être dans en.ts : le compilateur TypeScript le vérifie.
 * Pluriels : objet { one, other } choisi via Intl.PluralRules ; {n} est remplacé par le nombre.
 */
export const fr = {
  'app.name': 'Abbon',
  'app.tagline': 'QCM hors ligne',
  'nav.home': 'Accueil',
  'nav.about': 'À propos',
  'lang.label': 'Langue',

  'home.inProgress': 'En cours',
  'home.todo': 'À faire',
  'home.done': 'Faits',
  'home.empty.inProgress': 'Aucun QCM en cours.',
  'home.empty.todo': 'Tout est fait, bravo !',
  'home.empty.done': 'Aucun QCM terminé pour l’instant.',
  'home.search': 'Rechercher un QCM',
  'home.allCategories': 'Toutes les catégories',
  'home.loading': 'Chargement…',
  'home.error': 'Impossible d’ouvrir la base de données : {error}',

  'quiz.questions': { one: '{n} question', other: '{n} questions' },
  'quiz.lastScore': 'Dernier score : {score}',
  'quiz.bestScore': 'Meilleur : {score}',
  'quiz.start': 'Commencer',
  'quiz.resume': 'Reprendre',
  'quiz.retry': 'Refaire',
  'quiz.comingSoon': 'Le passage des QCM arrive au lot 1.',

  'about.title': 'À propos d’Abbon',
  'about.version': 'Version',
  'about.storage': 'Stockage',
  'about.storage.sqlite': 'SQLite (données conservées sur l’appareil)',
  'about.storage.memory': 'Mémoire (aperçu navigateur, rien n’est conservé)',
  'about.platform': 'Plateforme',
  'about.license': 'Logiciel libre sous licence MIT.',
  'about.demo': 'Les QCM affichés sont des données de démonstration.',
} as const;

export type MessageKey = keyof typeof fr;
export type Plural = { one: string; other: string };
export type Messages = { [K in MessageKey]: (typeof fr)[K] extends string ? string : Plural };

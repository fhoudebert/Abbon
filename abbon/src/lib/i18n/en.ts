import type { Messages } from './fr';

export const en: Messages = {
  'app.name': 'Abbon',
  'app.tagline': 'Offline quizzes',
  'nav.home': 'Home',
  'nav.about': 'About',
  'lang.label': 'Language',

  'home.inProgress': 'In progress',
  'home.todo': 'To do',
  'home.done': 'Done',
  'home.empty.inProgress': 'No quiz in progress.',
  'home.empty.todo': 'All done, well done!',
  'home.empty.done': 'No finished quiz yet.',
  'home.search': 'Search quizzes',
  'home.allCategories': 'All categories',
  'home.loading': 'Loading…',
  'home.error': 'Could not open the database: {error}',

  'quiz.questions': { one: '{n} question', other: '{n} questions' },
  'quiz.lastScore': 'Last score: {score}',
  'quiz.bestScore': 'Best: {score}',
  'quiz.start': 'Start',
  'quiz.resume': 'Resume',
  'quiz.retry': 'Retake',
  'quiz.comingSoon': 'Taking quizzes arrives in milestone 1.',

  'about.title': 'About Abbon',
  'about.version': 'Version',
  'about.storage': 'Storage',
  'about.storage.sqlite': 'SQLite (data kept on this device)',
  'about.storage.memory': 'Memory (browser preview, nothing is kept)',
  'about.platform': 'Platform',
  'about.license': 'Free software under the MIT licence.',
  'about.demo': 'The quizzes shown are demo data.',
};

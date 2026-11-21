import { common, createLowlight } from 'lowlight';

/** Coloration syntaxique (≈ 35 langages courants), partagée par l'éditeur et l'affichage. */
export const lowlight = createLowlight(common);

/** Langages proposés dans l'éditeur (identifiants highlight.js). */
export const CODE_LANGUAGES = [
  'bash',
  'c',
  'cpp',
  'csharp',
  'css',
  'go',
  'java',
  'javascript',
  'json',
  'kotlin',
  'php',
  'python',
  'ruby',
  'rust',
  'sql',
  'typescript',
  'xml',
  'yaml',
] as const;

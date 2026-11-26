import { describe, expect, it } from 'vitest';
import { checkRequirements } from '$lib/interchange/module';
import { buildPackage, parsePackage } from '$lib/interchange/qcmPackage';
import { compileModule, frenchDecimals, parseClozeSource, parseExpressionAnswer, parseNumericAnswer, splitQuestions, type SourceFile } from './source';

const MODULE = `id: org.abbon.test
version: 1.2.3
date: 2026-11-15
title: { fr: Essai, en: Test }
license: CC-BY-NC-SA-4.0
authors: [Abbon]
languages: [fr, en]
requires: { app: ">=0.2.0" }
categories:
  - id: rust
    name: { fr: Rust, en: Rust }
`;

const QUIZ = `---
id: rust-01
title: { fr: "Rust : possession", en: "Rust: ownership" }
level: bases
tags: [rust]
---

## q-move-01 · single
Que se passe-t-il après \`let b = a;\` si \`a\` est une \`String\` ?

- [ ] \`a\` et \`b\` partagent la même chaîne
- [x] \`a\` n'est plus utilisable
- [ ] La chaîne est copiée

> \`String\` n'implémente pas \`Copy\`.

### en
What happens after \`let b = a;\` if \`a\` is a \`String\`?

- [ ] \`a\` and \`b\` share the same string
- [x] \`a\` can no longer be used
- [ ] The string is copied

> \`String\` does not implement \`Copy\`.

## q-multi-01
Lesquels sont des entiers ?

\`\`\`rust
## ceci n'est pas une question
\`\`\`

- [x] u8
- [x] i32
- [ ] f64

> Les deux premiers.

### en
Which ones are integers?

- [x] u8
- [x] i32
- [ ] f64

> The first two.
`;

const files = (quiz = QUIZ, extra: SourceFile[] = []): SourceFile[] => [
  { path: 'module.yaml', text: MODULE },
  { path: 'rust/01-possession.md', text: quiz },
  ...extra,
];
const errors = (f: SourceFile[], assets: Parameters<typeof compileModule>[1] = []) => compileModule(f, assets).issues.filter((i) => i.level === 'error').map((i) => i.message);

describe('compilation d’un module', () => {
  it('découpe les questions, les langues et ignore les « ## » dans le code', () => {
    const qs = splitQuestions(QUIZ.split('---\n').slice(2).join('---\n'), 'fr');
    expect(qs.map((q) => [q.id, q.type])).toEqual([['q-move-01', 'single'], ['q-multi-01', undefined]]);
    expect([...qs[0].langs.keys()]).toEqual(['fr', 'en']);
    expect(qs[1].langs.get('fr')!.prompt).toContain("## ceci n'est pas une question");
  });

  it('produit des identifiants stables et préfixés, et une version entière', () => {
    const c = compileModule(files());
    expect(c.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(c.manifest.id).toBe('org.abbon.test');
    expect(c.categories.map((x) => x.id)).toEqual(['org-abbon-test_rust']);
    const [quiz] = c.quizzes;
    expect(quiz.id).toBe('org-abbon-test_rust-01');
    expect(quiz.version).toBe(1_002_003);
    expect(quiz.status).toBe('published');
    expect(quiz.categoryId).toBe('org-abbon-test_rust');
    expect(quiz.questions.map((q) => [q.id, q.type])).toEqual([
      ['org-abbon-test_rust-01_q-move-01', 'single'],
      ['org-abbon-test_rust-01_q-multi-01', 'multiple'],
    ]);
    expect(quiz.questions[0].choices.map((x) => [x.id.slice(-3), x.correct])).toEqual([['_c1', false], ['_c2', true], ['_c3', false]]);
    expect(Object.keys(quiz.questions[0].prompt)).toEqual(['fr', 'en']);
    expect(c.manifest.quizzes).toEqual([quiz.id]);
    expect(c.stats).toEqual([{ category: 'rust', level: 'bases', quizzes: 1, questions: 2 }]);
  });

  it('est déterministe : deux constructions donnent le même fichier', () => {
    const build = () => {
      const c = compileModule(files());
      return buildPackage(
        { quizzes: c.quizzes, categories: c.categories, media: new Map(), module: c.manifest },
        { kind: 'content', solutions: true, appVersion: '0.2.0', now: new Date('2026-11-15T00:00:00Z') },
      );
    };
    expect(Buffer.from(build()).equals(Buffer.from(build()))).toBe(true);
  });

  it('donne un fichier .qcm relu comme un module, fiche comprise', async () => {
    const c = compileModule(
      files(QUIZ, [
        { path: 'rust/fiche.fr.md', text: '## Possession\n\nUne valeur a un seul propriétaire.' },
        { path: 'rust/fiche.en.md', text: '## Ownership\n\nA value has a single owner.' },
      ]),
    );
    expect(c.issues).toEqual([{ level: 'warning', file: 'rust/01-possession.md', message: '2 questions (10 à 15 conseillées)' }]);
    const bytes = buildPackage(
      { quizzes: c.quizzes, categories: c.categories, media: new Map(), module: c.manifest },
      { kind: 'content', solutions: true, appVersion: '0.2.0' },
    );
    const p = await parsePackage(bytes);
    expect(p.problems).toEqual([]);
    expect(p.module?.id).toBe('org.abbon.test');
    expect(Object.keys(p.module?.sheets ?? {})).toEqual(['org-abbon-test_rust']);
    expect(p.quizzes).toHaveLength(1);
    expect(checkRequirements(p.module!, '0.1.0').appTooOld).toBe('>=0.2.0');
    expect(checkRequirements(p.module!, '0.2.0').ok).toBe(true);
  });

  it('signale les erreurs de fond', () => {
    expect(errors(files(QUIZ.replace('- [x] `a` n\'est plus utilisable', '- [ ] `a` n\'est plus utilisable')))).toEqual(
      expect.arrayContaining([
        expect.stringContaining('exactement une bonne réponse'),
        expect.stringContaining('ne correspondent pas'),
      ]),
    );
    expect(errors(files(QUIZ.replace('> `String` does not implement `Copy`.\n', '')))).toEqual([
      expect.stringContaining('explication manquante (en)'),
    ]);
    expect(errors(files(QUIZ.replace('## q-multi-01', '## q-move-01')))).toEqual([expect.stringContaining('déjà utilisé')]);
    expect(errors(files(QUIZ.replace(/### en[\s\S]*?(?=## q-multi)/, '')))).toEqual([expect.stringContaining('texte manquant en « en »')]);
    expect(errors(files(QUIZ.replace('id: rust-01', 'id: Rust_01')))).toEqual([expect.stringContaining('minuscules')]);
  });

  it('refuse un module.yaml incomplet', () => {
    const bad = [{ path: 'module.yaml', text: MODULE.replace('version: 1.2.3', 'version: 1.2').replace('license: CC-BY-NC-SA-4.0\n', '') }, files()[1]];
    expect(errors(bad)).toEqual(expect.arrayContaining([expect.stringContaining('SemVer'), expect.stringContaining('license')]));
  });
});

describe('questions à saisie dans les sources', () => {
  const TYPED = `---
id: saisie-01
title: { fr: Saisie, en: Typing }
level: bases
---

## go · short
Écrivez le prétérit de *to go*.

= went

> *go – went – gone*.

### en
Write the past simple of *to go*.

> *go – went – gone*.

## capitale
Capitale du Royaume-Uni ?

= Londres

> Londres.

### en
Capital of the United Kingdom?

= London

> London.

## python · short · case-sensitive
Nom du langage ?

= Python

> Avec une majuscule.

### en
Name of the language?

> Capitalised.

## cleo · short · accent-insensitive
Reine d'Égypte ?

= Cléopâtre

> Cléopâtre VII.

### en
Queen of Egypt?

> Cleopatra VII.

## g · numeric
Valeur de *g* ?

= 9,81 ± 0,01 m/s²

> Environ 9,81.

### en
Value of *g*?

> About 9.81.
`;

  it('lit les réponses attendues', () => {
    const c = compileModule(files(TYPED));
    expect(c.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(c.quizzes[0].questions.map((q) => [q.type, q.choices.length, q.expected])).toEqual([
      ['short', 0, { accepted: ['went'] }],
      ['short', 0, { accepted: ['Londres', 'London'] }],
      ['short', 0, { accepted: ['Python'], caseSensitive: true }],
      ['short', 0, { accepted: ['Cléopâtre'], ignoreAccents: true }],
      ['numeric', 0, { value: 9.81, tolerance: 0.01, unit: 'm/s²' }],
    ]);
  });

  it('options des questions à saisie : accents ignorés (réponse courte, trous à saisir), option inconnue refusée', () => {
    const bad = compileModule(files(TYPED.replace('## cleo · short · accent-insensitive', '## cleo · numeric · accent-insensitive')));
    expect(bad.issues.some((i) => i.level === 'error' && /accent-insensitive/.test(i.message))).toBe(true);
    const cloze = TYPED.replace(
      '## cleo · short · accent-insensitive\nReine d\'Égypte ?\n\n= Cléopâtre\n',
      '## cleo · cloze · accent-insensitive\nReine d\'Égypte ?\n\n= {Cléopâtre} en {Égypte ~Grèce}\n',
    );
    const c = compileModule(files(cloze));
    expect(c.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(c.quizzes[0].questions.find((q) => q.type === 'cloze')?.expected?.gaps).toEqual([
      { kind: 'text', accepted: ['Cléopâtre'], ignoreAccents: true },
      { kind: 'select', accepted: ['Égypte'], options: ['Grèce'] },
    ]);
  });

  it('lit les réponses numériques', () => {
    expect(parseNumericAnswer('4')).toEqual({ value: 4, tolerance: 0 });
    expect(parseNumericAnswer('-1,5e3 +/- 10')).toEqual({ value: -1500, tolerance: 10 });
    expect(parseNumericAnswer('6 faces')).toEqual({ value: 6, tolerance: 0, unit: 'faces' });
    expect(parseNumericAnswer('environ 4')).toBeNull();
  });

  it('lit les catégories parentes (regroupements sans QCM)', () => {
    const withParents = (cats: string) => files(TYPED).map((f) => (f.path === 'module.yaml' ? { ...f, text: f.text.replace(/categories:[\s\S]*$/, cats) } : f));
    const ok = compileModule(withParents('categories:\n  - id: groupe\n    name: { fr: Groupe, en: Group }\n  - id: rust\n    parent: groupe\n    name: { fr: Rust, en: Rust }\n'));
    expect(ok.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(ok.issues.some((i) => /sans QCM/.test(i.message))).toBe(false);
    const cats = Object.fromEntries(ok.categories.map((c) => [c.id.replace(/^.*_/, ''), c.parentId?.replace(/^.*_/, '') ?? null]));
    expect(cats).toEqual({ groupe: null, rust: 'groupe' });
    const unknown = compileModule(withParents('categories:\n  - id: rust\n    parent: absent\n    name: { fr: Rust, en: Rust }\n'));
    expect(unknown.issues.some((i) => /parent « absent » non déclaré/.test(i.message))).toBe(true);
    const loop = compileModule(withParents('categories:\n  - id: a\n    parent: rust\n    name: { fr: A, en: A }\n  - id: rust\n    parent: a\n    name: { fr: Rust, en: Rust }\n'));
    expect(loop.issues.some((i) => /boucle de parents/.test(i.message))).toBe(true);
  });

  it('résout les molécules « smiles: » dessinées avant la compilation', () => {
    const quiz = `---
id: mol-01
title: { fr: Molécules, en: Molecules }
level: bases
---

## ester · single
Quel groupe ? ![éthanoate d'éthyle](smiles:CCOC(C)=O)

- [x] Ester
- [ ] Alcool

> Groupe ester.

### en
Which group? ![ethyl ethanoate](smiles:CCOC(C)=O)

- [x] Ester
- [ ] Alcohol

> Ester group.
`;
    const ok = [{ path: 'smiles:CCOC(C)=O', hash: 'a'.repeat(64), mime: 'image/svg+xml' }];
    const c = compileModule(files(quiz), ok);
    expect(c.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(c.assets).toEqual(['smiles:CCOC(C)=O']);
    expect(c.manifest.requires?.features).toContain('svg');
    expect(JSON.stringify(c.quizzes[0].questions[0].prompt.fr)).toContain('"hash":"' + 'a'.repeat(64));
    expect(errors(files(quiz), [{ ...ok[0], mime: null }])).toEqual(expect.arrayContaining([expect.stringContaining('SMILES illisible')]));
    expect(errors(files(quiz.replace("![éthanoate d'éthyle]", '![]')), ok)).toEqual(expect.arrayContaining([expect.stringContaining('sans texte alternatif')]));
  });

  it('lit les expressions attendues (primitive : « + C »)', () => {
    expect(parseExpressionAnswer('$3x^2$')).toEqual({ expected: { latex: '3x^2' }, problem: null });
    expect(parseExpressionAnswer('$\\frac{x^3}{3} + C$')).toEqual({ expected: { latex: '\\frac{x^3}{3}', constant: true }, problem: null });
    expect(parseExpressionAnswer('x+').problem).toMatch(/incomplète/);
    const quiz = `---
id: expr-01
title: { fr: Dérivées, en: Derivatives }
level: bases
---

## carre · expression
Dérivée de $x^3$ ?

= $3x^2$

> $(x^n)' = n x^{n-1}$.

### en
Derivative of $x^3$?

> $(x^n)' = n x^{n-1}$.

## primitive · expression
Une primitive de $x^2$ ?

= $\\frac{x^3}{3} + C$

> Toute fonction $\\frac{x^3}{3} + C$ convient.

### en
An antiderivative of $x^2$?

> Any function $\\frac{x^3}{3} + C$ works.
`;
    const c = compileModule(files(quiz));
    expect(c.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(c.quizzes[0].questions.map((q) => [q.type, q.expected])).toEqual([
      ['expression', { latex: '3x^2' }],
      ['expression', { latex: '\\frac{x^3}{3}', constant: true }],
    ]);
    expect(errors(files(quiz.replace('= $3x^2$', '= $3x^$')))).toEqual([expect.stringContaining('expression attendue illisible')]);
  });

  it('signale les incohérences', () => {
    expect(errors(files(TYPED.replace('= went\n', '')))).toEqual([expect.stringContaining('réponse attendue manquante')]);
    expect(errors(files(TYPED.replace('= went', '- [x] went')))).toEqual(
      expect.arrayContaining([expect.stringContaining('pas de réponses à cocher')]),
    );
    expect(errors(files(TYPED.replace('= 9,81 ± 0,01 m/s²', '= beaucoup')))).toEqual([expect.stringContaining('illisible')]);
    expect(errors(files(QUIZ.replace('- [ ] La chaîne est copiée', '= copie')))).toEqual(
      expect.arrayContaining([expect.stringContaining('ligne « = réponse » dans une question « single »')]),
    );
  });
});

describe('textes à trous dans les sources', () => {
  const CLOZE = `---
id: trous-01
title: { fr: Trous, en: Gaps }
level: bases
---

## london · cloze
Complétez au prétérit.

= Yesterday, she {went|did go} to London
= and {saw} a friend. She {has ~have ~had} two cats.

> *go – went*, *see – saw*.

### en
Complete with the past simple.

> *go – went*, *see – saw*.
`;

  it('lit trous à saisir et listes déroulantes', () => {
    expect(parseClozeSource('a {b|c} d {e ~f ~g} \\{h\\}')).toEqual({
      text: 'a {{1}} d {{2}} {h}',
      gaps: [
        { kind: 'text', accepted: ['b', 'c'] },
        { kind: 'select', accepted: ['e'], options: ['f', 'g'] },
      ],
    });
  });

  it('compile un texte à trous, repris tel quel dans une langue sans texte', () => {
    const c = compileModule(files(CLOZE));
    expect(c.issues.filter((i) => i.level === 'error')).toEqual([]);
    const [q] = c.quizzes[0].questions;
    expect(q.type).toBe('cloze');
    expect(q.choices).toEqual([]);
    expect(q.expected?.gaps).toHaveLength(3);
    expect(q.expected?.text?.fr).toBe('Yesterday, she {{1}} to London\nand {{2}} a friend. She {{3}} two cats.');
    expect(q.expected?.text?.en).toBe(q.expected?.text?.fr);
  });

  it('signale un texte sans trou ou des trous différents d’une langue à l’autre', () => {
    expect(errors(files(CLOZE.replace(/= .*\n= .*\n/, '= Rien à compléter.\n')))).toEqual([expect.stringContaining('sans trou')]);
    expect(errors(files(CLOZE.replace('> *go – went*, *see – saw*.\n\n### en\nComplete with the past simple.\n', '> x\n\n### en\nComplete.\n\n= She {went} home.\n')))).toEqual([
      expect.stringContaining('diffèrent'),
    ]);
  });
});

describe('formules et figures dans un module', () => {
  const SVG_HASH = 'a'.repeat(64);
  const PNG_HASH = 'b'.repeat(64);
  const assets = [
    { path: 'rust/figures/rc.svg', hash: SVG_HASH, mime: 'image/svg+xml' },
    { path: 'rust/photo.png', hash: PNG_HASH, mime: 'image/png' },
    { path: 'rust/casse.svg', hash: 'c'.repeat(64), mime: null },
  ];
  const SCI = `---
id: sci-01
title: { fr: Sciences, en: Science }
level: bases
---

## chute
Un objet tombe avec $g = 9,81$ : que vaut $v$ après $t$ secondes ?

![Schéma de la chute](figures/rc.svg)

- [x] $v = g\\,t$
- [ ] $v = \\frac{g}{t}$
- [ ] $v = g\\,t^2$

> $$v(t) = g\\,t$$

### en
An object falls with $g = 9.81$: what is $v$ after $t$ seconds?

![Diagram of the fall](figures/rc.svg)

- [x] $v = g\\,t$
- [ ] $v = \\frac{g}{t}$
- [ ] $v = g\\,t^2$

> $$v(t) = g\\,t$$
`;

  it('joint les images utilisées, déclare les fonctions requises et met la virgule décimale française', () => {
    const c = compileModule(files(SCI), assets);
    expect(c.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(c.assets).toEqual(['rust/figures/rc.svg']);
    expect(c.manifest.requires).toEqual({ app: '>=0.2.0', features: ['math', 'svg'] });
    const [q] = c.quizzes[0].questions;
    expect(JSON.stringify(q.prompt.fr)).toContain('g = 9{,}81');
    expect(JSON.stringify(q.prompt.en)).toContain('g = 9.81');
    expect(JSON.stringify(q.prompt.fr)).toContain(`"hash":"${SVG_HASH}","alt":"Schéma de la chute"`);
    expect(c.issues.filter((i) => i.level === 'warning').map((i) => i.file)).toEqual(
      expect.arrayContaining(['rust/photo.png', 'rust/casse.svg']),
    );
  });

  it('ne déclare rien pour un module sans formule ni figure', () => {
    expect(compileModule(files()).manifest.requires).toEqual({ app: '>=0.2.0' });
  });

  it('signale formule fautive, image absente, mal formée ou sans texte alternatif', () => {
    const e = (from: string, to: string) => errors2(files(SCI.replaceAll(from, to)));
    const errors2 = (f: SourceFile[]) => compileModule(f, assets).issues.filter((i) => i.level === 'error').map((i) => i.message);
    expect(e('$v = \\frac{g}{t}$', '$v = \\frac{g}{$')).toEqual(expect.arrayContaining([expect.stringContaining('formule « v = \\frac{g}{ »')]));
    expect(e('figures/rc.svg', 'figures/absent.svg')).toEqual(expect.arrayContaining([expect.stringContaining('introuvable')]));
    expect(e('figures/rc.svg', 'casse.svg')).toEqual(expect.arrayContaining([expect.stringContaining('SVG mal formé')]));
    expect(e('![Schéma de la chute]', '![]')).toEqual(expect.arrayContaining([expect.stringContaining('sans texte alternatif')]));
  });
});

describe('virgule décimale française dans les formules', () => {
  it('protège la virgule entre deux chiffres, sauf dans \\pu et \\ce', () => {
    expect(frenchDecimals('g = 9,81')).toBe('g = 9{,}81');
    expect(frenchDecimals(String.raw`x = 1,5 \text{ et } \pu{0,075 mol.L-1} + 2,5`)).toBe(String.raw`x = 1{,}5 \text{ et } \pu{0,075 mol.L-1} + 2{,}5`);
    expect(frenchDecimals(String.raw`\ce{A_{1,2}} = 3,1`)).toBe(String.raw`\ce{A_{1,2}} = 3{,}1`);
    expect(frenchDecimals('f(a, b)')).toBe('f(a, b)');
  });
});

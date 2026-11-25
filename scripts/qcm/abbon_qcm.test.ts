/**
 * scripts/qcm/abbon_qcm.py, abbon_module.py et leurs prompts (docs/prompt-qcm-abbon.md, prompt-module-abbon.md) :
 * les copies des scripts dans les prompts sont exactes, et les fichiers produits (exemples des prompts, tous les
 * types de questions, module et sa mise à jour) s'importent, s'installent et se corrigent dans Abbon.
 * Les essais qui exécutent les scripts sont sautés sans Python 3.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scoreQuestion } from '$lib/domain/scoring';
import { planModule } from '$lib/interchange/module';
import { parsePackage } from '$lib/interchange/qcmPackage';
import { mathError } from '$lib/rich/math';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const script = read('./abbon_qcm.py');
const moduleScript = read('./abbon_module.py');
const prompt = read('../../docs/prompt-qcm-abbon.md');
const modulePrompt = read('../../docs/prompt-module-abbon.md');

/** Bloc de code Python qui suit le titre `heading` dans un prompt. */
function block(heading: string, doc = prompt): string {
  const at = doc.indexOf(heading);
  expect(at, heading).toBeGreaterThan(-1);
  const start = doc.indexOf('```python\n', at) + '```python\n'.length;
  return doc.slice(start, doc.indexOf('```', start));
}

let python = '';
for (const cmd of ['python3', 'python']) {
  try {
    if (/Python 3/.test(execFileSync(cmd, ['--version'], { encoding: 'utf8' }))) {
      python = cmd;
      break;
    }
  } catch {
    /* absent */
  }
}

/** Exécute les scripts `codes` (qui importent abbon_qcm et abbon_module) dans un dossier, et lit `out.qcm`. */
async function run(...codes: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'abbon-qcm-'));
  writeFileSync(join(dir, 'abbon_qcm.py'), script);
  writeFileSync(join(dir, 'abbon_module.py'), moduleScript);
  codes.forEach((code, i) => {
    writeFileSync(join(dir, `make${i}.py`), code);
    execFileSync(python, [`make${i}.py`], { cwd: dir });
  });
  return parsePackage(new Uint8Array(readFileSync(join(dir, 'out.qcm'))));
}

/** Formules d'un contenu JSON (QCM, fiches). */
const formulas = (value: unknown) =>
  [
    ...JSON.stringify(value).matchAll(
      /"type":"math(?:Block)?","content":\[\{"type":"text","text":"((?:[^"\\]|\\.)*)"/g,
    ),
  ].map((m) => JSON.parse(`"${m[1]}"`));

describe('QCM express (abbon_qcm.py)', () => {
  it('le prompt contient une copie exacte du script', () => {
    expect(block('## Le script `abbon_qcm.py`')).toBe(script);
  });

  it.skipIf(!python)("l'exemple du prompt donne un QCM valide, formules comprises", async () => {
    const example = block("## Exemple d'utilisation").replace(/q\.save\("[^"]+"\)/, 'q.save("out.qcm")');
    const p = await run(example);
    expect(p.problems).toEqual([]);
    expect(p.quizzes).toHaveLength(1);
    const quiz = p.quizzes[0];
    expect(quiz.questions.map((q) => q.type)).toEqual(['single', 'multiple', 'single', 'short', 'numeric', 'cloze']);
    const maths = formulas(quiz);
    expect(maths).toHaveLength(2);
    for (const m of maths) expect(mathError(m)).toBeNull();
  });

  it.skipIf(!python)('tous les types de questions, réglages, et correction des bonnes réponses', async () => {
    const p = await run(String.raw`
from abbon_qcm import Qcm
q = Qcm("Essai", lang="fr", solutions="never", time_limit_min=10, threshold=0.5, partial=False, tags=["essai"])
q.single("Capitale de l'Italie ?", ok="Rome", ko=["Milan", "Naples"], expl="Depuis 1871.")
q.multiple("Nombres premiers ?", ok=["2", "3"], ko=["4", "9"], expl="**4** et *9* ne le sont pas.")
q.vf("La Terre tourne autour du Soleil.", True)
q.short("Prétérit de *to go* ?", ["went"])
q.numeric("Valeur de $g$ ?", 9.81, 0.05, "m/s²")
q.cloze("Complétez.", "She [[went|did go]] to London. She [[has~have~had]] two cats.")
q.expression("Dérivée de $x^2$ ?", "2x")
q.expression("Primitive de $2x$ ?", "x^2", constant=True)
q.flashcard("Formule de l'eau ?", "$\\ce{H2O}$")
q.save("out.qcm")
`);
    expect(p.problems).toEqual([]);
    const quiz = p.quizzes[0];
    expect(quiz).toMatchObject({
      solutionVisibility: 'never',
      timeLimitSec: 600,
      passThreshold: 0.5,
      scoring: 'all_or_nothing',
      status: 'published',
    });
    const qs = quiz.questions;
    const by = (t: string, i = 0) => qs.filter((q) => q.type === t)[i];
    const correctIds = (t: string, i = 0) =>
      by(t, i)
        .choices.filter((c) => c.correct)
        .map((c) => c.id);
    const results = [
      scoreQuestion(by('single'), correctIds('single'), 'partial'),
      scoreQuestion(by('single', 1), correctIds('single', 1), 'partial'),
      scoreQuestion(by('multiple'), correctIds('multiple'), 'partial'),
      scoreQuestion(by('short'), [], 'partial', 'Went'),
      scoreQuestion(by('numeric'), [], 'partial', '9,8'),
      scoreQuestion(by('cloze'), [], 'partial', null, ['did go', 'has']),
      scoreQuestion(by('expression'), [], 'partial', '2\\cdot x'),
      scoreQuestion(by('expression', 1), [], 'partial', 'x^2+5'),
      scoreQuestion(by('flashcard'), [], 'partial', 'known'),
    ];
    expect(results.map((r) => r.correct)).toEqual(Array(results.length).fill(true));
    expect(scoreQuestion(by('numeric'), [], 'partial', '9,7').correct).toBe(false);
    expect(by('single', 1).choices.map((c) => c.content.fr)).toEqual(['Vrai', 'Faux']);
  });
});

describe('Module (abbon_module.py)', () => {
  const qcmExample = block("## Exemple d'utilisation").replace(/q\.save\("[^"]+"\)/, 'q.save("photosynthese.qcm")');
  const build = block('## Exemple de script de construction', modulePrompt).replace(
    /print\(m\.save\(\)\)/,
    'm.save("out.qcm")',
  );

  it('le prompt de module contient des copies exactes des deux scripts', () => {
    expect(block('## Le script `abbon_qcm.py`', modulePrompt)).toBe(script);
    expect(block('## Le script `abbon_module.py`', modulePrompt)).toBe(moduleScript);
  });

  it.skipIf(!python)("l'exemple du prompt donne un module installable : catégories, fiches, versions", async () => {
    const p = await run(qcmExample, build);
    expect(p.problems).toEqual([]);
    const m = p.module!;
    expect(m).toMatchObject({
      id: 'fr.college-exemple.svt-5e',
      version: '1.0.0',
      requires: { app: '>=0.2.0', features: ['math'] },
    });
    const prefix = 'fr-college-exemple-svt-5e_';
    expect(m.quizzes).toEqual([`${prefix}photosynthese`, `${prefix}graines`]);
    expect(p.categories.map((c) => [c.id, c.parentId])).toEqual([
      [`${prefix}vegetaux`, null],
      [`${prefix}graines`, `${prefix}vegetaux`],
    ]);
    expect(p.quizzes.map((q) => [q.categoryId, q.version, q.status])).toEqual([
      [`${prefix}vegetaux`, 1_000_000, 'published'],
      [`${prefix}graines`, 1_000_000, 'published'],
    ]);
    expect(p.quizzes[1].questions.map((q) => q.id)).toEqual([
      'graines-une-graine-contient-un-embryon',
      'graines-de-quoi-une-graine-a-t-elle-besoin-pour',
    ]);
    const sheet = m.sheets![`${prefix}vegetaux`].fr as { content: { type: string }[] };
    expect(sheet.content.map((n) => n.type)).toEqual(['heading', 'paragraph', 'mathBlock', 'table']);
    for (const f of formulas(m.sheets)) expect(mathError(f)).toBeNull();
    const plan = planModule(m, p, { modules: [], quizzes: [], categories: [] });
    expect([plan.status, plan.quizzes.length, plan.categories.length, plan.missing, plan.conflicts]).toEqual([
      'new',
      2,
      2,
      [],
      [],
    ]);
  });

  it.skipIf(!python)('une nouvelle version garde les identifiants et met à jour le module installé', async () => {
    const v1 = await run(qcmExample, build);
    const v2 = await run(qcmExample, build.replace('"1.0.0"', '"1.1.0"'));
    expect(v2.module!.version).toBe('1.1.0');
    expect(v2.quizzes.map((q) => q.version)).toEqual([1_001_000, 1_001_000]);
    const ids = (p: typeof v1) => p.quizzes.flatMap((q) => [q.id, ...q.questions.map((x) => x.id)]);
    expect(ids(v2)).toEqual(ids(v1));
    const installed = {
      modules: [{ manifest: v1.module! } as never],
      quizzes: v1.quizzes.map((q) => ({ id: q.id, moduleId: v1.module!.id })),
      categories: v1.categories.map((c) => ({ id: c.id, moduleId: v1.module!.id })),
    };
    const plan = planModule(v2.module!, v2, installed);
    expect([plan.status, plan.quizzes.length, plan.removedQuizIds, plan.conflicts]).toEqual(['update', 2, [], []]);
  });
});

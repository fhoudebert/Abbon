/**
 * scripts/qcm/abbon_qcm.py et le prompt docs/prompt-qcm-abbon.md : la copie du script dans le prompt est exacte,
 * et les fichiers produits (exemple du prompt, tous les types de questions) s'importent et se corrigent dans Abbon.
 * Les essais qui exécutent le script sont sautés sans Python 3.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scoreQuestion } from '$lib/domain/scoring';
import { parsePackage } from '$lib/interchange/qcmPackage';
import { mathError } from '$lib/rich/math';

const SCRIPT = new URL('./abbon_qcm.py', import.meta.url);
const PROMPT = new URL('../../docs/prompt-qcm-abbon.md', import.meta.url);
const script = readFileSync(SCRIPT, 'utf8');
const prompt = readFileSync(PROMPT, 'utf8');

/** Bloc de code Python qui suit le titre `heading` dans le prompt. */
function block(heading: string): string {
  const at = prompt.indexOf(heading);
  expect(at, heading).toBeGreaterThan(-1);
  const start = prompt.indexOf('```python\n', at) + '```python\n'.length;
  return prompt.slice(start, prompt.indexOf('```', start));
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

/** Exécute `code` (qui importe abbon_qcm) et lit le fichier `out.qcm` produit. */
async function run(code: string) {
  const dir = mkdtempSync(join(tmpdir(), 'abbon-qcm-'));
  writeFileSync(join(dir, 'abbon_qcm.py'), script);
  writeFileSync(join(dir, 'make.py'), code);
  execFileSync(python, ['make.py'], { cwd: dir });
  return parsePackage(new Uint8Array(readFileSync(join(dir, 'out.qcm'))));
}

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
    const maths = [...JSON.stringify(quiz).matchAll(/"type":"math(?:Block)?","content":\[\{"type":"text","text":"((?:[^"\\]|\\.)*)"/g)];
    expect(maths).toHaveLength(2);
    for (const m of maths) expect(mathError(JSON.parse(`"${m[1]}"`))).toBeNull();
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
    expect(quiz).toMatchObject({ solutionVisibility: 'never', timeLimitSec: 600, passThreshold: 0.5, scoring: 'all_or_nothing', status: 'published' });
    const qs = quiz.questions;
    const by = (t: string, i = 0) => qs.filter((q) => q.type === t)[i];
    const correctIds = (t: string, i = 0) => by(t, i).choices.filter((c) => c.correct).map((c) => c.id);
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

/**
 * Export d'un site d'examen corrigé par le serveur : les QCM publiés sans leurs réponses, et le corrigé
 * (`examen/solutions.php`) lu par le script de correction (server.ts, corriger.php).
 */
import { bytesToB64 } from '$lib/data/bytes';
import { expressionSamples } from '$lib/domain/expr';
import type { Quiz } from '$lib/domain/types';
import { stripSolutions } from '$lib/interchange/qcmPackage';
import type { SiteSolutions } from '$lib/site';
/**
 * QCM tel que publié dans le site : sans bonnes réponses, formes acceptées, valeurs ni explications
 * (voir `stripSolutions`). Restent le verso des cartes recto-verso (rien n'y est à deviner) et, pour les
 * expressions, les points de test où le lecteur évaluera la formule de l'élève.
 */
export function publicQuiz(quiz: Quiz): Quiz {
  const out = stripSolutions(quiz);
  const byId = new Map(quiz.questions.map((q) => [q.id, q]));
  out.questions = out.questions.map((q) => {
    const full = byId.get(q.id)!;
    if (q.type === 'flashcard') return { ...q, explanation: full.explanation ?? null };
    if (q.type === 'expression' && full.expected?.latex) {
      const { samples } = expressionSamples(full.expected.latex, { constant: full.expected.constant });
      return { ...q, expected: { ...(q.expected ?? {}), samples } };
    }
    return q;
  });
  return out;
}

/** Corrigé lu par corriger.php. */
export interface ServerSolutions {
  version: 1;
  /** Choix de l'export ; reglages.js, s'il est lisible par le serveur, l'emporte. */
  corrige: 'fin' | 'jamais';
  quizzes: Record<
    string,
    {
      scoring: Quiz['scoring'];
      passThreshold: number;
      questions: Record<string, Record<string, unknown>>;
    }
  >;
}

export function serverSolutions(quizzes: readonly Quiz[], solutions: SiteSolutions): ServerSolutions {
  const out: ServerSolutions = { version: 1, corrige: solutions === 'never' ? 'jamais' : 'fin', quizzes: {} };
  for (const quiz of quizzes) {
    const questions: Record<string, Record<string, unknown>> = {};
    for (const q of quiz.questions) {
      const entry: Record<string, unknown> = {
        type: q.type,
        points: q.points,
        choices: q.choices.map((c) => ({ id: c.id, correct: c.correct, feedback: c.feedback ?? null })),
        expected: q.expected ?? null,
        explanation: q.explanation ?? null,
      };
      if (q.type === 'expression' && q.expected?.latex) {
        try {
          const { values, hasVars } = expressionSamples(q.expected.latex, { constant: q.expected.constant });
          Object.assign(entry, { values, hasVars });
        } catch {
          /* attendue illisible : la question sera toujours fausse, comme dans l'application */
        }
      }
      questions[q.id] = entry;
    }
    out.quizzes[quiz.id] = { scoring: quiz.scoring, passThreshold: quiz.passThreshold, questions };
  }
  return out;
}

/** Texte de `examen/solutions.php` : le corrigé, en base 64, servi seulement à corriger.php. */
export function solutionsPhp(data: ServerSolutions): string {
  const b64 = bytesToB64(new TextEncoder().encode(JSON.stringify(data)));
  return `<?php
// Corrigé de l'examen Abbon, lu par corriger.php. Ouvert directement dans un navigateur, il ne renvoie rien.
if (!defined('ABBON_EXAMEN')) { http_response_code(404); exit; }
return json_decode(base64_decode('${b64}'), true);
`;
}

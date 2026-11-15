import { describe, expect, it } from 'vitest';
import { demoQuizzes } from '$lib/data/seed';
import { richToPlain } from '$lib/domain/rich';
import { escapeGift, htmlToText, parseGift, quizToGift, richToHtml } from './gift';

const SAMPLE = `// Exemple tiré de la documentation Moodle
$CATEGORY: $course$/top/Réseaux

::Port HTTPS:: Quel est le port HTTPS par défaut ? {
  =443 # Exact.
  ~80 # C'est HTTP.
  ~8080
  #### HTTPS écoute sur 443.
}

::Protocoles TCP:: [html]<p>Quels protocoles utilisent <b>TCP</b> ?</p> {
  ~%50%HTTP
  ~%50%SMTP
  ~%-100%DNS (requête standard)
}

Le soleil se lève à l'est. {T}

::Capitale::Capitale de la France ? {=Paris =paris}

::Associer:: Associez. { =chat -> miaou =chien -> ouaf }

::Essai:: Racontez vos vacances. {}

::Nombre:: Combien font 2+2 ? {#4}

Le caractère \\{ est une accolade et 1 \\= 1. {=Vrai ~Faux}
`;

describe('GIFT — import', () => {
  const r = parseGift(SAMPLE, 'Exemple', 'fr', new Date('2026-11-15T10:00:00Z'));
  const [https, tcp, sun, esc] = r.quiz.questions;
  const plain = (v: unknown) => richToPlain(v as never);

  it('crée un QCM brouillon avec les questions prises en charge', () => {
    expect(r.quiz).toMatchObject({ title: { fr: 'Exemple' }, status: 'draft', languages: ['fr'] });
    expect(r.quiz.questions).toHaveLength(4);
    expect(r.categoriesIgnored).toBe(true);
  });

  it('choix unique avec retours et explication', () => {
    expect(https.type).toBe('single');
    expect(plain(https.prompt.fr)).toBe('Quel est le port HTTPS par défaut ?');
    expect(https.choices.map((c) => [c.content.fr, c.correct])).toEqual([['443', true], ['80', false], ['8080', false]]);
    expect(https.choices[1].feedback).toEqual({ fr: "C'est HTTP." });
    expect(plain(https.explanation?.fr)).toBe('HTTPS écoute sur 443.');
  });

  it('choix multiples par poids, texte HTML converti sans être interprété', () => {
    expect(tcp.type).toBe('multiple');
    expect(plain(tcp.prompt.fr)).toBe('Quels protocoles utilisent TCP ?');
    expect(tcp.choices.map((c) => c.correct)).toEqual([true, true, false]);
  });

  it('vrai / faux et caractères échappés', () => {
    expect(sun.choices.map((c) => [c.content.fr, c.correct])).toEqual([['Vrai', true], ['Faux', false]]);
    expect(plain(esc.prompt.fr)).toBe('Le caractère { est une accolade et 1 = 1.');
  });

  it('signale les types non pris en charge', () => {
    expect(r.skipped.map((s) => [s.title, s.reason])).toEqual([
      ['Capitale', 'short_answer'],
      ['Associer', 'matching'],
      ['Essai', 'essay'],
      ['Nombre', 'numerical'],
    ]);
  });
});

describe('GIFT — export', () => {
  it('aller-retour : énoncés, réponses et bonnes réponses conservés', () => {
    for (const quiz of demoQuizzes) {
      const lang = quiz.languages[0];
      const back = parseGift(quizToGift(quiz, lang), 'x', lang).quiz;
      expect(back.questions.length).toBe(quiz.questions.length);
      quiz.questions.forEach((q, i) => {
        const b = back.questions[i];
        expect(b.type).toBe(q.type);
        expect(richToPlain(b.prompt[lang])).toBe(richToPlain(q.prompt[lang]));
        expect(b.choices.map((c) => [richToPlain(c.content[lang]), c.correct])).toEqual(
          q.choices.map((c) => [richToPlain(c.content[lang]), c.correct]),
        );
      });
    }
  });

  it('échappe les caractères spéciaux et le HTML', () => {
    expect(escapeGift('a=b {c} #d ~e: f\\')).toBe('a\\=b \\{c\\} \\#d \\~e\\: f\\\\');
    expect(richToHtml('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
    // Les balises sont retirées (jamais exécutées) ; il ne reste que du texte.
    expect(htmlToText('<p>a &lt;b&gt; &amp; &#233;</p><script>x</script>')).toBe('a <b> & é\nx');
  });

  it('écrit les réponses d’une ligne sans paragraphe', () => {
    const gift = quizToGift(demoQuizzes[0], 'fr');
    expect(gift).toContain('\t=Canberra\n');
    expect(gift).toContain('[html]<p>Quelle est la capitale');
  });

  it('écrit le code et les images', () => {
    const html = richToHtml(
      {
        type: 'doc',
        content: [
          { type: 'codeBlock', content: [{ type: 'text', text: 'if (a < b) {}' }] },
          { type: 'image', attrs: { hash: 'h', alt: 'schéma' } },
        ],
      },
      (h) => (h === 'h' ? 'data:image/png;base64,AAAA' : undefined),
    );
    expect(html).toBe('<pre><code>if (a &lt; b) {}</code></pre><img src="data:image/png;base64,AAAA" alt="schéma">');
  });
});

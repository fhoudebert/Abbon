import { describe, expect, it } from 'vitest';
import { richToPlain } from '$lib/domain/rich';
import { parseInline, toDocument, toRich } from './markdown';

describe('Markdown des sources de modules', () => {
  it('garde une chaîne pour un texte sans mise en forme', () => {
    expect(toRich('Quel est le prétérit de go ?')).toBe('Quel est le prétérit de go ?');
    expect(toRich('Deux lignes\nd’un même paragraphe')).toBe('Deux lignes d’un même paragraphe');
  });

  it('reconnaît code, gras et italique', () => {
    expect(parseInline('Le verbe *to go* donne **went**, pas `goed`.')).toEqual([
      { type: 'text', text: 'Le verbe ' },
      { type: 'text', text: 'to go', marks: [{ type: 'italic' }] },
      { type: 'text', text: ' donne ' },
      { type: 'text', text: 'went', marks: [{ type: 'bold' }] },
      { type: 'text', text: ', pas ' },
      { type: 'text', text: 'goed', marks: [{ type: 'code' }] },
      { type: 'text', text: '.' },
    ]);
  });

  it('n’interprète ni le Markdown dans le code, ni les caractères échappés', () => {
    expect(parseInline('`a * b` et 2 \\* 3')).toEqual([
      { type: 'text', text: 'a * b', marks: [{ type: 'code' }] },
      { type: 'text', text: ' et 2 * 3' },
    ]);
    expect(parseInline('``let s = `x`;``')[0]).toEqual({ type: 'text', text: 'let s = `x`;', marks: [{ type: 'code' }] });
  });

  it('refuse une marque non refermée', () => {
    expect(() => parseInline('un *oubli')).toThrow(/non refermée/);
  });

  it('ne laisse passer aucun HTML', () => {
    expect(toRich('<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>');
  });

  it('convertit blocs de code, listes, titres, citations et tableaux', () => {
    const doc = toDocument(
      [
        '## Titre',
        '',
        'Un paragraphe.',
        '',
        '```rust',
        'let b = a;',
        '```',
        '',
        '- un',
        '- deux',
        '',
        '1. premier',
        '2. second',
        '',
        '> à retenir',
        '',
        '| Base | Prétérit |',
        '| --- | --- |',
        '| go | went |',
      ].join('\n'),
    );
    expect(doc.content?.map((n) => n.type)).toEqual([
      'heading',
      'paragraph',
      'codeBlock',
      'bulletList',
      'orderedList',
      'blockquote',
      'table',
    ]);
    expect(doc.content?.[0].attrs).toEqual({ level: 1 });
    expect(doc.content?.[2]).toEqual({ type: 'codeBlock', attrs: { language: 'rust' }, content: [{ type: 'text', text: 'let b = a;' }] });
    const table = doc.content?.[6];
    expect(table?.content?.[0].content?.[0].type).toBe('tableHeader');
    expect(table?.content?.[1].content?.[1].type).toBe('tableCell');
    expect(richToPlain(doc)).toContain('went');
  });

  it('refuse un bloc de code non refermé', () => {
    expect(() => toDocument('```\ncode')).toThrow(/non refermé/);
  });
});

describe('formules et images dans les sources', () => {
  const math = (latex: string) => ({ type: 'math', content: [{ type: 'text', text: latex }] });

  it('reconnaît $…$ en ligne et $$…$$ en bloc', () => {
    expect(parseInline(String.raw`Soit $u_n = \frac{1}{n}$ pour $n \geq 1$.`)).toEqual([
      { type: 'text', text: 'Soit ' },
      math(String.raw`u_n = \frac{1}{n}`),
      { type: 'text', text: ' pour ' },
      math(String.raw`n \geq 1`),
      { type: 'text', text: '.' },
    ]);
    const doc = toDocument(['Texte.', '', '$$\\int_0^1 f(x)\\,dx$$', '', '$$', 'a &= b \\\\', 'c &= d', '$$'].join('\n'));
    expect(doc.content?.map((n) => n.type)).toEqual(['paragraph', 'mathBlock', 'mathBlock']);
    expect(doc.content?.[1].content?.[0].text).toBe(String.raw`\int_0^1 f(x)\,dx`);
    expect(doc.content?.[2].content?.[0].text).toBe('a &= b \\\\\nc &= d');
  });

  it('laisse un dollar ordinaire tranquille', () => {
    expect(toRich('Cela coûte 5 $ ou 6 $.')).toBe('Cela coûte 5 $ ou 6 $.');
    expect(toRich(String.raw`Prix : \$5 et \$6.`)).toBe('Prix : $5 et $6.');
    expect(toRich('Un seul $ ici')).toBe('Un seul $ ici');
  });

  it('ne lit pas le Markdown à l’intérieur d’une formule', () => {
    expect(parseInline('$a*b*c$ et `$x$`')).toEqual([math('a*b*c'), { type: 'text', text: ' et ' }, { type: 'text', text: '$x$', marks: [{ type: 'code' }] }]);
  });

  it('passe images et formules au contexte du compilateur', () => {
    const seen: string[] = [];
    const doc = toDocument('Voir ![Un circuit RC](figures/rc.svg) et $x$.', {
      image: (src, alt) => (seen.push(`${src}|${alt}`), { type: 'image', attrs: { hash: 'h', alt } }),
      math: (latex) => (seen.push(latex), latex.toUpperCase()),
    });
    expect(seen).toEqual(['figures/rc.svg|Un circuit RC', 'x']);
    expect(doc.content?.[0].content?.map((n) => n.type)).toEqual(['text', 'image', 'text', 'math', 'text']);
    expect(doc.content?.[0].content?.[3].content?.[0].text).toBe('X');
    // Sans contexte (pas d'images disponibles) : le texte reste tel quel.
    expect(toRich('![alt](x.png)')).toBe('![alt](x.png)');
  });

  it('refuse un bloc $$ non refermé', () => {
    expect(() => toDocument('$$\nx')).toThrow(/non refermée/);
  });
});

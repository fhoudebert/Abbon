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

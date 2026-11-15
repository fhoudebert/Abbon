import { describe, expect, it } from 'vitest';
import { hasImage, imagesWithoutAlt, isEmptyRich, mediaHashes, plainToDoc, richToPlain, toDoc } from './rich';
import type { RichDoc } from './types';

const doc: RichDoc = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Quel ' }, { type: 'text', text: 'port', marks: [{ type: 'bold' }] }, { type: 'text', text: ' ?' }] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'TCP' }] }] }] },
    { type: 'image', attrs: { hash: 'h1', alt: '' } },
    { type: 'image', attrs: { hash: 'h2', alt: 'schéma' } },
  ],
};

describe('contenu riche', () => {
  it('convertit le texte simple sans interpréter de HTML', () => {
    expect(plainToDoc('a < b\n<i>x</i>')).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'a < b' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '<i>x</i>' }] },
      ],
    });
    expect(toDoc('')).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
  });
  it('extrait le texte brut', () => {
    expect(richToPlain(doc)).toBe('Quel port ?\nTCP\nschéma');
    expect(richToPlain('simple')).toBe('simple');
    expect(richToPlain(null)).toBe('');
  });
  it('détecte le vide, les images et leurs textes alternatifs', () => {
    expect(isEmptyRich({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(true);
    expect(isEmptyRich('  ')).toBe(true);
    expect(isEmptyRich({ type: 'doc', content: [{ type: 'image', attrs: { hash: 'x' } }] })).toBe(false);
    expect(hasImage(doc)).toBe(true);
    expect(imagesWithoutAlt(doc)).toBe(1);
    expect(mediaHashes([doc, 'texte', null, doc])).toEqual(['h1', 'h2']);
  });
});

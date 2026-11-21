import { describe, expect, it } from 'vitest';
import { createPin, isValidPin, verifyPin } from './pin';

describe('code PIN', () => {
  it('n’accepte que 4 à 12 chiffres', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
    expect(isValidPin('1234567890123')).toBe(false);
  });
  it('vérifie le bon code et refuse les autres', async () => {
    const rec = await createPin('2468', 1000);
    expect(rec.hash).not.toContain('2468');
    expect(await verifyPin('2468', rec)).toBe(true);
    expect(await verifyPin('2469', rec)).toBe(false);
  });
  it('sale chaque empreinte', async () => {
    const [a, b] = await Promise.all([createPin('1111', 1000), createPin('1111', 1000)]);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });
});

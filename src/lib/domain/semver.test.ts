import { describe, expect, it } from 'vitest';
import { compareSemver, isSemver, quizVersionOf, satisfiesMin } from './semver';

describe('semver', () => {
  it('reconnaît les versions valides', () => {
    expect(isSemver('1.0.0')).toBe(true);
    expect(isSemver('0.1.0-rc.1')).toBe(true);
    expect(isSemver('1.0')).toBe(false);
    expect(isSemver('v1.0.0')).toBe(false);
  });

  it('compare les versions', () => {
    expect(compareSemver('1.0.1', '1.0.0')).toBeGreaterThan(0);
    expect(compareSemver('1.10.0', '1.9.9')).toBeGreaterThan(0);
    expect(compareSemver('2.0.0', '10.0.0')).toBeLessThan(0);
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('1.0.0-rc.1', '1.0.0')).toBeLessThan(0);
    expect(compareSemver('1.0.0-rc.2', '1.0.0-rc.10')).toBeLessThan(0);
    expect(compareSemver('n’importe quoi', '0.0.1')).toBeLessThan(0);
  });

  it('vérifie une version minimale', () => {
    expect(satisfiesMin('0.2.0', '>=0.2.0')).toBe(true);
    expect(satisfiesMin('0.2.0-beta.1', '>=0.2.0')).toBe(true);
    expect(satisfiesMin('0.1.9', '>=0.2.0')).toBe(false);
    expect(satisfiesMin('1.0.0', '0.2.0')).toBe(true);
    expect(satisfiesMin('1.0.0', '^0.2.0')).toBe(false); // opérateur inconnu : refus prudent
  });

  it('déduit une version entière croissante pour les QCM', () => {
    expect(quizVersionOf('0.1.0')).toBe(1000);
    expect(quizVersionOf('1.2.3')).toBe(1_002_003);
    expect(quizVersionOf('0.0.0')).toBe(1);
    expect(quizVersionOf('1.0.0')).toBeGreaterThan(quizVersionOf('0.99.99'));
  });
});

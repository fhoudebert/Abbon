import { describe, expect, it } from 'vitest';
import { flushEdits, registerFlush } from './pending';

describe('saisies en attente', () => {
  it('transmet toutes les saisies, sauf celles des éditeurs fermés', () => {
    const calls: string[] = [];
    const a = registerFlush(() => calls.push('a'));
    registerFlush(() => calls.push('b'));
    flushEdits();
    a();
    flushEdits();
    expect(calls).toEqual(['a', 'b', 'b']);
  });
});

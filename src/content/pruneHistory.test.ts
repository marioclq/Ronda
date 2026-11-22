import { describe, expect, it } from 'vitest';
import { pruneHistory } from './pruneHistory';

const history = { 'tod-t-soft-0001': 1, 'tod-t-soft-0099': 2, 'never-extreme-0001': 3, 'custom-gone': 4 };

describe('pruneHistory', () => {
  it('drops cards that no longer exist but keeps extreme ids until the extreme packs are loaded', () => {
    expect(pruneHistory(history, new Set(['tod-t-soft-0001']), false)).toEqual({
      'tod-t-soft-0001': 1,
      'never-extreme-0001': 3,
    });
  });

  it('drops unknown extreme ids once the extreme packs are loaded', () => {
    expect(pruneHistory(history, new Set(['tod-t-soft-0001']), true)).toEqual({ 'tod-t-soft-0001': 1 });
  });

  it('returns the same object when nothing is removed', () => {
    const kept = { 'tod-t-soft-0001': 1 };
    expect(pruneHistory(kept, new Set(['tod-t-soft-0001']), true)).toBe(kept);
  });
});

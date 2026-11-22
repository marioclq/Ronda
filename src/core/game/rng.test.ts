import { describe, expect, it } from 'vitest';
import { createSeededRng, pickOne, shuffle } from './rng';

describe('createSeededRng', () => {
  it('produces the same sequence for the same seed and a different one for another seed', () => {
    const sequence = (seed: number): number[] => {
      const rng = createSeededRng(seed);
      return Array.from({ length: 20 }, () => rng.nextInt(1000));
    };
    expect(sequence(7)).toEqual(sequence(7));
    expect(sequence(7)).not.toEqual(sequence(8));
  });

  it('stays inside [0, maxExclusive)', () => {
    const rng = createSeededRng(1);
    for (let i = 0; i < 1000; i++) {
      const value = rng.nextInt(3);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(3);
    }
  });

  it('rejects a non-positive range', () => {
    expect(() => createSeededRng(1).nextInt(0)).toThrow('maxExclusive must be a positive integer, got 0');
  });
});

describe('shuffle and pickOne', () => {
  it('shuffle returns a permutation without touching the input', () => {
    const input = ['a', 'b', 'c', 'd'];
    const output = shuffle(input, createSeededRng(3));
    expect([...output].sort()).toEqual(input);
    expect(input).toEqual(['a', 'b', 'c', 'd']);
  });

  it('pickOne fails explicitly on an empty list', () => {
    expect(() => pickOne([], createSeededRng(1))).toThrow('Cannot pick from an empty list');
  });
});

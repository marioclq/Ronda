import { describe, expect, it } from 'vitest';
import { deck } from '../core/testing/fixtures';
import { checkMinimums } from './milestones';

describe('checkMinimums', () => {
  const full = (n: number) => [
    ...(['TRUTH', 'DARE', 'NEVER', 'RATHER', 'MOST_LIKELY'] as const).flatMap((type) => [
      ...deck(`${type}-s`, type, 'SOFT', n),
      ...deck(`${type}-p`, type, 'SPICY', n),
      ...deck(`${type}-e`, type, 'EXTREME', n),
    ]),
  ];

  it('passes when every combination reaches its minimum', () => {
    expect(checkMinimums(full(3), 3, 3)).toEqual([]);
  });

  it('names each soft or spicy combination below the minimum, with its count', () => {
    const problems = checkMinimums(full(2), 3, 1);
    expect(problems).toHaveLength(10);
    expect(problems[0]).toContain('2');
  });

  it('checks the extreme level against its own minimum', () => {
    expect(checkMinimums(full(3), 3, 4)).toHaveLength(5);
  });
});

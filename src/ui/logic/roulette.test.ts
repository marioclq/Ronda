import { describe, expect, it } from 'vitest';
import type { PersonalType } from '../../core/game/engine';
import { FLIP_GAPS, revealFaces } from './roulette';

const FACES: readonly PersonalType[] = ['TRUTH', 'DARE'];

describe('roulette', () => {
  it("always lands on the engine's result", () => {
    for (const result of FACES) expect(revealFaces(result).at(-1)).toBe(result);
  });

  it('flips on every step, one face per gap plus the landing', () => {
    const faces = revealFaces('DARE');
    expect(faces).toHaveLength(FLIP_GAPS.length + 1);
    faces.slice(1).forEach((face, i) => expect(face).not.toBe(faces[i]));
  });

  it('slows down and lands in under two seconds', () => {
    for (let i = 1; i < FLIP_GAPS.length; i += 1) expect(FLIP_GAPS[i]).toBeGreaterThan(FLIP_GAPS[i - 1] ?? Infinity);
    expect(FLIP_GAPS.reduce((sum, gap) => sum + gap, 0)).toBeLessThan(2000);
  });
});

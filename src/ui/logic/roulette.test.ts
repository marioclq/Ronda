import { describe, expect, it } from 'vitest';
import type { PersonalType } from '../../core/game/engine';
import { BRAKE_GAPS, brakeFaces, brakeGap } from './roulette';

const FACES: readonly PersonalType[] = ['TRUTH', 'DARE'];

describe('roulette braking', () => {
  it("always lands on the engine's result, whatever face it was stopped on", () => {
    for (const current of FACES) {
      for (const result of FACES) {
        const faces = brakeFaces(current, result);
        expect(faces.at(-1)).toBe(result);
        expect(faces.length).toBeGreaterThanOrEqual(BRAKE_GAPS.length);
        expect(faces.length).toBeLessThanOrEqual(BRAKE_GAPS.length + 1);
      }
    }
  });

  it('keeps flipping: every face differs from the one before, starting with the stopped one', () => {
    const faces = brakeFaces('TRUTH', 'DARE');
    expect(faces[0]).toBe('DARE');
    faces.slice(1).forEach((face, i) => expect(face).not.toBe(faces[i]));
  });

  it('slows down, and holds the slowest gap past the table', () => {
    for (let i = 1; i < BRAKE_GAPS.length; i += 1) expect(brakeGap(i)).toBeGreaterThan(brakeGap(i - 1));
    expect(brakeGap(BRAKE_GAPS.length + 3)).toBe(brakeGap(BRAKE_GAPS.length - 1));
  });
});

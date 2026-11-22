import type { PersonalType } from '../../core/game/engine';

export const OTHER_FACE: Readonly<Record<PersonalType, PersonalType>> = { TRUTH: 'DARE', DARE: 'TRUTH' };

/** Gaps between flips, in ms: the wheel starts quick and slows down before it lands (about 1.4 s in all). */
export const FLIP_GAPS = [70, 75, 85, 100, 120, 150, 190, 245, 320] as const;

/** The type shown at each step, one more than the gaps; the sequence always ends on the engine's result. */
export function revealFaces(result: PersonalType): PersonalType[] {
  const steps = FLIP_GAPS.length + 1;
  const first = steps % 2 === 1 ? result : OTHER_FACE[result];
  return Array.from({ length: steps }, (_, i) => (i % 2 === 0 ? first : OTHER_FACE[first]));
}

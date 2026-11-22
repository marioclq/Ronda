import type { PersonalType } from '../../core/game/engine';

export const OTHER_FACE: Readonly<Record<PersonalType, PersonalType>> = { TRUTH: 'DARE', DARE: 'TRUTH' };

/** Gaps between flips while braking, in ms: the wheel slows down before it lands. */
export const BRAKE_GAPS = [85, 100, 120, 150, 190, 245, 320] as const;

/**
 * Faces shown while the roulette brakes, starting right after `current`.
 * The engine has already chosen: the last face is always `result`, so at least
 * BRAKE_GAPS.length flips and one more when the parity needs it.
 */
export function brakeFaces(current: PersonalType, result: PersonalType): PersonalType[] {
  const faces: PersonalType[] = [];
  let face = current;
  while (faces.length < BRAKE_GAPS.length || face !== result) {
    face = OTHER_FACE[face];
    faces.push(face);
  }
  return faces;
}

/** The wait before showing braking face `index`; flips past the table keep the slowest gap. */
export function brakeGap(index: number): number {
  const gap = BRAKE_GAPS[Math.min(index, BRAKE_GAPS.length - 1)];
  if (gap === undefined) throw new Error(`No brake gap for flip ${index} (table has ${BRAKE_GAPS.length})`);
  return gap;
}

import { describe, expect, it } from 'vitest';
import { compatibleWith, isCompatible } from './matchmaker';
import { ATTRACTIONS, GENDERS, type Attraction, type Gender, type Player } from './player';

let nextId = 0;
function p(gender: Gender, attractedTo: Attraction): Player {
  nextId++;
  return { id: `p${nextId}`, name: `P${nextId}`, gender, attractedTo };
}

const everyProfile = GENDERS.flatMap((gender) => ATTRACTIONS.map((attraction) => [gender, attraction] as const));

describe('isCompatible', () => {
  it.each([
    ['woman→men with man→women', p('WOMAN', 'MEN'), p('MAN', 'WOMEN'), true],
    ['woman→men with man→men', p('WOMAN', 'MEN'), p('MAN', 'MEN'), false],
    ['other→anyone with woman→anyone', p('OTHER', 'ANYONE'), p('WOMAN', 'ANYONE'), true],
    ['man→women with other→men', p('MAN', 'WOMEN'), p('OTHER', 'MEN'), false],
    ['woman→women with woman→women', p('WOMAN', 'WOMEN'), p('WOMAN', 'WOMEN'), true],
  ])('%s → %s', (_label, a, b, expected) => {
    expect(isCompatible(a, b)).toBe(expected);
  });

  it('is symmetric for every combination of profiles', () => {
    for (const [g1, a1] of everyProfile) {
      for (const [g2, a2] of everyProfile) {
        const first = p(g1, a1);
        const second = p(g2, a2);
        expect(isCompatible(first, second)).toBe(isCompatible(second, first));
      }
    }
  });

  it('never matches anyone with an undisclosed gender or attraction', () => {
    for (const [gender, attraction] of everyProfile) {
      const other = p(gender, attraction);
      expect(isCompatible(p('UNDISCLOSED', 'ANYONE'), other)).toBe(false);
      expect(isCompatible(p('WOMAN', 'UNDISCLOSED'), other)).toBe(false);
    }
  });

  it('ANYONE accepts every declared gender', () => {
    for (const gender of ['WOMAN', 'MAN', 'OTHER'] as const) {
      expect(isCompatible(p('OTHER', 'ANYONE'), p(gender, 'ANYONE'))).toBe(true);
    }
  });

  it('never matches a player with themselves', () => {
    const self = p('WOMAN', 'WOMEN');
    expect(isCompatible(self, self)).toBe(false);
  });
});

describe('compatibleWith', () => {
  it('returns only the compatible other players, in input order', () => {
    const ana = p('WOMAN', 'MEN');
    const beto = p('MAN', 'WOMEN');
    const caro = p('WOMAN', 'MEN');
    const dani = p('MAN', 'ANYONE');
    expect(compatibleWith(ana, [ana, beto, caro, dani])).toEqual([beto, dani]);
  });
});

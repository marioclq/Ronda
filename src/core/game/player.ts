export const GENDERS = ['WOMAN', 'MAN', 'OTHER', 'UNDISCLOSED'] as const;
export type Gender = (typeof GENDERS)[number];

export const ATTRACTIONS = ['WOMEN', 'MEN', 'ANYONE', 'UNDISCLOSED'] as const;
export type Attraction = (typeof ATTRACTIONS)[number];

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly gender: Gender;
  readonly attractedTo: Attraction;
}

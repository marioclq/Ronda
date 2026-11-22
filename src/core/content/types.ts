export const CARD_TYPES = ['TRUTH', 'DARE', 'NEVER', 'RATHER', 'MOST_LIKELY'] as const;
export type CardType = (typeof CARD_TYPES)[number];

export const LEVELS = ['SOFT', 'SPICY', 'EXTREME'] as const;
export type Level = (typeof LEVELS)[number];

export const GAME_MODES = ['TRUTH_OR_DARE', 'NEVER', 'RATHER', 'MOST_LIKELY'] as const;
export type GameMode = (typeof GAME_MODES)[number];

/** Card types each game mode draws from. Group modes use exactly one type. */
export const MODE_CARD_TYPES: Readonly<Record<GameMode, readonly CardType[]>> = {
  TRUTH_OR_DARE: ['TRUTH', 'DARE'],
  NEVER: ['NEVER'],
  RATHER: ['RATHER'],
  MOST_LIKELY: ['MOST_LIKELY'],
};

/** Cards addressed to the whole group: they cannot use player variables. */
export const GROUP_CARD_TYPES: readonly CardType[] = ['NEVER', 'RATHER', 'MOST_LIKELY'];

/** Tag for cards with physical contact or flirting: they must use {compatible}. */
export const CONTACT_TAG = 'contacto';

export interface Card {
  readonly id: string;
  readonly type: CardType;
  readonly level: Level;
  readonly text: string;
  readonly timerSeconds?: number;
  readonly tags: readonly string[];
}

export interface Pack {
  readonly id: string;
  readonly version: number;
  readonly lang: string;
  readonly cards: readonly Card[];
}

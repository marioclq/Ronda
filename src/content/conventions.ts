import { CARD_TYPES, LEVELS, type CardType, type Level, type Pack } from '../core/content/types';

export const TYPE_ID_SLUG: Readonly<Record<CardType, string>> = {
  TRUTH: 'tod-t',
  DARE: 'tod-d',
  NEVER: 'never',
  RATHER: 'rather',
  MOST_LIKELY: 'likely',
};

export const TYPE_FILE_SLUG: Readonly<Record<CardType, string>> = {
  TRUTH: 'truth',
  DARE: 'dare',
  NEVER: 'never',
  RATHER: 'rather',
  MOST_LIKELY: 'most-likely',
};

export const LEVEL_SLUG: Readonly<Record<Level, string>> = { SOFT: 'soft', SPICY: 'spicy', EXTREME: 'extreme' };

/** Path relative to content/packs. Extreme packs live in their own folder (separate chunk). */
export function packFileFor(type: CardType, level: Level): string {
  const name = `${TYPE_FILE_SLUG[type]}.${LEVEL_SLUG[level]}.json`;
  return level === 'EXTREME' ? `extreme/${name}` : name;
}

export function packIdFor(type: CardType, level: Level): string {
  return `${TYPE_FILE_SLUG[type]}-${LEVEL_SLUG[level]}`;
}

export function cardIdFor(type: CardType, level: Level, n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 9999) throw new Error(`Card number must be an integer from 1 to 9999, got ${n}`);
  return `${TYPE_ID_SLUG[type]}-${LEVEL_SLUG[level]}-${String(n).padStart(4, '0')}`;
}

const ID_PATTERN = /^(tod-t|tod-d|never|rather|likely)-(soft|spicy|extreme)-(\d{4})$/;

export interface ParsedCardId {
  readonly type: CardType;
  readonly level: Level;
  readonly n: number;
}

export function parseCardId(id: string): ParsedCardId | null {
  const match = ID_PATTERN.exec(id);
  if (match === null) return null;
  const type = CARD_TYPES.find((t) => TYPE_ID_SLUG[t] === match[1]);
  const level = LEVELS.find((l) => LEVEL_SLUG[l] === match[2]);
  if (type === undefined || level === undefined) return null;
  return { type, level, n: Number(match[3]) };
}

export function isExtremeCardId(id: string): boolean {
  return parseCardId(id)?.level === 'EXTREME';
}

/** Problems with a published pack: its file must name one type and level, and every card must match it. */
export function checkPackConventions(pack: Pack, relativePath: string): string[] {
  const path = relativePath.replace(/\\/g, '/');
  const combination = CARD_TYPES.flatMap((type) => LEVELS.map((level) => ({ type, level }))).find(
    ({ type, level }) => packFileFor(type, level) === path,
  );
  if (combination === undefined) return [`${path}: not a known pack file (expected <type>.<level>.json)`];
  const problems: string[] = [];
  const expectedId = packIdFor(combination.type, combination.level);
  if (pack.id !== expectedId) problems.push(`${path}: pack id must be "${expectedId}", got "${pack.id}"`);
  for (const card of pack.cards) {
    if (card.type !== combination.type || card.level !== combination.level) {
      problems.push(`${path} [${card.id}]: card is ${card.type}/${card.level}, file is ${combination.type}/${combination.level}`);
    }
    const parsed = parseCardId(card.id);
    if (parsed === null || parsed.type !== card.type || parsed.level !== card.level) {
      problems.push(`${path} [${card.id}]: id must look like ${cardIdFor(combination.type, combination.level, 1)}`);
    }
  }
  return problems;
}

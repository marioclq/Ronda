import { describe, expect, it } from 'vitest';
import { GAME_MODES, MODE_CARD_TYPES } from '../core/content/types';
import { parseCardId } from './conventions';
import { loadBaseCards, loadExtremeCards } from './loadCards';
import { checkMinimums, MIN_CARDS_PER_COMBINATION, MIN_EXTREME_CARDS_PER_TYPE } from './milestones';

describe('loadBaseCards', () => {
  it('returns only SOFT and SPICY cards, so EXTREME never ships in the main bundle', () => {
    const levels = new Set(loadBaseCards().map((card) => card.level));
    expect([...levels].sort()).toEqual(['SOFT', 'SPICY']);
  });

  it('has ids that are unique across all packs', () => {
    const ids = loadBaseCards().map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('loads only conventional ids, so history pruning can rely on them', () => {
    expect(loadBaseCards().every((card) => parseCardId(card.id) !== null)).toBe(true);
  });

  it('makes every mode playable at SOFT and SPICY', () => {
    const cards = loadBaseCards();
    for (const level of ['SOFT', 'SPICY'] as const) {
      for (const mode of GAME_MODES) {
        for (const type of MODE_CARD_TYPES[mode]) {
          expect(cards.some((card) => card.type === type && card.level === level)).toBe(true);
        }
      }
    }
  });
});

describe('loadExtremeCards', () => {
  it('returns only EXTREME cards, with ids that do not collide with the base cards', async () => {
    const extreme = await loadExtremeCards();
    expect(extreme.length).toBeGreaterThan(0);
    expect(extreme.every((card) => card.level === 'EXTREME')).toBe(true);
    const baseIds = new Set(loadBaseCards().map((card) => card.id));
    expect(extreme.some((card) => baseIds.has(card.id))).toBe(false);
  });

  it('meets the current milestone minimums', async () => {
    const cards = [...loadBaseCards(), ...(await loadExtremeCards())];
    expect(checkMinimums(cards, MIN_CARDS_PER_COMBINATION, MIN_EXTREME_CARDS_PER_TYPE)).toEqual([]);
  });
});

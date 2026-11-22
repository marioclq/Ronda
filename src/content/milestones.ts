import { CARD_TYPES, type Card } from '../core/content/types';
import { countByCombination } from '../core/content/corpus';

/** Raised with each milestone (spec section 5). Milestone 1: 150 and 50. */
export const MIN_CARDS_PER_COMBINATION = 150;
export const MIN_EXTREME_CARDS_PER_TYPE = 50;

export function checkMinimums(cards: readonly Card[], minPerCombination: number, minExtremePerType: number): string[] {
  const counts = countByCombination(cards);
  const problems: string[] = [];
  for (const level of ['SOFT', 'SPICY', 'EXTREME'] as const) {
    const minimum = level === 'EXTREME' ? minExtremePerType : minPerCombination;
    for (const type of CARD_TYPES) {
      const count = counts.get(`${type}/${level}`) ?? 0;
      if (count < minimum) problems.push(`${type}/${level} has ${count} cards, the minimum is ${minimum}`);
    }
  }
  return problems;
}

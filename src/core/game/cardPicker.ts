import type { Card, CardType, Level } from '../content/types';
import { pickOne, type Rng } from './rng';

/** Once every eligible card was seen, draw among this fraction of the oldest ones. */
export const RECYCLE_FRACTION = 0.25;

export interface PickRequest {
  readonly cards: readonly Card[];
  readonly type: CardType;
  readonly level: Level;
  /** cardId -> last time shown (epoch ms). */
  readonly history: Readonly<Record<string, number>>;
  readonly isEligible: (card: Card) => boolean;
  readonly rng: Rng;
}

export function pickCard(request: PickRequest): Card | null {
  const { history, rng } = request;
  const pool = request.cards.filter(
    (card) => card.type === request.type && card.level === request.level && request.isEligible(card),
  );
  if (pool.length === 0) return null;

  const unseen = pool.filter((card) => history[card.id] === undefined);
  if (unseen.length > 0) return pickOne(unseen, rng);

  const oldestFirst = [...pool].sort((a, b) => (history[a.id] ?? 0) - (history[b.id] ?? 0));
  const windowSize = Math.max(1, Math.ceil(pool.length * RECYCLE_FRACTION));
  return pickOne(oldestFirst.slice(0, windowSize), rng);
}

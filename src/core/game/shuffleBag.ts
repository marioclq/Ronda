import { shuffle, type Rng } from './rng';

export interface BagDraw<T> {
  readonly item: T;
  readonly bag: readonly T[];
}

function refill<T>(items: readonly T[], last: T | null, rng: Rng): T[] {
  const bag = shuffle(items, rng);
  if (bag.length > 1 && bag[0] === last) {
    const swapWith = 1 + rng.nextInt(bag.length - 1);
    const first = bag[0] as T;
    bag[0] = bag[swapWith] as T;
    bag[swapWith] = first;
  }
  return bag;
}

/**
 * Draws the next item of a shuffle bag. Bag entries missing from `items` are dropped.
 * An empty bag is refilled with every item, shuffled, never starting with `last`
 * unless `items` has a single element. Used for turn order and for game modes.
 */
export function drawFromBag<T>(bag: readonly T[], items: readonly T[], last: T | null, rng: Rng): BagDraw<T> {
  if (items.length === 0) throw new Error('Cannot draw from a bag without items');
  const valid = bag.filter((item) => items.includes(item));
  const source = valid.length > 0 ? valid : refill(items, last, rng);
  const [item, ...rest] = source;
  if (item === undefined) throw new Error('Shuffle bag produced no item');
  return { item, bag: rest };
}

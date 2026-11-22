import { describe, expect, it } from 'vitest';
import { createSeededRng } from './rng';
import { drawFromBag, type BagDraw } from './shuffleBag';

function drawMany(items: string[], count: number, seed: number): string[] {
  const rng = createSeededRng(seed);
  let bag: readonly string[] = [];
  let last: string | null = null;
  const drawn: string[] = [];
  for (let i = 0; i < count; i++) {
    const draw: BagDraw<string> = drawFromBag(bag, items, last, rng);
    drawn.push(draw.item);
    bag = draw.bag;
    last = draw.item;
  }
  return drawn;
}

describe('drawFromBag', () => {
  it('gives every item exactly once per cycle', () => {
    const items = ['a', 'b', 'c'];
    const drawn = drawMany(items, 30, 5);
    for (let start = 0; start < drawn.length; start += items.length) {
      expect(drawn.slice(start, start + items.length).sort()).toEqual(items);
    }
  });

  it('never repeats an item twice in a row, also across cycles', () => {
    for (const size of [2, 3, 4, 5]) {
      for (const seed of [1, 2, 3, 4, 5]) {
        const items = Array.from({ length: size }, (_, i) => `p${i}`);
        const drawn = drawMany(items, 300, seed);
        for (let i = 1; i < drawn.length; i++) expect(drawn[i]).not.toBe(drawn[i - 1]);
      }
    }
  });

  it('always returns the only item when there is one', () => {
    expect(drawMany(['solo'], 3, 1)).toEqual(['solo', 'solo', 'solo']);
  });

  it('skips bag entries that are no longer valid items', () => {
    const rng = createSeededRng(1);
    const first = drawFromBag(['a', 'b', 'c'], ['a', 'c'], null, rng);
    expect(first.item).toBe('a');
    expect(drawFromBag(first.bag, ['a', 'c'], 'a', rng).item).toBe('c');
  });

  it('draws entries appended to the bag within the current cycle', () => {
    const rng = createSeededRng(1);
    const first = drawFromBag(['b', 'x'], ['a', 'b', 'x'], 'a', rng);
    expect(first.item).toBe('b');
    expect(drawFromBag(first.bag, ['a', 'b', 'x'], 'b', rng).item).toBe('x');
  });

  it('fails explicitly without items', () => {
    expect(() => drawFromBag([], [], null, createSeededRng(1))).toThrow('Cannot draw from a bag without items');
  });
});

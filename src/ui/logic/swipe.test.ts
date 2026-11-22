import { describe, expect, it } from 'vitest';
import { otherIndex, swipeOutcome } from './swipe';

describe('swipeOutcome', () => {
  it('reads a tiny movement as a tap', () => {
    expect(swipeOutcome(3, 300)).toBe('TAP');
    expect(swipeOutcome(-5, 300)).toBe('TAP');
  });

  it('throws the card off past the threshold, either way', () => {
    expect(swipeOutcome(90, 300)).toBe('RIGHT');
    expect(swipeOutcome(-90, 300)).toBe('LEFT');
  });

  it('sends it back when the drag falls short', () => {
    expect(swipeOutcome(60, 300)).toBe('BACK');
  });

  it('refuses a card without width', () => {
    expect(() => swipeOutcome(10, 0)).toThrow('got 0');
  });
});

describe('otherIndex', () => {
  it('never returns the current card when there is another', () => {
    for (const r of [0, 0.2, 0.5, 0.99]) expect(otherIndex(2, 5, () => r)).not.toBe(2);
  });

  it('covers every other card', () => {
    const seen = new Set([0, 0.25, 0.5, 0.75].map((r) => otherIndex(0, 5, () => r)));
    expect([...seen].sort()).toEqual([1, 2, 3, 4]);
  });

  it('stays on the only card there is', () => {
    expect(otherIndex(0, 1, () => 0.5)).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import type { Card } from '../content/types';
import { card, deck, steppingClock } from '../testing/fixtures';
import { pickCard, RECYCLE_FRACTION } from './cardPicker';
import { createSeededRng } from './rng';

function play(cards: Card[], picks: number, seed: number): string[] {
  const rng = createSeededRng(seed);
  const clock = steppingClock();
  const history: Record<string, number> = {};
  const shown: string[] = [];
  for (let i = 0; i < picks; i++) {
    const picked = pickCard({ cards, type: 'TRUTH', level: 'SOFT', history, isEligible: () => true, rng });
    if (picked === null) throw new Error('Expected a card');
    history[picked.id] = clock.now();
    shown.push(picked.id);
  }
  return shown;
}

describe('pickCard', () => {
  it('only returns cards of the requested type, exact level and eligibility', () => {
    const cards = [
      card('t-soft', 'TRUTH', 'SOFT'),
      card('t-spicy', 'TRUTH', 'SPICY'),
      card('d-soft', 'DARE', 'SOFT'),
      card('t-blocked', 'TRUTH', 'SOFT'),
    ];
    for (let seed = 1; seed <= 20; seed++) {
      const picked = pickCard({
        cards,
        type: 'TRUTH',
        level: 'SOFT',
        history: {},
        isEligible: (c) => c.id !== 't-blocked',
        rng: createSeededRng(seed),
      });
      expect(picked?.id).toBe('t-soft');
    }
  });

  it('returns null when nothing is eligible', () => {
    expect(
      pickCard({ cards: [card('d', 'DARE')], type: 'TRUTH', level: 'SOFT', history: {}, isEligible: () => true, rng: createSeededRng(1) }),
    ).toBeNull();
  });

  it('never repeats a card while unseen ones remain', () => {
    const shown = play(deck('t', 'TRUTH', 'SOFT', 40), 40, 3);
    expect(new Set(shown).size).toBe(40);
  });

  it('prefers unseen cards even if seen ones are very old', () => {
    const cards = deck('t', 'TRUTH', 'SOFT', 3);
    const picked = pickCard({
      cards,
      type: 'TRUTH',
      level: 'SOFT',
      history: { 't-0': 1, 't-1': 2 },
      isEligible: () => true,
      rng: createSeededRng(1),
    });
    expect(picked?.id).toBe('t-2');
  });

  it('after a full cycle, recycles only the oldest quarter, so repeats are far apart', () => {
    const size = 40;
    const window = Math.ceil(size * RECYCLE_FRACTION);
    const shown = play(deck('t', 'TRUTH', 'SOFT', size), 400, 9);
    const lastSeenAt = new Map<string, number>();
    shown.forEach((id, index) => {
      const previous = lastSeenAt.get(id);
      if (previous !== undefined) expect(index - previous).toBeGreaterThanOrEqual(size - window + 1);
      lastSeenAt.set(id, index);
    });
  });

  it('plays the second cycle in a different order than the first', () => {
    const shown = play(deck('t', 'TRUTH', 'SOFT', 40), 80, 11);
    expect(shown.slice(40, 80)).not.toEqual(shown.slice(0, 40));
  });
});

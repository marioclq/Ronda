import { describe, expect, it } from 'vitest';
import type { Card, Pack } from '../core/content/types';
import { draftCombination, MAX_REJECTED, promoteDraft, reviewMarkdown, sampleIndexes, seedFrom } from './pipeline';

const draftCard = (n: number): Card => ({
  id: `draft-truth-soft-b001-${String(n).padStart(3, '0')}`,
  type: 'TRUTH',
  level: 'SOFT',
  text: `¿Pregunta ${n}?`,
  tags: [],
});
const draft: Pack = { id: 'draft-truth-soft-b001', version: 1, lang: 'es', cards: Array.from({ length: 30 }, (_, i) => draftCard(i + 1)) };

describe('sampleIndexes', () => {
  it('is deterministic for a seed, sorted, unique and in range', () => {
    const a = sampleIndexes(100, 20, seedFrom('draft-truth-soft-b001'));
    expect(a).toEqual(sampleIndexes(100, 20, seedFrom('draft-truth-soft-b001')));
    expect(new Set(a).size).toBe(20);
    expect([...a].sort((x, y) => x - y)).toEqual(a);
    expect(a.every((i) => i >= 0 && i < 100)).toBe(true);
  });

  it('takes everything when the batch is smaller than the sample', () => {
    expect(sampleIndexes(5, 20, 1)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('reviewMarkdown', () => {
  it('numbers the sampled cards from 1 and shows their text', () => {
    const md = reviewMarkdown(draft, [0, 4]);
    expect(md).toContain('1. ¿Pregunta 1?');
    expect(md).toContain('2. ¿Pregunta 5?');
  });
});

describe('promoteDraft', () => {
  it('assigns consecutive final ids after the existing ones and drops rejected cards', () => {
    const existing: Pack = {
      id: 'truth-soft',
      version: 3,
      lang: 'es',
      cards: [{ id: 'tod-t-soft-0007', type: 'TRUTH', level: 'SOFT', text: 'x', tags: [] }],
    };
    const promoted = promoteDraft(draft, existing, [draft.cards[1]?.id ?? '']);
    expect(promoted.version).toBe(4);
    expect(promoted.cards).toHaveLength(30);
    expect(promoted.cards[1]?.id).toBe('tod-t-soft-0008');
    expect(promoted.cards.some((c) => c.text === '¿Pregunta 2?')).toBe(false);
  });

  it('creates the pack when none exists', () => {
    const promoted = promoteDraft(draft, null, []);
    expect(promoted.id).toBe('truth-soft');
    expect(promoted.cards[0]?.id).toBe('tod-t-soft-0001');
  });

  it('refuses a batch with too many rejections: the spec discards it', () => {
    const ids = draft.cards.slice(0, MAX_REJECTED + 1).map((c) => c.id);
    expect(() => promoteDraft(draft, null, ids)).toThrow('discard');
  });

  it('refuses rejected ids that are not in the batch and mixed batches', () => {
    expect(() => promoteDraft(draft, null, ['nope'])).toThrow('nope');
    const mixed: Pack = { ...draft, cards: [draftCard(1), { ...draftCard(2), level: 'SPICY' }] };
    expect(() => draftCombination(mixed)).toThrow('SPICY');
  });
});

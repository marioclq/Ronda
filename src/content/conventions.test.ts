import { describe, expect, it } from 'vitest';
import type { Pack } from '../core/content/types';
import { cardIdFor, checkPackConventions, isExtremeCardId, packFileFor, packIdFor, parseCardId } from './conventions';

describe('ids and files', () => {
  it('builds ids with type, level and a four-digit number', () => {
    expect(cardIdFor('TRUTH', 'SOFT', 1)).toBe('tod-t-soft-0001');
    expect(cardIdFor('MOST_LIKELY', 'EXTREME', 42)).toBe('likely-extreme-0042');
  });

  it('refuses numbers outside 1..9999', () => {
    expect(() => cardIdFor('DARE', 'SOFT', 0)).toThrow('0');
    expect(() => cardIdFor('DARE', 'SOFT', 10_000)).toThrow('10000');
  });

  it('parses its own ids back and rejects anything else', () => {
    expect(parseCardId('tod-d-spicy-0150')).toEqual({ type: 'DARE', level: 'SPICY', n: 150 });
    expect(parseCardId('custom-abc')).toBeNull();
    expect(parseCardId('tod-t-soft-1')).toBeNull();
  });

  it('knows extreme ids without loading them', () => {
    expect(isExtremeCardId('never-extreme-0003')).toBe(true);
    expect(isExtremeCardId('never-spicy-0003')).toBe(false);
    expect(isExtremeCardId('custom-x')).toBe(false);
  });

  it('places extreme packs in their own folder', () => {
    expect(packFileFor('RATHER', 'SOFT')).toBe('rather.soft.json');
    expect(packFileFor('MOST_LIKELY', 'EXTREME')).toBe('extreme/most-likely.extreme.json');
    expect(packIdFor('MOST_LIKELY', 'SPICY')).toBe('most-likely-spicy');
  });
});

describe('checkPackConventions', () => {
  const pack = (cards: Pack['cards'], id = 'truth-soft'): Pack => ({ id, version: 1, lang: 'es', cards });
  const truth = { type: 'TRUTH', level: 'SOFT', text: '¿Hola?', tags: [] } as const;

  it('accepts a pack whose file, id and cards agree', () => {
    expect(checkPackConventions(pack([{ ...truth, id: 'tod-t-soft-0001' }]), 'truth.soft.json')).toEqual([]);
  });

  it('reports a card of another type or level, a bad id, a wrong pack id and an unknown file', () => {
    const problems = checkPackConventions(
      pack([{ ...truth, id: 'tod-t-soft-0001', level: 'SPICY' }, { ...truth, id: 'whatever' }], 'truth-x'),
      'truth.soft.json',
    );
    expect(problems.join('\n')).toContain('SPICY');
    expect(problems.join('\n')).toContain('whatever');
    expect(problems.join('\n')).toContain('truth-x');
    expect(checkPackConventions(pack([]), 'misc.json')[0]).toContain('misc.json');
  });
});

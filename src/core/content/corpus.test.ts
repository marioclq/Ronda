import { describe, expect, it } from 'vitest';
import {
  assertCorpus,
  checkCorpus,
  countByCombination,
  DEFAULT_NEAR_DUPLICATE_THRESHOLD,
  findBannedWords,
  findNearDuplicates,
  jaccard,
  normalizeWords,
  type CorpusRules,
} from './corpus';
import type { Card, Pack } from './types';
import { ContentError } from './validator';

function card(id: string, text: string, overrides: Partial<Card> = {}): Card {
  return { id, type: 'TRUTH', level: 'SOFT', text, tags: [], ...overrides };
}

function pack(id: string, cards: Card[]): Pack {
  return { id, version: 1, lang: 'es', cards };
}

const rules: CorpusRules = { bannedSoftWords: ['palabrota', 'beso'], nearDuplicateThreshold: DEFAULT_NEAR_DUPLICATE_THRESHOLD };

describe('normalizeWords', () => {
  it('ignores case, accents, punctuation and which variable is used', () => {
    expect(normalizeWords('¿Qué le DIJISTE a {otro}?')).toEqual(['que', 'le', 'dijiste', 'a', 'var']);
    expect(normalizeWords('¿Qué le dijiste a {compatible}?')).toEqual(normalizeWords('Que le dijiste a {otro}'));
  });
});

describe('jaccard', () => {
  it('is 1 for equal sets and 0 for disjoint sets', () => {
    expect(jaccard(new Set(['a', 'b']), new Set(['a', 'b']))).toBe(1);
    expect(jaccard(new Set(['a']), new Set(['b']))).toBe(0);
  });
});

describe('findNearDuplicates', () => {
  it('flags cards of the same type that only differ in punctuation or case', () => {
    const duplicates = findNearDuplicates(
      [card('a', 'Cuenta tu peor cita de la vida'), card('b', '¡CUENTA tu peor cita de la vida!')],
      0.8,
    );
    expect(duplicates.map((d) => [d.a.id, d.b.id])).toEqual([['a', 'b']]);
  });

  it('does not compare cards of different types', () => {
    const duplicates = findNearDuplicates(
      [card('a', 'Cuenta tu peor cita de la vida'), card('b', 'Cuenta tu peor cita de la vida', { type: 'DARE' })],
      0.8,
    );
    expect(duplicates).toEqual([]);
  });

  it('does not flag genuinely different cards', () => {
    const duplicates = findNearDuplicates(
      [card('a', 'Cuenta tu peor cita de la vida'), card('b', 'Imita a tu profesor favorito del colegio')],
      0.8,
    );
    expect(duplicates).toEqual([]);
  });
});

describe('findBannedWords', () => {
  it('matches whole words ignoring accents and case', () => {
    expect(findBannedWords(card('a', 'Un BESÓ inesperado'), ['beso'])).toEqual(['beso']);
    expect(findBannedWords(card('a', 'Me dio mareo'), ['mar'])).toEqual([]);
  });
});

describe('countByCombination', () => {
  it('counts every type and level combination, including empty ones', () => {
    const counts = countByCombination([card('a', 'x'), card('b', 'y'), card('c', 'z', { level: 'SPICY' })]);
    expect(counts.size).toBe(15);
    expect(counts.get('TRUTH/SOFT')).toBe(2);
    expect(counts.get('TRUTH/SPICY')).toBe(1);
    expect(counts.get('DARE/EXTREME')).toBe(0);
  });
});

describe('checkCorpus', () => {
  it('reports ids reused across packs', () => {
    const issues = checkCorpus([pack('p1', [card('same', 'Uno dos tres')]), pack('p2', [card('same', 'Cuatro cinco seis')])], rules);
    expect(issues).toEqual([{ source: 'p2', cardId: 'same', message: 'id already used in pack p1' }]);
  });

  it('reports banned words only on SOFT cards', () => {
    const issues = checkCorpus(
      [pack('p1', [card('soft', 'Di una palabrota'), card('spicy', 'Di otra palabrota', { level: 'SPICY' })])],
      rules,
    );
    expect(issues).toEqual([{ source: 'p1', cardId: 'soft', message: 'banned words in SOFT card: palabrota' }]);
  });

  it('reports near-duplicates across packs', () => {
    const issues = checkCorpus(
      [pack('p1', [card('a', 'Cuenta tu peor cita de la vida')]), pack('p2', [card('b', 'Cuenta tu peor cita de la vida.')])],
      rules,
    );
    expect(issues).toEqual([{ source: 'p1', cardId: 'a', message: 'near-duplicate of b (similarity 1.00)' }]);
  });

  it('assertCorpus throws ContentError with the issues', () => {
    expect(() => assertCorpus([pack('p1', [card('soft', 'Di una palabrota')])], rules)).toThrow(ContentError);
    expect(() => assertCorpus([pack('p1', [card('ok', 'Cuenta algo bonito')])], rules)).not.toThrow();
  });
});

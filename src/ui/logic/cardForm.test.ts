import { describe, expect, it } from 'vitest';
import { buildCustomCard, EMPTY_CARD_DRAFT } from './cardForm';

const draft = { ...EMPTY_CARD_DRAFT, text: '  ¿Cuál es tu secreto?  ' };

describe('buildCustomCard', () => {
  it('builds a valid card with a trimmed text and no tags', () => {
    expect(buildCustomCard(draft, 'custom-1')).toEqual({
      id: 'custom-1',
      type: 'TRUTH',
      level: 'SOFT',
      text: '¿Cuál es tu secreto?',
      tags: [],
    });
  });

  it('rejects empty text', () => {
    expect(() => buildCustomCard({ ...draft, text: '   ' }, 'custom-1')).toThrow('text');
  });

  it('rejects player variables in group cards', () => {
    expect(() => buildCustomCard({ ...draft, type: 'NEVER', text: 'Yo nunca con {otro}' }, 'custom-1')).toThrow();
  });

  it('rejects unknown variables', () => {
    expect(() => buildCustomCard({ ...draft, text: 'Hola {nadie}' }, 'custom-1')).toThrow('nadie');
  });

  it('accepts a timer on DARE cards only as a whole number', () => {
    expect(buildCustomCard({ ...draft, type: 'DARE', text: 'Baila', timerSeconds: '20' }, 'custom-1').timerSeconds).toBe(20);
    expect(() => buildCustomCard({ ...draft, type: 'DARE', text: 'Baila', timerSeconds: 'abc' }, 'custom-1')).toThrow('timerSeconds');
  });

  it('ignores a stale timer value when the type is not DARE', () => {
    const card = buildCustomCard({ ...draft, type: 'TRUTH', timerSeconds: '30' }, 'custom-1');
    expect(card.timerSeconds).toBeUndefined();
    expect(card.type).toBe('TRUTH');
  });
});

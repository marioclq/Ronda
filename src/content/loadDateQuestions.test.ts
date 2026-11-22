import { describe, expect, it } from 'vitest';
import { loadDateQuestions, parseDateQuestions } from './loadDateQuestions';

describe('loadDateQuestions', () => {
  it('loads the 36 questions in order, 12 per set', () => {
    const questions = loadDateQuestions();
    expect(questions.map((q) => q.number)).toEqual(Array.from({ length: 36 }, (_, i) => i + 1));
    for (const set of [1, 2, 3] as const) expect(questions.filter((q) => q.set === set)).toHaveLength(12);
  });

  it('keeps the 4-minute life story timed', () => {
    expect(loadDateQuestions().find((q) => q.number === 11)?.timerSeconds).toBe(240);
  });

  it('rejects a file out of order, with the offending number', () => {
    expect(() =>
      parseDateQuestions({ questions: [{ number: 2, set: 1, text: 'x' }, { number: 1, set: 1, text: 'y' }] }),
    ).toThrow('2');
  });

  it('rejects an unknown set or empty text', () => {
    expect(() => parseDateQuestions({ questions: [{ number: 1, set: 4, text: 'x' }] })).toThrow('set');
    expect(() => parseDateQuestions({ questions: [{ number: 1, set: 1, text: ' ' }] })).toThrow('text');
  });
});

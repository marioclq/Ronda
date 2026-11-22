import { describe, expect, it } from 'vitest';
import { steppingClock } from '../testing/fixtures';
import {
  createDateSession,
  dateRecordFrom,
  isSetTimeUp,
  readerSeat,
  reduceDate,
  SET_MINUTES,
  type DateQuestion,
  type DateSession,
} from './session';

const questions: DateQuestion[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  number: n,
  set: (n <= 2 ? 1 : n <= 4 ? 2 : 3) as 1 | 2 | 3,
  text: `Pregunta ${n}`,
}));

function begin(startSet: 1 | 2 | 3 = 1): DateSession {
  const clock = steppingClock(0, 1000);
  let s = createDateSession(['Ana', 'Beto'], questions, startSet);
  s = reduceDate(s, { type: 'AGREE' }, clock);
  s = reduceDate(s, { type: 'RATE', value: 3 }, clock);
  return reduceDate(s, { type: 'RATE', value: 4 }, clock);
}

describe('date session', () => {
  it('starts asking for the shared agreement, then IOS from each seat, then the first card of the chosen set', () => {
    const clock = steppingClock();
    let s = createDateSession(['Ana', 'Beto'], questions, 2);
    expect(s.phase).toEqual({ kind: 'CONSENT' });
    s = reduceDate(s, { type: 'AGREE' }, clock);
    expect(s.phase).toEqual({ kind: 'IOS', moment: 'BEFORE', seat: 0 });
    s = reduceDate(s, { type: 'RATE', value: 2 }, clock);
    expect(s.phase).toEqual({ kind: 'IOS', moment: 'BEFORE', seat: 1 });
    s = reduceDate(s, { type: 'RATE', value: 5 }, clock);
    expect(s.phase).toEqual({ kind: 'QUESTION', index: 2 });
    expect(s.ios.before).toEqual([2, 5]);
  });

  it('alternates who reads first on every card, starting with the first seat', () => {
    let s = begin();
    const readers: number[] = [];
    while (s.phase.kind === 'QUESTION' || s.phase.kind === 'SET_BREAK') {
      if (s.phase.kind === 'QUESTION') readers.push(readerSeat(s, s.phase.index));
      s = reduceDate(s, { type: 'NEXT' }, steppingClock());
    }
    expect(readers).toEqual([0, 1, 0, 1, 0, 1]);
  });

  it('pauses between sets and goes to the closing IOS after the last card', () => {
    let s = begin();
    s = reduceDate(s, { type: 'NEXT' }, steppingClock());
    s = reduceDate(s, { type: 'NEXT' }, steppingClock());
    expect(s.phase).toEqual({ kind: 'SET_BREAK', nextSet: 2 });
    for (let i = 0; i < 6; i += 1) s = reduceDate(s, { type: 'NEXT' }, steppingClock());
    expect(s.phase).toEqual({ kind: 'IOS', moment: 'AFTER', seat: 0 });
  });

  it('records the closing IOS of both seats and shows the result', () => {
    let s = reduceDate(begin(3), { type: 'FINISH' }, steppingClock());
    s = reduceDate(s, { type: 'RATE', value: 6 }, steppingClock());
    s = reduceDate(s, { type: 'RATE', value: 5 }, steppingClock());
    expect(s.phase).toEqual({ kind: 'RESULT' });
    expect(s.ios).toEqual({ before: [3, 4], after: [6, 5] });
  });

  it('times each set: 15 minutes from its first card', () => {
    const s = begin();
    if (s.setStartedAt === null) throw new Error('set should have started');
    expect(isSetTimeUp(s, s.setStartedAt + SET_MINUTES * 60_000 - 1)).toBe(false);
    expect(isSetTimeUp(s, s.setStartedAt + SET_MINUTES * 60_000)).toBe(true);
  });

  it('rejects IOS values outside 1..7, two equal names, and actions in the wrong phase', () => {
    const s = reduceDate(createDateSession(['Ana', 'Beto'], questions, 1), { type: 'AGREE' }, steppingClock());
    expect(() => reduceDate(s, { type: 'RATE', value: 8 }, steppingClock())).toThrow('8');
    expect(() => createDateSession(['Ana', 'ana'], questions, 1)).toThrow('ana');
    expect(() => reduceDate(s, { type: 'NEXT' }, steppingClock())).toThrow('IOS');
  });

  it('refuses a start set that has no questions', () => {
    expect(() => createDateSession(['Ana', 'Beto'], questions.slice(0, 2), 3)).toThrow('set 3');
  });
});

describe('date record', () => {
  function finished(): DateSession {
    let s = begin(1);
    s = reduceDate(s, { type: 'NEXT' }, steppingClock());
    s = reduceDate(s, { type: 'FINISH' }, steppingClock());
    s = reduceDate(s, { type: 'RATE', value: 5 }, steppingClock());
    return reduceDate(s, { type: 'RATE', value: 6 }, steppingClock());
  }

  it('remembers the furthest question reached', () => {
    let s = begin(1);
    expect(s.furthestNumber).toBe(1);
    s = reduceDate(s, { type: 'NEXT' }, steppingClock());
    expect(s.furthestNumber).toBe(2);
  });

  it('builds a record with names, start set, how far they got and both IOS pairs', () => {
    expect(dateRecordFrom(finished(), 1_700_000_000_000, 'date-1')).toEqual({
      id: 'date-1',
      at: 1_700_000_000_000,
      names: ['Ana', 'Beto'],
      startSet: 1,
      lastQuestion: 2,
      ios: { before: [3, 4], after: [5, 6] },
    });
  });

  it('refuses to build a record before the result', () => {
    expect(() => dateRecordFrom(begin(1), 1, 'date-1')).toThrow('RESULT');
  });
});

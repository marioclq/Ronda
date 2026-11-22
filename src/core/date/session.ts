import type { Clock } from '../game/clock';

/**
 * Date mode: the 36-question procedure of Aron et al. (1997) for two people with one phone.
 * Pure state machine; the UI renders phases and dispatches actions.
 */

/** Aron 1997: about 15 minutes per set. Not finishing a set is fine. */
export const SET_MINUTES = 15;
export const IOS_MIN = 1;
export const IOS_MAX = 7;

export type DateSet = 1 | 2 | 3;
export type Seat = 0 | 1;

export interface DateQuestion {
  readonly number: number;
  readonly set: DateSet;
  readonly text: string;
  /** For tasks with a duration, such as the 4-minute life story. */
  readonly timerSeconds?: number;
}

export type DatePhase =
  | { readonly kind: 'CONSENT' }
  | { readonly kind: 'IOS'; readonly moment: 'BEFORE' | 'AFTER'; readonly seat: Seat }
  | { readonly kind: 'QUESTION'; readonly index: number }
  | { readonly kind: 'SET_BREAK'; readonly nextSet: DateSet }
  | { readonly kind: 'RESULT' };

type Pair = readonly [number | null, number | null];

export interface DateSession {
  readonly names: readonly [string, string];
  readonly questions: readonly DateQuestion[];
  readonly startSet: DateSet;
  /** Index of the first card played; readers alternate from here. */
  readonly firstIndex: number;
  /** Number of the furthest question shown, for the saved record. */
  readonly furthestNumber: number | null;
  readonly ios: { readonly before: Pair; readonly after: Pair };
  readonly setStartedAt: number | null;
  readonly phase: DatePhase;
}

export type DateAction =
  | { readonly type: 'AGREE' }
  | { readonly type: 'RATE'; readonly value: number }
  | { readonly type: 'NEXT' }
  | { readonly type: 'FINISH' };

export function createDateSession(
  names: readonly [string, string],
  questions: readonly DateQuestion[],
  startSet: DateSet,
): DateSession {
  const [first, second] = names;
  if (first.trim() === '' || second.trim() === '') throw new Error(`A date needs two named people, got ${JSON.stringify(names)}`);
  if (first.trim().toLowerCase() === second.trim().toLowerCase()) {
    throw new Error(`A date needs two different people, got "${first}" and "${second}"`);
  }
  const firstIndex = questions.findIndex((q) => q.set === startSet);
  if (firstIndex === -1) throw new Error(`There are no questions in set ${startSet} (${questions.length} questions loaded)`);
  return {
    names,
    questions,
    startSet,
    firstIndex,
    furthestNumber: null,
    ios: { before: [null, null], after: [null, null] },
    setStartedAt: null,
    phase: { kind: 'CONSENT' },
  };
}

/** Who reads the card aloud and answers first. Alternates on every card (Aron 1997, procedure). */
export function readerSeat(session: DateSession, index: number): Seat {
  return (index - session.firstIndex) % 2 === 0 ? 0 : 1;
}

export function isSetTimeUp(session: DateSession, now: number): boolean {
  return session.setStartedAt !== null && now - session.setStartedAt >= SET_MINUTES * 60_000;
}

function invalid(action: DateAction, phase: DatePhase, reason: string): Error {
  return new Error(`Date action ${JSON.stringify(action)} is not valid in phase ${phase.kind}: ${reason}`);
}

function withRating(pair: Pair, seat: Seat, value: number): Pair {
  return seat === 0 ? [value, pair[1]] : [pair[0], value];
}

function showQuestion(session: DateSession, index: number): DateSession {
  const question = session.questions[index];
  if (question === undefined) throw new Error(`No date question at index ${index} (${session.questions.length} loaded)`);
  const furthestNumber = Math.max(session.furthestNumber ?? 0, question.number);
  return { ...session, furthestNumber, phase: { kind: 'QUESTION', index } };
}

/** What is kept of a finished date: who, when, how far, and how close each felt before and after. */
export interface DateRecord {
  readonly id: string;
  readonly at: number;
  readonly names: readonly [string, string];
  readonly startSet: DateSet;
  readonly lastQuestion: number;
  readonly ios: { readonly before: readonly [number, number]; readonly after: readonly [number, number] };
}

export function dateRecordFrom(session: DateSession, at: number, id: string): DateRecord {
  const { before, after } = session.ios;
  const [b0, b1] = before;
  const [a0, a1] = after;
  if (session.phase.kind !== 'RESULT' || b0 === null || b1 === null || a0 === null || a1 === null || session.furthestNumber === null) {
    throw new Error(
      `A date record needs a finished date (phase RESULT, both IOS pairs), got phase ${session.phase.kind} and IOS ${JSON.stringify(session.ios)}`,
    );
  }
  return {
    id,
    at,
    names: session.names,
    startSet: session.startSet,
    lastQuestion: session.furthestNumber,
    ios: { before: [b0, b1], after: [a0, a1] },
  };
}

export function reduceDate(session: DateSession, action: DateAction, clock: Clock): DateSession {
  const { phase } = session;
  switch (action.type) {
    case 'AGREE':
      if (phase.kind !== 'CONSENT') throw invalid(action, phase, 'the agreement is only asked at the start');
      return { ...session, phase: { kind: 'IOS', moment: 'BEFORE', seat: 0 } };

    case 'RATE': {
      if (phase.kind !== 'IOS') throw invalid(action, phase, 'ratings are only taken on the IOS screens');
      if (!Number.isInteger(action.value) || action.value < IOS_MIN || action.value > IOS_MAX) {
        throw invalid(action, phase, `IOS must be an integer from ${IOS_MIN} to ${IOS_MAX}, got ${action.value}`);
      }
      const ios =
        phase.moment === 'BEFORE'
          ? { ...session.ios, before: withRating(session.ios.before, phase.seat, action.value) }
          : { ...session.ios, after: withRating(session.ios.after, phase.seat, action.value) };
      if (phase.seat === 0) return { ...session, ios, phase: { ...phase, seat: 1 } };
      if (phase.moment === 'AFTER') return { ...session, ios, phase: { kind: 'RESULT' } };
      return showQuestion({ ...session, ios, setStartedAt: clock.now() }, session.firstIndex);
    }

    case 'NEXT': {
      if (phase.kind === 'SET_BREAK') {
        const index = session.questions.findIndex((q) => q.set === phase.nextSet);
        if (index === -1) throw invalid(action, phase, `set ${phase.nextSet} has no questions`);
        return showQuestion({ ...session, setStartedAt: clock.now() }, index);
      }
      if (phase.kind !== 'QUESTION') throw invalid(action, phase, 'NEXT moves through cards and set breaks only');
      const current = session.questions[phase.index];
      const next = session.questions[phase.index + 1];
      if (current === undefined) throw invalid(action, phase, `no question at index ${phase.index}`);
      if (next === undefined) return { ...session, phase: { kind: 'IOS', moment: 'AFTER', seat: 0 } };
      if (next.set !== current.set) return { ...session, phase: { kind: 'SET_BREAK', nextSet: next.set } };
      return showQuestion(session, phase.index + 1);
    }

    case 'FINISH':
      if (phase.kind !== 'QUESTION' && phase.kind !== 'SET_BREAK') {
        throw invalid(action, phase, 'a date can only be finished from a card or a set break');
      }
      return { ...session, phase: { kind: 'IOS', moment: 'AFTER', seat: 0 } };
  }
}

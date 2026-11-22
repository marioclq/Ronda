import { describe, expect, it } from 'vitest';
import type { Card, GameMode, Level } from '../content/types';
import { deck, player, steppingClock } from '../testing/fixtures';
import {
  createGame,
  InvalidActionError,
  missingContent,
  reduce,
  type EngineDeps,
  type GameConfig,
  type GameState,
  type Penalty,
} from './engine';
import { createSeededRng } from './rng';

const ana = player('ana', 'WOMAN', 'MEN');
const beto = player('beto', 'MAN', 'WOMEN');
const caro = player('caro', 'WOMAN', 'UNDISCLOSED');

const softCards: Card[] = [
  ...deck('t', 'TRUTH', 'SOFT', 5),
  ...deck('d', 'DARE', 'SOFT', 5),
  ...deck('n', 'NEVER', 'SOFT', 5),
  ...deck('r', 'RATHER', 'SOFT', 5),
];

function deps(cards: Card[] = softCards, seed = 1): EngineDeps {
  return { cards, rng: createSeededRng(seed), clock: steppingClock() };
}

function config(modes: GameMode[], penalty: Penalty = { kind: 'NONE' }, level: Level = 'SOFT'): GameConfig {
  return { modes, level, penalty };
}

function awaitingPlayer(state: GameState): string {
  if (state.phase.kind !== 'AWAITING_CHOICE') throw new Error(`Expected AWAITING_CHOICE, got ${state.phase.kind}`);
  return state.phase.playerId;
}

describe('createGame', () => {
  it('rejects games without modes, with repeated modes or with fewer than 2 players', () => {
    expect(() => createGame(config([]), [ana, beto], {}, deps())).toThrow('A game needs at least one mode');
    expect(() => createGame(config(['NEVER', 'NEVER']), [ana, beto], {}, deps())).toThrow('Duplicate modes: NEVER, NEVER');
    expect(() => createGame(config(['NEVER']), [ana], {}, deps())).toThrow('A game needs at least 2 players, got 1');
    expect(() => createGame(config(['NEVER']), [ana, ana], {}, deps())).toThrow('Duplicate player ids: ana, ana');
  });

  it('rejects modes without cards at the chosen level', () => {
    expect(missingContent(config(['NEVER', 'MOST_LIKELY']), softCards)).toEqual(['MOST_LIKELY']);
    expect(() => createGame(config(['MOST_LIKELY']), [ana, beto], {}, deps())).toThrow(
      'No cards at level SOFT for modes: MOST_LIKELY',
    );
  });
});

describe('group modes', () => {
  it('shows a group card and records it in the history', () => {
    const state = createGame(config(['NEVER']), [ana, beto], {}, deps());
    expect(state.round).toBe(1);
    if (state.phase.kind !== 'SHOWING_CARD') throw new Error('Expected SHOWING_CARD');
    expect(state.phase.playerId).toBeNull();
    expect(state.phase.card.type).toBe('NEVER');
    expect(state.history[state.phase.card.id]).toBeTypeOf('number');
  });

  it('NEXT starts a new round with an unseen card', () => {
    const d = deps();
    const first = createGame(config(['NEVER']), [ana, beto], {}, d);
    const second = reduce(first, { type: 'NEXT' }, d);
    expect(second.round).toBe(2);
    if (first.phase.kind !== 'SHOWING_CARD' || second.phase.kind !== 'SHOWING_CARD') throw new Error('Expected cards');
    expect(second.phase.card.id).not.toBe(first.phase.card.id);
  });

  it('alternates modes so both appear in every pair of rounds', () => {
    const d = deps();
    let state = createGame(config(['NEVER', 'RATHER']), [ana, beto], {}, d);
    const modes: GameMode[] = [];
    for (let i = 0; i < 10; i++) {
      if (state.phase.kind !== 'SHOWING_CARD') throw new Error('Expected SHOWING_CARD');
      modes.push(state.phase.mode);
      state = reduce(state, { type: 'NEXT' }, d);
    }
    for (let i = 0; i < modes.length; i += 2) expect(new Set(modes.slice(i, i + 2)).size).toBe(2);
  });
});

describe('truth or dare', () => {
  it('asks the player to choose, then shows a card of the chosen type for that player', () => {
    const d = deps();
    const state = createGame(config(['TRUTH_OR_DARE']), [ana, beto], {}, d);
    const playerId = awaitingPlayer(state);
    expect(state.phase).toEqual({ kind: 'AWAITING_CHOICE', playerId, unavailable: [] });

    const shown = reduce(state, { type: 'CHOOSE', choice: 'TRUTH' }, d);
    if (shown.phase.kind !== 'SHOWING_CARD') throw new Error('Expected SHOWING_CARD');
    expect(shown.phase.card.type).toBe('TRUTH');
    expect(shown.phase.playerId).toBe(playerId);
    expect(shown.choiceCount[playerId]).toEqual({ truth: 1, dare: 0 });
  });

  it('alternates between two players turn after turn', () => {
    const d = deps();
    let state = createGame(config(['TRUTH_OR_DARE']), [ana, beto], {}, d);
    const turns: string[] = [];
    for (let i = 0; i < 6; i++) {
      turns.push(awaitingPlayer(state));
      state = reduce(reduce(state, { type: 'CHOOSE', choice: 'TRUTH' }, d), { type: 'COMPLETE' }, d);
    }
    for (let i = 1; i < turns.length; i++) expect(turns[i]).not.toBe(turns[i - 1]);
  });

  it('REFUSE shows the configured penalty, then NEXT moves on', () => {
    const d = deps();
    const start = createGame(config(['TRUTH_OR_DARE'], { kind: 'DRINKS', count: 2 }), [ana, beto], {}, d);
    const playerId = awaitingPlayer(start);
    const refused = reduce(reduce(start, { type: 'CHOOSE', choice: 'DARE' }, d), { type: 'REFUSE' }, d);
    expect(refused.phase).toEqual({ kind: 'SHOWING_PENALTY', playerId, penalty: { kind: 'DRINKS', count: 2 } });
    const next = reduce(refused, { type: 'NEXT' }, d);
    expect(next.round).toBe(2);
    expect(next.phase.kind).toBe('AWAITING_CHOICE');
  });

  it('REFUSE without penalty moves straight to the next round', () => {
    const d = deps();
    const start = createGame(config(['TRUTH_OR_DARE']), [ana, beto], {}, d);
    const next = reduce(reduce(start, { type: 'CHOOSE', choice: 'DARE' }, d), { type: 'REFUSE' }, d);
    expect(next.round).toBe(2);
    expect(next.phase.kind).toBe('AWAITING_CHOICE');
  });

  it('RANDOM picks the type the player has done less', () => {
    const d = deps();
    let state = createGame(config(['TRUTH_OR_DARE']), [ana, beto], {}, d);
    const first = awaitingPlayer(state);
    state = reduce(reduce(state, { type: 'CHOOSE', choice: 'TRUTH' }, d), { type: 'COMPLETE' }, d);
    state = reduce(reduce(state, { type: 'CHOOSE', choice: 'TRUTH' }, d), { type: 'COMPLETE' }, d);
    expect(awaitingPlayer(state)).toBe(first);
    const shown = reduce(state, { type: 'CHOOSE', choice: 'RANDOM' }, d);
    if (shown.phase.kind !== 'SHOWING_CARD') throw new Error('Expected SHOWING_CARD');
    expect(shown.phase.card.type).toBe('DARE');
  });

  it('marks a type unavailable when no card can be rendered for the current players', () => {
    const cards = [...deck('t', 'TRUTH', 'SOFT', 3), ...deck('d', 'DARE', 'SOFT', 3, () => 'Abraza a {compatible}')];
    const d = deps(cards);
    const state = createGame(config(['TRUTH_OR_DARE']), [ana, caro], {}, d);
    expect(state.phase).toMatchObject({ kind: 'AWAITING_CHOICE', unavailable: ['DARE'] });
    expect(() => reduce(state, { type: 'CHOOSE', choice: 'DARE' }, d)).toThrow(InvalidActionError);
    const shown = reduce(state, { type: 'CHOOSE', choice: 'RANDOM' }, d);
    if (shown.phase.kind !== 'SHOWING_CARD') throw new Error('Expected SHOWING_CARD');
    expect(shown.phase.card.type).toBe('TRUTH');
  });

  it('allows SKIP_TURN only when no card is possible at all', () => {
    const needsMatch = () => 'Con {compatible}';
    const cards = [...deck('t', 'TRUTH', 'SOFT', 3, needsMatch), ...deck('d', 'DARE', 'SOFT', 3, needsMatch)];
    const d = deps(cards);
    const stuck = createGame(config(['TRUTH_OR_DARE']), [ana, caro], {}, d);
    expect(stuck.phase).toMatchObject({ kind: 'AWAITING_CHOICE', unavailable: ['TRUTH', 'DARE'] });
    const skipped = reduce(stuck, { type: 'SKIP_TURN' }, d);
    expect(skipped.round).toBe(2);
    expect(awaitingPlayer(skipped)).not.toBe(awaitingPlayer(stuck));

    const normal = createGame(config(['TRUTH_OR_DARE']), [ana, beto], {}, deps());
    expect(() => reduce(normal, { type: 'SKIP_TURN' }, deps())).toThrow(InvalidActionError);
  });
});

describe('invalid actions and ending', () => {
  it('rejects actions that do not belong to the current phase', () => {
    const d = deps();
    const choosing = createGame(config(['TRUTH_OR_DARE']), [ana, beto], {}, d);
    expect(() => reduce(choosing, { type: 'NEXT' }, d)).toThrow('Action NEXT is not valid in phase AWAITING_CHOICE');
    const group = createGame(config(['NEVER']), [ana, beto], {}, d);
    expect(() => reduce(group, { type: 'COMPLETE' }, d)).toThrow(InvalidActionError);
  });

  it('END finishes the game and nothing is accepted afterwards', () => {
    const d = deps();
    const ended = reduce(createGame(config(['NEVER']), [ana, beto], {}, d), { type: 'END' }, d);
    expect(ended.phase).toEqual({ kind: 'ENDED' });
    expect(() => reduce(ended, { type: 'NEXT' }, d)).toThrow('the game has ended');
  });
});

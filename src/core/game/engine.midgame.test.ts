import { describe, expect, it } from 'vitest';
import type { Card, GameMode, Level } from '../content/types';
import { deck, player, steppingClock } from '../testing/fixtures';
import { createGame, InvalidActionError, reduce, type EngineDeps, type GameConfig, type GameState } from './engine';
import { createSeededRng } from './rng';

const ana = player('ana', 'WOMAN', 'MEN');
const beto = player('beto', 'MAN', 'WOMEN');
const caro = player('caro', 'WOMAN', 'UNDISCLOSED');
const dani = player('dani', 'WOMAN', 'MEN');

const cards: Card[] = [
  ...deck('t', 'TRUTH', 'SOFT', 6),
  ...deck('d', 'DARE', 'SOFT', 6),
  ...deck('ts', 'TRUTH', 'SPICY', 6),
  ...deck('ds', 'DARE', 'SPICY', 6),
];

function deps(list: Card[] = cards, seed = 1): EngineDeps {
  return { cards: list, rng: createSeededRng(seed), clock: steppingClock() };
}

function config(modes: GameMode[] = ['TRUTH_OR_DARE'], level: Level = 'SOFT'): GameConfig {
  return { modes, level, penalty: { kind: 'NONE' } };
}

function awaitingPlayer(state: GameState): string {
  if (state.phase.kind !== 'AWAITING_CHOICE') throw new Error(`Expected AWAITING_CHOICE, got ${state.phase.kind}`);
  return state.phase.playerId;
}

function playTurn(state: GameState, d: EngineDeps): GameState {
  return reduce(reduce(state, { type: 'CHOOSE', choice: 'TRUTH' }, d), { type: 'COMPLETE' }, d);
}

describe('ADD_PLAYER', () => {
  it('lets the new player play within the current cycle, after those still waiting', () => {
    const d = deps();
    const start = createGame(config(), [ana, beto], {}, d);
    const first = awaitingPlayer(start);
    const waiting = first === 'ana' ? 'beto' : 'ana';
    const withCaro = reduce(start, { type: 'ADD_PLAYER', player: caro }, d);
    expect(awaitingPlayer(withCaro)).toBe(first);
    const second = playTurn(withCaro, d);
    expect(awaitingPlayer(second)).toBe(waiting);
    expect(awaitingPlayer(playTurn(second, d))).toBe('caro');
  });

  it('rejects a player who is already playing', () => {
    const d = deps();
    const start = createGame(config(), [ana, beto], {}, d);
    expect(() => reduce(start, { type: 'ADD_PLAYER', player: ana }, d)).toThrow('player ana is already playing');
  });

  it('refreshes unavailable types when a compatible player joins', () => {
    const cardsNeedingMatch = [...deck('t', 'TRUTH', 'SOFT', 3), ...deck('d', 'DARE', 'SOFT', 3, () => 'Abraza a {compatible}')];
    const d = deps(cardsNeedingMatch);
    const start = createGame(config(), [ana, dani], {}, d);
    expect(start.phase).toMatchObject({ kind: 'AWAITING_CHOICE', unavailable: ['DARE'] });
    const withBeto = reduce(start, { type: 'ADD_PLAYER', player: beto }, d);
    expect(withBeto.phase).toMatchObject({ kind: 'AWAITING_CHOICE', unavailable: [] });
  });
});

describe('REMOVE_PLAYER', () => {
  it('starts a new round when the current player leaves', () => {
    const d = deps();
    const start = createGame(config(), [ana, beto, caro], {}, d);
    const leaving = awaitingPlayer(start);
    const after = reduce(start, { type: 'REMOVE_PLAYER', playerId: leaving }, d);
    expect(after.round).toBe(2);
    expect(awaitingPlayer(after)).not.toBe(leaving);
    expect(after.players.map((p) => p.id)).not.toContain(leaving);
  });

  it('pauses below 2 players and resumes when someone joins', () => {
    const d = deps();
    const start = createGame(config(), [ana, beto], {}, d);
    const paused = reduce(start, { type: 'REMOVE_PLAYER', playerId: 'beto' }, d);
    expect(paused.phase).toEqual({ kind: 'PAUSED_NEED_PLAYERS' });
    expect(() => reduce(paused, { type: 'NEXT' }, d)).toThrow(InvalidActionError);
    const resumed = reduce(paused, { type: 'ADD_PLAYER', player: caro }, d);
    expect(resumed.phase.kind).toBe('AWAITING_CHOICE');
    expect(resumed.history).toEqual(paused.history);
  });

  it('rejects removing someone who is not playing', () => {
    const d = deps();
    const start = createGame(config(), [ana, beto], {}, d);
    expect(() => reduce(start, { type: 'REMOVE_PLAYER', playerId: 'zoe' }, d)).toThrow('player zoe is not playing');
  });
});

describe('CHANGE_LEVEL', () => {
  it('uses the new level from the next card on, keeping the history', () => {
    const d = deps();
    const start = createGame(config(), [ana, beto], {}, d);
    const softShown = reduce(start, { type: 'CHOOSE', choice: 'TRUTH' }, d);
    const changed = reduce(softShown, { type: 'CHANGE_LEVEL', level: 'SPICY' }, d);
    expect(changed.history).toEqual(softShown.history);
    const next = reduce(reduce(changed, { type: 'COMPLETE' }, d), { type: 'CHOOSE', choice: 'TRUTH' }, d);
    if (next.phase.kind !== 'SHOWING_CARD') throw new Error('Expected SHOWING_CARD');
    expect(next.phase.card.level).toBe('SPICY');
  });

  it('rejects a level without cards for the selected modes', () => {
    const d = deps();
    const start = createGame(config(), [ana, beto], {}, d);
    const confirmed = reduce(start, { type: 'CONFIRM_ADULT' }, d);
    expect(() => reduce(confirmed, { type: 'CHANGE_LEVEL', level: 'EXTREME' }, d)).toThrow(
      'No cards at level EXTREME for modes: TRUTH_OR_DARE',
    );
  });
});

describe('turn order across player changes', () => {
  it('keeps one turn per player per cycle when a player joins right after a cycle was dealt', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const d = deps(cards, seed);
      let state = createGame(config(), [ana, beto], {}, d);
      while (state.turnQueue.length > 0) state = playTurn(state, d);
      const current = awaitingPlayer(state);
      state = reduce(state, { type: 'ADD_PLAYER', player: caro }, d);
      const turns = [current];
      for (let i = 0; i < 30; i += 1) {
        state = playTurn(state, d);
        turns.push(awaitingPlayer(state));
      }
      const context = `seed ${seed}: ${turns.join(',')}`;
      turns.slice(1).forEach((id, index) => {
        expect(id, context).not.toBe(turns[index]);
      });
      // turns[0] closes the previous cycle; every later window of 3 starts at a refill.
      for (let start = 1; start + 3 <= turns.length; start += 3) {
        expect([...turns.slice(start, start + 3)].sort(), context).toEqual(['ana', 'beto', 'caro']);
      }
    }
  });

  it('gives no extra turn to a player removed and re-added within the same cycle', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const d = deps(cards, seed);
      let state = createGame(config(), [ana, beto, caro], {}, d);
      const first = awaitingPlayer(state);
      const firstPlayer = [ana, beto, caro].find((p) => p.id === first);
      if (firstPlayer === undefined) throw new Error(`Unknown first player ${first}`);
      state = playTurn(state, d);
      state = reduce(state, { type: 'REMOVE_PLAYER', playerId: first }, d);
      state = reduce(state, { type: 'ADD_PLAYER', player: firstPlayer }, d);
      expect(state.turnQueue, `seed ${seed}`).not.toContain(first);
      const second = awaitingPlayer(state);
      state = playTurn(state, d);
      const third = awaitingPlayer(state);
      expect([first, second, third].sort(), `seed ${seed}`).toEqual(['ana', 'beto', 'caro']);
      expect(awaitingPlayer(playTurn(state, d)), `seed ${seed}`).not.toBe(third);
    }
  });

  it('never repeats a player in a row nor within a cycle while players join and leave', () => {
    const pool = [ana, beto, caro, dani, player('eli', 'MAN', 'WOMEN')];
    for (let seed = 1; seed <= 40; seed += 1) {
      const d = deps(cards, seed);
      const chance = createSeededRng(seed * 7919);
      let state = createGame(config(), [ana, beto], {}, d);
      let cycleSeen = new Set<string>([awaitingPlayer(state)]);
      let previousTurn = awaitingPlayer(state);
      const log: string[] = [`start:${previousTurn}`];

      const observe = (before: GameState, after: GameState): void => {
        if (after.round === before.round) return;
        const turn = awaitingPlayer(after);
        const queueBefore = before.turnQueue.filter((id) => after.players.some((p) => p.id === id));
        if (queueBefore.length === 0) cycleSeen = new Set<string>();
        log.push(`turn:${turn}`);
        const context = `seed ${seed}: ${log.join(' ')}`;
        expect(turn, context).not.toBe(previousTurn);
        expect(cycleSeen.has(turn), context).toBe(false);
        cycleSeen.add(turn);
        previousTurn = turn;
      };
      const apply = (action: Parameters<typeof reduce>[1]): void => {
        const before = state;
        state = reduce(state, action, d);
        observe(before, state);
      };

      for (let step = 0; step < 60; step += 1) {
        const roll = chance.nextInt(3);
        if (roll === 0) {
          const absent = pool.filter((p) => !state.players.some((q) => q.id === p.id));
          const candidate = absent[chance.nextInt(Math.max(absent.length, 1))];
          if (candidate !== undefined) {
            log.push(`add:${candidate.id}`);
            apply({ type: 'ADD_PLAYER', player: candidate });
          }
        } else if (roll === 1 && state.players.length > 2) {
          const leaving = state.players[chance.nextInt(state.players.length)];
          if (leaving !== undefined) {
            log.push(`remove:${leaving.id}`);
            apply({ type: 'REMOVE_PLAYER', playerId: leaving.id });
          }
        }
        apply({ type: 'CHOOSE', choice: 'TRUTH' });
        apply({ type: 'COMPLETE' });
      }
    }
  });
});

describe('REMOVE_PLAYER in a mixed-mode game', () => {
  it('re-draws only the chooser, keeping the mode bag and the last mode', () => {
    const d = deps([...cards, ...deck('n', 'NEVER', 'SOFT', 6)], 3);
    let state = createGame(config(['TRUTH_OR_DARE', 'NEVER']), [ana, beto, caro], {}, d);
    while (state.phase.kind !== 'AWAITING_CHOICE') state = reduce(state, { type: 'NEXT' }, d);
    const leaving = awaitingPlayer(state);
    const after = reduce(state, { type: 'REMOVE_PLAYER', playerId: leaving }, d);
    expect(after.phase.kind).toBe('AWAITING_CHOICE');
    expect(awaitingPlayer(after)).not.toBe(leaving);
    expect(after.modeBag).toEqual(state.modeBag);
    expect(after.lastMode).toBe(state.lastMode);
    expect(after.lastMode).toBe('TRUTH_OR_DARE');
  });
});

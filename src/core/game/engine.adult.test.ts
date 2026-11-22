import { describe, expect, it } from 'vitest';
import { deck, player, steppingClock } from '../testing/fixtures';
import { createGame, InvalidActionError, reduce, type EngineDeps, type GameConfig } from './engine';
import { createSeededRng } from './rng';

const players = [player('ana'), player('beto')];
const cards = [
  ...deck('t-soft', 'TRUTH', 'SOFT', 5),
  ...deck('d-soft', 'DARE', 'SOFT', 5),
  ...deck('t-ext', 'TRUTH', 'EXTREME', 5),
  ...deck('d-ext', 'DARE', 'EXTREME', 5),
];
const soft: GameConfig = { modes: ['TRUTH_OR_DARE'], level: 'SOFT', penalty: { kind: 'NONE' } };
const extreme: GameConfig = { ...soft, level: 'EXTREME' };

function deps(): EngineDeps {
  return { cards, rng: createSeededRng(7), clock: steppingClock() };
}

describe('+18 confirmation', () => {
  it('refuses to start an EXTREME game without confirmation', () => {
    expect(() => createGame(extreme, players, {}, deps())).toThrow('+18');
  });

  it('starts an EXTREME game when confirmed, and records it in the state', () => {
    const state = createGame(extreme, players, {}, deps(), true);
    expect(state.adultConfirmed).toBe(true);
    expect(state.phase.kind).toBe('AWAITING_CHOICE');
  });

  it('starts unconfirmed for lower levels', () => {
    expect(createGame(soft, players, {}, deps()).adultConfirmed).toBe(false);
  });

  it('refuses CHANGE_LEVEL to EXTREME until CONFIRM_ADULT is reduced', () => {
    const d = deps();
    const start = createGame(soft, players, {}, d);
    expect(() => reduce(start, { type: 'CHANGE_LEVEL', level: 'EXTREME' }, d)).toThrow(InvalidActionError);
    const confirmed = reduce(start, { type: 'CONFIRM_ADULT' }, d);
    const changed = reduce(confirmed, { type: 'CHANGE_LEVEL', level: 'EXTREME' }, d);
    expect(changed.config.level).toBe('EXTREME');
  });

  it('keeps the confirmation when the level goes back and forth', () => {
    const d = deps();
    const start = reduce(createGame(soft, players, {}, d), { type: 'CONFIRM_ADULT' }, d);
    const toExtreme = reduce(start, { type: 'CHANGE_LEVEL', level: 'EXTREME' }, d);
    const toSoft = reduce(toExtreme, { type: 'CHANGE_LEVEL', level: 'SOFT' }, d);
    expect(reduce(toSoft, { type: 'CHANGE_LEVEL', level: 'EXTREME' }, d).config.level).toBe('EXTREME');
  });
});

import { describe, expect, it } from 'vitest';
import { card, deck, player, steppingClock } from '../testing/fixtures';
import { createGame, reduce, type EngineDeps, type GameConfig, type GameState } from './engine';
import { createSeededRng } from './rng';

const players = [player('ana'), player('beto')];
const config: GameConfig = { modes: ['TRUTH_OR_DARE'], level: 'SOFT', penalty: { kind: 'NONE' } };

function deps(cards = [...deck('t', 'TRUTH', 'SOFT', 4), ...deck('d', 'DARE', 'SOFT', 4)]): EngineDeps {
  return { cards, rng: createSeededRng(3), clock: steppingClock(1_000, 1_000) };
}

function showingTruth(d: EngineDeps): GameState {
  return reduce(createGame(config, players, {}, d), { type: 'CHOOSE', choice: 'TRUTH' }, d);
}

describe('REPLACE', () => {
  it('shows a different card of the same type to the same player, in the same round', () => {
    const d = deps();
    const before = showingTruth(d);
    if (before.phase.kind !== 'SHOWING_CARD') throw new Error('expected a card');
    const after = reduce(before, { type: 'REPLACE', reason: 'UNCLEAR' }, d);
    if (after.phase.kind !== 'SHOWING_CARD') throw new Error('expected a card');
    expect(after.phase.card.id).not.toBe(before.phase.card.id);
    expect(after.phase.card.type).toBe('TRUTH');
    expect(after.phase.playerId).toBe(before.phase.playerId);
    expect(after.round).toBe(before.round);
  });

  it('does not count the replacement as another truth chosen', () => {
    const d = deps();
    const before = showingTruth(d);
    if (before.phase.kind !== 'SHOWING_CARD' || before.phase.playerId === null) throw new Error('expected a personal card');
    const after = reduce(before, { type: 'REPLACE', reason: 'NOT_FOR_US' }, d);
    expect(after.choiceCount[before.phase.playerId]).toEqual(before.choiceCount[before.phase.playerId]);
  });

  it('keeps the replaced card in the history, so it is not offered again soon', () => {
    const d = deps();
    const before = showingTruth(d);
    if (before.phase.kind !== 'SHOWING_CARD') throw new Error('expected a card');
    const after = reduce(before, { type: 'REPLACE', reason: 'UNCLEAR' }, d);
    expect(after.history[before.phase.card.id]).toBeDefined();
  });

  it('fails with the card id when there is no other card to offer', () => {
    const d = deps([card('only-truth', 'TRUTH'), card('only-dare', 'DARE')]);
    const before = showingTruth(d);
    expect(() => reduce(before, { type: 'REPLACE', reason: 'UNCLEAR' }, d)).toThrow('only-truth');
  });

  it('is not valid while a player is choosing', () => {
    const d = deps();
    expect(() => reduce(createGame(config, players, {}, d), { type: 'REPLACE', reason: 'UNCLEAR' }, d)).toThrow('AWAITING_CHOICE');
  });
});

describe('shownAt', () => {
  it('records when the card appeared, with the same time written to the history', () => {
    const d = deps();
    const state = showingTruth(d);
    if (state.phase.kind !== 'SHOWING_CARD') throw new Error('expected a card');
    expect(state.phase.shownAt).toBe(state.history[state.phase.card.id]);
  });
});

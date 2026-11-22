import { describe, expect, it } from 'vitest';
import { createGame, reduce, type EngineDeps, type GameConfig, type GameState } from '../game/engine';
import { createSeededRng } from '../game/rng';
import { deck, player, steppingClock } from '../testing/fixtures';
import { appendEvent, eventForAction, type PlayEvent } from './playEvent';

const players = [player('ana'), player('beto')];
const tod: GameConfig = { modes: ['TRUTH_OR_DARE'], level: 'SOFT', penalty: { kind: 'NONE' } };
const group: GameConfig = { modes: ['NEVER'], level: 'SPICY', penalty: { kind: 'NONE' } };
const cards = [...deck('t', 'TRUTH', 'SOFT', 3), ...deck('d', 'DARE', 'SOFT', 3), ...deck('n', 'NEVER', 'SPICY', 3)];

function deps(): EngineDeps {
  return { cards, rng: createSeededRng(5), clock: steppingClock(10_000, 1_000) };
}

function personalCard(): GameState {
  const d = deps();
  return reduce(createGame(tod, players, {}, d), { type: 'CHOOSE', choice: 'DARE' }, d);
}

const ctx = (at: number) => ({ id: 'e1', at, session: 's1' });

describe('eventForAction', () => {
  it('records a completed personal card with the player alias and the time on screen', () => {
    const state = personalCard();
    if (state.phase.kind !== 'SHOWING_CARD' || state.phase.playerId === null) throw new Error('expected a personal card');
    const playerId = state.phase.playerId;
    const event = eventForAction(state, { type: 'COMPLETE' }, ctx(state.phase.shownAt + 4_200));
    expect(event).toEqual({
      id: 'e1',
      at: state.phase.shownAt + 4_200,
      session: 's1',
      mode: 'TRUTH_OR_DARE',
      level: 'SOFT',
      cardId: state.phase.card.id,
      playerAlias: state.players.find((p) => p.id === playerId)?.name,
      outcome: 'COMPLETED',
      msOnCard: 4_200,
    });
  });

  it('records a pass and a replacement with its reason', () => {
    const state = personalCard();
    if (state.phase.kind !== 'SHOWING_CARD') throw new Error('expected a card');
    expect(eventForAction(state, { type: 'REFUSE' }, ctx(state.phase.shownAt))?.outcome).toBe('PASSED');
    const replaced = eventForAction(state, { type: 'REPLACE', reason: 'UNCLEAR' }, ctx(state.phase.shownAt));
    expect(replaced).toMatchObject({ outcome: 'REPLACED', reason: 'UNCLEAR' });
  });

  it('records a group card as shown, with no player', () => {
    const d = deps();
    const state = createGame(group, players, {}, d);
    if (state.phase.kind !== 'SHOWING_CARD') throw new Error('expected a group card');
    expect(eventForAction(state, { type: 'NEXT' }, ctx(state.phase.shownAt))).toMatchObject({
      outcome: 'SHOWN',
      playerAlias: null,
      level: 'SPICY',
      mode: 'NEVER',
    });
  });

  it('records nothing for actions that do not close a card', () => {
    const d = deps();
    const choosing = createGame(tod, players, {}, d);
    expect(eventForAction(choosing, { type: 'CHOOSE', choice: 'TRUTH' }, ctx(1))).toBeNull();
    expect(eventForAction(personalCard(), { type: 'END' }, ctx(1))).toBeNull();
  });

  it('never reports a negative time on screen', () => {
    const state = personalCard();
    if (state.phase.kind !== 'SHOWING_CARD') throw new Error('expected a card');
    expect(eventForAction(state, { type: 'COMPLETE' }, ctx(state.phase.shownAt - 50))?.msOnCard).toBe(0);
  });
});

describe('appendEvent', () => {
  const event = (id: string): PlayEvent => ({
    id,
    at: 1,
    session: 's',
    mode: 'NEVER',
    level: 'SOFT',
    cardId: 'c',
    playerAlias: null,
    outcome: 'SHOWN',
    msOnCard: 0,
  });

  it('keeps only the most recent events once the cap is reached', () => {
    const events = ['a', 'b', 'c'].map(event);
    expect(appendEvent(events, event('d'), 3).map((e) => e.id)).toEqual(['b', 'c', 'd']);
  });
});

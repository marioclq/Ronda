import { describe, expect, it } from 'vitest';
import { deck, player, steppingClock } from '../core/testing/fixtures';
import { createGame, reduce, type GameState } from '../core/game/engine';
import { createSeededRng } from '../core/game/rng';
import { ACTIVE_GAME_KEY, clearActiveGame, isResumable, loadActiveGame, saveActiveGame } from './activeGame';

/** In-memory stand-in for localStorage (the tests run in node). */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

const deps = () => ({ cards: [...deck('t', 'TRUTH', 'SOFT', 5), ...deck('d', 'DARE', 'SOFT', 5)], rng: createSeededRng(3), clock: steppingClock() });

function gameShowingACard(): GameState {
  const game = createGame(
    { modes: ['TRUTH_OR_DARE'], level: 'SOFT', penalty: { kind: 'DRINKS', count: 2 } },
    [player('ana', 'WOMAN', 'MEN'), player('beto', 'MAN', 'WOMEN')],
    {},
    deps(),
  );
  return reduce(game, { type: 'CHOOSE', choice: 'TRUTH' }, deps());
}

describe('active game', () => {
  it('comes back exactly as it was saved, card on screen included', () => {
    const storage = memoryStorage();
    const game = gameShowingACard();
    saveActiveGame(storage, 'game-1', game);
    expect(loadActiveGame(storage)).toEqual({ version: 1, session: 'game-1', game });
  });

  it('is gone once cleared, and nothing saved reads as no game', () => {
    const storage = memoryStorage();
    expect(loadActiveGame(storage)).toBeNull();
    saveActiveGame(storage, 'game-1', gameShowingACard());
    clearActiveGame(storage);
    expect(loadActiveGame(storage)).toBeNull();
  });

  it('only resumes games that are still being played', () => {
    const game = gameShowingACard();
    expect(isResumable(game)).toBe(true);
    expect(isResumable(null)).toBe(false);
    expect(isResumable(reduce(game, { type: 'END' }, deps()))).toBe(false);
  });

  it('refuses a stored value that is not a game, saying what it found', () => {
    const storage = memoryStorage();
    storage.setItem(ACTIVE_GAME_KEY, '{not json');
    expect(() => loadActiveGame(storage)).toThrow('not JSON');
    storage.setItem(ACTIVE_GAME_KEY, JSON.stringify({ version: 1, session: 's', game: { players: [], turnQueue: [], config: { level: 'HOT' } } }));
    expect(() => loadActiveGame(storage)).toThrow('level HOT');
  });
});

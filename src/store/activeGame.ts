import { LEVELS } from '../core/content/types';
import type { GameState } from '../core/game/engine';

/**
 * The game in progress, kept in localStorage so it survives Android closing the app in the background.
 * Synchronous on purpose: it must be written before the process can be killed, after every action.
 */
export const ACTIVE_GAME_KEY = 'ronda.activeGame.v1';

export interface SavedGame {
  readonly version: 1;
  /** The play-event session id, so events after a restore stay in the same game. */
  readonly session: string;
  readonly game: GameState;
}

const PHASES = ['AWAITING_CHOICE', 'SHOWING_CARD', 'SHOWING_PENALTY', 'PAUSED_NEED_PLAYERS'];

/** A game worth restoring: one that is still being played. */
export function isResumable(game: GameState | null): game is GameState {
  return game !== null && PHASES.includes(game.phase.kind);
}

export function saveActiveGame(storage: Storage, session: string, game: GameState): void {
  const saved: SavedGame = { version: 1, session, game };
  storage.setItem(ACTIVE_GAME_KEY, JSON.stringify(saved));
}

export function clearActiveGame(storage: Storage): void {
  storage.removeItem(ACTIVE_GAME_KEY);
}

/** The saved game, or null when there is none. Throws, with what it found, when the stored value is not a game. */
export function loadActiveGame(storage: Storage): SavedGame | null {
  const raw = storage.getItem(ACTIVE_GAME_KEY);
  if (raw === null) return null;
  const problem = (detail: string): Error => new Error(`Saved game in ${ACTIVE_GAME_KEY} is not valid (${detail}): ${raw.slice(0, 200)}`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (failure) {
    throw problem(`not JSON: ${failure instanceof Error ? failure.message : String(failure)}`);
  }
  if (typeof parsed !== 'object' || parsed === null) throw problem('not an object');
  const saved = parsed as Partial<SavedGame>;
  if (saved.version !== 1) throw problem(`version ${String(saved.version)}`);
  if (typeof saved.session !== 'string') throw problem('no session id');
  const game = saved.game;
  if (typeof game !== 'object' || game === null) throw problem('no game');
  if (!Array.isArray(game.players) || !Array.isArray(game.turnQueue)) throw problem('no players or turn queue');
  if (!LEVELS.includes(game.config?.level)) throw problem(`level ${String(game.config?.level)}`);
  if (!PHASES.includes(game.phase?.kind)) throw problem(`phase ${String(game.phase?.kind)}`);
  return { version: 1, session: saved.session, game };
}

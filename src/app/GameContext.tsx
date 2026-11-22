import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { systemClock } from '../core/game/clock';
import { createGame, reduce, type EngineDeps, type GameAction, type GameConfig, type GameState } from '../core/game/engine';
import { appendEvent, eventForAction, type PlayOutcome } from '../core/events/playEvent';
import type { Player } from '../core/game/player';
import { newId } from '../ui/newId';
import { createMathRng } from '../core/game/rng';
import { es } from '../i18n/es';
import { clearActiveGame, isResumable, loadActiveGame, saveActiveGame, type SavedGame } from '../store/activeGame';
import { useCards } from './CardsContext';
import { useUserState } from './UserStateContext';

/** How long the "undo" offer stays after a card is closed. */
export const UNDO_MS = 5000;

interface Undoable {
  readonly previous: GameState;
  readonly outcome: PlayOutcome;
  readonly eventId: string;
}

interface GameApi {
  readonly game: GameState | null;
  /** The last engine error, with its input. Shown to the user; cleared by the next successful action. */
  readonly error: string | null;
  /** Set for UNDO_MS after a card is closed: what happened, so the toast can name it. */
  readonly undoable: { readonly outcome: PlayOutcome } | null;
  /** Why the game saved before Android closed the app could not be restored, or null. */
  readonly restoreError: string | null;
  start(config: GameConfig, players: readonly Player[], adultConfirmed: boolean): boolean;
  dispatch(action: GameAction): void;
  /** Restores the card that was just closed and drops its event. */
  undo(): void;
  discard(): void;
}

const Context = createContext<GameApi | null>(null);

export function useGame(): GameApi {
  const value = useContext(Context);
  if (value === null) throw new Error('useGame must be used inside GameProvider');
  return value;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Reads the game saved before the app was closed; a broken save is reported and removed so the app can start. */
function restoreSavedGame(): { readonly saved: SavedGame | null; readonly failure: string | null } {
  try {
    return { saved: loadActiveGame(window.localStorage), failure: null };
  } catch (failure) {
    clearActiveGame(window.localStorage);
    return { saved: null, failure: es.play.restoreFailed(messageOf(failure)) };
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { state, update } = useUserState();
  const { getCards, loadExtreme } = useCards();
  const [restored] = useState(restoreSavedGame);
  const [game, setGame] = useState<GameState | null>(restored.saved?.game ?? null);
  const [error, setError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(restored.failure);
  const gameRef = useRef<GameState | null>(restored.saved?.game ?? null);
  const historyRef = useRef(state.history);
  const savedHistory = useRef<GameState['history'] | null>(null);
  const rng = useMemo(() => createMathRng(), []);
  const sessionRef = useRef<string>(restored.saved?.session ?? '');
  const [undoable, setUndoable] = useState<Undoable | null>(null);
  const undoTimer = useRef<number | null>(null);

  historyRef.current = state.history;

  const clearUndo = useCallback((): void => {
    if (undoTimer.current !== null) window.clearTimeout(undoTimer.current);
    undoTimer.current = null;
    setUndoable(null);
  }, []);

  // getCards reads refs, so extreme cards loaded a moment ago are already included.
  const deps = useCallback((): EngineDeps => ({ cards: getCards(), rng, clock: systemClock }), [getCards, rng]);

  const publish = useCallback((next: GameState | null): void => {
    gameRef.current = next;
    setGame(next);
  }, []);

  const start = useCallback(
    (config: GameConfig, players: readonly Player[], adultConfirmed: boolean): boolean => {
      try {
        publish(createGame(config, players, historyRef.current, deps(), adultConfirmed));
        sessionRef.current = newId('game');
        clearUndo();
        setError(null);
        return true;
      } catch (failure) {
        setError(es.play.startFailed(JSON.stringify(config), players.length, messageOf(failure)));
        return false;
      }
    },
    [deps, publish, clearUndo],
  );

  const dispatch = useCallback(
    (action: GameAction): void => {
      const current = gameRef.current;
      if (current === null) throw new Error(`Action ${JSON.stringify(action)} was dispatched without a game in progress`);
      let next: GameState;
      try {
        next = reduce(current, action, deps());
      } catch (failure) {
        setError(es.play.actionFailed(action.type, JSON.stringify(action), messageOf(failure)));
        return;
      }
      const event = eventForAction(current, action, { id: newId('ev'), at: systemClock.now(), session: sessionRef.current });
      publish(next);
      setError(null);
      clearUndo();
      if (event === null) return;
      update((user) => ({ ...user, events: appendEvent(user.events, event) }));
      setUndoable({ previous: current, outcome: event.outcome, eventId: event.id });
      undoTimer.current = window.setTimeout(() => setUndoable(null), UNDO_MS);
    },
    [deps, publish, clearUndo, update],
  );

  const undo = useCallback((): void => {
    if (undoable === null) throw new Error('There is nothing to undo');
    const { previous, eventId } = undoable;
    publish(previous);
    update((user) => ({ ...user, events: user.events.filter((e) => e.id !== eventId) }));
    clearUndo();
  }, [undoable, publish, update, clearUndo]);

  const discard = useCallback((): void => {
    publish(null);
    clearUndo();
    setError(null);
  }, [publish, clearUndo]);

  // A restored extreme game needs its cards before the next draw; they live in a separate chunk.
  useEffect(() => {
    const saved = restored.saved;
    if (saved === null || (saved.game.config.level !== 'EXTREME' && !saved.game.adultConfirmed)) return;
    void loadExtreme().then((loaded) => {
      if (!loaded) setRestoreError(es.play.restoreFailed(es.play.restoreExtremeMissing));
    });
  }, [restored, loadExtreme]);

  // Kept on every change so the game survives Android closing the app; gone once it ends or is discarded.
  useEffect(() => {
    if (isResumable(game)) saveActiveGame(window.localStorage, sessionRef.current, game);
    else clearActiveGame(window.localStorage);
  }, [game]);

  // The engine keeps the history; persist it after every card shown (decision 9).
  useEffect(() => {
    if (game === null || game.history === savedHistory.current) return;
    savedHistory.current = game.history;
    update((current) => ({ ...current, history: game.history }));
  }, [game, update]);

  const api = useMemo<GameApi>(
    () => ({
      game,
      error,
      undoable: undoable === null ? null : { outcome: undoable.outcome },
      restoreError,
      start,
      dispatch,
      undo,
      discard,
    }),
    [game, error, undoable, restoreError, start, dispatch, undo, discard],
  );
  return <Context.Provider value={api}>{children}</Context.Provider>;
}

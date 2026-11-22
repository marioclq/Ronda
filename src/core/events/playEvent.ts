import type { Level } from '../content/types';
import type { GameAction, GameState, ReplaceReason } from '../game/engine';
import type { GameMode } from '../content/types';

/**
 * One card closed by the players: the raw data for suggestions, mood and content review (v2 spec, section 2).
 * Kept on the device only, with the player's alias, never a real name.
 */
export type PlayOutcome = 'COMPLETED' | 'PASSED' | 'REPLACED' | 'SHOWN';
export type EventMode = GameMode | 'DATE_36';

export interface PlayEvent {
  readonly id: string;
  readonly at: number;
  readonly session: string;
  readonly mode: EventMode;
  readonly level: Level;
  readonly cardId: string;
  readonly playerAlias: string | null;
  readonly outcome: PlayOutcome;
  readonly reason?: ReplaceReason;
  readonly msOnCard: number;
}

/** About 100 nights of play; the oldest events are dropped first. */
export const MAX_EVENTS = 5000;

export interface EventContext {
  readonly id: string;
  readonly at: number;
  readonly session: string;
}

/** The event an action produces, or null when the action does not close a card. */
export function eventForAction(state: GameState, action: GameAction, ctx: EventContext): PlayEvent | null {
  const { phase } = state;
  if (phase.kind !== 'SHOWING_CARD') return null;

  let outcome: PlayOutcome;
  if (action.type === 'COMPLETE') outcome = 'COMPLETED';
  else if (action.type === 'REFUSE') outcome = 'PASSED';
  else if (action.type === 'REPLACE') outcome = 'REPLACED';
  else if (action.type === 'NEXT' && phase.playerId === null) outcome = 'SHOWN';
  else return null;

  const playerAlias = phase.playerId === null ? null : (state.players.find((p) => p.id === phase.playerId)?.name ?? null);
  if (phase.playerId !== null && playerAlias === null) {
    throw new Error(`Event for card ${phase.card.id}: player ${phase.playerId} is not in the game`);
  }
  return {
    id: ctx.id,
    at: ctx.at,
    session: ctx.session,
    mode: phase.mode,
    level: state.config.level,
    cardId: phase.card.id,
    playerAlias,
    outcome,
    ...(action.type === 'REPLACE' ? { reason: action.reason } : {}),
    msOnCard: Math.max(0, ctx.at - phase.shownAt),
  };
}

export function appendEvent(events: readonly PlayEvent[], event: PlayEvent, max: number = MAX_EVENTS): PlayEvent[] {
  const next = [...events, event];
  return next.length > max ? next.slice(next.length - max) : next;
}

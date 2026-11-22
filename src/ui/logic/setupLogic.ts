import { GAME_MODES, type Card, type GameMode, type Level } from '../../core/content/types';
import { missingContent, type GameConfig, type Penalty } from '../../core/game/engine';

export interface SetupDraft {
  readonly modes: readonly GameMode[];
  readonly level: Level;
  readonly penalty: Penalty;
  /** +18 confirmation for this game only; never persisted. */
  readonly adultConfirmed: boolean;
}

export const DEFAULT_DRAFT: SetupDraft = {
  modes: ['TRUTH_OR_DARE'],
  level: 'SOFT',
  penalty: { kind: 'NONE' },
  adultConfirmed: false,
};

export function draftFromLastConfig(last: GameConfig | undefined): SetupDraft {
  return last === undefined ? DEFAULT_DRAFT : { ...last, adultConfirmed: false };
}

export function toggleMode(draft: SetupDraft, mode: GameMode): SetupDraft {
  const selected = draft.modes.includes(mode) ? draft.modes.filter((m) => m !== mode) : [...draft.modes, mode];
  return { ...draft, modes: GAME_MODES.filter((m) => selected.includes(m)) };
}

export function setLevel(draft: SetupDraft, level: Level): SetupDraft {
  return { ...draft, level, adultConfirmed: level === 'EXTREME' ? draft.adultConfirmed : false };
}

export function toConfig(draft: SetupDraft): GameConfig {
  return { modes: draft.modes, level: draft.level, penalty: draft.penalty };
}

export type StartBlocker =
  | { readonly kind: 'NO_MODES' }
  | { readonly kind: 'NOT_ENOUGH_PLAYERS' }
  | { readonly kind: 'ADULT_UNCONFIRMED' }
  | { readonly kind: 'MISSING_CONTENT'; readonly modes: readonly GameMode[] };

export function startBlockers(draft: SetupDraft, cards: readonly Card[], playerCount: number): StartBlocker[] {
  const blockers: StartBlocker[] = [];
  if (draft.modes.length === 0) blockers.push({ kind: 'NO_MODES' });
  if (playerCount < 2) blockers.push({ kind: 'NOT_ENOUGH_PLAYERS' });
  if (draft.level === 'EXTREME' && !draft.adultConfirmed) {
    blockers.push({ kind: 'ADULT_UNCONFIRMED' });
  } else if (draft.modes.length > 0) {
    const missing = missingContent(toConfig(draft), cards);
    if (missing.length > 0) blockers.push({ kind: 'MISSING_CONTENT', modes: missing });
  }
  return blockers;
}

/**
 * "Play again" from home skips setup, so it only offers configs that need no new decision:
 * a remembered config, enough players tonight, and never EXTREME (the +18 confirmation is per game).
 */
export function canReplay(last: GameConfig | undefined, playerCount: number): last is GameConfig {
  return last !== undefined && last.level !== 'EXTREME' && playerCount >= 2;
}

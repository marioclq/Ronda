import type { Attraction, Gender, Player } from '../../core/game/player';

export interface PlayerDraft {
  readonly name: string;
  readonly gender: Gender;
  readonly attractedTo: Attraction;
}

export const EMPTY_DRAFT: PlayerDraft = { name: '', gender: 'UNDISCLOSED', attractedTo: 'UNDISCLOSED' };

export type PlayerFormError = { readonly kind: 'NAME_EMPTY' } | { readonly kind: 'NAME_TAKEN'; readonly name: string };

export function validatePlayerDraft(
  draft: PlayerDraft,
  players: readonly Player[],
  editingId: string | null,
): PlayerFormError | null {
  const name = draft.name.trim();
  if (name.length === 0) return { kind: 'NAME_EMPTY' };
  const taken = players.some((p) => p.id !== editingId && p.name.trim().toLowerCase() === name.toLowerCase());
  return taken ? { kind: 'NAME_TAKEN', name } : null;
}

export function buildPlayer(draft: PlayerDraft, id: string): Player {
  return { id, name: draft.name.trim(), gender: draft.gender, attractedTo: draft.attractedTo };
}

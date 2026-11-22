import type { Attraction, Gender, Player } from './player';

function attracts(attraction: Attraction, gender: Gender): boolean {
  if (attraction === 'UNDISCLOSED' || gender === 'UNDISCLOSED') return false;
  if (attraction === 'ANYONE') return true;
  if (attraction === 'WOMEN') return gender === 'WOMAN';
  return gender === 'MAN';
}

/** Mutual attraction between two different players. */
export function isCompatible(a: Player, b: Player): boolean {
  if (a.id === b.id) return false;
  return attracts(a.attractedTo, b.gender) && attracts(b.attractedTo, a.gender);
}

export function compatibleWith(player: Player, players: readonly Player[]): Player[] {
  return players.filter((other) => isCompatible(player, other));
}

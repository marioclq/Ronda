import type { Card, CardType, Level } from '../content/types';
import type { Clock } from '../game/clock';
import type { Attraction, Gender, Player } from '../game/player';

export function player(id: string, gender: Gender = 'OTHER', attractedTo: Attraction = 'UNDISCLOSED'): Player {
  return { id, name: id.charAt(0).toUpperCase() + id.slice(1), gender, attractedTo };
}

export function card(
  id: string,
  type: CardType,
  level: Level = 'SOFT',
  text = `Card ${id}`,
  tags: readonly string[] = [],
): Card {
  return { id, type, level, text, tags };
}

export function deck(
  prefix: string,
  type: CardType,
  level: Level,
  count: number,
  text: (index: number) => string = (index) => `Card ${prefix}-${index}`,
): Card[] {
  return Array.from({ length: count }, (_, index) => card(`${prefix}-${index}`, type, level, text(index)));
}

/** Each call to now() returns a strictly larger time. */
export function steppingClock(start = 1_000, step = 1_000): Clock {
  let current = start;
  return {
    now(): number {
      const value = current;
      current += step;
      return value;
    },
  };
}

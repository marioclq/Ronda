import type { Penalty } from '../../core/game/engine';
import { es } from '../../i18n/es';

export function describePenalty(penalty: Penalty): string {
  switch (penalty.kind) {
    case 'DRINKS':
      return es.play.penaltyDrinks(penalty.count);
    case 'GARMENT':
      return es.play.penaltyGarment;
    case 'NONE':
      throw new Error('There is no penalty text for NONE: the engine skips the penalty phase');
  }
}

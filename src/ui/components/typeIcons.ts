import type { CardType, GameMode } from '../../core/content/types';
import type { IconName } from './Icon';

/** One icon per game mode, shared by setup chips and anywhere a mode is named. */
export const MODE_ICONS: Readonly<Record<GameMode, IconName>> = {
  TRUTH_OR_DARE: 'dare',
  NEVER: 'never',
  RATHER: 'scale',
  MOST_LIKELY: 'target',
};

/** One icon per card type; group types reuse their mode's icon. */
export const CARD_TYPE_ICONS: Readonly<Record<CardType, IconName>> = {
  TRUTH: 'truth',
  DARE: 'dare',
  NEVER: 'never',
  RATHER: 'scale',
  MOST_LIKELY: 'target',
};

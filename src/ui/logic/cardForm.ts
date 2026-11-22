import type { Card, CardType, Level } from '../../core/content/types';
import { checkCard } from '../../core/content/validator';

export interface CardDraft {
  readonly type: CardType;
  readonly level: Level;
  readonly text: string;
  /** Raw input value; empty means no timer. */
  readonly timerSeconds: string;
}

export const EMPTY_CARD_DRAFT: CardDraft = { type: 'TRUTH', level: 'SOFT', text: '', timerSeconds: '' };

/** Builds a card through the same validator the packs use. Throws with every problem and the input. */
export function buildCustomCard(draft: CardDraft, id: string): Card {
  // The timer input is hidden for non-DARE cards; a stale value must not make the card invalid.
  const timer = draft.type === 'DARE' ? draft.timerSeconds.trim() : '';
  const raw = {
    id,
    type: draft.type,
    level: draft.level,
    text: draft.text.trim(),
    tags: [],
    ...(timer === '' ? {} : { timerSeconds: Number(timer) }),
  };
  const check = checkCard(raw, id);
  if (check.card === null) throw new Error(`${check.problems.join('; ')} (input: ${JSON.stringify(raw)})`);
  return check.card;
}

export type SwipeOutcome = 'LEFT' | 'RIGHT' | 'BACK' | 'TAP';

/** Below this travel in px a release is a tap, not a drag. */
export const TAP_SLOP = 6;
/** A drag past this share of the card's width throws it off the deck. */
export const THROW_RATIO = 0.28;

/** What a release does after dragging the top card `dx` px sideways on a card `width` px wide. */
export function swipeOutcome(dx: number, width: number): SwipeOutcome {
  if (width <= 0) throw new Error(`The card must have a width to judge a swipe, got ${width}`);
  if (Math.abs(dx) < TAP_SLOP) return 'TAP';
  if (dx >= width * THROW_RATIO) return 'RIGHT';
  if (dx <= -width * THROW_RATIO) return 'LEFT';
  return 'BACK';
}

/** Another index than `current` in a list of `length`, so a shuffle always changes the card when it can. */
export function otherIndex(current: number, length: number, random: () => number): number {
  if (length <= 1) return 0;
  const pick = Math.floor(random() * (length - 1));
  return pick >= current ? pick + 1 : pick;
}

import { flushSync } from 'react-dom';

/** The shared-element name both ends of the morph carry (the card and the roulette set it in CSS). */
export const MORPH_NAME = 'play-card';

/**
 * Runs a state change as a View Transition in which `source` becomes the element named MORPH_NAME on the
 * next screen, e.g. the tapped "Verdad" row turning into the card. Without the API, or with reduced motion,
 * the change simply happens.
 */
export function morphInto(source: HTMLElement, change: () => void): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof document.startViewTransition !== 'function' || reduced) {
    change();
    return;
  }
  source.style.viewTransitionName = MORPH_NAME;
  const transition = document.startViewTransition(() => {
    source.style.viewTransitionName = '';
    flushSync(change);
  });
  transition.ready.catch((reason: unknown) => {
    // An aborted animation (the viewport changed mid-transition) leaves the new state in place: expected.
    if (reason instanceof DOMException && (reason.name === 'InvalidStateError' || reason.name === 'AbortError')) return;
    console.error('Card morph failed', reason);
  });
}

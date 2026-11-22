import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { parseRoute, type Route } from './route';

export function useRoute(): Route {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = (): void => {
      const next = window.location.hash;
      // A new screen starts at its top, not at the previous screen's scroll position.
      const swap = (): void => {
        flushSync(() => setHash(next));
        window.scrollTo(0, 0);
      };
      // Screen changes crossfade with the View Transitions API where it exists (motion.css);
      // elsewhere the screen simply swaps. flushSync lets the browser capture the new DOM.
      if (typeof document.startViewTransition !== 'function') {
        swap();
        return;
      }
      const transition = document.startViewTransition(swap);
      transition.ready.catch((reason: unknown) => {
        // The browser aborts the animation (not the screen change) when the viewport changes mid-transition,
        // e.g. the keyboard opens or the phone rotates. The new screen is already in place; anything else is a real error.
        if (reason instanceof DOMException && (reason.name === 'InvalidStateError' || reason.name === 'AbortError')) return;
        console.error(`Screen transition to ${next} failed`, reason);
      });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return useMemo(() => parseRoute(hash, import.meta.env.DEV), [hash]);
}

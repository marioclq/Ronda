import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { parseRoute, type Route } from './route';

export function useRoute(): Route {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = (): void => {
      const next = window.location.hash;
      // Screen changes crossfade with the View Transitions API where it exists (motion.css);
      // elsewhere the screen simply swaps. flushSync lets the browser capture the new DOM.
      if (typeof document.startViewTransition === 'function') {
        document.startViewTransition(() => flushSync(() => setHash(next)));
      } else {
        setHash(next);
      }
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return useMemo(() => parseRoute(hash, import.meta.env.DEV), [hash]);
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { es } from '../i18n/es';
import type { UserState } from '../store/userState';
import type { UserStore } from '../store/userStore';
import { LoadError } from '../ui/screens/LoadError';

interface UserStateApi {
  readonly state: UserState;
  /** Set when the last save failed. Shown to the user; never swallowed. */
  readonly saveError: string | null;
  update(change: (current: UserState) => UserState): void;
}

type Loaded = { kind: 'loading' } | { kind: 'error'; error: unknown } | { kind: 'ready'; state: UserState };

const Context = createContext<UserStateApi | null>(null);

export function useUserState(): UserStateApi {
  const value = useContext(Context);
  if (value === null) throw new Error('useUserState must be used inside UserStateProvider');
  return value;
}

export function UserStateProvider({ store, children }: { store: UserStore; children: ReactNode }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: 'loading' });
  const [saveError, setSaveError] = useState<string | null>(null);
  const latest = useRef<UserState | null>(null);

  useEffect(() => {
    let cancelled = false;
    store.load().then(
      (state) => {
        if (cancelled) return;
        latest.current = state;
        setLoaded({ kind: 'ready', state });
      },
      (error: unknown) => {
        if (!cancelled) setLoaded({ kind: 'error', error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [store]);

  const update = useCallback(
    (change: (current: UserState) => UserState): void => {
      if (latest.current === null) throw new Error('Cannot update the user state before it is loaded');
      const next = change(latest.current);
      if (next === latest.current) return;
      latest.current = next;
      setLoaded({ kind: 'ready', state: next });
      store.save(next).then(
        () => setSaveError(null),
        (error: unknown) => setSaveError(es.errors.saveFailed(error instanceof Error ? error.message : String(error))),
      );
    },
    [store],
  );

  const readyState = loaded.kind === 'ready' ? loaded.state : null;
  const api = useMemo<UserStateApi | null>(
    () => (readyState === null ? null : { state: readyState, saveError, update }),
    [readyState, saveError, update],
  );

  if (loaded.kind === 'loading') {
    return (
      <main className="screen">
        <p>{es.common.loading}</p>
      </main>
    );
  }
  if (loaded.kind === 'error') return <LoadError error={loaded.error} />;
  return <Context.Provider value={api}>{children}</Context.Provider>;
}

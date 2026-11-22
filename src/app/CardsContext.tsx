import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadBaseCards, loadExtremeCards } from '../content/loadCards';
import { pruneHistory } from '../content/pruneHistory';
import type { Card } from '../core/content/types';
import { es } from '../i18n/es';
import { useUserState } from './UserStateContext';

interface CardsApi {
  /** Base cards, extreme cards once loaded, and the user's own cards (reactive, for rendering). */
  readonly cards: readonly Card[];
  readonly extremeLoaded: boolean;
  /** Same list, read from refs: correct right after `await loadExtreme()`, before React re-renders. */
  getCards(): readonly Card[];
  /** Resolves false (and sets loadError) when the extreme chunk fails to load. */
  loadExtreme(): Promise<boolean>;
  readonly loadError: string | null;
}

const Context = createContext<CardsApi | null>(null);

export function useCards(): CardsApi {
  const value = useContext(Context);
  if (value === null) throw new Error('useCards must be used inside CardsProvider');
  return value;
}

export function CardsProvider({ children }: { children: ReactNode }) {
  const { state, update } = useUserState();
  const base = useMemo(() => loadBaseCards(), []);
  const [extreme, setExtreme] = useState<readonly Card[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const extremeRef = useRef<readonly Card[] | null>(null);
  const customRef = useRef(state.customCards);
  customRef.current = state.customCards;

  const getCards = useCallback(
    (): readonly Card[] => [...base, ...(extremeRef.current ?? []), ...customRef.current],
    [base],
  );

  const loadExtreme = useCallback(async (): Promise<boolean> => {
    if (extremeRef.current !== null) return true;
    try {
      const loaded = await loadExtremeCards();
      extremeRef.current = loaded;
      setExtreme(loaded);
      setLoadError(null);
      return true;
    } catch (error) {
      setLoadError(`${es.errors.contentTitle}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }, []);

  useEffect(() => {
    const known = new Set(getCards().map((card) => card.id));
    const loaded = extremeRef.current !== null;
    update((current) => {
      const pruned = pruneHistory(current.history, known, loaded);
      return pruned === current.history ? current : { ...current, history: pruned };
    });
  }, [extreme, getCards, update]);

  const cards = useMemo(() => [...base, ...(extreme ?? []), ...state.customCards], [base, extreme, state.customCards]);
  const api = useMemo<CardsApi>(
    () => ({ cards, extremeLoaded: extreme !== null, getCards, loadExtreme, loadError }),
    [cards, extreme, getCards, loadExtreme, loadError],
  );
  return <Context.Provider value={api}>{children}</Context.Provider>;
}

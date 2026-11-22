import { useEffect } from 'react';
import type { Level } from '../../core/content/types';
import type { Theme } from '../../store/userState';
import { effectiveTheme } from './applyTheme';

/** Sets data-theme on <html>, following the system when the choice is SYSTEM. */
export function useTheme(theme: Theme): void {
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (): void => {
      document.documentElement.dataset.theme = effectiveTheme(theme, query.matches);
    };
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [theme]);
}

/** Sets the atmosphere for a level; going back to SOFT on unmount keeps other screens calm. */
export function useLevelBackdrop(level: Level): void {
  useEffect(() => {
    document.documentElement.dataset.level = level;
    return () => {
      document.documentElement.dataset.level = 'SOFT';
    };
  }, [level]);
}

export function useAppearance(theme: Theme, level: Level): void {
  useTheme(theme);
  useLevelBackdrop(level);
}

import type { Theme } from '../../store/userState';

export function effectiveTheme(choice: Theme, prefersDark: boolean): 'light' | 'dark' {
  if (choice === 'LIGHT') return 'light';
  if (choice === 'DARK') return 'dark';
  return prefersDark ? 'dark' : 'light';
}

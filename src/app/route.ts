export const ROUTE_NAMES = ['home', 'players', 'setup', 'play', 'cards', 'settings', 'glass', 'date'] as const;
export type RouteName = (typeof ROUTE_NAMES)[number];

export type Route =
  | { readonly name: RouteName }
  | { readonly name: 'kit' }
  | { readonly name: 'unknown'; readonly hash: string };

export function parseRoute(hash: string, devMode: boolean): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path === '') return { name: 'home' };
  if ((ROUTE_NAMES as readonly string[]).includes(path)) return { name: path as RouteName };
  if (path === 'kit' && devMode) return { name: 'kit' };
  return { name: 'unknown', hash };
}

export function routeHash(name: RouteName): string {
  return name === 'home' ? '#/' : `#/${name}`;
}

/** `replace` swaps the current history entry instead of pushing one, so Back does not return to a redirecting screen. */
export function navigate(name: RouteName, options: { readonly replace?: boolean } = {}): void {
  if (options.replace === true) window.location.replace(routeHash(name));
  else window.location.hash = routeHash(name);
}

import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash } from './route';

describe('parseRoute', () => {
  it('maps the empty hash and #/ to home', () => {
    expect(parseRoute('', false)).toEqual({ name: 'home' });
    expect(parseRoute('#/', false)).toEqual({ name: 'home' });
  });

  it('maps every screen name', () => {
    for (const name of ['players', 'setup', 'play', 'cards', 'settings'] as const) {
      expect(parseRoute(`#/${name}`, false)).toEqual({ name });
    }
  });

  it('reports unknown hashes instead of guessing a screen', () => {
    expect(parseRoute('#/nope', false)).toEqual({ name: 'unknown', hash: '#/nope' });
  });

  it('exposes the kit only in dev mode', () => {
    expect(parseRoute('#/kit', true)).toEqual({ name: 'kit' });
    expect(parseRoute('#/kit', false)).toEqual({ name: 'unknown', hash: '#/kit' });
  });

  it('builds hashes that parse back to the same route', () => {
    expect(parseRoute(routeHash('players'), false)).toEqual({ name: 'players' });
    expect(parseRoute(routeHash('home'), false)).toEqual({ name: 'home' });
  });
});

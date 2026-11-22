import { describe, expect, it } from 'vitest';
import { extractVariableNames, hasStrayBraces, isKnownVariable, replaceVariables } from './variables';

describe('extractVariableNames', () => {
  it('returns every placeholder in order, including repeats and unknown names', () => {
    expect(extractVariableNames('{jugador} mira a {otro}, {jugador} a {amigo}')).toEqual([
      'jugador',
      'otro',
      'jugador',
      'amigo',
    ]);
  });

  it('returns an empty list for plain text', () => {
    expect(extractVariableNames('Yo nunca he mentido en una entrevista')).toEqual([]);
  });
});

describe('isKnownVariable', () => {
  it('accepts only the three variables of the spec', () => {
    expect(['jugador', 'otro', 'compatible'].every(isKnownVariable)).toBe(true);
    expect(isKnownVariable('amigo')).toBe(false);
    expect(isKnownVariable('Jugador')).toBe(false);
  });
});

describe('hasStrayBraces', () => {
  it('detects unclosed or unopened braces', () => {
    expect(hasStrayBraces('Hola {jugador')).toBe(true);
    expect(hasStrayBraces('Hola jugador}')).toBe(true);
    expect(hasStrayBraces('Hola {jugador} y {otro}')).toBe(false);
  });
});

describe('replaceVariables', () => {
  it('replaces each placeholder with the replacer result', () => {
    expect(replaceVariables('{jugador} y {otro}', (name) => name.toUpperCase())).toBe('JUGADOR y OTRO');
  });
});

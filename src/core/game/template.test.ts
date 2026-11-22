import { describe, expect, it } from 'vitest';
import { card, player } from '../testing/fixtures';
import { createSeededRng } from './rng';
import { canRender, renderCard, type RenderContext } from './template';

const ana = player('ana', 'WOMAN', 'MEN');
const beto = player('beto', 'MAN', 'WOMEN');
const caro = player('caro', 'WOMAN', 'MEN');
const dani = player('dani', 'MAN', 'ANYONE');

function ctx(overrides: Partial<RenderContext> = {}): RenderContext {
  return { current: ana, players: [ana, beto, caro, dani], lastNamed: {}, rng: createSeededRng(1), ...overrides };
}

describe('renderCard', () => {
  it('replaces {jugador} with the current player and names nobody else', () => {
    const result = renderCard(card('t1', 'TRUTH', 'SOFT', '{jugador}, ¿qué escondes?'), ctx());
    expect(result).toEqual({ text: 'Ana, ¿qué escondes?', namedPlayerIds: [] });
  });

  it('resolves a repeated variable to the same person', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { text } = renderCard(card('t1', 'TRUTH', 'SOFT', '{otro} y otra vez {otro}'), ctx({ rng: createSeededRng(seed) }));
      expect(text).toMatch(/^(\w+) y otra vez \1$/);
    }
  });

  it('gives different variables to different people', () => {
    const result = renderCard(card('d1', 'DARE', 'SOFT', '{compatible}|{otro}'), ctx({ players: [ana, beto, caro] }));
    expect(result.text).toBe('Beto|Caro');
    expect(result.namedPlayerIds).toEqual(['beto', 'caro']);
  });

  it('targets the player named longest ago', () => {
    const { text } = renderCard(card('t1', 'TRUTH', 'SOFT', '{otro}'), ctx({ lastNamed: { beto: 3, caro: 1, dani: 2 } }));
    expect(text).toBe('Caro');
  });

  it('prefers players never named over any named player', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { text } = renderCard(card('t1', 'TRUTH', 'SOFT', '{otro}'), ctx({ lastNamed: { beto: 1 }, rng: createSeededRng(seed) }));
      expect(['Caro', 'Dani']).toContain(text);
    }
  });

  it('leaves group cards untouched', () => {
    const result = renderCard(card('n1', 'NEVER', 'SOFT', 'Yo nunca he cantado en público'), ctx({ current: undefined }));
    expect(result).toEqual({ text: 'Yo nunca he cantado en público', namedPlayerIds: [] });
  });

  it('fails explicitly on unknown variables, naming the card', () => {
    expect(() => renderCard(card('bad-1', 'TRUTH', 'SOFT', 'Habla con {amigo}'), ctx())).toThrow(
      'Card "bad-1" uses unknown variable {amigo}',
    );
  });

  it('fails explicitly when the card cannot be rendered', () => {
    const solo = player('solo', 'WOMAN', 'UNDISCLOSED');
    expect(() =>
      renderCard(card('d1', 'DARE', 'SOFT', 'Abraza a {compatible}'), ctx({ current: solo, players: [solo, beto] })),
    ).toThrow('Card "d1" cannot be rendered for Solo');
  });
});

describe('canRender', () => {
  it('requires a compatible candidate for {compatible}', () => {
    const dare = card('d1', 'DARE', 'SOFT', 'Abraza a {compatible}');
    expect(canRender(dare, ana, [ana, beto])).toBe(true);
    expect(canRender(dare, ana, [ana, caro])).toBe(false);
  });

  it('requires a third player when a card needs {compatible} and {otro}', () => {
    const dare = card('d1', 'DARE', 'SOFT', '{compatible} y {otro}');
    expect(canRender(dare, ana, [ana, beto])).toBe(false);
    expect(canRender(dare, ana, [ana, beto, caro])).toBe(true);
  });

  it('rejects player variables without a current player', () => {
    expect(canRender(card('t1', 'TRUTH', 'SOFT', '{otro}'), undefined, [ana, beto])).toBe(false);
    expect(canRender(card('n1', 'NEVER', 'SOFT', 'Sin variables'), undefined, [ana, beto])).toBe(true);
  });
});

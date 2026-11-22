import { describe, expect, it } from 'vitest';
import { AVATAR_COLORS, avatarColor, initialOf } from './avatar';

describe('initialOf', () => {
  it('takes the first letter, uppercased, ignoring spaces', () => {
    expect(initialOf('  ana')).toBe('A');
    expect(initialOf('Ángela')).toBe('Á');
  });

  it('refuses an empty name instead of drawing a blank avatar', () => {
    expect(() => initialOf('   ')).toThrow('empty');
  });
});

describe('avatarColor', () => {
  it('always gives the same color to the same name, ignoring case and spaces', () => {
    expect(avatarColor('Beto')).toBe(avatarColor(' beto '));
  });

  it('stays inside the palette and spreads different names across it', () => {
    const names = ['Ana', 'Beto', 'Cami', 'Dani', 'Eli', 'Fer', 'Gabi', 'Hugo', 'Isa', 'Juan'];
    const colors = names.map(avatarColor);
    expect(colors.every((c) => c >= 1 && c <= AVATAR_COLORS)).toBe(true);
    expect(new Set(colors).size).toBeGreaterThanOrEqual(4);
  });
});

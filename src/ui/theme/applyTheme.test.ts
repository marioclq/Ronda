import { describe, expect, it } from 'vitest';
import { effectiveTheme } from './applyTheme';

describe('effectiveTheme', () => {
  it('follows the system only when the choice is SYSTEM', () => {
    expect(effectiveTheme('SYSTEM', true)).toBe('dark');
    expect(effectiveTheme('SYSTEM', false)).toBe('light');
  });

  it('honours an explicit choice whatever the system prefers', () => {
    expect(effectiveTheme('LIGHT', true)).toBe('light');
    expect(effectiveTheme('DARK', false)).toBe('dark');
  });
});

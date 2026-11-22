import { describe, expect, it } from 'vitest';
import { DEFAULT_GLASS } from '../../store/glassStyle';
import { glassCssVars } from './glassVars';

describe('glassCssVars', () => {
  it('turns the defaults into the values tokens.css starts from', () => {
    expect(glassCssVars(DEFAULT_GLASS)).toEqual({
      '--lg-frost': '28px',
      '--lg-saturation': '1.9',
      '--lg-tint': '1',
      '--lg-film': '0.15',
      '--lg-rim': '1',
      '--lg-depth': '1',
    });
  });

  it('carries each change through, saturation as a factor', () => {
    const vars = glassCssVars({ ...DEFAULT_GLASS, frost: 6, saturation: 120, tint: 0.4 });
    expect(vars['--lg-frost']).toBe('6px');
    expect(vars['--lg-saturation']).toBe('1.2');
    expect(vars['--lg-tint']).toBe('0.4');
  });
});

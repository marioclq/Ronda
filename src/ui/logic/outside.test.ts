import { describe, expect, it } from 'vitest';
import { isOutside } from './outside';

const sheet = { left: 0, right: 400, top: 0, bottom: 500 };

describe('isOutside', () => {
  it('a tap below the sheet is outside', () => {
    expect(isOutside(sheet, 200, 700)).toBe(true);
  });

  it('a tap on the sheet, edges included, is inside', () => {
    expect(isOutside(sheet, 200, 10)).toBe(false);
    expect(isOutside(sheet, 400, 500)).toBe(false);
  });
});

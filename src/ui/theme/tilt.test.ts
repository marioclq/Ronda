import { describe, expect, it } from 'vitest';
import { tiltFromOrientation } from './tilt';

describe('tiltFromOrientation', () => {
  it('is level in the reading pose and with no reading', () => {
    expect(tiltFromOrientation(45, 0)).toEqual({ x: 0, y: 0 });
    expect(tiltFromOrientation(null, null)).toEqual({ x: 0, y: 0 });
  });

  it('follows the tilt in both directions and stops at full range', () => {
    expect(tiltFromOrientation(45, 17.5).x).toBeCloseTo(0.5);
    expect(tiltFromOrientation(45, -90).x).toBe(-1);
    expect(tiltFromOrientation(80, 0).y).toBe(1);
    expect(tiltFromOrientation(10, 0).y).toBe(-1);
  });
});

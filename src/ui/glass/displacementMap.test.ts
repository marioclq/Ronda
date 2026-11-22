import { describe, expect, it } from 'vitest';
import { renderDisplacementPixels, signedInsideDistance, type LensSpec } from './displacementMap';

const spec: LensSpec = { width: 120, height: 80, radius: 20, bezel: 16 };

function pixel(data: Uint8ClampedArray, x: number, y: number): [number, number, number, number] {
  const offset = (y * spec.width + x) * 4;
  return [data[offset] ?? -1, data[offset + 1] ?? -1, data[offset + 2] ?? -1, data[offset + 3] ?? -1];
}

describe('signedInsideDistance', () => {
  it('is positive inside, near zero at the edge and grows toward the center', () => {
    expect(signedInsideDistance(60, 40, spec)).toBeGreaterThan(30);
    expect(signedInsideDistance(0.5, 40, spec)).toBeCloseTo(0.5, 1);
    expect(signedInsideDistance(60, 40, spec)).toBeGreaterThan(signedInsideDistance(10, 40, spec));
  });
});

describe('renderDisplacementPixels', () => {
  const data = renderDisplacementPixels(spec);

  it('has one RGBA pixel per cell, fully opaque', () => {
    expect(data.length).toBe(spec.width * spec.height * 4);
    expect(pixel(data, 60, 40)[3]).toBe(255);
  });

  it('is neutral (128) in the flat interior, so the content there is not displaced', () => {
    expect(pixel(data, 60, 40).slice(0, 2)).toEqual([128, 128]);
  });

  it('pushes each edge toward the inside', () => {
    expect(pixel(data, 1, 40)[0]).toBeGreaterThan(128);
    expect(pixel(data, spec.width - 2, 40)[0]).toBeLessThan(128);
    expect(pixel(data, 60, 1)[1]).toBeGreaterThan(128);
    expect(pixel(data, 60, spec.height - 2)[1]).toBeLessThan(128);
  });

  it('displaces more at the edge than deeper in the bezel', () => {
    const edge = Math.abs((pixel(data, 1, 40)[0] ?? 0) - 128);
    const deeper = Math.abs((pixel(data, 9, 40)[0] ?? 0) - 128);
    expect(edge).toBeGreaterThan(deeper);
    expect(deeper).toBeGreaterThan(0);
  });

  it('is mirror-symmetric left to right', () => {
    const left = (pixel(data, 3, 40)[0] ?? 0) - 128;
    const right = (pixel(data, spec.width - 1 - 3, 40)[0] ?? 0) - 128;
    expect(left).toBe(-right);
  });
});

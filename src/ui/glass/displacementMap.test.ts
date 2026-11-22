import { describe, expect, it } from 'vitest';
import { renderDisplacementPixels, type LensSpec } from './displacementMap';
import { displacementScale, effectiveBezel, lensPrimitives } from './lensFilter';

const spec: LensSpec = { width: 120, height: 80, radius: 20, bezel: 16, magnify: 0 };

function pixel(data: Uint8ClampedArray, x: number, y: number, width = spec.width): [number, number, number, number] {
  const offset = (y * width + x) * 4;
  return [data[offset] ?? -1, data[offset + 1] ?? -1, data[offset + 2] ?? -1, data[offset + 3] ?? -1];
}

describe('renderDisplacementPixels', () => {
  const data = renderDisplacementPixels(spec);

  it('has one opaque RGBA pixel per cell', () => {
    expect(data.length).toBe(spec.width * spec.height * 4);
    expect(pixel(data, 60, 40)[3]).toBe(255);
  });

  it('is neutral (128) in the flat interior, so the content there is not displaced', () => {
    expect(pixel(data, 60, 40).slice(0, 2)).toEqual([128, 128]);
  });

  it('pulls each edge toward the inside', () => {
    expect(pixel(data, 1, 40)[0]).toBeGreaterThan(128);
    expect(pixel(data, spec.width - 2, 40)[0]).toBeLessThan(128);
    expect(pixel(data, 60, 1)[1]).toBeGreaterThan(128);
    expect(pixel(data, 60, spec.height - 2)[1]).toBeLessThan(128);
  });

  it('pulls harder at the outline than deeper in the rim', () => {
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

  it('with magnify, the interior samples toward the centre too, more with more magnify', () => {
    const low = renderDisplacementPixels({ ...spec, magnify: 0.02 });
    const high = renderDisplacementPixels({ ...spec, magnify: 0.08 });
    const lowShift = (pixel(low, 40, 40)[0] ?? 0) - 128;
    const highShift = (pixel(high, 40, 40)[0] ?? 0) - 128;
    expect(lowShift).toBeGreaterThan(0);
    expect(highShift).toBeGreaterThan(lowShift);
  });

  it('refuses a rim of zero width, with the size', () => {
    expect(() => renderDisplacementPixels({ ...spec, bezel: 0 })).toThrow('120x80');
  });
});

describe('lens filter', () => {
  it('keeps the rim under a third of the short side', () => {
    expect(effectiveBezel(40, 300, 60)).toBeCloseTo(19.2);
    expect(effectiveBezel(16, 300, 200)).toBe(16);
  });

  it('bends in proportion to the rim width and the curvature, capped at 2', () => {
    expect(displacementScale(20, 1)).toBe(24);
    expect(displacementScale(20, 0)).toBe(0);
    expect(displacementScale(20, 5)).toBe(48);
  });

  it('uses one displacement without colour separation, and three slightly different ones with it', () => {
    const params = { curvature: 1, bezel: 20, dispersion: 0, magnify: 0 };
    const plain = lensPrimitives('data:x', 100, 80, 20, params).filter((p) => p.tag === 'feDisplacementMap');
    expect(plain).toHaveLength(1);

    const split = lensPrimitives('data:x', 100, 80, 20, { ...params, dispersion: 0.1 }).filter((p) => p.tag === 'feDisplacementMap');
    expect(split.map((p) => p.attrs.scale)).toEqual(['24.00', '21.60', '19.20']);
  });
});

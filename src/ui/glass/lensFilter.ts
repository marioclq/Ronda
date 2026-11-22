/*
 * The SVG filter chain for the liquid glass lens, ported from xenitV1/liquid-glass-skill
 * (assets/refraction.js, MIT License, Copyright (c) xenitV1).
 */

export interface LensParams {
  /** How strongly the rim bends, 0 to 2. */
  readonly curvature: number;
  /** Width of the bending rim in CSS pixels. */
  readonly bezel: number;
  /** Colour fringing at the rim, 0 to 0.2: R, G and B bend by slightly different amounts. */
  readonly dispersion: number;
  /** Gentle zoom toward the centre, 0 to 0.1. */
  readonly magnify: number;
}

/** One filter primitive: its SVG tag and attributes. */
export interface Primitive {
  readonly tag: 'feImage' | 'feGaussianBlur' | 'feDisplacementMap' | 'feColorMatrix' | 'feComposite';
  readonly attrs: Readonly<Record<string, string | number>>;
}

/** The rim band actually used: the requested width, kept under a third of the short side. */
export function effectiveBezel(requested: number, width: number, height: number): number {
  return Math.max(1, Math.min(requested, Math.min(width, height) * 0.32));
}

/** Largest shift in px is half of this. */
export function displacementScale(bezel: number, curvature: number): number {
  return Math.round(bezel * 1.2 * Math.max(0, Math.min(2, curvature)));
}

const CHANNEL_MATRICES = {
  r: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  g: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  b: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
} as const;

/** Primitives in order: the map, a soft blur of it, then one displacement or three (R, G, B) added back up. */
export function lensPrimitives(mapUrl: string, width: number, height: number, bezel: number, params: LensParams): Primitive[] {
  const scale = displacementScale(bezel, params.curvature);
  const dispersion = Math.max(0, Math.min(0.2, params.dispersion));
  const primitives: Primitive[] = [
    { tag: 'feImage', attrs: { href: mapUrl, x: 0, y: 0, width, height, preserveAspectRatio: 'none', result: 'raw' } },
    // Softening the map keeps the pull smooth where the outline curves instead of pinching into a knot.
    { tag: 'feGaussianBlur', attrs: { in: 'raw', stdDeviation: Math.max(1.5, bezel * 0.25).toFixed(1), result: 'map' } },
  ];
  if (dispersion === 0) {
    primitives.push({ tag: 'feDisplacementMap', attrs: { in: 'SourceGraphic', in2: 'map', scale, xChannelSelector: 'R', yChannelSelector: 'G' } });
    return primitives;
  }
  const channels = [
    ['r', scale],
    ['g', scale * (1 - dispersion)],
    ['b', scale * (1 - 2 * dispersion)],
  ] as const;
  for (const [name, channelScale] of channels) {
    primitives.push({
      tag: 'feDisplacementMap',
      attrs: { in: 'SourceGraphic', in2: 'map', scale: channelScale.toFixed(2), xChannelSelector: 'R', yChannelSelector: 'G', result: `d${name}` },
    });
    primitives.push({ tag: 'feColorMatrix', attrs: { in: `d${name}`, type: 'matrix', values: CHANNEL_MATRICES[name], result: name } });
  }
  primitives.push({ tag: 'feComposite', attrs: { in: 'r', in2: 'g', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0, result: 'rg' } });
  primitives.push({ tag: 'feComposite', attrs: { in: 'rg', in2: 'b', operator: 'arithmetic', k1: 0, k2: 1, k3: 1, k4: 0 } });
  return primitives;
}

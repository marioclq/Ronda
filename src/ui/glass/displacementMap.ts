/*
 * Displacement map for the liquid glass lens, ported from xenitV1/liquid-glass-skill
 * (assets/refraction.js, MIT License, Copyright (c) xenitV1).
 * Neutral in the middle; inside a rim band ("bezel") every pixel samples from further inward,
 * so what is behind the glass curves and compresses at the edge like the rim of a thick lens.
 */

export interface LensSpec {
  /** Size of the element in CSS pixels. */
  readonly width: number;
  readonly height: number;
  /** Corner radius in CSS pixels (already capped to half the short side). */
  readonly radius: number;
  /** Width of the refracting rim in CSS pixels; the interior stays neutral. */
  readonly bezel: number;
  /** Gentle zoom toward the centre across the whole surface, 0 for none. */
  readonly magnify: number;
}

interface Field {
  /** Signed distance to the outline, negative inside. */
  readonly d: number;
  /** Outward normal. */
  readonly nx: number;
  readonly ny: number;
}

/** Signed distance from a point to a rounded rectangle centred at 0,0, with its outward normal. */
export function roundedRectField(x: number, y: number, halfWidth: number, halfHeight: number, radius: number): Field {
  const qx = Math.abs(x) - (halfWidth - radius);
  const qy = Math.abs(y) - (halfHeight - radius);
  const sx = x < 0 ? -1 : 1;
  const sy = y < 0 ? -1 : 1;
  if (qx > 0 && qy > 0) {
    const length = Math.hypot(qx, qy) || 1;
    return { d: length - radius, nx: (qx / length) * sx, ny: (qy / length) * sy };
  }
  if (qx > qy) return { d: qx - radius, nx: sx, ny: 0 };
  return { d: qy - radius, nx: 0, ny: sy };
}

const NEUTRAL = 128;

function channel(value: number): number {
  return Math.round(NEUTRAL + Math.max(-1, Math.min(1, value)) * 127);
}

/** RGBA pixels for feDisplacementMap: R = x shift, G = y shift, 128 = none. */
export function renderDisplacementPixels(spec: LensSpec): Uint8ClampedArray<ArrayBuffer> {
  const { width, height, radius, bezel, magnify } = spec;
  if (bezel <= 0) throw new Error(`The lens bezel must be positive, got ${bezel} for a ${width}x${height} map`);
  const data = new Uint8ClampedArray(width * height * 4);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      const x = px + 0.5 - halfWidth;
      const y = py + 0.5 - halfHeight;
      const field = roundedRectField(x, y, halfWidth, halfHeight, radius);
      const inside = -field.d;
      let vx = 0;
      let vy = 0;
      if (inside < bezel && inside > -1) {
        // 1 at the outline, 0 at the inner edge of the bezel; steep near the outline.
        const t = 1 - Math.max(0, inside) / bezel;
        const m = (t * t * (3 - 2 * t)) ** 1.6;
        vx = -field.nx * m;
        vy = -field.ny * m;
      }
      if (magnify > 0) {
        // The original turns a fixed 0.25 zoom on or off; here it grows with magnify (0.1 = the original).
        vx -= (x / halfWidth) * magnify * 2.5;
        vy -= (y / halfHeight) * magnify * 2.5;
      }
      const offset = (py * width + px) * 4;
      data[offset] = channel(vx);
      data[offset + 1] = channel(vy);
      data[offset + 2] = NEUTRAL;
      data[offset + 3] = 255;
    }
  }
  return data;
}

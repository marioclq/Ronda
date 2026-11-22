export interface LensSpec {
  /** Size of the element in CSS pixels. */
  readonly width: number;
  readonly height: number;
  /** Corner radius in CSS pixels. */
  readonly radius: number;
  /** Width of the refracting rim in CSS pixels; the interior stays neutral. */
  readonly bezel: number;
}

/** Distance from a point to the edge of a rounded rectangle; positive inside, zero on the edge. */
export function signedInsideDistance(x: number, y: number, spec: LensSpec): number {
  const halfWidth = spec.width / 2;
  const halfHeight = spec.height / 2;
  const qx = Math.abs(x - halfWidth) - (halfWidth - spec.radius);
  const qy = Math.abs(y - halfHeight) - (halfHeight - spec.radius);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - spec.radius;
  return -outside;
}

/** Unit vector pointing from the edge toward the inside, from a numeric gradient of the distance. */
function inwardDirection(x: number, y: number, spec: LensSpec): readonly [number, number] {
  const step = 0.75;
  const gx = signedInsideDistance(x + step, y, spec) - signedInsideDistance(x - step, y, spec);
  const gy = signedInsideDistance(x, y + step, spec) - signedInsideDistance(x, y - step, spec);
  const length = Math.hypot(gx, gy);
  return length === 0 ? [0, 0] : [gx / length, gy / length];
}

const NEUTRAL = 128;

/**
 * RGBA pixels of a displacement map for feDisplacementMap (R = x, G = y, 128 = no shift).
 * The shift is strongest on the edge and falls to zero at the inner side of the bezel, and it
 * points inward, so the rim shows content bent toward the center like a convex lens.
 */
export function renderDisplacementPixels(spec: LensSpec): Uint8ClampedArray<ArrayBuffer> {
  const data = new Uint8ClampedArray(spec.width * spec.height * 4);
  for (let y = 0; y < spec.height; y += 1) {
    for (let x = 0; x < spec.width; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const depth = signedInsideDistance(px, py, spec) / spec.bezel;
      const strength = depth >= 1 ? 0 : (1 - Math.max(depth, 0)) ** 2;
      const [dx, dy] = inwardDirection(px, py, spec);
      const offset = (y * spec.width + x) * 4;
      data[offset] = Math.round(NEUTRAL + 127 * dx * strength);
      data[offset + 1] = Math.round(NEUTRAL + 127 * dy * strength);
      data[offset + 2] = NEUTRAL;
      data[offset + 3] = 255;
    }
  }
  return data;
}

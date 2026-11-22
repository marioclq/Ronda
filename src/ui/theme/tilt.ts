/** Holding a phone to read tilts it about this far toward the face; that pose is "level". */
const REST_BETA = 45;
const RANGE_GAMMA = 35;
const RANGE_BETA = 35;

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

/**
 * Device orientation to a light offset from -1 to 1 on each axis: x from side to side (gamma),
 * y from tipping toward or away (beta, around the reading pose). A missing reading counts as level.
 */
export function tiltFromOrientation(beta: number | null, gamma: number | null): { readonly x: number; readonly y: number } {
  return {
    x: gamma === null ? 0 : clamp(gamma / RANGE_GAMMA),
    y: beta === null ? 0 : clamp((beta - REST_BETA) / RANGE_BETA),
  };
}

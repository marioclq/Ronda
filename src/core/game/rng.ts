export interface Rng {
  /** Uniform integer in [0, maxExclusive). Throws if maxExclusive is not a positive integer. */
  nextInt(maxExclusive: number): number;
}

function assertRange(maxExclusive: number): void {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
    throw new RangeError(`maxExclusive must be a positive integer, got ${maxExclusive}`);
  }
}

/** Deterministic generator (mulberry32) for tests and reproducible games. */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    nextInt(maxExclusive: number): number {
      assertRange(maxExclusive);
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      const unit = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return Math.floor(unit * maxExclusive);
    },
  };
}

export function createMathRng(): Rng {
  return {
    nextInt(maxExclusive: number): number {
      assertRange(maxExclusive);
      return Math.floor(Math.random() * maxExclusive);
    },
  };
}

/** Fisher–Yates on a copy. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const current = result[i] as T;
    result[i] = result[j] as T;
    result[j] = current;
  }
  return result;
}

export function pickOne<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('Cannot pick from an empty list');
  return items[rng.nextInt(items.length)] as T;
}

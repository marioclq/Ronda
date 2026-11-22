/** The liquid glass look the user tunes in Ajustes → Vidrio. Stored in settings.glass and in backups. */

export const GLASS_TINT_COLORS = ['NEUTRAL', 'ACCENT'] as const;
export type GlassTintColor = (typeof GLASS_TINT_COLORS)[number];

export const GLASS_NUMBERS = [
  'frost',
  'saturation',
  'tint',
  'film',
  'rim',
  'rimDepth',
  'curvature',
  'dispersion',
  'magnify',
  'depth',
] as const;
export type GlassNumber = (typeof GLASS_NUMBERS)[number];

export type GlassStyle = Readonly<Record<GlassNumber, number>> & {
  readonly tintColor: GlassTintColor;
  /** Opaque glass without refraction, whatever the system says. */
  readonly reduceTransparency: boolean;
  /** Rim light and film follow how the phone is tilted (device orientation). */
  readonly tiltLight: boolean;
};

export interface GlassRange {
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export const GLASS_RANGES: Readonly<Record<GlassNumber, GlassRange>> = {
  frost: { min: 0, max: 40, step: 1 },
  saturation: { min: 100, max: 250, step: 5 },
  tint: { min: 0, max: 2, step: 0.05 },
  film: { min: 0, max: 0.5, step: 0.01 },
  rim: { min: 0, max: 2, step: 0.05 },
  rimDepth: { min: 4, max: 40, step: 1 },
  curvature: { min: 0, max: 2, step: 0.05 },
  dispersion: { min: 0, max: 0.2, step: 0.01 },
  magnify: { min: 0, max: 0.1, step: 0.005 },
  depth: { min: 0, max: 2, step: 0.05 },
};

export const DEFAULT_GLASS: GlassStyle = {
  frost: 28,
  saturation: 190,
  tint: 1,
  film: 0.15,
  rim: 1,
  rimDepth: 16,
  curvature: 1,
  dispersion: 0.04,
  magnify: 0,
  depth: 1,
  tintColor: 'NEUTRAL',
  reduceTransparency: false,
  tiltLight: true,
};

const FIELDS = new Set<string>([...GLASS_NUMBERS, 'tintColor', 'reduceTransparency', 'tiltLight']);

/** Validates settings.glass. Each problem is reported with the value found; nothing is repaired. */
export function parseGlassStyle(raw: unknown, problems: string[]): GlassStyle {
  const where = 'settings.glass';
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    problems.push(`${where} must be an object, got ${JSON.stringify(raw)}`);
    return DEFAULT_GLASS;
  }
  const record = raw as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!FIELDS.has(key)) problems.push(`${where}: unknown field "${key}"`);
  }
  const numbers = {} as Record<GlassNumber, number>;
  for (const key of GLASS_NUMBERS) {
    const value = record[key];
    const { min, max } = GLASS_RANGES[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max) {
      numbers[key] = value;
    } else {
      problems.push(`${where}.${key} must be a number from ${min} to ${max}, got ${JSON.stringify(value)}`);
      numbers[key] = DEFAULT_GLASS[key];
    }
  }
  let tintColor: GlassTintColor = DEFAULT_GLASS.tintColor;
  if ((GLASS_TINT_COLORS as readonly unknown[]).includes(record.tintColor)) tintColor = record.tintColor as GlassTintColor;
  else problems.push(`${where}.tintColor must be one of ${GLASS_TINT_COLORS.join(', ')}, got ${JSON.stringify(record.tintColor)}`);
  let reduceTransparency = DEFAULT_GLASS.reduceTransparency;
  if (typeof record.reduceTransparency === 'boolean') reduceTransparency = record.reduceTransparency;
  else problems.push(`${where}.reduceTransparency must be true or false, got ${JSON.stringify(record.reduceTransparency)}`);
  // Added after the first release: a saved style without it takes the default.
  let tiltLight = DEFAULT_GLASS.tiltLight;
  if (typeof record.tiltLight === 'boolean') tiltLight = record.tiltLight;
  else if (record.tiltLight !== undefined) problems.push(`${where}.tiltLight must be true or false, got ${JSON.stringify(record.tiltLight)}`);
  return { ...numbers, tintColor, reduceTransparency, tiltLight };
}

import { GAME_MODES, LEVELS, type Card, type GameMode } from '../core/content/types';
import { checkCard } from '../core/content/validator';
import type { GameConfig, Penalty } from '../core/game/engine';
import { IOS_MAX, IOS_MIN, type DateRecord, type DateSet } from '../core/date/session';
import type { PlayEvent } from '../core/events/playEvent';
import { ATTRACTIONS, GENDERS, type Attraction, type Gender, type Player } from '../core/game/player';
import { parseGlassStyle, type GlassStyle } from './glassStyle';

/** 2: adds `dates`. 3: adds `events` (one per card closed). Older versions are migrated on read. */
export const SCHEMA_VERSION = 3;
export const CUSTOM_ID_PREFIX = 'custom-';
export const THEMES = ['SYSTEM', 'LIGHT', 'DARK'] as const;
export type Theme = (typeof THEMES)[number];

export interface UserSettings {
  readonly theme: Theme;
  readonly lastConfig?: GameConfig;
  /** Liquid glass look from Ajustes → Vidrio; absent means the defaults. Optional, so no schema bump. */
  readonly glass?: GlassStyle;
}

export interface UserState {
  readonly schemaVersion: number;
  readonly players: readonly Player[];
  /** cardId -> last time shown (epoch ms). */
  readonly history: Readonly<Record<string, number>>;
  readonly customCards: readonly Card[];
  readonly settings: UserSettings;
  /** Finished dates, oldest first. Names are the players' aliases. */
  readonly dates: readonly DateRecord[];
  /** Cards closed while playing, oldest first, capped at MAX_EVENTS. */
  readonly events: readonly PlayEvent[];
}

/** Carries the raw stored value so the error screen can export it untouched. */
export class UserStateError extends Error {
  readonly raw: unknown;

  constructor(message: string, raw: unknown) {
    super(message);
    this.name = 'UserStateError';
    this.raw = raw;
  }
}

export function emptyUserState(): UserState {
  return { schemaVersion: SCHEMA_VERSION, players: [], history: {}, customCards: [], settings: { theme: 'SYSTEM' }, dates: [], events: [] };
}

const TOP_LEVEL_FIELDS = new Set(['schemaVersion', 'players', 'history', 'customCards', 'settings', 'dates', 'events']);

/** Migrations by version, applied in sequence. Each adds what the next version introduced; none repairs invalid data. */
function migrate(input: Record<string, unknown>): Record<string, unknown> {
  let raw = input;
  if (raw.schemaVersion === 1) raw = { ...raw, schemaVersion: 2, dates: [] };
  if (raw.schemaVersion === 2) raw = { ...raw, schemaVersion: 3, events: [] };
  return raw;
}

const OUTCOMES = ['COMPLETED', 'PASSED', 'REPLACED', 'SHOWN'] as const;
const REASONS = ['UNCLEAR', 'NOT_FOR_US'] as const;
const EVENT_MODES = [...GAME_MODES, 'DATE_36'] as const;

function parseEvents(raw: unknown, problems: string[]): PlayEvent[] {
  if (!Array.isArray(raw)) {
    problems.push(`events must be an array, got ${JSON.stringify(raw)}`);
    return [];
  }
  const events: PlayEvent[] = [];
  raw.forEach((item: unknown, index: number) => {
    const where = `events[${index}]`;
    if (!isRecord(item)) {
      problems.push(`${where} must be an object`);
      return;
    }
    const { id, at, session, mode, level, cardId, playerAlias, outcome, reason, msOnCard } = item;
    const bad: string[] = [];
    if (typeof id !== 'string' || id === '') bad.push(`id ${JSON.stringify(id)}`);
    if (typeof at !== 'number' || !Number.isFinite(at)) bad.push(`at ${JSON.stringify(at)}`);
    if (typeof session !== 'string' || session === '') bad.push(`session ${JSON.stringify(session)}`);
    if (!oneOf(EVENT_MODES, mode)) bad.push(`mode ${JSON.stringify(mode)}`);
    if (!oneOf(LEVELS, level)) bad.push(`level ${JSON.stringify(level)}`);
    if (typeof cardId !== 'string' || cardId === '') bad.push(`cardId ${JSON.stringify(cardId)}`);
    if (playerAlias !== null && (typeof playerAlias !== 'string' || playerAlias === '')) bad.push(`playerAlias ${JSON.stringify(playerAlias)}`);
    if (!oneOf(OUTCOMES, outcome)) bad.push(`outcome ${JSON.stringify(outcome)}`);
    if (reason !== undefined && !oneOf(REASONS, reason)) bad.push(`reason ${JSON.stringify(reason)}`);
    if (typeof msOnCard !== 'number' || !Number.isFinite(msOnCard) || msOnCard < 0) bad.push(`msOnCard ${JSON.stringify(msOnCard)}`);
    if (bad.length > 0) {
      problems.push(`${where} is invalid: ${bad.join('; ')}`);
      return;
    }
    events.push({
      id: id as string,
      at: at as number,
      session: session as string,
      mode: mode as PlayEvent['mode'],
      level: level as PlayEvent['level'],
      cardId: cardId as string,
      playerAlias: playerAlias as string | null,
      outcome: outcome as PlayEvent['outcome'],
      ...(reason === undefined ? {} : { reason: reason as NonNullable<PlayEvent['reason']> }),
      msOnCard: msOnCard as number,
    });
  });
  return events;
}

function isIos(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= IOS_MIN && value <= IOS_MAX;
}

function parseIosPair(value: unknown): readonly [number, number] | null {
  return Array.isArray(value) && value.length === 2 && isIos(value[0]) && isIos(value[1]) ? [value[0], value[1]] : null;
}

function parseDates(raw: unknown, problems: string[]): DateRecord[] {
  if (!Array.isArray(raw)) {
    problems.push(`dates must be an array, got ${JSON.stringify(raw)}`);
    return [];
  }
  const records: DateRecord[] = [];
  raw.forEach((item: unknown, index: number) => {
    const where = `dates[${index}]`;
    if (!isRecord(item)) {
      problems.push(`${where} must be an object`);
      return;
    }
    const { id, at, names, startSet, lastQuestion, ios } = item;
    const before = isRecord(ios) ? parseIosPair(ios.before) : null;
    const after = isRecord(ios) ? parseIosPair(ios.after) : null;
    const bad: string[] = [];
    if (typeof id !== 'string' || id === '') bad.push(`id ${JSON.stringify(id)}`);
    if (typeof at !== 'number' || !Number.isFinite(at)) bad.push(`at ${JSON.stringify(at)}`);
    if (!Array.isArray(names) || names.length !== 2 || !names.every((n) => typeof n === 'string' && n.trim() !== '')) {
      bad.push(`names ${JSON.stringify(names)}`);
    }
    if (startSet !== 1 && startSet !== 2 && startSet !== 3) bad.push(`startSet ${JSON.stringify(startSet)}`);
    if (typeof lastQuestion !== 'number' || !Number.isInteger(lastQuestion) || lastQuestion < 1) {
      bad.push(`lastQuestion ${JSON.stringify(lastQuestion)}`);
    }
    if (before === null || after === null) bad.push(`ios ${JSON.stringify(ios)} (two values from ${IOS_MIN} to ${IOS_MAX}, before and after)`);
    if (bad.length > 0 || before === null || after === null) {
      problems.push(`${where} is invalid: ${bad.join('; ')}`);
      return;
    }
    records.push({
      id: id as string,
      at: at as number,
      names: [(names as string[])[0] as string, (names as string[])[1] as string],
      startSet: startSet as DateSet,
      lastQuestion: lastQuestion as number,
      ios: { before, after },
    });
  });
  return records;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

function parsePlayers(raw: unknown, problems: string[]): Player[] {
  if (!Array.isArray(raw)) {
    problems.push(`players must be an array, got ${JSON.stringify(raw)}`);
    return [];
  }
  const players: Player[] = [];
  const ids = new Set<string>();
  const names = new Set<string>();
  raw.forEach((item: unknown, index: number) => {
    const where = `players[${index}]`;
    if (!isRecord(item)) {
      problems.push(`${where} must be an object`);
      return;
    }
    const { id, name, gender, attractedTo } = item;
    let ok = true;
    if (typeof id !== 'string' || id.length === 0) {
      problems.push(`${where}.id must be a non-empty string, got ${JSON.stringify(id)}`);
      ok = false;
    } else if (ids.has(id)) {
      problems.push(`${where}.id "${id}" is duplicated`);
      ok = false;
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      problems.push(`${where}.name must be a non-empty string, got ${JSON.stringify(name)}`);
      ok = false;
    } else if (names.has(name.trim().toLowerCase())) {
      problems.push(`${where}.name "${name}" is duplicated (case-insensitive)`);
      ok = false;
    }
    if (!oneOf(GENDERS, gender)) {
      problems.push(`${where}.gender must be one of ${GENDERS.join(', ')}, got ${JSON.stringify(gender)}`);
      ok = false;
    }
    if (!oneOf(ATTRACTIONS, attractedTo)) {
      problems.push(`${where}.attractedTo must be one of ${ATTRACTIONS.join(', ')}, got ${JSON.stringify(attractedTo)}`);
      ok = false;
    }
    if (ok) {
      ids.add(id as string);
      names.add((name as string).trim().toLowerCase());
      players.push({
        id: id as string,
        name: (name as string).trim(),
        gender: gender as Gender,
        attractedTo: attractedTo as Attraction,
      });
    }
  });
  return players;
}

function parseHistory(raw: unknown, problems: string[]): Record<string, number> {
  if (!isRecord(raw)) {
    problems.push(`history must be an object, got ${JSON.stringify(raw)}`);
    return {};
  }
  const history: Record<string, number> = {};
  for (const [cardId, seen] of Object.entries(raw)) {
    if (typeof seen !== 'number' || !Number.isFinite(seen) || seen < 0) {
      problems.push(`history["${cardId}"] must be a non-negative number, got ${JSON.stringify(seen)}`);
    } else {
      history[cardId] = seen;
    }
  }
  return history;
}

function parseCustomCards(raw: unknown, problems: string[]): Card[] {
  if (!Array.isArray(raw)) {
    problems.push(`customCards must be an array, got ${JSON.stringify(raw)}`);
    return [];
  }
  const cards: Card[] = [];
  const ids = new Set<string>();
  raw.forEach((item: unknown, index: number) => {
    const check = checkCard(item, `customCards[${index}]`);
    for (const problem of check.problems) problems.push(`${check.label}: ${problem}`);
    if (check.card === null) return;
    if (!check.card.id.startsWith(CUSTOM_ID_PREFIX)) {
      problems.push(`${check.label}: custom card ids must start with "${CUSTOM_ID_PREFIX}"`);
    } else if (ids.has(check.card.id)) {
      problems.push(`${check.label}: id is duplicated`);
    } else {
      ids.add(check.card.id);
      cards.push(check.card);
    }
  });
  return cards;
}

function parsePenalty(raw: unknown, problems: string[]): Penalty | null {
  const where = 'settings.lastConfig.penalty';
  if (!isRecord(raw)) {
    problems.push(`${where} must be an object, got ${JSON.stringify(raw)}`);
    return null;
  }
  switch (raw.kind) {
    case 'NONE':
      return { kind: 'NONE' };
    case 'GARMENT':
      return { kind: 'GARMENT' };
    case 'DRINKS': {
      const count = raw.count;
      if (count === 1 || count === 2 || count === 3 || count === 4 || count === 5) return { kind: 'DRINKS', count };
      problems.push(`${where}.count must be 1 to 5, got ${JSON.stringify(count)}`);
      return null;
    }
    default:
      problems.push(`${where}.kind must be NONE, GARMENT or DRINKS, got ${JSON.stringify(raw.kind)}`);
      return null;
  }
}

function parseConfig(raw: unknown, problems: string[]): GameConfig | null {
  const where = 'settings.lastConfig';
  if (!isRecord(raw)) {
    problems.push(`${where} must be an object, got ${JSON.stringify(raw)}`);
    return null;
  }
  const { modes, level } = raw;
  let parsedModes: GameMode[] = [];
  if (
    !Array.isArray(modes) ||
    modes.length === 0 ||
    !modes.every((mode: unknown): mode is GameMode => oneOf(GAME_MODES, mode)) ||
    new Set(modes).size !== modes.length
  ) {
    problems.push(`${where}.modes must be a non-empty list of unique modes from ${GAME_MODES.join(', ')}, got ${JSON.stringify(modes)}`);
  } else {
    parsedModes = modes;
  }
  if (!oneOf(LEVELS, level)) problems.push(`${where}.level must be one of ${LEVELS.join(', ')}, got ${JSON.stringify(level)}`);
  const penalty = parsePenalty(raw.penalty, problems);
  if (penalty === null || !oneOf(LEVELS, level) || parsedModes.length === 0) return null;
  return { modes: parsedModes, level, penalty };
}

function parseSettings(raw: unknown, problems: string[]): UserSettings {
  if (!isRecord(raw)) {
    problems.push(`settings must be an object, got ${JSON.stringify(raw)}`);
    return { theme: 'SYSTEM' };
  }
  let theme: Theme = 'SYSTEM';
  if (oneOf(THEMES, raw.theme)) theme = raw.theme;
  else problems.push(`settings.theme must be one of ${THEMES.join(', ')}, got ${JSON.stringify(raw.theme)}`);
  const lastConfig = raw.lastConfig === undefined ? null : parseConfig(raw.lastConfig, problems);
  const glass = raw.glass === undefined ? null : parseGlassStyle(raw.glass, problems);
  return {
    theme,
    ...(lastConfig === null ? {} : { lastConfig }),
    ...(glass === null ? {} : { glass }),
  };
}

/** Validates a raw stored value. Throws UserStateError listing every problem; never repairs anything. */
export function parseUserState(input: unknown, source: string): UserState {
  if (!isRecord(input)) throw new UserStateError(`${source}: stored state must be a JSON object, got ${JSON.stringify(input)}`, input);
  const raw = migrate(input);
  if (raw.schemaVersion !== SCHEMA_VERSION) {
    throw new UserStateError(
      `${source}: unsupported schemaVersion ${JSON.stringify(input.schemaVersion)}, this app reads 1 to ${SCHEMA_VERSION}`,
      input,
    );
  }
  const problems: string[] = [];
  for (const key of Object.keys(raw)) {
    if (!TOP_LEVEL_FIELDS.has(key)) problems.push(`unknown field "${key}"`);
  }
  const state: UserState = {
    schemaVersion: SCHEMA_VERSION,
    players: parsePlayers(raw.players, problems),
    history: parseHistory(raw.history, problems),
    customCards: parseCustomCards(raw.customCards, problems),
    settings: parseSettings(raw.settings, problems),
    dates: parseDates(raw.dates, problems),
    events: parseEvents(raw.events, problems),
  };
  if (problems.length > 0) {
    throw new UserStateError(`${source}: invalid user state:\n- ${problems.join('\n- ')}`, input);
  }
  return state;
}

import {
  CARD_TYPES,
  CONTACT_TAG,
  GROUP_CARD_TYPES,
  LEVELS,
  type Card,
  type CardType,
  type Level,
  type Pack,
} from './types';
import { extractVariableNames, hasStrayBraces, isKnownVariable } from './variables';

export interface ContentIssue {
  readonly source: string;
  readonly cardId: string | null;
  readonly message: string;
}

export function formatIssue(issue: ContentIssue): string {
  return issue.cardId === null
    ? `${issue.source}: ${issue.message}`
    : `${issue.source} [${issue.cardId}]: ${issue.message}`;
}

export class ContentError extends Error {
  readonly issues: readonly ContentIssue[];

  constructor(issues: readonly ContentIssue[]) {
    super(`Invalid content (${issues.length} issue(s)):\n${issues.map(formatIssue).join('\n')}`);
    this.name = 'ContentError';
    this.issues = issues;
  }
}

export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_TIMER_SECONDS = 600;

const PACK_FIELDS = new Set(['id', 'version', 'lang', 'cards']);
const CARD_FIELDS = new Set(['id', 'type', 'level', 'text', 'timerSeconds', 'tags']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value);
}

function textProblems(text: string, type: CardType | null, tags: readonly unknown[]): string[] {
  const problems: string[] = [];
  if (hasStrayBraces(text)) problems.push('text has unbalanced braces');
  const names = extractVariableNames(text);
  for (const name of new Set(names)) {
    if (!isKnownVariable(name)) problems.push(`unknown variable {${name}}`);
  }
  if (type !== null && GROUP_CARD_TYPES.includes(type) && names.length > 0) {
    problems.push(`${type} cards are for the whole group and cannot use player variables`);
  }
  if (tags.includes(CONTACT_TAG) && !names.includes('compatible')) {
    problems.push(`cards tagged "${CONTACT_TAG}" must use {compatible}`);
  }
  return problems;
}

export interface CardCheck {
  readonly card: Card | null;
  readonly label: string;
  readonly problems: readonly string[];
}

/** Validates one raw card. `label` identifies it when it has no usable id. */
export function checkCard(raw: unknown, label: string): CardCheck {
  if (!isRecord(raw)) return { card: null, label, problems: ['card must be a JSON object'] };

  const { id, type, level, text, tags, timerSeconds } = raw;
  const cardLabel = typeof id === 'string' && id.length > 0 ? id : label;
  const problems: string[] = [];

  for (const key of Object.keys(raw)) {
    if (!CARD_FIELDS.has(key)) problems.push(`unknown field "${key}"`);
  }
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    problems.push(`id must match ${ID_PATTERN}, got ${JSON.stringify(id)}`);
  }
  if (!isOneOf(CARD_TYPES, type)) {
    problems.push(`type must be one of ${CARD_TYPES.join(', ')}, got ${JSON.stringify(type)}`);
  }
  if (!isOneOf(LEVELS, level)) {
    problems.push(`level must be one of ${LEVELS.join(', ')}, got ${JSON.stringify(level)}`);
  }
  if (typeof text !== 'string' || text.trim().length === 0) {
    problems.push('text must be a non-empty string');
  }
  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string' && tag.length > 0)) {
    problems.push('tags must be an array of non-empty strings');
  }
  if (timerSeconds !== undefined) {
    if (
      typeof timerSeconds !== 'number' ||
      !Number.isInteger(timerSeconds) ||
      timerSeconds < 1 ||
      timerSeconds > MAX_TIMER_SECONDS
    ) {
      problems.push(
        `timerSeconds must be an integer between 1 and ${MAX_TIMER_SECONDS}, got ${JSON.stringify(timerSeconds)}`,
      );
    }
    if (type !== 'DARE') problems.push('timerSeconds is only allowed on DARE cards');
  }
  if (typeof text === 'string') {
    problems.push(...textProblems(text, isOneOf(CARD_TYPES, type) ? type : null, Array.isArray(tags) ? tags : []));
  }

  if (problems.length > 0) return { card: null, label: cardLabel, problems };

  const card: Card = {
    id: id as string,
    type: type as CardType,
    level: level as Level,
    text: text as string,
    tags: [...(tags as string[])],
    ...(timerSeconds === undefined ? {} : { timerSeconds: timerSeconds as number }),
  };
  return { card, label: cardLabel, problems: [] };
}

/** Parses a raw pack. Throws ContentError listing every problem found. */
export function parsePack(raw: unknown, source: string): Pack {
  if (!isRecord(raw)) {
    throw new ContentError([{ source, cardId: null, message: 'pack must be a JSON object' }]);
  }

  const issues: ContentIssue[] = [];
  const packIssue = (message: string): void => {
    issues.push({ source, cardId: null, message });
  };

  for (const key of Object.keys(raw)) {
    if (!PACK_FIELDS.has(key)) packIssue(`unknown pack field "${key}"`);
  }
  const { id, version, lang, cards } = raw;
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    packIssue(`pack id must match ${ID_PATTERN}, got ${JSON.stringify(id)}`);
  }
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    packIssue(`version must be a positive integer, got ${JSON.stringify(version)}`);
  }
  if (typeof lang !== 'string' || lang.length === 0) {
    packIssue(`lang must be a non-empty string, got ${JSON.stringify(lang)}`);
  }
  if (!Array.isArray(cards)) {
    packIssue('cards must be an array');
    throw new ContentError(issues);
  }

  const parsed: Card[] = [];
  const seen = new Set<string>();
  cards.forEach((rawCard: unknown, index: number) => {
    const check = checkCard(rawCard, `#${index}`);
    for (const message of check.problems) issues.push({ source, cardId: check.label, message });
    if (check.card === null) return;
    if (seen.has(check.card.id)) {
      issues.push({ source, cardId: check.card.id, message: 'duplicate id in pack' });
      return;
    }
    seen.add(check.card.id);
    parsed.push(check.card);
  });

  if (issues.length > 0) throw new ContentError(issues);
  return { id: id as string, version: version as number, lang: lang as string, cards: parsed };
}

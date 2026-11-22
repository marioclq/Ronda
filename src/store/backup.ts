import type { Card } from '../core/content/types';
import { parsePack } from '../core/content/validator';
import { CUSTOM_ID_PREFIX, parseUserState, type UserState } from './userState';

export const BACKUP_FORMAT = 'party-questions-backup';
export const CUSTOM_PACK_ID = 'custom-cards';

function parseJson(text: string, source: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${source} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function serializeBackup(state: UserState, exportedAt: number): string {
  return JSON.stringify({ format: BACKUP_FORMAT, exportedAt, state }, null, 2);
}

/** Throws with the reason when the text is not a valid backup. Never partially applies. */
export function parseBackup(text: string): UserState {
  const raw = parseJson(text, 'Backup file');
  if (typeof raw !== 'object' || raw === null || (raw as { format?: unknown }).format !== BACKUP_FORMAT) {
    throw new Error(`Backup file has format ${JSON.stringify((raw as { format?: unknown } | null)?.format)}, expected "${BACKUP_FORMAT}"`);
  }
  return parseUserState((raw as { state?: unknown }).state, 'backup file');
}

export function serializeCustomPack(cards: readonly Card[]): string {
  return JSON.stringify({ id: CUSTOM_PACK_ID, version: 1, lang: 'es', cards }, null, 2);
}

export interface ImportResult {
  readonly state: UserState;
  readonly added: number;
  readonly skipped: number;
}

/** Validates the whole pack first; one invalid or conflicting card rejects the file. */
export function importCustomPack(state: UserState, text: string, sourceName: string): ImportResult {
  const pack = parsePack(parseJson(text, sourceName), sourceName);
  const notCustom = pack.cards.filter((card) => !card.id.startsWith(CUSTOM_ID_PREFIX));
  if (notCustom.length > 0) {
    throw new Error(`${sourceName}: imported card ids must start with "${CUSTOM_ID_PREFIX}": ${notCustom.map((c) => c.id).join(', ')}`);
  }
  const existing = new Map(state.customCards.map((card) => [card.id, card]));
  const conflicts = pack.cards.filter((card) => {
    const current = existing.get(card.id);
    return current !== undefined && current.text !== card.text;
  });
  if (conflicts.length > 0) {
    throw new Error(`${sourceName}: cards already exist with different text: ${conflicts.map((c) => c.id).join(', ')}`);
  }
  const fresh = pack.cards.filter((card) => !existing.has(card.id));
  return {
    state: { ...state, customCards: [...state.customCards, ...fresh] },
    added: fresh.length,
    skipped: pack.cards.length - fresh.length,
  };
}

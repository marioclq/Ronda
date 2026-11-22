import { describe, expect, it } from 'vitest';
import { importCustomPack, parseBackup, serializeBackup, serializeCustomPack } from './backup';
import { emptyUserState, type UserState } from './userState';

const withCard: UserState = {
  ...emptyUserState(),
  customCards: [{ id: 'custom-1', type: 'TRUTH', level: 'SOFT', text: '¿Cuál es tu secreto?', tags: [] }],
};

describe('backup', () => {
  it('round-trips the whole user state', () => {
    expect(parseBackup(serializeBackup(withCard, 1_700_000_000_000))).toEqual(withCard);
  });

  it('rejects text that is not JSON, naming the cause', () => {
    expect(() => parseBackup('not json')).toThrow('not valid JSON');
  });

  it('rejects a file with another format marker', () => {
    expect(() => parseBackup(JSON.stringify({ format: 'something-else', state: emptyUserState() }))).toThrow('format');
  });

  it('rejects a backup whose state is invalid', () => {
    expect(() => parseBackup(JSON.stringify({ format: 'party-questions-backup', state: { schemaVersion: 1 } }))).toThrow();
  });
});

describe('importCustomPack', () => {
  const pack = (cards: unknown[]): string => JSON.stringify({ id: 'custom-cards', version: 1, lang: 'es', cards });
  const card = (id: string, text: string): Record<string, unknown> => ({ id, type: 'TRUTH', level: 'SOFT', text, tags: [] });

  it('adds new cards and skips identical ones', () => {
    const result = importCustomPack(withCard, pack([card('custom-1', '¿Cuál es tu secreto?'), card('custom-2', '¿Quién eres?')]), 'f.json');
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.state.customCards.map((c) => c.id)).toEqual(['custom-1', 'custom-2']);
  });

  it('rejects the whole file when an id exists with different text', () => {
    expect(() => importCustomPack(withCard, pack([card('custom-2', 'ok'), card('custom-1', 'otro texto')]), 'f.json')).toThrow('custom-1');
  });

  it('rejects ids without the custom- prefix', () => {
    expect(() => importCustomPack(withCard, pack([card('starter-soft-001', 'x')]), 'f.json')).toThrow('custom-');
  });

  it('rejects invalid packs with the file name and the reason', () => {
    expect(() => importCustomPack(withCard, '{"id":1}', 'mine.json')).toThrow('mine.json');
  });

  it('exports and re-imports the same cards', () => {
    const text = serializeCustomPack(withCard.customCards);
    expect(importCustomPack(emptyUserState(), text, 'f.json').state.customCards).toEqual(withCard.customCards);
  });
});

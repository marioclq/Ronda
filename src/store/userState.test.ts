import { describe, expect, it } from 'vitest';
import { emptyUserState, parseUserState, SCHEMA_VERSION, UserStateError, type UserState } from './userState';

function valid(): UserState {
  return {
    schemaVersion: SCHEMA_VERSION,
    players: [{ id: 'p1', name: 'Ana', gender: 'WOMAN', attractedTo: 'MEN' }],
    history: { 'starter-soft-001': 123 },
    customCards: [{ id: 'custom-1', type: 'TRUTH', level: 'SOFT', text: '¿Cuál es tu secreto?', tags: [] }],
    settings: {
      theme: 'DARK',
      lastConfig: { modes: ['TRUTH_OR_DARE'], level: 'SOFT', penalty: { kind: 'DRINKS', count: 2 } },
    },
    dates: [
      { id: 'date-1', at: 1_700_000_000_000, names: ['Ana', 'Beto'], startSet: 1, lastQuestion: 12, ios: { before: [3, 4], after: [5, 6] } },
    ],
    events: [
      {
        id: 'ev-1',
        at: 1_700_000_100_000,
        session: 'game-1',
        mode: 'TRUTH_OR_DARE',
        level: 'SOFT',
        cardId: 'tod-t-soft-0001',
        playerAlias: 'Ana',
        outcome: 'REPLACED',
        reason: 'UNCLEAR',
        msOnCard: 3200,
      },
    ],
  };
}

function clone(): Record<string, any> {
  return JSON.parse(JSON.stringify(valid())) as Record<string, any>;
}

describe('parseUserState', () => {
  it('round-trips a valid state and an empty one', () => {
    expect(parseUserState(clone(), 't')).toEqual(valid());
    expect(parseUserState(JSON.parse(JSON.stringify(emptyUserState())), 't')).toEqual(emptyUserState());
  });

  it('rejects an unknown schemaVersion and keeps the raw value for export', () => {
    const raw = clone();
    raw.schemaVersion = 99;
    try {
      parseUserState(raw, 'record');
      throw new Error('expected parseUserState to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(UserStateError);
      expect((error as UserStateError).message).toContain('schemaVersion');
      expect((error as UserStateError).raw).toBe(raw);
    }
  });

  it('rejects non-object values', () => {
    expect(() => parseUserState('nope', 't')).toThrow(UserStateError);
    expect(() => parseUserState(null, 't')).toThrow(UserStateError);
  });

  it('rejects duplicate player names regardless of case', () => {
    const raw = clone();
    raw.players.push({ id: 'p2', name: 'ana', gender: 'MAN', attractedTo: 'WOMEN' });
    expect(() => parseUserState(raw, 't')).toThrow('duplicated');
  });

  it('rejects an invalid gender, a bad penalty count and an unknown theme, naming each problem', () => {
    const raw = clone();
    raw.players[0].gender = 'ROBOT';
    raw.settings.lastConfig.penalty.count = 9;
    raw.settings.theme = 'NEON';
    let message = '';
    try {
      parseUserState(raw, 't');
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('players[0].gender');
    expect(message).toContain('penalty.count');
    expect(message).toContain('theme');
  });

  it('rejects custom cards without the custom- prefix and invalid cards', () => {
    const raw = clone();
    raw.customCards.push({ id: 'starter-soft-001', type: 'TRUTH', level: 'SOFT', text: 'x', tags: [] });
    raw.customCards.push({ id: 'custom-2', type: 'NEVER', level: 'SOFT', text: 'Yo nunca con {otro}', tags: [] });
    let message = '';
    try {
      parseUserState(raw, 't');
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('must start with "custom-"');
    expect(message).toContain('custom-2');
  });

  it('rejects unknown top-level fields and negative history timestamps', () => {
    const raw = clone();
    raw.extra = true;
    raw.history['x'] = -1;
    expect(() => parseUserState(raw, 't')).toThrow('extra');
    const raw2 = clone();
    raw2.history['x'] = -1;
    expect(() => parseUserState(raw2, 't')).toThrow('history');
  });
});

describe('schema migration and date records', () => {
  it('reads a version 1 record as version 2 with no dates, keeping everything else', () => {
    const v1 = clone();
    v1.schemaVersion = 1;
    delete v1.dates;
    const parsed = parseUserState(v1, 't');
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    expect(parsed.dates).toEqual([]);
    expect(parsed.players).toEqual(valid().players);
  });

  it('rejects a date record with an IOS outside 1..7 or a missing name, naming the record', () => {
    const raw = clone();
    raw.dates[0].ios.after[1] = 9;
    expect(() => parseUserState(raw, 't')).toThrow('dates[0]');
    const raw2 = clone();
    raw2.dates[0].names = ['Ana'];
    expect(() => parseUserState(raw2, 't')).toThrow('names');
  });
});

describe('schema v3: play events', () => {
  it('reads a version 2 record as version 3 with no events, and a version 1 record through both steps', () => {
    const v2 = clone();
    v2.schemaVersion = 2;
    delete v2.events;
    expect(parseUserState(v2, 't').events).toEqual([]);
    const v1 = clone();
    v1.schemaVersion = 1;
    delete v1.events;
    delete v1.dates;
    const parsed = parseUserState(v1, 't');
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    expect(parsed.events).toEqual([]);
    expect(parsed.dates).toEqual([]);
  });

  it('rejects an event with an unknown outcome or a negative time on screen, naming the event', () => {
    const raw = clone();
    raw.events[0].outcome = 'SKIPPED';
    expect(() => parseUserState(raw, 't')).toThrow('events[0]');
    const raw2 = clone();
    raw2.events[0].msOnCard = -1;
    expect(() => parseUserState(raw2, 't')).toThrow('msOnCard');
  });
});

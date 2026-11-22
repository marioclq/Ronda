import { describe, expect, it } from 'vitest';
import { ContentError, formatIssue, parsePack } from './validator';

const SOURCE = 'packs/truth.soft.json';

function packWith(cards: unknown[]): Record<string, unknown> {
  return { id: 'truth-soft', version: 1, lang: 'es', cards };
}

function validCard(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { id: 'tod-t-soft-0001', type: 'TRUTH', level: 'SOFT', text: '¿Qué le ocultas a {otro}?', tags: [], ...overrides };
}

function issuesOf(raw: unknown): string[] {
  try {
    parsePack(raw, SOURCE);
  } catch (error) {
    if (error instanceof ContentError) return error.issues.map(formatIssue);
    throw error;
  }
  throw new Error('Expected parsePack to throw ContentError');
}

describe('parsePack', () => {
  it('returns the typed pack when everything is valid', () => {
    const pack = parsePack(packWith([validCard()]), SOURCE);
    expect(pack.id).toBe('truth-soft');
    expect(pack.cards).toHaveLength(1);
    expect(pack.cards[0]).toEqual({
      id: 'tod-t-soft-0001',
      type: 'TRUTH',
      level: 'SOFT',
      text: '¿Qué le ocultas a {otro}?',
      tags: [],
    });
    expect('timerSeconds' in (pack.cards[0] ?? {})).toBe(false);
  });

  it('keeps timerSeconds on dares', () => {
    const pack = parsePack(
      packWith([validCard({ id: 'tod-d-soft-0001', type: 'DARE', text: 'Baila 30 segundos', timerSeconds: 30 })]),
      SOURCE,
    );
    expect(pack.cards[0]?.timerSeconds).toBe(30);
  });

  it('reports all problems at once, with source and card id', () => {
    const issues = issuesOf(
      packWith([
        validCard({ id: 'tod-t-soft-0001', type: 'TRUTHS' }),
        validCard({ id: 'tod-t-soft-0002', text: '   ' }),
      ]),
    );
    expect(issues).toHaveLength(2);
    expect(issues[0]).toContain(`${SOURCE} [tod-t-soft-0001]: type must be one of`);
    expect(issues[1]).toContain(`${SOURCE} [tod-t-soft-0002]: text must be a non-empty string`);
  });

  it.each([
    ['unknown card fields (typos)', validCard({ timer: 30 }), 'unknown field "timer"'],
    ['ids outside the slug format', validCard({ id: 'Bad Id' }), 'id must match'],
    ['unknown levels', validCard({ level: 'HOT' }), 'level must be one of'],
    ['tags that are not string arrays', validCard({ tags: 'x' }), 'tags must be an array'],
    ['timers on non-dare cards', validCard({ timerSeconds: 30 }), 'timerSeconds is only allowed on DARE cards'],
    ['out-of-range timers', validCard({ type: 'DARE', timerSeconds: 0 }), 'between 1 and 600'],
    ['unknown variables', validCard({ text: 'Habla con {amigo}' }), 'unknown variable {amigo}'],
    ['unbalanced braces', validCard({ text: 'Habla con {otro' }), 'unbalanced braces'],
    [
      'player variables in group cards',
      validCard({ type: 'NEVER', text: 'Yo nunca le mentí a {otro}' }),
      'NEVER cards are for the whole group',
    ],
    [
      'contact cards without {compatible}',
      validCard({ type: 'DARE', text: 'Abraza a {otro}', tags: ['contacto'] }),
      'cards tagged "contacto" must use {compatible}',
    ],
  ])('rejects %s', (_label, raw, expected) => {
    const issues = issuesOf(packWith([raw]));
    expect(issues.some((issue) => issue.includes(expected))).toBe(true);
  });

  it('rejects duplicate ids inside a pack', () => {
    expect(issuesOf(packWith([validCard(), validCard()]))).toEqual([
      `${SOURCE} [tod-t-soft-0001]: duplicate id in pack`,
    ]);
  });

  it('rejects malformed pack envelopes', () => {
    expect(issuesOf('not a pack')).toEqual([`${SOURCE}: pack must be a JSON object`]);
    expect(issuesOf({ id: 'truth-soft', version: 1, lang: 'es', cards: {} })).toEqual([
      `${SOURCE}: cards must be an array`,
    ]);
    expect(issuesOf({ ...packWith([]), version: 0, extra: true })).toEqual([
      `${SOURCE}: unknown pack field "extra"`,
      `${SOURCE}: version must be a positive integer, got 0`,
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { deck } from '../../core/testing/fixtures';
import { canReplay, DEFAULT_DRAFT, draftFromLastConfig, setLevel, startBlockers, toConfig, toggleMode } from './setupLogic';

const base = [
  ...deck('t', 'TRUTH', 'SOFT', 3),
  ...deck('d', 'DARE', 'SOFT', 3),
  ...deck('n', 'NEVER', 'SOFT', 3),
];

describe('startBlockers', () => {
  it('lets the default draft start with two players', () => {
    expect(startBlockers(DEFAULT_DRAFT, base, 2)).toEqual([]);
  });

  it('asks for at least one mode and two players', () => {
    expect(startBlockers({ ...DEFAULT_DRAFT, modes: [] }, base, 2)).toEqual([{ kind: 'NO_MODES' }]);
    expect(startBlockers(DEFAULT_DRAFT, base, 1)).toEqual([{ kind: 'NOT_ENOUGH_PLAYERS' }]);
  });

  it('lists the modes that lack cards at the chosen level', () => {
    const draft = { ...DEFAULT_DRAFT, modes: ['TRUTH_OR_DARE', 'RATHER'] as const };
    expect(startBlockers(draft, base, 2)).toEqual([{ kind: 'MISSING_CONTENT', modes: ['RATHER'] }]);
  });

  it('blocks EXTREME until the +18 confirmation, without a misleading missing-content message', () => {
    expect(startBlockers({ ...DEFAULT_DRAFT, level: 'EXTREME' }, base, 2)).toEqual([{ kind: 'ADULT_UNCONFIRMED' }]);
  });

  it('reports missing content for a confirmed EXTREME game with no extreme cards loaded', () => {
    const draft = { ...DEFAULT_DRAFT, level: 'EXTREME' as const, adultConfirmed: true };
    expect(startBlockers(draft, base, 2)).toEqual([{ kind: 'MISSING_CONTENT', modes: ['TRUTH_OR_DARE'] }]);
  });
});

describe('draft helpers', () => {
  it('toggles modes keeping the canonical order', () => {
    const withNever = toggleMode(DEFAULT_DRAFT, 'NEVER');
    expect(withNever.modes).toEqual(['TRUTH_OR_DARE', 'NEVER']);
    expect(toggleMode(withNever, 'TRUTH_OR_DARE').modes).toEqual(['NEVER']);
  });

  it('forgets the +18 confirmation when the level leaves EXTREME', () => {
    const confirmed = { ...DEFAULT_DRAFT, level: 'EXTREME' as const, adultConfirmed: true };
    expect(setLevel(confirmed, 'SPICY')).toMatchObject({ level: 'SPICY', adultConfirmed: false });
  });

  it('never restores a +18 confirmation from the last config', () => {
    const last = { modes: ['NEVER'] as const, level: 'EXTREME' as const, penalty: { kind: 'GARMENT' } as const };
    expect(draftFromLastConfig(last)).toMatchObject({ level: 'EXTREME', adultConfirmed: false });
    expect(draftFromLastConfig(undefined)).toEqual(DEFAULT_DRAFT);
  });

  it('builds the engine config without the confirmation flag', () => {
    expect(toConfig(DEFAULT_DRAFT)).toEqual({ modes: ['TRUTH_OR_DARE'], level: 'SOFT', penalty: { kind: 'NONE' } });
  });
});

describe('canReplay', () => {
  const last = { modes: ['TRUTH_OR_DARE'] as const, level: 'SPICY' as const, penalty: { kind: 'NONE' } as const };

  it('offers a replay of the last config with two or more players', () => {
    expect(canReplay(last, 2)).toBe(true);
  });

  it('needs a remembered config and two players', () => {
    expect(canReplay(undefined, 4)).toBe(false);
    expect(canReplay(last, 1)).toBe(false);
  });

  it('never replays EXTREME, because the +18 confirmation is asked every game', () => {
    expect(canReplay({ ...last, level: 'EXTREME' }, 4)).toBe(false);
  });
});

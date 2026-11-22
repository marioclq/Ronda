import { describe, expect, it } from 'vitest';
import type { Player } from '../../core/game/player';
import { buildPlayer, EMPTY_DRAFT, validatePlayerDraft } from './playerForm';

const ana: Player = { id: 'p1', name: 'Ana', gender: 'WOMAN', attractedTo: 'MEN' };

describe('validatePlayerDraft', () => {
  it('rejects empty and whitespace-only names', () => {
    expect(validatePlayerDraft({ ...EMPTY_DRAFT, name: '   ' }, [], null)).toEqual({ kind: 'NAME_EMPTY' });
  });

  it('rejects a name that exists, ignoring case and surrounding spaces', () => {
    expect(validatePlayerDraft({ ...EMPTY_DRAFT, name: ' ANA ' }, [ana], null)).toEqual({ kind: 'NAME_TAKEN', name: 'ANA' });
  });

  it('lets a player keep their own name while editing', () => {
    expect(validatePlayerDraft({ ...EMPTY_DRAFT, name: 'ana' }, [ana], 'p1')).toBeNull();
  });

  it('accepts a new unique name', () => {
    expect(validatePlayerDraft({ ...EMPTY_DRAFT, name: 'Beto' }, [ana], null)).toBeNull();
  });
});

describe('buildPlayer', () => {
  it('trims the name and keeps gender and attraction', () => {
    expect(buildPlayer({ name: '  Beto ', gender: 'MAN', attractedTo: 'ANYONE' }, 'p2')).toEqual({
      id: 'p2',
      name: 'Beto',
      gender: 'MAN',
      attractedTo: 'ANYONE',
    });
  });
});

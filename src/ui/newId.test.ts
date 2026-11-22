import { describe, expect, it } from 'vitest';
import { newId } from './newId';

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('newId', () => {
  it('returns lowercase hex that matches the id pattern', () => {
    expect(newId()).toMatch(/^[0-9a-f]{32}$/);
    expect(newId()).toMatch(ID_PATTERN);
  });

  it('prepends the prefix with a dash and still matches the id pattern', () => {
    const id = newId('custom');
    expect(id.startsWith('custom-')).toBe(true);
    expect(id).toMatch(ID_PATTERN);
  });

  it('does not repeat over 1000 calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()));
    expect(ids.size).toBe(1000);
  });
});

import { describe, expect, it } from 'vitest';
import { describePenalty } from './penaltyText';

describe('describePenalty', () => {
  it('mentions the amount for drinks', () => {
    expect(describePenalty({ kind: 'DRINKS', count: 3 })).toContain('3');
  });

  it('describes different amounts differently', () => {
    expect(describePenalty({ kind: 'DRINKS', count: 1 })).not.toBe(describePenalty({ kind: 'DRINKS', count: 2 }));
  });

  it('describes a garment penalty', () => {
    expect(describePenalty({ kind: 'GARMENT' }).length).toBeGreaterThan(0);
  });

  it('refuses NONE: the engine never shows a penalty for it', () => {
    expect(() => describePenalty({ kind: 'NONE' })).toThrow('NONE');
  });
});

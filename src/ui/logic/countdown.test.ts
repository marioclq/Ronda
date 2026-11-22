import { describe, expect, it } from 'vitest';
import { IDLE_CLOCK, pauseClock, remainingSeconds, startClock } from './countdown';

describe('countdown clock', () => {
  it('starts at the full duration and does not move before it starts', () => {
    expect(remainingSeconds(30, IDLE_CLOCK, 50_000)).toBe(30);
    expect(remainingSeconds(30, startClock(IDLE_CLOCK, 1_000), 1_000)).toBe(30);
  });

  it('counts whole elapsed seconds only', () => {
    const running = startClock(IDLE_CLOCK, 0);
    expect(remainingSeconds(30, running, 999)).toBe(30);
    expect(remainingSeconds(30, running, 1_500)).toBe(29);
  });

  it('never goes below zero', () => {
    const running = startClock(IDLE_CLOCK, 0);
    expect(remainingSeconds(30, running, 30_000)).toBe(0);
    expect(remainingSeconds(30, running, 900_000)).toBe(0);
  });

  it('stands still while paused and continues from there when resumed', () => {
    const paused = pauseClock(startClock(IDLE_CLOCK, 0), 4_200);
    expect(remainingSeconds(30, paused, 4_200)).toBe(26);
    expect(remainingSeconds(30, paused, 60_000)).toBe(26);

    const resumed = startClock(paused, 60_000);
    expect(remainingSeconds(30, resumed, 60_000)).toBe(26);
    expect(remainingSeconds(30, resumed, 61_000)).toBe(25);
  });

  it('adds up several pauses', () => {
    let clock = startClock(IDLE_CLOCK, 0);
    clock = pauseClock(clock, 2_000);
    clock = startClock(clock, 10_000);
    clock = pauseClock(clock, 13_000);
    expect(remainingSeconds(30, clock, 99_000)).toBe(25);
  });

  it('refuses to start twice or to pause a stopped clock, with the values', () => {
    expect(() => startClock(startClock(IDLE_CLOCK, 5), 9)).toThrow('5');
    expect(() => pauseClock(IDLE_CLOCK, 9)).toThrow('not running');
  });

  it('refuses a clock that runs backwards, with the values', () => {
    expect(() => remainingSeconds(30, startClock(IDLE_CLOCK, 5_000), 4_000)).toThrow('5000');
  });
});

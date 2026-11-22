/** A countdown that can pause: time already run plus, while running, the moment it last (re)started. */
export interface CountdownClock {
  readonly elapsedMs: number;
  readonly runningSince: number | null;
}

export const IDLE_CLOCK: CountdownClock = { elapsedMs: 0, runningSince: null };

export function startClock(clock: CountdownClock, nowMs: number): CountdownClock {
  if (clock.runningSince !== null) throw new Error(`Countdown is already running since ${clock.runningSince}`);
  return { elapsedMs: clock.elapsedMs, runningSince: nowMs };
}

export function pauseClock(clock: CountdownClock, nowMs: number): CountdownClock {
  if (clock.runningSince === null) throw new Error(`Countdown is not running (elapsed ${clock.elapsedMs} ms)`);
  return { elapsedMs: elapsedMs(clock, nowMs), runningSince: null };
}

export function elapsedMs(clock: CountdownClock, nowMs: number): number {
  if (clock.runningSince === null) return clock.elapsedMs;
  if (nowMs < clock.runningSince) {
    throw new Error(`Countdown clock went backwards: started at ${clock.runningSince}, now ${nowMs}`);
  }
  return clock.elapsedMs + (nowMs - clock.runningSince);
}

export function remainingSeconds(totalSeconds: number, clock: CountdownClock, nowMs: number): number {
  return Math.max(0, totalSeconds - Math.floor(elapsedMs(clock, nowMs) / 1000));
}

import { useEffect, useState } from 'react';
import { IDLE_CLOCK, pauseClock, remainingSeconds, startClock, type CountdownClock } from './countdown';

export function useCountdown(totalSeconds: number) {
  const [clock, setClock] = useState<CountdownClock>(IDLE_CLOCK);
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    const tick = (): void => setRemaining(remainingSeconds(totalSeconds, clock, performance.now()));
    tick();
    if (clock.runningSince === null) return;
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [clock, totalSeconds]);

  const started = clock.runningSince !== null || clock.elapsedMs > 0;
  const finished = started && remaining === 0;
  return {
    remaining,
    running: clock.runningSince !== null && !finished,
    paused: started && clock.runningSince === null && !finished,
    finished,
    start: (): void => setClock((current) => startClock(current, performance.now())),
    pause: (): void => setClock((current) => pauseClock(current, performance.now())),
  };
}

import { useEffect, useId, type CSSProperties } from 'react';
import { es } from '../../i18n/es';
import { useCountdown } from '../logic/useCountdown';
import { Button } from './Button';

/** The last seconds of a dare tick visibly and the ring turns to the accent (motion.css). */
const URGENT_SECONDS = 5;

/** Short dares read as seconds; a minute or more reads as m:ss. */
export function formatSeconds(total: number): string {
  if (total < 60) return String(total);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

export function Countdown({ seconds }: { seconds: number }) {
  const { remaining, running, paused, finished, start, pause } = useCountdown(seconds);
  const state = finished ? 'done' : paused ? 'paused' : running ? (remaining <= URGENT_SECONDS ? 'urgent' : 'running') : 'idle';
  const gradientId = `ring-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    // Support varies by platform (spec open question 4); a missing API simply means no buzz.
    if (finished && 'vibrate' in navigator) navigator.vibrate([200, 100, 200]);
  }, [finished]);

  return (
    <div className="countdown-wrap">
      <div className="countdown" data-state={state} style={{ '--total': `${seconds}s` } as CSSProperties}>
        <svg className="countdown__ring" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" className="countdown__stop-a" />
              <stop offset="1" className="countdown__stop-b" />
            </linearGradient>
          </defs>
          <circle className="countdown__track" cx="60" cy="60" r="54" />
          <circle className="countdown__progress" cx="60" cy="60" r="54" pathLength={1} stroke={`url(#${gradientId})`} />
        </svg>
        <div className="countdown__center">
          <p className="countdown__digits" role="timer" data-testid="timer">
            <span key={remaining} className="countdown__digit">
              {formatSeconds(remaining)}
            </span>
          </p>
          <span className="countdown__unit">{remaining < 60 ? es.play.secondsUnit : es.play.minutesUnit}</span>
        </div>
      </div>
      {finished ? (
        <p className="stage__label timer-done" role="status">
          {es.play.timeUp}
        </p>
      ) : null}
      {state === 'idle' ? (
        <Button className="btn--small" onClick={start} icon="timer" data-testid="timer-start">
          {es.play.startTimer}
        </Button>
      ) : null}
      {state === 'running' || state === 'urgent' ? (
        <Button className="btn--small" onClick={pause} icon="pause" data-testid="timer-pause">
          {es.play.pauseTimer}
        </Button>
      ) : null}
      {state === 'paused' ? (
        <Button className="btn--small" onClick={start} icon="play" data-testid="timer-resume">
          {es.play.resumeTimer}
        </Button>
      ) : null}
    </div>
  );
}

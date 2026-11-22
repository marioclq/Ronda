import type { CSSProperties } from 'react';
import { IOS_MAX, IOS_MIN } from '../../core/date/session';
import { es } from '../../i18n/es';

const OPTIONS = Array.from({ length: IOS_MAX - IOS_MIN + 1 }, (_, i) => IOS_MIN + i);

function gapFor(value: number): number {
  return 34 - ((value - IOS_MIN) * 34) / (IOS_MAX - IOS_MIN);
}

/**
 * Two circles, Self and Other, overlapping more as closeness grows (IOS scale, Aron 1997).
 * With `from`, the circles start where that value put them and move to `value`: the change shown as motion.
 */
export function IosCircles({ value, size = 64, from }: { value: number; size?: number; from?: number }) {
  const gap = gapFor(value);
  // Each circle travels half the difference. CSS px on an SVG shape are viewBox units, so no scaling.
  const shift = from === undefined ? 0 : (gapFor(from) - gap) / 2;
  const style = from === undefined ? undefined : ({ '--ios-shift': `${shift}px` } as CSSProperties);
  return (
    <svg
      className={from === undefined ? 'ios-circles' : 'ios-circles ios-circles--from'}
      width={size}
      height={size * 0.5}
      viewBox="0 0 80 40"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      <circle cx={40 - gap / 2 - 0.5} cy="20" r="15" />
      <circle cx={40 + gap / 2 + 0.5} cy="20" r="15" />
    </svg>
  );
}

export function IosPicker({ value, onChange }: { value: number | null; onChange: (value: number) => void }) {
  return (
    <div className="ios-picker" role="radiogroup">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          aria-label={es.date.iosOption(option)}
          className="ios-option glass"
          onClick={() => onChange(option)}
          data-testid={`ios-option-${option}`}
        >
          <IosCircles value={option} />
          <span className="ios-option__value">{option}</span>
        </button>
      ))}
    </div>
  );
}

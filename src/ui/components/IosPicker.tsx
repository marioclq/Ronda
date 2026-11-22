import { IOS_MAX, IOS_MIN } from '../../core/date/session';
import { es } from '../../i18n/es';

const OPTIONS = Array.from({ length: IOS_MAX - IOS_MIN + 1 }, (_, i) => IOS_MIN + i);

/** Two circles, Self and Other, overlapping more as closeness grows (IOS scale, Aron 1997). */
export function IosCircles({ value, size = 64 }: { value: number; size?: number }) {
  const gap = 34 - ((value - IOS_MIN) * 34) / (IOS_MAX - IOS_MIN);
  return (
    <svg className="ios-circles" width={size} height={size * 0.5} viewBox="0 0 80 40" aria-hidden="true" focusable="false">
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

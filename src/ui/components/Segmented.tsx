import type { Level } from '../../core/content/types';
import { Icon, type IconName } from './Icon';

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: IconName;
  /** Lights the option in that level's own color instead of the current accent. */
  readonly level?: Level;
}

interface SegmentedProps<T extends string> {
  readonly label: string;
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  /** data-testid of each option is `${testIdPrefix}-${value}`. */
  readonly testIdPrefix: string;
  /** Lays more than three options out in rows of three instead of one long track. */
  readonly wrap?: boolean;
}

/** One track, one lit segment (DESIGN.md "Dynamic Mode & Level Selectors"). */
export function Segmented<T extends string>({ label, options, value, onChange, testIdPrefix, wrap = false }: SegmentedProps<T>) {
  return (
    <div className={wrap ? 'segmented segmented--wrap' : 'segmented'} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="segmented__option"
          aria-pressed={option.value === value}
          data-level={option.level}
          onClick={() => onChange(option.value)}
          data-testid={`${testIdPrefix}-${option.value}`}
        >
          {option.icon === undefined ? null : <Icon name={option.icon} size={18} />}
          {option.label}
        </button>
      ))}
    </div>
  );
}

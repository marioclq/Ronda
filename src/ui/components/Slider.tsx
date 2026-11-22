import { useId } from 'react';

interface SliderProps {
  readonly label: string;
  readonly hint: string;
  readonly value: number;
  /** The value as shown next to the label, with its unit. */
  readonly display: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly onChange: (value: number) => void;
  readonly testId: string;
}

/** A labelled range input that shows its current value and a one-line explanation. */
export function Slider({ label, hint, value, display, min, max, step, onChange, testId }: SliderProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="slider">
      <div className="slider__head">
        <label className="slider__label" htmlFor={id}>
          {label}
        </label>
        <output className="slider__value" htmlFor={id}>
          {display}
        </output>
      </div>
      <input
        id={id}
        className="slider__input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={hintId}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
        data-testid={testId}
      />
      <p className="slider__hint" id={hintId}>
        {hint}
      </p>
    </div>
  );
}

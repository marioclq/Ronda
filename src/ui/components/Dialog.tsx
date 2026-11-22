import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { cx } from './cx';

interface DialogProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly testId?: string;
  /** While true, Escape, a tap outside and the close event are ignored (an operation is in flight and must not be abandoned). */
  readonly locked?: boolean;
  /** Where the sheet comes from: the bottom (default) or the top, under a control in the top bar. */
  readonly placement?: 'bottom' | 'top';
  readonly children: ReactNode;
}

/** A tap on the backdrop reaches the <dialog> itself, outside its box; a tap on its own padding is inside. */
function tappedOutside(event: MouseEvent<HTMLDialogElement>): boolean {
  if (event.target !== event.currentTarget) return false;
  const box = event.currentTarget.getBoundingClientRect();
  return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
}

/** Native <dialog>: focus trap and Escape come from the browser; a tap outside closes it too. */
export function Dialog({ title, onClose, testId, locked = false, placement = 'bottom', children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = ref.current;
    if (element === null) throw new Error('Dialog element is missing');
    if (!element.open) element.showModal();
    // React's autoFocus runs before showModal(), when the dialog cannot take focus; so a child marks itself with data-autofocus.
    element.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  const handle = <span className="sheet__handle" aria-hidden="true" />;
  return (
    <dialog
      ref={ref}
      className={cx('sheet glass glass--thick', placement === 'top' && 'sheet--top')}
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (locked) event.preventDefault();
      }}
      onClick={(event) => {
        if (!locked && tappedOutside(event)) event.currentTarget.close();
      }}
      onClose={onClose}
      data-testid={testId}
    >
      {placement === 'bottom' ? handle : null}
      <div className="stack">
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
      {placement === 'top' ? handle : null}
    </dialog>
  );
}

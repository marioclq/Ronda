import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly testId?: string;
  /** While true, Escape and the close event are ignored (an operation is in flight and must not be abandoned). */
  readonly locked?: boolean;
  readonly children: ReactNode;
}

/** Native <dialog>: focus trap and Escape come from the browser. */
export function Dialog({ title, onClose, testId, locked = false, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = ref.current;
    if (element === null) throw new Error('Dialog element is missing');
    if (!element.open) element.showModal();
    // React's autoFocus runs before showModal(), when the dialog cannot take focus; so a child marks itself with data-autofocus.
    element.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  return (
    <dialog
      ref={ref}
      className="sheet glass glass--thick"
      aria-labelledby={titleId}
      onCancel={(event) => {
        if (locked) event.preventDefault();
      }}
      onClose={onClose}
      data-testid={testId}
    >
      <span className="sheet__handle" aria-hidden="true" />
      <div className="stack">
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

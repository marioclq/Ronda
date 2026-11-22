import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

interface SectionProps {
  readonly title: string;
  readonly icon?: IconName;
  /** Right side of the header: a short hint or a small action. */
  readonly aside?: ReactNode;
  /** Plain: the same header and spacing without the glass panel. */
  readonly plain?: boolean;
  readonly children: ReactNode;
}

/** A group of choices with an icon header, on a glass panel unless plain. */
export function Section({ title, icon, aside, plain = false, children }: SectionProps) {
  return (
    <section className={cx('section', plain ? 'section--plain' : 'glass glass--thick')} aria-label={title}>
      <header className="section__head">
        {icon === undefined ? null : <Icon name={icon} />}
        <h2 className="section__title">{title}</h2>
        {aside === undefined ? null : <div className="section__aside">{aside}</div>}
      </header>
      {children}
    </section>
  );
}

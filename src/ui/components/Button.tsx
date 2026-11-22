import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'glass' | 'quiet';

export function Button({
  variant = 'glass',
  icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; icon?: IconName }) {
  return (
    <button type="button" className={cx('btn', `btn--${variant}`, className)} {...rest}>
      {icon === undefined ? null : <Icon name={icon} />}
      {children}
    </button>
  );
}

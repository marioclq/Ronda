import type { ComponentProps } from 'react';
import { cx } from './cx';

export type GlassProps = ComponentProps<'div'> & { thick?: boolean };

export function Glass({ thick = false, className, ...rest }: GlassProps) {
  return <div className={cx('glass', thick && 'glass--thick', className)} {...rest} />;
}

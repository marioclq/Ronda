import type { CSSProperties } from 'react';
import { es } from '../../i18n/es';
import { avatarColor, initialOf } from '../logic/avatar';

/** Initials in a colored circle, drawn locally: no photos, no network. */
export function Avatar({ name, size = 2 }: { name: string; size?: number }) {
  return (
    <span
      className={`avatar avatar--${avatarColor(name)}`}
      style={{ '--avatar-size': `${size}rem` } as CSSProperties}
      aria-hidden="true"
    >
      {initialOf(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 3 }: { names: readonly string[]; max?: number }) {
  return (
    <span className="avatar-stack" aria-hidden="true">
      {names.slice(0, max).map((name) => (
        <Avatar key={name} name={name} size={1.75} />
      ))}
      {max < names.length ? <span className="avatar avatar--more">{es.players.more(names.length - max)}</span> : null}
    </span>
  );
}

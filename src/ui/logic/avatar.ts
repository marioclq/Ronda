/** Number of avatar colors defined in tokens.css (--avatar-1 to --avatar-6). */
export const AVATAR_COLORS = 6;

export function initialOf(name: string): string {
  const first = name.trim().charAt(0);
  if (first === '') throw new Error(`Cannot draw an avatar for an empty name (${JSON.stringify(name)})`);
  return first.toLocaleUpperCase('es');
}

/** A stable color (1..AVATAR_COLORS) per name, so a player keeps their color across screens and nights. */
export function avatarColor(name: string): number {
  let hash = 0;
  for (const char of name.trim().toLocaleLowerCase('es')) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return (hash % AVATAR_COLORS) + 1;
}

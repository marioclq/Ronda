/** Random lowercase-hex id. Uses getRandomValues because randomUUID needs a secure context (the phone plays over plain HTTP). */
export function newId(prefix?: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return prefix === undefined ? hex : `${prefix}-${hex}`;
}

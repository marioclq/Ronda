export const KNOWN_VARIABLES = ['jugador', 'otro', 'compatible'] as const;
export type Variable = (typeof KNOWN_VARIABLES)[number];

const VARIABLE_PATTERN = /\{([^{}]*)\}/g;

/** Every `{name}` occurrence in order, including repeats and unknown names. */
export function extractVariableNames(text: string): string[] {
  return Array.from(text.matchAll(VARIABLE_PATTERN), (match) => match[1] ?? '');
}

export function isKnownVariable(name: string): name is Variable {
  return (KNOWN_VARIABLES as readonly string[]).includes(name);
}

export function replaceVariables(text: string, replacer: (name: string) => string): string {
  return text.replace(VARIABLE_PATTERN, (_match, name: string) => replacer(name));
}

/** True when a brace is left over after removing every well-formed `{name}`. */
export function hasStrayBraces(text: string): boolean {
  const withoutVariables = replaceVariables(text, () => '');
  return withoutVariables.includes('{') || withoutVariables.includes('}');
}

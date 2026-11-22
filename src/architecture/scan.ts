export interface Finding {
  readonly line: number;
  readonly rule: string;
  readonly text: string;
}

/** Replaces comments with spaces (newlines kept) so line numbers survive. Heuristic: strings that contain "//" are not special-cased. */
function stripComments(source: string): string {
  const blank = (match: string): string => match.replace(/[^\n]/g, ' ');
  return source.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:'"`])\/\/.*$/gm, (match, lead: string) => lead + blank(match.slice(lead.length)));
}

function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (source[i] === '\n') line += 1;
  return line;
}

function collect(source: string, rule: string, pattern: RegExp): Finding[] {
  const text = stripComments(source);
  const findings: Finding[] = [];
  for (const match of text.matchAll(pattern)) {
    findings.push({ line: lineOf(text, match.index), rule, text: match[0].trim() });
  }
  return findings;
}

/** Characters allowed in literal text next to an expression: letters, digits, spaces and plain punctuation, on one line. */
const TEXT = String.raw`[\p{L}\p{N} \t,.:;¡!¿?'’…-]`;

/**
 * Finds user-visible literal text in JSX: text nodes, string attributes read by
 * assistive tech, `{'literal'}` expressions, and letters mixed with expressions
 * (`<p>Hola {name}</p>`, `<p>{n} jugadores</p>`). It is a regex heuristic, not a
 * parser: text containing ( ) = is not detected, which keeps `useState<string>(x)`
 * and arrow functions from producing false positives. Punctuation-only text
 * between expressions (`{a}: {b}`) has no letters, so it is accepted.
 */
export function findJsxLiterals(source: string): Finding[] {
  return [
    ...collect(source, 'jsx-text', />([^<>{}=;()]*\p{L}[^<>{}=;()]*)</gu),
    ...collect(source, 'jsx-attribute', /\b(?:aria-label|aria-description|title|placeholder|alt)\s*=\s*"[^"]*\p{L}[^"]*"/gu),
    // text right after a tag end, before an expression: <p>Hola {name}</p>
    ...collect(source, 'jsx-mixed-text', new RegExp(String.raw`(?<![=-])>${TEXT}*\p{L}${TEXT}*\{`, 'gu')),
    // expression, then text on the same line, then a closing tag: <p>{n} jugadores</p>
    // (closing tag only: `}: Props<T>` in a parameter list must not match)
    ...collect(source, 'jsx-mixed-text', new RegExp(String.raw`\}[ \t]*${TEXT}*\p{L}${TEXT}*<\/`, 'gu')),
    // expression, text, expression: <p>{a} de {b}</p>
    ...collect(source, 'jsx-mixed-text', new RegExp(String.raw`(?<![=-])>\{[^{}<>]*\}${TEXT}*\p{L}${TEXT}*\{`, 'gu')),
    ...collect(source, 'jsx-expression', />\s*\{\s*(['"`])[^'"`]*\p{L}[^'"`]*\1\s*\}/gu),
  ];
}

/** Finds literal colors: the only source of color is the token file. */
export function findColorLiterals(source: string): Finding[] {
  return collect(source, 'color', /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lch|lab|color)\(/g);
}

import { describe, expect, it } from 'vitest';
import { findColorLiterals, findJsxLiterals } from './scan';

describe('findJsxLiterals', () => {
  it('flags literal text between tags', () => {
    expect(findJsxLiterals('const a = <p>Hola mundo</p>;')).toHaveLength(1);
  });

  it('flags literal accessible attributes and rendered string expressions', () => {
    expect(findJsxLiterals('<img alt="Logo" />')).toHaveLength(1);
    expect(findJsxLiterals("<b>{'texto'}</b>")).toHaveLength(1);
  });

  it('accepts text that comes from the translation object', () => {
    expect(findJsxLiterals('<p>{es.home.tagline}</p>')).toHaveLength(0);
    expect(findJsxLiterals('<img alt={es.home.tagline} />')).toHaveLength(0);
  });

  it('does not confuse generics, arrows and comparisons with text', () => {
    const source = "const [a, setA] = useState<string>('x');\nconst f = (n: number) => n > 1 ? <b>{a}</b> : null;";
    expect(findJsxLiterals(source)).toHaveLength(0);
  });

  it('flags literal letters next to an expression inside an element', () => {
    expect(findJsxLiterals('<p>Hola {name}</p>')).toHaveLength(1);
    expect(findJsxLiterals('<p>{n} jugadores</p>')).toHaveLength(1);
    expect(findJsxLiterals('<p>{a} de {b}</p>').length).toBeGreaterThan(0);
  });

  it('accepts punctuation-only text between expressions and structural braces', () => {
    expect(findJsxLiterals('<p>{es.play.errorTitle}: {error}</p>')).toHaveLength(0);
    expect(findJsxLiterals('<p>{a}, {b}</p>')).toHaveLength(0);
    expect(findJsxLiterals('if (a) {\n  b();\n} else {\n  c();\n}\nfunction f<T>(x: T) {}')).toHaveLength(0);
  });

  it('ignores comments and reports the right line', () => {
    expect(findJsxLiterals('// <p>Hola</p>\n/* <p>Hola</p> */')).toHaveLength(0);
    expect(findJsxLiterals('const a = 1;\n\nconst b = <p>Hola</p>;')[0]?.line).toBe(3);
  });
});

describe('findColorLiterals', () => {
  it('flags hex and functional colors but not tokens', () => {
    expect(findColorLiterals("style={{ color: '#fff' }}")).toHaveLength(1);
    expect(findColorLiterals("style={{ color: 'oklch(0.5 0.1 20)' }}")).toHaveLength(1);
    expect(findColorLiterals("style={{ color: 'var(--text)' }}")).toHaveLength(0);
  });
});

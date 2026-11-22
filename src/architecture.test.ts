import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { es } from './i18n/es';
import { findColorLiterals, findJsxLiterals } from './architecture/scan';

const SRC = fileURLToPath(new URL('.', import.meta.url));

function listFiles(dir: string, extension: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, extension);
    return extension.test(entry.name) ? [full] : [];
  });
}

const IMPORT_PATTERN = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

describe('architecture', () => {
  it('keeps src/core free of imports from other layers and packages', () => {
    const coreDir = join(SRC, 'core') + sep;
    const offenders: string[] = [];
    for (const file of listFiles(join(SRC, 'core'), /\.ts$/)) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(IMPORT_PATTERN)) {
        const specifier = match[1] ?? match[2];
        if (specifier === undefined) continue;
        if (specifier.startsWith('.')) {
          if (!(resolve(dirname(file), specifier) + sep).startsWith(coreDir)) offenders.push(`${file}: ${specifier}`);
        } else if (specifier !== 'vitest' && !specifier.startsWith('vitest/')) {
          offenders.push(`${file}: ${specifier}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('has no literal user-visible text in JSX (all text comes from i18n/es.ts)', () => {
    const offenders = listFiles(SRC, /\.tsx$/).flatMap((file) =>
      findJsxLiterals(readFileSync(file, 'utf8')).map((f) => `${file}:${f.line} [${f.rule}] ${f.text}`),
    );
    expect(offenders).toEqual([]);
  });

  it('has no literal colors in .tsx files (colors come from tokens.css)', () => {
    const offenders = listFiles(SRC, /\.tsx$/).flatMap((file) =>
      findColorLiterals(readFileSync(file, 'utf8')).map((f) => `${file}:${f.line} ${f.text}`),
    );
    expect(offenders).toEqual([]);
  });

  it('has no empty strings in the translation file', () => {
    const empty: string[] = [];
    const walk = (value: unknown, path: string): void => {
      if (typeof value === 'string') {
        if (value.trim().length === 0) empty.push(path);
      } else if (typeof value === 'object' && value !== null) {
        for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`);
      }
    };
    walk(es, 'es');
    expect(empty).toEqual([]);
  });
});

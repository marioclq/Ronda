# Plan 3: pipeline de contenido y primeras cartas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** las herramientas para producir, revisar y publicar cartas por lotes (sección 5 de la spec), la poda del historial que el plan 2 difirió, y el primer lote de cada combinación listo para que el usuario lo revise.

**Architecture:** la lógica del pipeline es TypeScript puro en `src/content/` con tests en Vitest. Los comandos (`content:check`, `content:sample`, `content:promote`, `content:similar`) son scripts en `scripts/*.ts` que se ejecutan con `tsx` y reutilizan el validador del núcleo. Los packs siguen una convención fija de archivo e id, y esa convención permite podar el historial sin cargar el nivel extremo.

**Tech Stack:** lo del plan 2 más `tsx` 4.23.15 (consultado con `npm view` el 2026-11-12; `engines.node >=18`).

**Spec:** [`docs/superpowers/specs/2026-11-12-party-questions-pwa-design.md`](../specs/2026-11-12-party-questions-pwa-design.md), sección 5 (pipeline y metas). Planes anteriores: 1 y 2, ejecutados.

## Decisiones

1. **`tsx` para los scripts.** Node 24 quita tipos, pero exige extensiones `.ts` en las importaciones relativas y el núcleo importa sin extensión. `tsx` las resuelve sin tocar el núcleo.
2. **Sin dataset semilla en el hito 1.** La spec lo menciona como acelerador (~1 200 frases MIT en inglés). Traducirlas también lo haría Claude, así que no ahorra trabajo y obliga a descargar y atribuir. Las cartas se generan desde la guía. Si más adelante se usa, se agrega la atribución (M5 del plan 2).
3. **Convención de packs:** un archivo por tipo y nivel (`truth.soft.json`, …, `extreme/truth.extreme.json`) e ids `<tipo>-<nivel>-<nnnn>` (`tod-t-soft-0001`, como el ejemplo de la spec). El nivel va en el id, así que la poda del historial sabe qué ids son del extremo sin cargarlos.
4. **Meta del extremo en el hito 1: 50 cartas por tipo.** La spec deja el extremo "aparte" sin cifra.
5. **Lotes:** el primer lote de cada combinación tiene 100 cartas en suave y picante y 50 en extremo. El segundo lote de suave y picante (50 cartas, hasta llegar a 150) se genera después de la revisión del primero, con la guía ajustada, como manda la spec.
6. **El mínimo por combinación (M7) sube por hitos.** Hoy es 1 (lo que hay publicado). Al promover el segundo lote pasa a 150 en suave y picante y a 50 en extremo.
7. **Las cartas de arranque del plan 2 se migran a la convención,** no se borran: son cartas válidas.
8. **Umbral de casi duplicados:** se calibra con los lotes reales usando `content:similar` antes de promover.

## Global Constraints

- Las de los planes 1 y 2 siguen vigentes: dependencias exactas, código en inglés, textos de interfaz en `es.ts`, sin red en tiempo de ejecución, fallos explícitos con datos, tests de reglas y no de mecánica.
- **Git:** sin commits ni `git add` sin pedido explícito.
- Los textos de las cartas van en español neutro.
- Shell: PowerShell 7 o Bash; usar la herramienta Write para archivos largos (los heredocs de Bash fallan con comillas).

---

### Task 1: convención de packs y migración de las cartas de arranque

**Files:**
- Create: `src/content/conventions.ts`, `src/content/conventions.test.ts`
- Create: 15 packs con la convención (`content/packs/<tipo>.<nivel>.json` y `content/packs/extreme/<tipo>.extreme.json`); Delete: `content/packs/starter.soft.json`, `content/packs/starter.spicy.json`, `content/packs/extreme/starter.extreme.json`
- Modify: `src/content/loadCards.ts` (aplica la convención al cargar), `src/content/loadCards.test.ts`

**Interfaces:**
- Produces: `TYPE_ID_SLUG`, `TYPE_FILE_SLUG`, `LEVEL_SLUG`, `packFileFor(type, level)`, `packIdFor(type, level)`, `cardIdFor(type, level, n)`, `parseCardId(id)`, `isExtremeCardId(id)`, `checkPackConventions(pack, relativePath): string[]`.

- [ ] **Step 1: test (falla primero)**

`src/content/conventions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Pack } from '../core/content/types';
import { cardIdFor, checkPackConventions, isExtremeCardId, packFileFor, packIdFor, parseCardId } from './conventions';

describe('ids and files', () => {
  it('builds ids with type, level and a four-digit number', () => {
    expect(cardIdFor('TRUTH', 'SOFT', 1)).toBe('tod-t-soft-0001');
    expect(cardIdFor('MOST_LIKELY', 'EXTREME', 42)).toBe('likely-extreme-0042');
  });

  it('refuses numbers outside 1..9999', () => {
    expect(() => cardIdFor('DARE', 'SOFT', 0)).toThrow('0');
    expect(() => cardIdFor('DARE', 'SOFT', 10_000)).toThrow('10000');
  });

  it('parses its own ids back and rejects anything else', () => {
    expect(parseCardId('tod-d-spicy-0150')).toEqual({ type: 'DARE', level: 'SPICY', n: 150 });
    expect(parseCardId('custom-abc')).toBeNull();
    expect(parseCardId('tod-t-soft-1')).toBeNull();
  });

  it('knows extreme ids without loading them', () => {
    expect(isExtremeCardId('never-extreme-0003')).toBe(true);
    expect(isExtremeCardId('never-spicy-0003')).toBe(false);
    expect(isExtremeCardId('custom-x')).toBe(false);
  });

  it('places extreme packs in their own folder', () => {
    expect(packFileFor('RATHER', 'SOFT')).toBe('rather.soft.json');
    expect(packFileFor('MOST_LIKELY', 'EXTREME')).toBe('extreme/most-likely.extreme.json');
    expect(packIdFor('MOST_LIKELY', 'SPICY')).toBe('most-likely-spicy');
  });
});

describe('checkPackConventions', () => {
  const pack = (cards: Pack['cards'], id = 'truth-soft'): Pack => ({ id, version: 1, lang: 'es', cards });
  const truth = { type: 'TRUTH', level: 'SOFT', text: '¿Hola?', tags: [] } as const;

  it('accepts a pack whose file, id and cards agree', () => {
    expect(checkPackConventions(pack([{ ...truth, id: 'tod-t-soft-0001' }]), 'truth.soft.json')).toEqual([]);
  });

  it('reports a card of another type or level, a bad id, a wrong pack id and an unknown file', () => {
    const problems = checkPackConventions(
      pack([{ ...truth, id: 'tod-t-soft-0001', level: 'SPICY' }, { ...truth, id: 'whatever' }], 'truth-x'),
      'truth.soft.json',
    );
    expect(problems.join('\n')).toContain('SPICY');
    expect(problems.join('\n')).toContain('whatever');
    expect(problems.join('\n')).toContain('truth-x');
    expect(checkPackConventions(pack([]), 'misc.json')[0]).toContain('misc.json');
  });
});
```

- [ ] **Step 2: implementar `src/content/conventions.ts`**

```ts
import { CARD_TYPES, LEVELS, type CardType, type Level, type Pack } from '../core/content/types';

export const TYPE_ID_SLUG: Readonly<Record<CardType, string>> = {
  TRUTH: 'tod-t',
  DARE: 'tod-d',
  NEVER: 'never',
  RATHER: 'rather',
  MOST_LIKELY: 'likely',
};

export const TYPE_FILE_SLUG: Readonly<Record<CardType, string>> = {
  TRUTH: 'truth',
  DARE: 'dare',
  NEVER: 'never',
  RATHER: 'rather',
  MOST_LIKELY: 'most-likely',
};

export const LEVEL_SLUG: Readonly<Record<Level, string>> = { SOFT: 'soft', SPICY: 'spicy', EXTREME: 'extreme' };

/** Path relative to content/packs. Extreme packs live in their own folder (separate chunk). */
export function packFileFor(type: CardType, level: Level): string {
  const name = `${TYPE_FILE_SLUG[type]}.${LEVEL_SLUG[level]}.json`;
  return level === 'EXTREME' ? `extreme/${name}` : name;
}

export function packIdFor(type: CardType, level: Level): string {
  return `${TYPE_FILE_SLUG[type]}-${LEVEL_SLUG[level]}`;
}

export function cardIdFor(type: CardType, level: Level, n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 9999) throw new Error(`Card number must be an integer from 1 to 9999, got ${n}`);
  return `${TYPE_ID_SLUG[type]}-${LEVEL_SLUG[level]}-${String(n).padStart(4, '0')}`;
}

const ID_PATTERN = /^(tod-t|tod-d|never|rather|likely)-(soft|spicy|extreme)-(\d{4})$/;

export interface ParsedCardId {
  readonly type: CardType;
  readonly level: Level;
  readonly n: number;
}

export function parseCardId(id: string): ParsedCardId | null {
  const match = ID_PATTERN.exec(id);
  if (match === null) return null;
  const type = CARD_TYPES.find((t) => TYPE_ID_SLUG[t] === match[1]);
  const level = LEVELS.find((l) => LEVEL_SLUG[l] === match[2]);
  if (type === undefined || level === undefined) return null;
  return { type, level, n: Number(match[3]) };
}

export function isExtremeCardId(id: string): boolean {
  return parseCardId(id)?.level === 'EXTREME';
}

/** Problems with a published pack: its file must name one type and level, and every card must match it. */
export function checkPackConventions(pack: Pack, relativePath: string): string[] {
  const path = relativePath.replace(/\\/g, '/');
  const combination = CARD_TYPES.flatMap((type) => LEVELS.map((level) => ({ type, level }))).find(
    ({ type, level }) => packFileFor(type, level) === path,
  );
  if (combination === undefined) return [`${path}: not a known pack file (expected <type>.<level>.json)`];
  const problems: string[] = [];
  const expectedId = packIdFor(combination.type, combination.level);
  if (pack.id !== expectedId) problems.push(`${path}: pack id must be "${expectedId}", got "${pack.id}"`);
  for (const card of pack.cards) {
    if (card.type !== combination.type || card.level !== combination.level) {
      problems.push(`${path} [${card.id}]: card is ${card.type}/${card.level}, file is ${combination.type}/${combination.level}`);
    }
    const parsed = parseCardId(card.id);
    if (parsed === null || parsed.type !== card.type || parsed.level !== card.level) {
      problems.push(`${path} [${card.id}]: id must look like ${cardIdFor(combination.type, combination.level, 1)}`);
    }
  }
  return problems;
}
```

Run: `npx vitest run src/content/conventions.test.ts` → PASS.

- [ ] **Step 3: migrar las cartas de arranque**

Con un script desechable (no se guarda en el repo), mover cada carta de `starter.soft.json`, `starter.spicy.json` y `extreme/starter.extreme.json` al pack de su tipo y nivel (`packFileFor`), con `id = cardIdFor(type, level, n)` numerado en el orden original dentro de cada combinación, `id` del pack `packIdFor(type, level)`, `version: 1`, `lang: "es"`. Conservar `text`, `tags` y `timerSeconds`. Borrar los tres archivos `starter.*`. Resultado: 15 archivos.

- [ ] **Step 4: aplicar la convención al cargar**

En `src/content/loadCards.ts`, dentro de `parseEntries`, después de `parsePack(raw, path)`, calcular la ruta relativa (`path.slice(path.indexOf('content/packs/') + 'content/packs/'.length)`), llamar `checkPackConventions(pack, relative)` y, si hay problemas, lanzar `new Error(problems.join('\n'))`.

En `src/content/loadCards.test.ts`, agregar:

```ts
  it('loads only conventional ids, so history pruning can rely on them', () => {
    expect(loadBaseCards().every((card) => parseCardId(card.id) !== null)).toBe(true);
  });
```
(importar `parseCardId` de `./conventions`).

- [ ] **Step 5: verificar**

Run: `npm test`, `npm run typecheck`, `npm run e2e`. Expected: todo en verde (los E2E no dependen de ids concretos). Pegar la salida real.

---

### Task 2: reglas del corpus y `content:check`

**Files:**
- Create: `content/banned-soft.json`, `src/content/milestones.ts`, `src/content/milestones.test.ts`
- Create: `scripts/content-check.ts`
- Modify: `src/content/loadCards.ts` (usa la lista de palabras prohibidas), `src/content/loadCards.test.ts` (mínimos), `package.json` (`tsx`, scripts), `tsconfig.app.json` (incluye `scripts/**/*.ts`)

**Interfaces:**
- Produces: `MIN_CARDS_PER_COMBINATION`, `MIN_EXTREME_CARDS_PER_TYPE`, `checkMinimums(cards, minPerCombination, minExtremePerType): string[]`, `BANNED_SOFT_WORDS: readonly string[]`, `npm run content:check`.

- [ ] **Step 1: instalar `tsx`**

`npm install --save-dev --save-exact tsx@4.23.15`. Si hay errores de peer dependencies, parar y reportarlo.

- [ ] **Step 2: palabras prohibidas en suave**

`content/banned-soft.json` (palabras o frases enteras; el validador normaliza tildes y mayúsculas):

```json
{
  "words": [
    "sexo", "sexual", "sexuales", "coger", "follar", "cogerte", "desnudo", "desnuda", "desnudos", "desnudarte",
    "orgasmo", "excitar", "excitado", "excitada", "cachondo", "cachonda", "caliente", "lencería", "condón",
    "preservativo", "porno", "pornografía", "erótico", "erótica", "tetas", "pene", "vagina", "trasero", "nalgas",
    "chupar", "lamer", "cama", "acostarte", "acostado", "amante", "infiel", "infidelidad", "trío", "fetiche",
    "droga", "drogas", "marihuana", "porro", "cocaína", "borracho", "borracha", "emborracharte", "vodka", "tequila",
    "cerveza", "alcohol", "shot", "trago", "tragos"
  ]
}
```

Nota: "trago" y "alcohol" están prohibidos en todas las cartas suaves porque la guía dice que el alcohol solo aparece como castigo.

- [ ] **Step 3: mínimos por hito (test primero)**

`src/content/milestones.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { deck } from '../core/testing/fixtures';
import { checkMinimums } from './milestones';

describe('checkMinimums', () => {
  const full = (n: number) => [
    ...(['TRUTH', 'DARE', 'NEVER', 'RATHER', 'MOST_LIKELY'] as const).flatMap((type) => [
      ...deck(`${type}-s`, type, 'SOFT', n),
      ...deck(`${type}-p`, type, 'SPICY', n),
      ...deck(`${type}-e`, type, 'EXTREME', n),
    ]),
  ];

  it('passes when every combination reaches its minimum', () => {
    expect(checkMinimums(full(3), 3, 3)).toEqual([]);
  });

  it('names each soft or spicy combination below the minimum, with its count', () => {
    const problems = checkMinimums(full(2), 3, 1);
    expect(problems).toHaveLength(10);
    expect(problems[0]).toContain('2');
  });

  it('checks the extreme level against its own minimum', () => {
    expect(checkMinimums(full(3), 3, 4)).toHaveLength(5);
  });
});
```

`src/content/milestones.ts`:

```ts
import { CARD_TYPES, type Card } from '../core/content/types';
import { countByCombination } from '../core/content/corpus';

/** Raised with each milestone (spec section 5). Milestone 1: 150 and 50. */
export const MIN_CARDS_PER_COMBINATION = 1;
export const MIN_EXTREME_CARDS_PER_TYPE = 1;

export function checkMinimums(cards: readonly Card[], minPerCombination: number, minExtremePerType: number): string[] {
  const counts = countByCombination(cards);
  const problems: string[] = [];
  for (const level of ['SOFT', 'SPICY', 'EXTREME'] as const) {
    const minimum = level === 'EXTREME' ? minExtremePerType : minPerCombination;
    for (const type of CARD_TYPES) {
      const count = counts.get(`${type}/${level}`) ?? 0;
      if (count < minimum) problems.push(`${type}/${level} has ${count} cards, the minimum is ${minimum}`);
    }
  }
  return problems;
}
```

- [ ] **Step 4: usar la lista en la carga y exigir los mínimos en los tests**

En `src/content/loadCards.ts`: importar `banned from '../../content/banned-soft.json'`, validar que sea `{ words: string[] }` (si no, lanzar con el valor recibido) y exportar `BANNED_SOFT_WORDS`. Cambiar `CORPUS_RULES` a `{ bannedSoftWords: BANNED_SOFT_WORDS, nearDuplicateThreshold: DEFAULT_NEAR_DUPLICATE_THRESHOLD }`.

En `src/content/loadCards.test.ts` agregar:

```ts
  it('meets the current milestone minimums', async () => {
    const cards = [...loadBaseCards(), ...(await loadExtremeCards())];
    expect(checkMinimums(cards, MIN_CARDS_PER_COMBINATION, MIN_EXTREME_CARDS_PER_TYPE)).toEqual([]);
  });
```

- [ ] **Step 5: comando `content:check`**

`scripts/content-check.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { checkCorpus, DEFAULT_NEAR_DUPLICATE_THRESHOLD, countByCombination } from '../src/core/content/corpus';
import type { Pack } from '../src/core/content/types';
import { ContentError, formatIssue, parsePack } from '../src/core/content/validator';
import { checkPackConventions } from '../src/content/conventions';
import { checkMinimums, MIN_CARDS_PER_COMBINATION, MIN_EXTREME_CARDS_PER_TYPE } from '../src/content/milestones';

const PACKS = 'content/packs';
const DRAFTS = 'content/drafts';

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return jsonFiles(full);
    return entry.name.endsWith('.json') ? [full] : [];
  });
}

const problems: string[] = [];

function load(file: string): Pack | null {
  try {
    return parsePack(JSON.parse(readFileSync(file, 'utf8')), file);
  } catch (error) {
    if (error instanceof ContentError) {
      problems.push(...error.issues.map(formatIssue));
      return null;
    }
    throw new Error(`Cannot read ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const packs = jsonFiles(PACKS).flatMap((file) => {
  const pack = load(file);
  if (pack === null) return [];
  problems.push(...checkPackConventions(pack, relative(PACKS, file)));
  return [pack];
});
const drafts = jsonFiles(DRAFTS).flatMap((file) => {
  const pack = load(file);
  return pack === null ? [] : [pack];
});

const banned = JSON.parse(readFileSync('content/banned-soft.json', 'utf8')) as { words: string[] };
const threshold = Number(process.env.NEAR_DUPLICATE_THRESHOLD ?? DEFAULT_NEAR_DUPLICATE_THRESHOLD);
problems.push(
  ...checkCorpus([...packs, ...drafts], { bannedSoftWords: banned.words, nearDuplicateThreshold: threshold }).map(formatIssue),
);
const published = packs.flatMap((pack) => [...pack.cards]);
problems.push(...checkMinimums(published, MIN_CARDS_PER_COMBINATION, MIN_EXTREME_CARDS_PER_TYPE));

const counts = [...countByCombination(published)].map(([key, count]) => `${key}: ${count}`).join(', ');
console.log(`Published: ${published.length} cards (${counts}). Drafts: ${drafts.map((d) => `${d.id} (${d.cards.length})`).join(', ') || 'none'}.`);
if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('Content OK.');
```

En `package.json` agregar los scripts `"content:check": "tsx scripts/content-check.ts"`. En `tsconfig.app.json`, agregar `"scripts"` a `include`.

- [ ] **Step 6: verificar**

Run: `npm run content:check`, `npm test`, `npm run typecheck`. Expected: `Content OK.` con 30 cartas publicadas; todo en verde. Pegar la salida real.

---

### Task 3: lotes, muestras y promoción

**Files:**
- Create: `src/content/pipeline.ts`, `src/content/pipeline.test.ts`
- Create: `scripts/content-sample.ts`, `scripts/content-promote.ts`, `scripts/content-similar.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `createSeededRng`, `shuffle`, `cardIdFor`, `packIdFor`, `parseCardId`, `shingles`, `jaccard`.
- Produces: `SAMPLE_SIZE = 20`, `MAX_REJECTED = 2`, `seedFrom(text): number`, `sampleIndexes(total, size, seed): number[]`, `reviewMarkdown(draft, indexes): string`, `promoteDraft(draft, existing, rejectedIds): Pack`, `draftCombination(draft): { type; level }`.

Formato de un lote (`content/drafts/<pack-id>-b<nnn>.json`): un pack con `id` `draft-<pack-id>-b<nnn>` (ej. `draft-truth-soft-b001`), todas las cartas del mismo tipo y nivel, ids `draft-<pack-id>-b<nnn>-<nnn>`.

- [ ] **Step 1: test (falla primero)**

`src/content/pipeline.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Card, Pack } from '../core/content/types';
import { draftCombination, MAX_REJECTED, promoteDraft, reviewMarkdown, sampleIndexes, seedFrom } from './pipeline';

const draftCard = (n: number): Card => ({
  id: `draft-truth-soft-b001-${String(n).padStart(3, '0')}`,
  type: 'TRUTH',
  level: 'SOFT',
  text: `¿Pregunta ${n}?`,
  tags: [],
});
const draft: Pack = { id: 'draft-truth-soft-b001', version: 1, lang: 'es', cards: Array.from({ length: 30 }, (_, i) => draftCard(i + 1)) };

describe('sampleIndexes', () => {
  it('is deterministic for a seed, sorted, unique and in range', () => {
    const a = sampleIndexes(100, 20, seedFrom('draft-truth-soft-b001'));
    expect(a).toEqual(sampleIndexes(100, 20, seedFrom('draft-truth-soft-b001')));
    expect(new Set(a).size).toBe(20);
    expect([...a].sort((x, y) => x - y)).toEqual(a);
    expect(a.every((i) => i >= 0 && i < 100)).toBe(true);
  });

  it('takes everything when the batch is smaller than the sample', () => {
    expect(sampleIndexes(5, 20, 1)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('reviewMarkdown', () => {
  it('numbers the sampled cards from 1 and shows their text', () => {
    const md = reviewMarkdown(draft, [0, 4]);
    expect(md).toContain('1. ¿Pregunta 1?');
    expect(md).toContain('2. ¿Pregunta 5?');
  });
});

describe('promoteDraft', () => {
  it('assigns consecutive final ids after the existing ones and drops rejected cards', () => {
    const existing: Pack = {
      id: 'truth-soft',
      version: 3,
      lang: 'es',
      cards: [{ id: 'tod-t-soft-0007', type: 'TRUTH', level: 'SOFT', text: 'x', tags: [] }],
    };
    const promoted = promoteDraft(draft, existing, [draft.cards[1]?.id ?? '']);
    expect(promoted.version).toBe(4);
    expect(promoted.cards).toHaveLength(30);
    expect(promoted.cards[1]?.id).toBe('tod-t-soft-0008');
    expect(promoted.cards.some((c) => c.text === '¿Pregunta 2?')).toBe(false);
  });

  it('creates the pack when none exists', () => {
    const promoted = promoteDraft(draft, null, []);
    expect(promoted.id).toBe('truth-soft');
    expect(promoted.cards[0]?.id).toBe('tod-t-soft-0001');
  });

  it('refuses a batch with too many rejections: the spec discards it', () => {
    const ids = draft.cards.slice(0, MAX_REJECTED + 1).map((c) => c.id);
    expect(() => promoteDraft(draft, null, ids)).toThrow('discard');
  });

  it('refuses rejected ids that are not in the batch and mixed batches', () => {
    expect(() => promoteDraft(draft, null, ['nope'])).toThrow('nope');
    const mixed: Pack = { ...draft, cards: [draftCard(1), { ...draftCard(2), level: 'SPICY' }] };
    expect(() => draftCombination(mixed)).toThrow('SPICY');
  });
});
```

- [ ] **Step 2: implementar `src/content/pipeline.ts`**

```ts
import type { Card, CardType, Level, Pack } from '../core/content/types';
import { createSeededRng, shuffle } from '../core/game/rng';
import { cardIdFor, packIdFor, parseCardId } from './conventions';

export const SAMPLE_SIZE = 20;
/** Spec section 5: up to 2 rejected cards, the batch is promoted without them; more, it is discarded. */
export const MAX_REJECTED = 2;

export function seedFrom(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function sampleIndexes(total: number, size: number, seed: number): number[] {
  const all = Array.from({ length: total }, (_, i) => i);
  if (total <= size) return all;
  return shuffle(all, createSeededRng(seed))
    .slice(0, size)
    .sort((a, b) => a - b);
}

export function draftCombination(draft: Pack): { type: CardType; level: Level } {
  const first = draft.cards[0];
  if (first === undefined) throw new Error(`Batch ${draft.id} has no cards`);
  const odd = draft.cards.filter((c) => c.type !== first.type || c.level !== first.level);
  if (odd.length > 0) {
    throw new Error(`Batch ${draft.id} mixes combinations: ${odd.map((c) => `${c.id} ${c.type}/${c.level}`).join(', ')}`);
  }
  return { type: first.type, level: first.level };
}

export function reviewMarkdown(draft: Pack, indexes: readonly number[]): string {
  const { type, level } = draftCombination(draft);
  const lines = indexes.map((index, position) => {
    const card = draft.cards[index];
    if (card === undefined) throw new Error(`Index ${index} is outside batch ${draft.id} (${draft.cards.length} cards)`);
    const extras = [card.timerSeconds === undefined ? '' : `${card.timerSeconds} s`, card.tags.join(', ')].filter(Boolean);
    return `${position + 1}. ${card.text}${extras.length > 0 ? `  _(${extras.join(' · ')})_` : ''}`;
  });
  return [
    `# Muestra del lote ${draft.id}`,
    '',
    `${type} / ${level}: ${indexes.length} de ${draft.cards.length} cartas, elegidas al azar.`,
    'Responde con los números que rechazas y el motivo. Hasta 2 rechazos: se quitan y el lote se publica. Más: el lote se descarta.',
    '',
    ...lines,
    '',
  ].join('\n');
}

export function promoteDraft(draft: Pack, existing: Pack | null, rejectedIds: readonly string[]): Pack {
  const { type, level } = draftCombination(draft);
  const unknown = rejectedIds.filter((id) => !draft.cards.some((c) => c.id === id));
  if (unknown.length > 0) throw new Error(`Rejected ids are not in batch ${draft.id}: ${unknown.join(', ')}`);
  if (rejectedIds.length > MAX_REJECTED) {
    throw new Error(`Batch ${draft.id} has ${rejectedIds.length} rejections (max ${MAX_REJECTED}): discard it and adjust the guidelines`);
  }
  const base: Pack = existing ?? { id: packIdFor(type, level), version: 0, lang: 'es', cards: [] };
  let next = Math.max(0, ...base.cards.map((c) => parseCardId(c.id)?.n ?? 0)) + 1;
  const promoted: Card[] = draft.cards
    .filter((card) => !rejectedIds.includes(card.id))
    .map((card) => ({ ...card, id: cardIdFor(type, level, next++) }));
  return { ...base, version: base.version + 1, cards: [...base.cards, ...promoted] };
}
```

Run → PASS.

- [ ] **Step 3: comandos**

`scripts/content-sample.ts` (uso: `npm run content:sample -- content/drafts/<lote>.json`): lee el lote con `parsePack`, calcula `sampleIndexes(cards.length, SAMPLE_SIZE, seedFrom(draft.id))` y escribe `content/review/<draft.id>.md` con `reviewMarkdown`. Imprime la ruta escrita.

`scripts/content-promote.ts` (uso: `npm run content:promote -- content/drafts/<lote>.json --reject 3,7`): recalcula la misma muestra, traduce los números de la muestra a ids, lee el pack existente en `content/packs/<packFileFor(type, level)>` si existe (con `parsePack`), llama `promoteDraft`, escribe el pack con `JSON.stringify(pack, null, 2) + '\n'`, borra el archivo del lote e imprime cuántas cartas se agregaron y el rango de ids. Un número fuera de 1..muestra es un error con el número.

`scripts/content-similar.ts` (uso: `npm run content:similar -- 30`): lee packs y lotes, y por cada tipo imprime los N pares más parecidos con su similitud (`jaccard` de `shingles`), para calibrar el umbral.

Los tres usan el mismo `jsonFiles`/lectura que `content-check.ts` (extraer a `scripts/lib.ts` y reutilizar en los cuatro). Agregar a `package.json`: `content:sample`, `content:promote`, `content:similar` con `tsx scripts/<nombre>.ts`.

- [ ] **Step 4: verificar con un lote de prueba**

Crear `content/drafts/draft-never-soft-b999.json` con 3 cartas válidas de prueba, correr `content:sample` (debe escribir `content/review/draft-never-soft-b999.md` con 3 cartas) y `content:promote -- … --reject 1`. Comprobar que `never.soft.json` ganó 2 cartas con ids consecutivos y que el lote se borró. **Después restaurar `never.soft.json` a su contenido anterior y borrar `content/review/draft-never-soft-b999.md`.** Correr `npm test`, `npm run typecheck`, `npm run content:check`. Pegar la salida real.

---

### Task 4: poda del historial

**Files:**
- Create: `src/content/pruneHistory.ts`, `src/content/pruneHistory.test.ts`
- Modify: `src/app/CardsContext.tsx`

**Interfaces:**
- Produces: `pruneHistory(history, knownIds: ReadonlySet<string>, extremeLoaded: boolean): Readonly<Record<string, number>>` (devuelve el mismo objeto si no quita nada).

- [ ] **Step 1: test (falla primero)**

```ts
import { describe, expect, it } from 'vitest';
import { pruneHistory } from './pruneHistory';

const history = { 'tod-t-soft-0001': 1, 'tod-t-soft-0099': 2, 'never-extreme-0001': 3, 'custom-gone': 4 };

describe('pruneHistory', () => {
  it('drops cards that no longer exist but keeps extreme ids until the extreme packs are loaded', () => {
    expect(pruneHistory(history, new Set(['tod-t-soft-0001']), false)).toEqual({
      'tod-t-soft-0001': 1,
      'never-extreme-0001': 3,
    });
  });

  it('drops unknown extreme ids once the extreme packs are loaded', () => {
    expect(pruneHistory(history, new Set(['tod-t-soft-0001']), true)).toEqual({ 'tod-t-soft-0001': 1 });
  });

  it('returns the same object when nothing is removed', () => {
    const kept = { 'tod-t-soft-0001': 1 };
    expect(pruneHistory(kept, new Set(['tod-t-soft-0001']), true)).toBe(kept);
  });
});
```

- [ ] **Step 2: implementar**

```ts
import { isExtremeCardId } from './conventions';

/** Spec section 3: history entries of cards that no longer exist are pruned on load. */
export function pruneHistory(
  history: Readonly<Record<string, number>>,
  knownIds: ReadonlySet<string>,
  extremeLoaded: boolean,
): Readonly<Record<string, number>> {
  const entries = Object.entries(history);
  const kept = entries.filter(([id]) => knownIds.has(id) || (!extremeLoaded && isExtremeCardId(id)));
  return kept.length === entries.length ? history : Object.fromEntries(kept);
}
```

- [ ] **Step 3: conectarlo**

En `src/app/CardsContext.tsx`, tomar `update` de `useUserState()` y agregar un efecto que corre al montar y cada vez que cambia `extreme`:

```tsx
  useEffect(() => {
    const known = new Set(getCards().map((card) => card.id));
    const loaded = extremeRef.current !== null;
    update((current) => {
      const pruned = pruneHistory(current.history, known, loaded);
      return pruned === current.history ? current : { ...current, history: pruned };
    });
  }, [extreme, getCards, update]);
```

Para no guardar sin cambios, `UserStateContext.update` debe omitir `setLoaded` y `store.save` cuando `change` devuelve el mismo objeto: agregar `if (next === latest.current) return;` justo después de calcular `next`.

- [ ] **Step 4: verificar**

Run: `npm test`, `npm run typecheck`, `npm run e2e`. Pegar la salida real.

---

### Task 5: guía de contenido

**Files:**
- Create: `content/GUIDELINES.md` (texto exacto abajo)

- [ ] **Step 1: escribir la guía**

````markdown
# Guía de contenido

Juego para adultos que se conocen, pasando un teléfono. Cada carta se lee en voz alta. Español neutro: sin modismos de un país, "tú" (no "vos" ni "usted"), "celular" en lugar de "móvil".

## Reglas duras (todas las cartas)

- Nada peligroso, ilegal ni humillante. Nada que involucre a menores, manejar, armas, autolesión ni salir de la casa.
- El alcohol solo aparece como castigo (lo pone la app). Ninguna carta menciona beber, tragos ni marcas de bebida. Nada de drogas.
- Nada que se burle del cuerpo, peso, raza, religión, orientación ni discapacidad de nadie.
- Nada que pida datos reales sensibles: contraseñas, direcciones, dinero, documentos.
- Los retos se hacen en la sala, en menos de dos minutos, sin romper nada y sin gastar dinero. El celular de cada quien se usa solo si el reto lo dice y sin publicar nada.
- Todo contacto físico con otra persona usa `{compatible}` y lleva la etiqueta `contacto`. Coquetear con alguien también usa `{compatible}`.
- Nada no consentido. Ningún reto obliga a desnudarse (quitarse una prenda es un castigo que pone la app).

## Variables

- `{jugador}`: quien tiene el turno. Úsala poco: la carta ya se le lee a esa persona.
- `{otro}`: otro jugador cualquiera. Para imitar, preguntar, elegir o hacer algo junto a alguien sin carga romántica.
- `{compatible}`: alguien que se siente atraído mutuamente. Solo para coqueteo o contacto.
- Las cartas de grupo (Yo nunca, ¿Qué prefieres?, Lo más probable) no llevan variables.

## Formato por tipo

- **Verdad:** una pregunta que se pueda contestar en voz alta en menos de un minuto. Empieza con "¿" y termina con "?".
- **Reto:** una instrucción en imperativo. Si la duración importa, `timerSeconds` entre 10 y 120. Sin tiempo si no hace falta.
- **Yo nunca:** empieza con "Yo nunca" y describe una experiencia concreta que algunos sí habrán vivido.
- **¿Qué prefieres?:** "¿Qué prefieres: A o B?" Dos opciones parejas, ninguna obvia.
- **Lo más probable:** pregunta al grupo quién es más probable que haga algo. Variar el inicio: "¿Quién de aquí…?", "¿Quién sería el primero en…?", "¿Quién tiene más pinta de…?", "Señalen a quien…". No repetir el mismo inicio más de un tercio del lote.

## Tono por nivel

- **Suave:** apto para cualquier reunión, incluso con compañeros de trabajo. Anécdotas, gustos, manías, vergüenzas leves, hipótesis absurdas. Nada romántico ni sexual.
- **Picante:** sugerente, nunca explícito. Citas, atracción, coqueteo, primeras veces románticas, celos, exes, besos. Se puede insinuar; no se describe nada sexual.
- **Extremo (solo adultos, tras confirmar +18):** temas sexuales e íntimos entre adultos, en lenguaje directo pero no gráfico: experiencias, fantasías, preferencias, lugares, confesiones. Retos de seducción con `{compatible}` (miradas, susurros, bailes, besos en lugares no íntimos) con etiqueta `contacto`. Nunca describe actos sexuales con detalle, nunca exige desnudez ni tocar partes íntimas.

## Calidad

- Una idea por carta, máximo 25 palabras.
- Concreta: "¿Cuál es la peor excusa que inventaste para cancelar un plan?" mejor que "¿Alguna vez mentiste?".
- Variedad: dentro de un lote, no repetir la misma estructura o tema más de tres veces.
- Que provoque una historia o una risa, no un sí o un no.
````

---

### Task 6: primer lote de cada combinación

**Files:**
- Create: `content/drafts/draft-<pack-id>-b001.json` para las 15 combinaciones (100 cartas en suave y picante, 50 en extremo), `content/review/draft-<pack-id>-b001.md`.

- [ ] **Step 1: generar**

Por cada tipo, un generador escribe tres lotes (suave, picante, extremo) siguiendo `content/GUIDELINES.md` y el formato de lote de la Task 3. Antes de escribir, lee las cartas ya publicadas de ese tipo para no repetirlas.

- [ ] **Step 2: validar**

`npm run content:check`. Corregir en el lote cada problema reportado (variables, palabras prohibidas, casi duplicados) reescribiendo la carta, nunca relajando la regla.

- [ ] **Step 3: calibrar el umbral**

`npm run content:similar -- 25`. Revisar los pares: si hay pares claramente duplicados por debajo de 0.8, bajar `DEFAULT_NEAR_DUPLICATE_THRESHOLD` al valor que los atrape sin marcar cartas distintas, y anotar el valor y los pares que lo justifican en el reporte. Si no, dejar 0.8 y anotarlo.

- [ ] **Step 4: muestras**

`npm run content:sample -- <lote>` para los 15 lotes.

- [ ] **Step 5: parar.** La revisión de las muestras la hace el usuario (spec sección 5, paso 4). La promoción, el segundo lote y la subida de los mínimos a 150/50 esperan su respuesta.

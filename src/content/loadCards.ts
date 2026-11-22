import { assertCorpus, DEFAULT_NEAR_DUPLICATE_THRESHOLD } from '../core/content/corpus';
import type { Card, Pack } from '../core/content/types';
import { parsePack } from '../core/content/validator';
import banned from '../../content/banned-soft.json';
import { checkPackConventions } from './conventions';

// Base packs travel in the main bundle; extreme packs are a separate chunk that
// only loads after the +18 confirmation (spec section 1).
const baseModules = import.meta.glob<unknown>('../../content/packs/*.json', { eager: true, import: 'default' });
const extremeModules = import.meta.glob<unknown>('../../content/packs/extreme/*.json', { import: 'default' });

function readBannedWords(value: unknown): readonly string[] {
  const words = (value as { words?: unknown } | null)?.words;
  if (!Array.isArray(words) || !words.every((word) => typeof word === 'string')) {
    throw new Error(`content/banned-soft.json must be { "words": string[] }, got ${JSON.stringify(value)}`);
  }
  return words as string[];
}

export const BANNED_SOFT_WORDS: readonly string[] = readBannedWords(banned);

const CORPUS_RULES = { bannedSoftWords: BANNED_SOFT_WORDS, nearDuplicateThreshold: DEFAULT_NEAR_DUPLICATE_THRESHOLD } as const;

function parseEntries(entries: readonly (readonly [string, unknown])[]): Pack[] {
  return entries.map(([path, raw]) => {
    const pack = parsePack(raw, path);
    const relative = path.slice(path.indexOf('content/packs/') + 'content/packs/'.length);
    const problems = checkPackConventions(pack, relative);
    if (problems.length > 0) throw new Error(problems.join('\n'));
    return pack;
  });
}

function requireLevel(packs: readonly Pack[], allowed: (level: Card['level']) => boolean, where: string): void {
  const wrong = packs.flatMap((pack) =>
    pack.cards.filter((card) => !allowed(card.level)).map((card) => `${pack.id}/${card.id} (${card.level})`),
  );
  if (wrong.length > 0) throw new Error(`${where} contain cards at a level they must not have: ${wrong.join(', ')}`);
}

const basePacks = parseEntries(Object.entries(baseModules));
requireLevel(basePacks, (level) => level !== 'EXTREME', 'Base packs');
assertCorpus(basePacks, CORPUS_RULES);

export function loadBaseCards(): Card[] {
  return basePacks.flatMap((pack) => [...pack.cards]);
}

export async function loadExtremeCards(): Promise<Card[]> {
  const entries = await Promise.all(
    Object.entries(extremeModules).map(async ([path, load]) => [path, await load()] as const),
  );
  const extremePacks = parseEntries(entries);
  requireLevel(extremePacks, (level) => level === 'EXTREME', 'Extreme packs');
  assertCorpus([...basePacks, ...extremePacks], CORPUS_RULES);
  return extremePacks.flatMap((pack) => [...pack.cards]);
}

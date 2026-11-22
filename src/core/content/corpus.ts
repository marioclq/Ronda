import { CARD_TYPES, LEVELS, type Card, type Pack } from './types';
import { ContentError, type ContentIssue } from './validator';
import { replaceVariables } from './variables';

export interface CorpusRules {
  readonly bannedSoftWords: readonly string[];
  readonly nearDuplicateThreshold: number;
}

/** Calibrated on batch 1 (plan 3): the most similar distinct pair scored 0.50, no true duplicate appeared. */
export const DEFAULT_NEAR_DUPLICATE_THRESHOLD = 0.6;

/** Lowercase words without accents or punctuation; every variable becomes "var". */
export function normalizeWords(text: string): string[] {
  return replaceVariables(text, () => ' var ')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter((word) => word.length > 0);
}

/** Word trigrams; texts shorter than three words become a single shingle. */
export function shingles(text: string): Set<string> {
  const words = normalizeWords(text);
  if (words.length < 3) return new Set([words.join(' ')]);
  const result = new Set<string>();
  for (let i = 0; i + 3 <= words.length; i++) result.add(words.slice(i, i + 3).join(' '));
  return result;
}

export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared++;
  return shared / (a.size + b.size - shared);
}

export interface NearDuplicate {
  readonly a: Card;
  readonly b: Card;
  readonly similarity: number;
}

/** Pairs of cards of the same type whose trigram similarity is >= threshold. */
export function findNearDuplicates(cards: readonly Card[], threshold: number): NearDuplicate[] {
  const prepared = cards.map((card) => ({ card, shingles: shingles(card.text) }));
  const result: NearDuplicate[] = [];
  for (let i = 0; i < prepared.length; i++) {
    const first = prepared[i];
    if (first === undefined) continue;
    for (let j = i + 1; j < prepared.length; j++) {
      const second = prepared[j];
      if (second === undefined || first.card.type !== second.card.type) continue;
      const similarity = jaccard(first.shingles, second.shingles);
      if (similarity >= threshold) result.push({ a: first.card, b: second.card, similarity });
    }
  }
  return result;
}

/** Banned entries (words or phrases) present as whole words in the card text. */
export function findBannedWords(card: Card, banned: readonly string[]): string[] {
  const haystack = ` ${normalizeWords(card.text).join(' ')} `;
  return banned.filter((entry) => {
    const needle = normalizeWords(entry).join(' ');
    return needle.length > 0 && haystack.includes(` ${needle} `);
  });
}

export function countByCombination(cards: readonly Card[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const type of CARD_TYPES) for (const level of LEVELS) counts.set(`${type}/${level}`, 0);
  for (const card of cards) {
    const key = `${card.type}/${card.level}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Cross-pack rules: unique ids, banned words in SOFT, near-duplicates. */
export function checkCorpus(packs: readonly Pack[], rules: CorpusRules): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const sourceById = new Map<string, string>();
  const unique: Card[] = [];

  for (const pack of packs) {
    for (const card of pack.cards) {
      const owner = sourceById.get(card.id);
      if (owner !== undefined) {
        issues.push({ source: pack.id, cardId: card.id, message: `id already used in pack ${owner}` });
        continue;
      }
      sourceById.set(card.id, pack.id);
      unique.push(card);
    }
  }

  const sourceOf = (cardId: string): string => {
    const source = sourceById.get(cardId);
    if (source === undefined) throw new Error(`Card ${cardId} has no source pack`);
    return source;
  };

  for (const card of unique) {
    if (card.level !== 'SOFT') continue;
    const banned = findBannedWords(card, rules.bannedSoftWords);
    if (banned.length > 0) {
      issues.push({ source: sourceOf(card.id), cardId: card.id, message: `banned words in SOFT card: ${banned.join(', ')}` });
    }
  }

  for (const duplicate of findNearDuplicates(unique, rules.nearDuplicateThreshold)) {
    issues.push({
      source: sourceOf(duplicate.a.id),
      cardId: duplicate.a.id,
      message: `near-duplicate of ${duplicate.b.id} (similarity ${duplicate.similarity.toFixed(2)})`,
    });
  }

  return issues;
}

export function assertCorpus(packs: readonly Pack[], rules: CorpusRules): void {
  const issues = checkCorpus(packs, rules);
  if (issues.length > 0) throw new ContentError(issues);
}

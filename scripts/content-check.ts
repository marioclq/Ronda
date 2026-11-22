import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { checkCorpus, DEFAULT_NEAR_DUPLICATE_THRESHOLD, countByCombination } from '../src/core/content/corpus';
import type { Pack } from '../src/core/content/types';
import { ContentError, formatIssue } from '../src/core/content/validator';
import { checkPackConventions } from '../src/content/conventions';
import { DRAFTS, jsonFiles, PACKS, readPack } from './lib';
import { checkMinimums, MIN_CARDS_PER_COMBINATION, MIN_EXTREME_CARDS_PER_TYPE } from '../src/content/milestones';

const problems: string[] = [];

function load(file: string): Pack | null {
  try {
    return readPack(file);
  } catch (error) {
    if (error instanceof ContentError) {
      problems.push(...error.issues.map(formatIssue));
      return null;
    }
    throw error;
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

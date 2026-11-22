import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { reviewMarkdown, sampleIndexes, SAMPLE_SIZE, seedFrom } from '../src/content/pipeline';
import { readPack, REVIEW } from './lib';

const file = process.argv[2];
if (file === undefined) throw new Error('Usage: npm run content:sample -- content/drafts/<batch>.json');

const draft = readPack(file);
const indexes = sampleIndexes(draft.cards.length, SAMPLE_SIZE, seedFrom(draft.id));
mkdirSync(REVIEW, { recursive: true });
const target = join(REVIEW, `${draft.id}.md`);
writeFileSync(target, reviewMarkdown(draft, indexes));
console.log(`Wrote ${target} (${indexes.length} of ${draft.cards.length} cards).`);

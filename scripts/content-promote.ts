import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { packFileFor } from '../src/content/conventions';
import { draftCombination, promoteDraft, sampleIndexes, SAMPLE_SIZE, seedFrom } from '../src/content/pipeline';
import { PACKS, readPack } from './lib';

const args = process.argv.slice(2);
const file = args[0];
if (file === undefined || file.startsWith('--')) {
  throw new Error('Usage: npm run content:promote -- content/drafts/<batch>.json [--reject 3,7]');
}
const rejectFlag = args.indexOf('--reject');
const rejectValue = rejectFlag === -1 ? undefined : args[rejectFlag + 1];
if (rejectFlag !== -1 && rejectValue === undefined) throw new Error('--reject needs a comma separated list of sample numbers');

const draft = readPack(file);
const indexes = sampleIndexes(draft.cards.length, SAMPLE_SIZE, seedFrom(draft.id));
const rejectedIds = (rejectValue === undefined ? [] : rejectValue.split(','))
  .map((text) => text.trim())
  .filter((text) => text.length > 0)
  .map((text) => {
    const number = Number(text);
    if (!Number.isInteger(number) || number < 1 || number > indexes.length) {
      throw new Error(`Rejected number "${text}" is outside the sample (1 to ${indexes.length}) of batch ${draft.id}`);
    }
    const card = draft.cards[indexes[number - 1] ?? -1];
    if (card === undefined) throw new Error(`Sample number ${number} has no card in batch ${draft.id}`);
    return card.id;
  });

const { type, level } = draftCombination(draft);
const target = join(PACKS, packFileFor(type, level));
const existing = existsSync(target) ? readPack(target) : null;
const pack = promoteDraft(draft, existing, rejectedIds);
writeFileSync(target, `${JSON.stringify(pack, null, 2)}\n`);
unlinkSync(file);

const added = pack.cards.slice(existing === null ? 0 : existing.cards.length);
console.log(`Promoted ${added.length} cards into ${target}: ${added[0]?.id ?? 'none'} to ${added[added.length - 1]?.id ?? 'none'}.`);

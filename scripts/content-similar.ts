import { jaccard, shingles } from '../src/core/content/corpus';
import { CARD_TYPES, type Card } from '../src/core/content/types';
import { DRAFTS, jsonFiles, PACKS, readPack } from './lib';

const raw = process.argv[2] ?? '30';
const top = Number(raw);
if (!Number.isInteger(top) || top < 1) throw new Error(`Usage: npm run content:similar -- <pairs per type>, got "${raw}"`);

const cards: Card[] = [...jsonFiles(PACKS), ...jsonFiles(DRAFTS)].flatMap((file) => [...readPack(file).cards]);
const sets = new Map(cards.map((card) => [card.id, shingles(card.text)]));

for (const type of CARD_TYPES) {
  const group = cards.filter((card) => card.type === type);
  const pairs: { a: Card; b: Card; similarity: number }[] = [];
  for (let i = 0; i < group.length; i += 1) {
    for (let j = i + 1; j < group.length; j += 1) {
      const a = group[i];
      const b = group[j];
      const setA = a === undefined ? undefined : sets.get(a.id);
      const setB = b === undefined ? undefined : sets.get(b.id);
      if (a === undefined || b === undefined || setA === undefined || setB === undefined) {
        throw new Error(`Missing card or shingles for pair ${i}/${j} of ${type}`);
      }
      pairs.push({ a, b, similarity: jaccard(setA, setB) });
    }
  }
  pairs.sort((x, y) => y.similarity - x.similarity);
  console.log(`\n## ${type} (${group.length} cards, ${pairs.length} pairs)`);
  for (const { a, b, similarity } of pairs.slice(0, top)) {
    console.log(`${similarity.toFixed(2)}  ${a.id}: ${a.text}\n      ${b.id}: ${b.text}`);
  }
}

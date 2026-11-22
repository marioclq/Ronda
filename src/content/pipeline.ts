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

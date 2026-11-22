import { describe, expect, it } from 'vitest';
import { GAME_MODES, type Card, type CardType } from '../content/types';
import { deck, player, steppingClock } from '../testing/fixtures';
import { createGame, reduce, type EngineDeps, type GameState } from './engine';
import { createSeededRng } from './rng';
import { canRender } from './template';

const players = [
  player('ana', 'WOMAN', 'MEN'),
  player('beto', 'MAN', 'WOMEN'),
  player('caro', 'WOMAN', 'ANYONE'),
  player('dani', 'OTHER', 'UNDISCLOSED'),
];

const PER_TYPE = 30;
const cards: Card[] = [
  ...deck('t', 'TRUTH', 'SOFT', PER_TYPE, (i) => (i % 3 === 0 ? `¿Qué opinas de {otro}? (${i})` : `Verdad ${i}`)),
  ...deck('d', 'DARE', 'SOFT', PER_TYPE, (i) => (i % 4 === 0 ? `Choca la mano de {compatible} (${i})` : `Reto ${i}`)),
  ...deck('n', 'NEVER', 'SOFT', PER_TYPE),
  ...deck('r', 'RATHER', 'SOFT', PER_TYPE),
  ...deck('m', 'MOST_LIKELY', 'SOFT', PER_TYPE),
];

interface Shown {
  readonly card: Card;
  readonly playerId: string | null;
}

interface Transcript {
  readonly turns: string[];
  readonly shown: Shown[];
  readonly texts: string[];
  readonly final: GameState;
}

function playRounds(seed: number, rounds: number): Transcript {
  const d: EngineDeps = { cards, rng: createSeededRng(seed), clock: steppingClock() };
  let state = createGame({ modes: [...GAME_MODES], level: 'SOFT', penalty: { kind: 'NONE' } }, players, {}, d);
  const turns: string[] = [];
  const shown: Shown[] = [];
  const texts: string[] = [];
  while (state.round <= rounds) {
    const { phase } = state;
    if (phase.kind === 'AWAITING_CHOICE') {
      turns.push(phase.playerId);
      state = reduce(state, { type: 'CHOOSE', choice: 'RANDOM' }, d);
    } else if (phase.kind === 'SHOWING_CARD') {
      shown.push({ card: phase.card, playerId: phase.playerId });
      texts.push(phase.text);
      state = reduce(state, phase.playerId === null ? { type: 'NEXT' } : { type: 'COMPLETE' }, d);
    } else {
      throw new Error(`Unexpected phase ${phase.kind} in round ${state.round}`);
    }
  }
  return { turns, shown, texts, final: state };
}

describe('long game', () => {
  const transcript = playRounds(42, 300);

  it('never gives two truth-or-dare turns in a row to the same player', () => {
    for (let i = 1; i < transcript.turns.length; i++) expect(transcript.turns[i]).not.toBe(transcript.turns[i - 1]);
  });

  it('gives everyone exactly one turn per cycle', () => {
    const ids = players.map((p) => p.id).sort();
    const complete = transcript.turns.length - (transcript.turns.length % ids.length);
    for (let start = 0; start < complete; start += ids.length) {
      expect(transcript.turns.slice(start, start + ids.length).sort()).toEqual(ids);
    }
  });

  it('repeats a card only when no unseen card was eligible for that turn', () => {
    const seen = new Set<string>();
    let repeats = 0;
    for (const { card: shownCard, playerId } of transcript.shown) {
      if (seen.has(shownCard.id)) {
        repeats++;
        const current = playerId === null ? undefined : players.find((p) => p.id === playerId);
        const unseenEligible = cards.filter(
          (other) =>
            other.type === shownCard.type &&
            other.level === shownCard.level &&
            !seen.has(other.id) &&
            canRender(other, current, players),
        );
        expect(unseenEligible.map((c) => c.id), `${shownCard.id} repeated while unseen eligible cards remained`).toEqual([]);
      }
      seen.add(shownCard.id);
    }
    expect(repeats, 'the game should be long enough to exercise recycling').toBeGreaterThan(0);
  });

  it('shows every card of a type at least once before the first repeat when all are eligible for everyone', () => {
    const always: CardType[] = ['NEVER', 'RATHER', 'MOST_LIKELY'];
    for (const type of always) {
      const ids = transcript.shown.filter((s) => s.card.type === type).map((s) => s.card.id);
      const firstCycle = ids.slice(0, PER_TYPE);
      expect(new Set(firstCycle).size, `${type} repeated before exhausting its pool`).toBe(firstCycle.length);
    }
  });

  it('keeps truths and dares balanced per player when everyone picks RANDOM', () => {
    for (const count of Object.values(transcript.final.choiceCount)) {
      expect(Math.abs(count.truth - count.dare)).toBeLessThanOrEqual(1);
    }
  });

  it('never leaves template variables unresolved', () => {
    for (const text of transcript.texts) expect(text).not.toMatch(/[{}]/);
  });

  it('is reproducible with the same seed and different with another', () => {
    expect(playRounds(42, 60).texts).toEqual(playRounds(42, 60).texts);
    expect(playRounds(42, 60).texts).not.toEqual(playRounds(43, 60).texts);
  });
});

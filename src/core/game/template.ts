import type { Card } from '../content/types';
import { extractVariableNames, isKnownVariable, replaceVariables, type Variable } from '../content/variables';
import { compatibleWith } from './matchmaker';
import type { Player } from './player';
import { pickOne, type Rng } from './rng';

/** Most constrained first, so {otro} never steals the only compatible player. */
const RESOLUTION_ORDER: readonly Variable[] = ['jugador', 'compatible', 'otro'];

export interface RenderContext {
  readonly current: Player | undefined;
  readonly players: readonly Player[];
  readonly lastNamed: Readonly<Record<string, number>>;
  readonly rng: Rng;
}

export interface RenderResult {
  readonly text: string;
  /** Players named by {otro} or {compatible}; never the current player. */
  readonly namedPlayerIds: readonly string[];
}

type Chooser = (options: readonly Player[]) => Player;

function variablesIn(card: Card): Set<Variable> {
  const result = new Set<Variable>();
  for (const name of extractVariableNames(card.text)) {
    if (!isKnownVariable(name)) throw new Error(`Card "${card.id}" uses unknown variable {${name}}`);
    result.add(name);
  }
  return result;
}

function candidates(
  variable: Variable,
  current: Player | undefined,
  players: readonly Player[],
  taken: ReadonlySet<string>,
): Player[] {
  if (current === undefined) return [];
  if (variable === 'jugador') return [current];
  const pool = variable === 'compatible' ? compatibleWith(current, players) : players.filter((p) => p.id !== current.id);
  return pool.filter((p) => !taken.has(p.id));
}

function assign(
  card: Card,
  current: Player | undefined,
  players: readonly Player[],
  choose: Chooser,
): Map<Variable, Player> | null {
  const used = variablesIn(card);
  const assignment = new Map<Variable, Player>();
  const taken = new Set<string>();
  for (const variable of RESOLUTION_ORDER) {
    if (!used.has(variable)) continue;
    const options = candidates(variable, current, players, taken);
    if (options.length === 0) return null;
    const chosen = choose(options);
    assignment.set(variable, chosen);
    taken.add(chosen.id);
  }
  return assignment;
}

const firstOption: Chooser = (options) => {
  const first = options[0];
  if (first === undefined) throw new Error('Chooser called without options');
  return first;
};

function leastRecentlyNamed(lastNamed: Readonly<Record<string, number>>, rng: Rng): Chooser {
  return (options) => {
    const score = (p: Player): number => lastNamed[p.id] ?? Number.NEGATIVE_INFINITY;
    const best = Math.min(...options.map(score));
    return pickOne(
      options.filter((p) => score(p) === best),
      rng,
    );
  };
}

export function canRender(card: Card, current: Player | undefined, players: readonly Player[]): boolean {
  return assign(card, current, players, firstOption) !== null;
}

export function renderCard(card: Card, ctx: RenderContext): RenderResult {
  const assignment = assign(card, ctx.current, ctx.players, leastRecentlyNamed(ctx.lastNamed, ctx.rng));
  if (assignment === null) {
    throw new Error(
      `Card "${card.id}" cannot be rendered for ${ctx.current?.name ?? 'the group'} with players [${ctx.players
        .map((p) => p.name)
        .join(', ')}]`,
    );
  }
  const text = replaceVariables(card.text, (name) => {
    const assigned = isKnownVariable(name) ? assignment.get(name) : undefined;
    if (assigned === undefined) throw new Error(`Card "${card.id}" has unresolved variable {${name}}`);
    return assigned.name;
  });
  const namedPlayerIds = [...assignment]
    .filter(([variable]) => variable !== 'jugador')
    .map(([, assigned]) => assigned.id);
  return { text, namedPlayerIds };
}

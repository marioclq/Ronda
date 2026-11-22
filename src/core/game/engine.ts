import { MODE_CARD_TYPES, type Card, type CardType, type GameMode, type Level } from '../content/types';
import { pickCard } from './cardPicker';
import type { Clock } from './clock';
import type { Player } from './player';
import { pickOne, type Rng } from './rng';
import { drawFromBag } from './shuffleBag';
import { canRender, renderCard } from './template';

export const MIN_PLAYERS = 2;

export type Penalty =
  | { readonly kind: 'DRINKS'; readonly count: 1 | 2 | 3 | 4 | 5 }
  | { readonly kind: 'GARMENT' }
  | { readonly kind: 'NONE' };

export interface GameConfig {
  readonly modes: readonly GameMode[];
  readonly level: Level;
  readonly penalty: Penalty;
}

export type PersonalType = 'TRUTH' | 'DARE';
export type ReplaceReason = 'UNCLEAR' | 'NOT_FOR_US';
export type Choice = PersonalType | 'RANDOM';
const PERSONAL_TYPES: readonly PersonalType[] = ['TRUTH', 'DARE'];

export type Phase =
  | { readonly kind: 'AWAITING_CHOICE'; readonly playerId: string; readonly unavailable: readonly PersonalType[] }
  | {
      readonly kind: 'SHOWING_CARD';
      readonly mode: GameMode;
      readonly card: Card;
      readonly text: string;
      readonly playerId: string | null;
      /** When the card appeared (epoch ms); the same value written to the history. */
      readonly shownAt: number;
    }
  | { readonly kind: 'SHOWING_PENALTY'; readonly playerId: string; readonly penalty: Penalty }
  | { readonly kind: 'PAUSED_NEED_PLAYERS' }
  | { readonly kind: 'ENDED' };

export interface ChoiceCount {
  readonly truth: number;
  readonly dare: number;
}

export interface GameState {
  readonly config: GameConfig;
  readonly players: readonly Player[];
  readonly turnQueue: readonly string[];
  readonly lastTurnPlayerId: string | null;
  /** Players who already had a turn in the current TRUTH_OR_DARE cycle (reset on refill). */
  readonly playedThisCycle: readonly string[];
  readonly modeBag: readonly GameMode[];
  readonly lastMode: GameMode | null;
  readonly choiceCount: Readonly<Record<string, ChoiceCount>>;
  /** playerId -> round in which they were last named by {otro} or {compatible}. */
  readonly lastNamed: Readonly<Record<string, number>>;
  /** cardId -> last time shown (epoch ms). Persisted by the UI after every card. */
  readonly history: Readonly<Record<string, number>>;
  readonly round: number;
  /** The +18 confirmation for this game. Never persisted. */
  readonly adultConfirmed: boolean;
  readonly phase: Phase;
}

export type GameAction =
  | { readonly type: 'CHOOSE'; readonly choice: Choice }
  | { readonly type: 'COMPLETE' }
  | { readonly type: 'REFUSE' }
  /** Another card of the same type for the same player: the current one is unclear or does not fit. */
  | { readonly type: 'REPLACE'; readonly reason: ReplaceReason }
  | { readonly type: 'NEXT' }
  | { readonly type: 'SKIP_TURN' }
  | { readonly type: 'ADD_PLAYER'; readonly player: Player }
  | { readonly type: 'REMOVE_PLAYER'; readonly playerId: string }
  | { readonly type: 'CHANGE_LEVEL'; readonly level: Level }
  | { readonly type: 'CONFIRM_ADULT' }
  | { readonly type: 'END' };

export interface EngineDeps {
  /** Pack cards plus custom cards, every level the UI has loaded. */
  readonly cards: readonly Card[];
  readonly rng: Rng;
  readonly clock: Clock;
}

export class InvalidActionError extends Error {
  constructor(action: GameAction, phase: Phase, reason: string) {
    super(`Action ${action.type} is not valid in phase ${phase.kind}: ${reason}`);
    this.name = 'InvalidActionError';
  }
}

/** Modes that lack at least one of their card types at the configured level. */
export function missingContent(config: GameConfig, cards: readonly Card[]): GameMode[] {
  return config.modes.filter((mode) =>
    MODE_CARD_TYPES[mode].some((type) => !cards.some((card) => card.type === type && card.level === config.level)),
  );
}

function assertContent(config: GameConfig, cards: readonly Card[]): void {
  const missing = missingContent(config, cards);
  if (missing.length > 0) throw new Error(`No cards at level ${config.level} for modes: ${missing.join(', ')}`);
}

function findPlayer(state: GameState, playerId: string): Player {
  const found = state.players.find((p) => p.id === playerId);
  if (found === undefined) throw new Error(`Unknown player id ${playerId}`);
  return found;
}

function unavailableTypes(state: GameState, playerId: string, deps: EngineDeps): PersonalType[] {
  const current = findPlayer(state, playerId);
  return PERSONAL_TYPES.filter(
    (type) =>
      !deps.cards.some(
        (card) => card.type === type && card.level === state.config.level && canRender(card, current, state.players),
      ),
  );
}

function showCard(
  state: GameState,
  mode: GameMode,
  type: CardType,
  playerId: string | null,
  deps: EngineDeps,
  replacing: Card | null = null,
): GameState {
  const current = playerId === null ? undefined : findPlayer(state, playerId);
  const card = pickCard({
    cards: deps.cards,
    type,
    level: state.config.level,
    history: state.history,
    isEligible: (candidate) => candidate.id !== replacing?.id && canRender(candidate, current, state.players),
    rng: deps.rng,
  });
  if (card === null) {
    const other = replacing === null ? '' : ` other than ${replacing.id}`;
    throw new Error(`No eligible ${type} card${other} at level ${state.config.level} for ${playerId ?? 'the group'}`);
  }
  const rendered = renderCard(card, { current, players: state.players, lastNamed: state.lastNamed, rng: deps.rng });

  const lastNamed: Record<string, number> = { ...state.lastNamed };
  for (const id of rendered.namedPlayerIds) lastNamed[id] = state.round;

  let choiceCount = state.choiceCount;
  // A replacement is the same choice, not a new one.
  if (replacing === null && playerId !== null && (type === 'TRUTH' || type === 'DARE')) {
    const previous = state.choiceCount[playerId] ?? { truth: 0, dare: 0 };
    const updated =
      type === 'TRUTH' ? { ...previous, truth: previous.truth + 1 } : { ...previous, dare: previous.dare + 1 };
    choiceCount = { ...state.choiceCount, [playerId]: updated };
  }

  const shownAt = deps.clock.now();
  return {
    ...state,
    history: { ...state.history, [card.id]: shownAt },
    lastNamed,
    choiceCount,
    phase: { kind: 'SHOWING_CARD', mode, card, text: rendered.text, playerId, shownAt },
  };
}

/** Draws the next chooser from the turn queue, without touching the mode bag. */
function startChooserTurn(state: GameState, deps: EngineDeps): GameState {
  const turn = drawFromBag(
    state.turnQueue,
    state.players.map((p) => p.id),
    state.lastTurnPlayerId,
    deps.rng,
  );
  const refilled = !state.turnQueue.some((id) => state.players.some((p) => p.id === id));
  return {
    ...state,
    turnQueue: turn.bag,
    lastTurnPlayerId: turn.item,
    playedThisCycle: refilled ? [turn.item] : [...state.playedThisCycle, turn.item],
    phase: { kind: 'AWAITING_CHOICE', playerId: turn.item, unavailable: unavailableTypes(state, turn.item, deps) },
  };
}

function startRound(state: GameState, deps: EngineDeps): GameState {
  const modeDraw = drawFromBag(state.modeBag, state.config.modes, state.lastMode, deps.rng);
  const next: GameState = { ...state, round: state.round + 1, modeBag: modeDraw.bag, lastMode: modeDraw.item };

  if (modeDraw.item === 'TRUTH_OR_DARE') return startChooserTurn(next, deps);

  const [groupType] = MODE_CARD_TYPES[modeDraw.item];
  if (groupType === undefined) throw new Error(`Mode ${modeDraw.item} has no card types`);
  return showCard(next, modeDraw.item, groupType, null, deps);
}

function resolveChoice(
  state: GameState,
  phase: Extract<Phase, { kind: 'AWAITING_CHOICE' }>,
  action: Extract<GameAction, { type: 'CHOOSE' }>,
  rng: Rng,
): PersonalType {
  const available = PERSONAL_TYPES.filter((type) => !phase.unavailable.includes(type));
  const choice = action.choice;
  if (choice !== 'RANDOM') {
    if (!available.includes(choice)) {
      throw new InvalidActionError(action, phase, `no ${choice} card is possible for ${phase.playerId}`);
    }
    return choice;
  }
  const [first, ...others] = available;
  if (first === undefined) throw new InvalidActionError(action, phase, `no card is possible for ${phase.playerId}`);
  if (others.length === 0) return first;
  const count = state.choiceCount[phase.playerId] ?? { truth: 0, dare: 0 };
  if (count.truth < count.dare) return 'TRUTH';
  if (count.dare < count.truth) return 'DARE';
  return pickOne(PERSONAL_TYPES, rng);
}

/** Recomputes which personal types are possible after players or level changed. */
function refreshChoice(state: GameState, deps: EngineDeps): GameState {
  if (state.phase.kind !== 'AWAITING_CHOICE') return state;
  return {
    ...state,
    phase: { ...state.phase, unavailable: unavailableTypes(state, state.phase.playerId, deps) },
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(value)}`);
}

export function createGame(
  config: GameConfig,
  players: readonly Player[],
  history: Readonly<Record<string, number>>,
  deps: EngineDeps,
  adultConfirmed = false,
): GameState {
  if (config.modes.length === 0) throw new Error('A game needs at least one mode');
  if (new Set(config.modes).size !== config.modes.length) {
    throw new Error(`Duplicate modes: ${config.modes.join(', ')}`);
  }
  if (players.length < MIN_PLAYERS) {
    throw new Error(`A game needs at least ${MIN_PLAYERS} players, got ${players.length}`);
  }
  const ids = players.map((p) => p.id);
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate player ids: ${ids.join(', ')}`);
  if (config.level === 'EXTREME' && !adultConfirmed) {
    throw new Error('Level EXTREME requires the +18 confirmation (adultConfirmed was false)');
  }
  assertContent(config, deps.cards);

  const initial: GameState = {
    config,
    players,
    turnQueue: [],
    lastTurnPlayerId: null,
    playedThisCycle: [],
    modeBag: [],
    lastMode: null,
    choiceCount: {},
    lastNamed: {},
    history,
    round: 0,
    adultConfirmed,
    phase: { kind: 'PAUSED_NEED_PLAYERS' },
  };
  return startRound(initial, deps);
}

export function reduce(state: GameState, action: GameAction, deps: EngineDeps): GameState {
  const { phase } = state;
  if (phase.kind === 'ENDED') throw new InvalidActionError(action, phase, 'the game has ended');

  switch (action.type) {
    case 'END':
      return { ...state, phase: { kind: 'ENDED' } };

    case 'CONFIRM_ADULT':
      return { ...state, adultConfirmed: true };
    case 'CHOOSE': {
      if (phase.kind !== 'AWAITING_CHOICE') throw new InvalidActionError(action, phase, 'no player is choosing');
      const type = resolveChoice(state, phase, action, deps.rng);
      return showCard(state, 'TRUTH_OR_DARE', type, phase.playerId, deps);
    }

    case 'COMPLETE': {
      if (phase.kind !== 'SHOWING_CARD' || phase.playerId === null) {
        throw new InvalidActionError(action, phase, 'only a personal card can be completed');
      }
      return startRound(state, deps);
    }

    case 'REFUSE': {
      if (phase.kind !== 'SHOWING_CARD' || phase.playerId === null) {
        throw new InvalidActionError(action, phase, 'only a personal card can be refused');
      }
      if (state.config.penalty.kind === 'NONE') return startRound(state, deps);
      return { ...state, phase: { kind: 'SHOWING_PENALTY', playerId: phase.playerId, penalty: state.config.penalty } };
    }

    case 'REPLACE': {
      if (phase.kind !== 'SHOWING_CARD') throw new InvalidActionError(action, phase, 'only a card on screen can be replaced');
      return showCard(state, phase.mode, phase.card.type, phase.playerId, deps, phase.card);
    }

    case 'NEXT': {
      const isGroupCard = phase.kind === 'SHOWING_CARD' && phase.playerId === null;
      if (!isGroupCard && phase.kind !== 'SHOWING_PENALTY') {
        throw new InvalidActionError(action, phase, 'NEXT only follows a group card or a penalty');
      }
      return startRound(state, deps);
    }

    case 'SKIP_TURN': {
      if (phase.kind !== 'AWAITING_CHOICE' || phase.unavailable.length < PERSONAL_TYPES.length) {
        throw new InvalidActionError(action, phase, 'a turn can only be skipped when no card is possible');
      }
      return startRound(state, deps);
    }

    case 'ADD_PLAYER': {
      if (state.players.some((p) => p.id === action.player.id)) {
        throw new InvalidActionError(action, phase, `player ${action.player.id} is already playing`);
      }
      const added: GameState = {
        ...state,
        players: [...state.players, action.player],
        // Mid-cycle only, and not for someone who already played this cycle: otherwise the next refill includes them.
        turnQueue:
          state.turnQueue.length > 0 && !state.playedThisCycle.includes(action.player.id)
            ? [...state.turnQueue, action.player.id]
            : state.turnQueue,
      };
      if (phase.kind === 'PAUSED_NEED_PLAYERS') {
        return added.players.length >= MIN_PLAYERS ? startRound(added, deps) : added;
      }
      return refreshChoice(added, deps);
    }

    case 'REMOVE_PLAYER': {
      if (!state.players.some((p) => p.id === action.playerId)) {
        throw new InvalidActionError(action, phase, `player ${action.playerId} is not playing`);
      }
      const removed: GameState = {
        ...state,
        players: state.players.filter((p) => p.id !== action.playerId),
        turnQueue: state.turnQueue.filter((id) => id !== action.playerId),
      };
      if (removed.players.length < MIN_PLAYERS) return { ...removed, phase: { kind: 'PAUSED_NEED_PLAYERS' } };
      if ('playerId' in phase && phase.playerId === action.playerId) {
        // Only TRUTH_OR_DARE phases carry a playerId: keep the mode, re-draw the chooser.
        return startChooserTurn({ ...removed, round: removed.round + 1 }, deps);
      }
      return refreshChoice(removed, deps);
    }

    case 'CHANGE_LEVEL': {
      if (action.level === 'EXTREME' && !state.adultConfirmed) {
        throw new InvalidActionError(action, phase, 'level EXTREME requires the +18 confirmation');
      }
      const changed: GameState = { ...state, config: { ...state.config, level: action.level } };
      assertContent(changed.config, deps.cards);
      return refreshChoice(changed, deps);
    }

    default:
      return assertNever(action);
  }
}

import { useCallback, useEffect, useState } from 'react';
import { useCards } from '../../app/CardsContext';
import { useGame } from '../../app/GameContext';
import { navigate } from '../../app/route';
import { useUserState } from '../../app/UserStateContext';
import type { PlayOutcome } from '../../core/events/playEvent';
import type { Choice, GameState, Phase, ReplaceReason } from '../../core/game/engine';
import { es } from '../../i18n/es';
import { AvatarStack } from '../components/Avatar';
import { Button } from '../components/Button';
import { Countdown } from '../components/Countdown';
import { cx } from '../components/cx';
import { Dialog } from '../components/Dialog';
import { Glass } from '../components/Glass';
import { Icon, type IconName } from '../components/Icon';
import { CARD_TYPE_ICONS } from '../components/typeIcons';
import { LensGlass } from '../glass/LensGlass';
import { describePenalty } from '../logic/penaltyText';
import { useLevelBackdrop } from '../theme/useAppearance';
import { PlayMenu } from './PlayMenu';
import { RandomReveal } from './RandomReveal';

function nameOf(game: GameState, playerId: string): string {
  const player = game.players.find((p) => p.id === playerId);
  if (player === undefined) {
    throw new Error(`Player ${playerId} is not in the game (players: ${game.players.map((p) => p.id).join(', ')})`);
  }
  return player.name;
}

const CHOICE_ICONS: Readonly<Record<Choice, IconName>> = { TRUTH: 'truth', RANDOM: 'random', DARE: 'dare' };
const CHOICE_WORDS: Readonly<Record<Choice, string>> = { TRUTH: es.play.truth, RANDOM: es.play.random, DARE: es.play.dare };
const OUTCOME_ICONS: Readonly<Record<PlayOutcome, IconName>> = { COMPLETED: 'check', PASSED: 'next', REPLACED: 'swap', SHOWN: 'cards' };

/** One of the three turn options: icon, name and what it means, as one big row. */
function ChoiceRow({ choice, primary, disabled, onChoose }: { choice: Choice; primary: boolean; disabled: boolean; onChoose: () => void }) {
  return (
    <button
      type="button"
      className={cx('choice', primary ? 'choice--primary' : 'glass')}
      disabled={disabled}
      onClick={onChoose}
      data-testid={`choice-${choice.toLowerCase()}`}
    >
      <span className="choice__icon">
        <Icon name={CHOICE_ICONS[choice]} size={24} />
      </span>
      <span className="choice__body">
        <span className="choice__title">{CHOICE_WORDS[choice]}</span>
        <span className="choice__hint">{es.play.choiceHints[choice]}</span>
      </span>
      <span className="choice__end">
        <Icon name={primary ? 'sparkle' : 'chevronRight'} size={20} />
      </span>
    </button>
  );
}

function ChoiceView({
  game,
  phase,
  onChoose,
  onSkip,
}: {
  game: GameState;
  phase: Extract<Phase, { kind: 'AWAITING_CHOICE' }>;
  onChoose: (choice: Choice) => void;
  onSkip: () => void;
}) {
  const noneAvailable = phase.unavailable.length === 2;
  return (
    <div className="stage stage--turn">
      <div className="turn-head">
        <p className="eyebrow">
          <Icon name="replay" size={16} />
          {es.play.turnOf}
        </p>
        <h2 className="turn-head__name" data-testid="turn-name">
          {nameOf(game, phase.playerId)}
        </h2>
        <span className="turn-head__rule" aria-hidden="true" />
        {noneAvailable ? null : <p className="turn-head__hint">{es.play.choiceHint}</p>}
      </div>
      {noneAvailable ? (
        <>
          <p className="banner" role="alert">
            {es.play.noCardPossible}
          </p>
          <Button variant="primary" onClick={onSkip} icon="next" data-testid="choice-skip">
            {es.play.skipTurn}
          </Button>
        </>
      ) : (
        <div className="choices">
          <ChoiceRow choice="TRUTH" primary={false} disabled={phase.unavailable.includes('TRUTH')} onChoose={() => onChoose('TRUTH')} />
          <ChoiceRow choice="RANDOM" primary disabled={false} onChoose={() => onChoose('RANDOM')} />
          <ChoiceRow choice="DARE" primary={false} disabled={phase.unavailable.includes('DARE')} onChoose={() => onChoose('DARE')} />
        </div>
      )}
    </div>
  );
}

function CardView({
  game,
  phase,
  onComplete,
  onRefuse,
  onNext,
  onReplace,
  revealing,
  onRevealDone,
}: {
  game: GameState;
  phase: Extract<Phase, { kind: 'SHOWING_CARD' }>;
  onComplete: () => void;
  onRefuse: () => void;
  onNext: () => void;
  onReplace: (reason: ReplaceReason) => void;
  /** True right after "Al azar": the choice is staged before the card appears. */
  revealing: boolean;
  onRevealDone: () => void;
}) {
  const [askingWhy, setAskingWhy] = useState(false);
  const timerSeconds = phase.card.timerSeconds;
  const type = phase.card.type;
  const replace = (reason: ReplaceReason): void => {
    setAskingWhy(false);
    onReplace(reason);
  };
  if (revealing && phase.playerId !== null && (type === 'TRUTH' || type === 'DARE')) {
    return (
      <div className="stage">
        <div className="turn-head">
          <p className="eyebrow">{es.play.turnOf}</p>
          <h2 className="turn-head__name turn-head__name--compact">{nameOf(game, phase.playerId)}</h2>
        </div>
        <RandomReveal result={type} onDone={onRevealDone} />
      </div>
    );
  }
  const drinksRule =
    phase.playerId === null && type === 'NEVER' && game.config.penalty.kind === 'DRINKS'
      ? es.play.groupDrinks(game.config.penalty.count)
      : null;
  return (
    <div className="stage">
      {phase.playerId === null ? (
        <p className="pill pill--accent">
          <Icon name="users" size={16} />
          {es.play.groupHint}
        </p>
      ) : (
        <div className="card-head">
          <span className="type-tag type-tag--accent">
            <Icon name={CARD_TYPE_ICONS[type]} size={16} />
            {es.cards.types[type]}
          </span>
          <h2 className="card-head__name">{nameOf(game, phase.playerId)}</h2>
          <span className="turn-head__rule" aria-hidden="true" />
        </div>
      )}
      <LensGlass thick className={cx('stage__card play-card', phase.playerId === null && 'play-card--group')} data-testid="play-card">
        {phase.playerId === null ? (
          <span className="play-card__tag">
            <Icon name={CARD_TYPE_ICONS[type]} size={18} />
            {es.cards.types[type]}
          </span>
        ) : null}
        <p className="play-card__text" data-testid="card-text">
          {phase.text}
        </p>
        {timerSeconds === undefined ? null : <Countdown seconds={timerSeconds} />}
        {drinksRule === null ? null : (
          <p className="play-card__rule" data-testid="group-rule">
            <Icon name="drink" size={18} />
            {drinksRule}
          </p>
        )}
      </LensGlass>
      {phase.playerId === null ? (
        <div className="stack stack--tight">
          <Button variant="primary" onClick={onNext} icon="next" data-testid="card-next">
            {es.play.next}
          </Button>
          <Button icon="swap" onClick={() => setAskingWhy(true)} data-testid="card-replace">
            {es.play.replace}
          </Button>
        </div>
      ) : (
        <>
          <div className="stage__actions stage__actions--wide">
            <Button variant="primary" onClick={onComplete} icon="check" data-testid="card-complete">
              {es.play.complete}
            </Button>
            <Button onClick={onRefuse} icon="next" data-testid="card-refuse">
              {es.play.refuse}
            </Button>
          </div>
          <Button variant="quiet" icon="swap" onClick={() => setAskingWhy(true)} data-testid="card-replace">
            {es.play.replace}
          </Button>
        </>
      )}

      {askingWhy ? (
        <Dialog title={es.play.replaceTitle} onClose={() => setAskingWhy(false)} testId="replace-dialog">
          <p className="stage__label">{es.play.replaceHelp}</p>
          <div className="stack">
            <Button onClick={() => replace('UNCLEAR')} data-testid="replace-unclear">
              {es.play.replaceUnclear}
            </Button>
            <Button onClick={() => replace('NOT_FOR_US')} data-testid="replace-not-for-us">
              {es.play.replaceNotForUs}
            </Button>
            <Button variant="quiet" onClick={() => setAskingWhy(false)} data-autofocus>
              {es.common.cancel}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}

export function Play() {
  const { game, error, dispatch, discard, undoable, undo } = useGame();
  const { loadExtreme, loadError } = useCards();
  const { state } = useUserState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [randomPending, setRandomPending] = useState(false);
  const finishReveal = useCallback(() => setRandomPending(false), []);
  useLevelBackdrop(game?.config.level ?? 'SOFT');

  useEffect(() => {
    if (game === null) navigate('home', { replace: true });
  }, [game]);

  if (game === null) return null;
  const { phase } = game;
  const leave = (): void => {
    discard();
    navigate('home', { replace: true });
  };

  return (
    <main className="screen" data-testid="play">
      <header className="screen__bar">
        <p className="pill" data-testid="round-pill">
          <span className="pill__dot" />
          {es.play.roundLabel(game.round, es.setup.levelNames[game.config.level])}
        </p>
        <div className="play-bar__end">
          <AvatarStack names={game.players.map((player) => player.name)} />
          <button
            type="button"
            className="icon-btn icon-btn--glass"
            aria-label={es.play.menu.open}
            onClick={() => setMenuOpen(true)}
            data-testid="play-menu"
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      {error === null ? null : (
        <p className="banner" role="alert" data-testid="game-error">
          {es.play.errorTitle}: {error}
        </p>
      )}

      {undoable === null ? null : (
        <div className="toast glass" role="status" data-testid="undo-toast">
          <span className="toast__icon">
            <Icon name={OUTCOME_ICONS[undoable.outcome]} size={18} />
          </span>
          <span className="toast__body">
            <span className="toast__label">{es.play.previousTurn}</span>
            <span className="toast__text">{es.play.closed[undoable.outcome]}</span>
          </span>
          <Button className="btn--small" icon="replay" onClick={undo} data-testid="undo-button">
            {es.play.undo}
          </Button>
        </div>
      )}

      {phase.kind === 'AWAITING_CHOICE' ? (
        <ChoiceView
          key={game.round}
          game={game}
          phase={phase}
          onChoose={(choice) => {
            setRandomPending(choice === 'RANDOM');
            dispatch({ type: 'CHOOSE', choice });
          }}
          onSkip={() => dispatch({ type: 'SKIP_TURN' })}
        />
      ) : null}
      {phase.kind === 'SHOWING_CARD' ? (
        <CardView
          key={`${game.round}-${phase.card.id}`}
          game={game}
          phase={phase}
          onComplete={() => dispatch({ type: 'COMPLETE' })}
          onRefuse={() => dispatch({ type: 'REFUSE' })}
          onNext={() => dispatch({ type: 'NEXT' })}
          onReplace={(reason) => dispatch({ type: 'REPLACE', reason })}
          revealing={randomPending}
          onRevealDone={finishReveal}
        />
      ) : null}
      {phase.kind === 'SHOWING_PENALTY' ? (
        <div className="stage">
          <div>
            <p className="stage__label">{es.play.passedLabel}</p>
            <h2 className="stage__name stage__name--compact">{nameOf(game, phase.playerId)}</h2>
          </div>
          <Glass thick className="stage__card stage__card--penalty" data-testid="penalty-text">
            {describePenalty(phase.penalty)}
          </Glass>
          <Button variant="primary" onClick={() => dispatch({ type: 'NEXT' })} icon="next" data-testid="penalty-next">
            {es.play.next}
          </Button>
        </div>
      ) : null}
      {phase.kind === 'PAUSED_NEED_PLAYERS' ? (
        <div className="stage">
          <p className="banner" role="status" data-testid="paused">
            {es.play.paused}
          </p>
        </div>
      ) : null}
      {phase.kind === 'ENDED' ? (
        <div className="stage">
          <h2 className="stage__name stage__name--compact">{es.play.ended}</h2>
          <Button variant="primary" onClick={leave} data-testid="ended-home">
            {es.play.backHome}
          </Button>
        </div>
      ) : null}

      {menuOpen ? (
        <PlayMenu
          game={game}
          savedPlayers={state.players}
          dispatch={dispatch}
          loadExtreme={loadExtreme}
          loadError={loadError}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
    </main>
  );
}

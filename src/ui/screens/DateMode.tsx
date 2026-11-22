import { useEffect, useMemo, useState } from 'react';
import { useUserState } from '../../app/UserStateContext';
import { loadDateQuestions } from '../../content/loadDateQuestions';
import { systemClock } from '../../core/game/clock';
import {
  createDateSession,
  dateRecordFrom,
  isSetTimeUp,
  readerSeat,
  reduceDate,
  type DateAction,
  type DateSession,
  type DateSet,
} from '../../core/date/session';
import { es } from '../../i18n/es';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Countdown } from '../components/Countdown';
import { Glass } from '../components/Glass';
import { Icon } from '../components/Icon';
import { IosCircles, IosPicker } from '../components/IosPicker';
import { PlayerSheet } from '../components/PlayerSheet';
import { Screen } from '../components/Screen';
import { LensGlass } from '../glass/LensGlass';
import { newId } from '../newId';
import { useLevelBackdrop } from '../theme/useAppearance';

const SETS: readonly DateSet[] = [1, 2, 3];
const TIME_CHECK_MS = 15_000;

interface DateModeProps {
  readonly tonight: readonly string[];
  readonly onExit: () => void;
}

function Setup({ tonight, onStart, onExit }: { tonight: readonly string[]; onStart: (s: DateSession) => void; onExit: () => void }) {
  const { state } = useUserState();
  const [picked, setPicked] = useState<readonly string[]>(() => {
    const playing = state.players.filter((p) => tonight.includes(p.id));
    return playing.length === 2 ? playing.map((p) => p.id) : [];
  });
  const [startSet, setStartSet] = useState<DateSet>(1);
  const [adding, setAdding] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);
  const chosen = state.players.filter((p) => picked.includes(p.id));

  const toggle = (id: string): void => {
    setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  };

  const begin = (): void => {
    const [first, second] = chosen;
    if (first === undefined || second === undefined || chosen.length !== 2) {
      throw new Error(`A date needs exactly two people, got ${chosen.length}`);
    }
    onStart(createDateSession([first.name, second.name], loadDateQuestions(), startSet));
  };

  return (
    <Screen title={es.date.title} onBack={onExit}>
      {persistError === null ? null : (
        <p className="banner" role="alert" data-testid="persist-error">
          {persistError}
        </p>
      )}
      <section className="stack stack--tight" aria-label={es.date.pickTwo}>
        <h2>{es.date.pickTwo}</h2>
        <div className="row">
          {state.players.map((player) => (
            <button
              key={player.id}
              type="button"
              className="chip chip--person"
              aria-pressed={picked.includes(player.id)}
              onClick={() => toggle(player.id)}
              data-testid="date-player"
            >
              <Avatar name={player.name} size={2} />
              {player.name}
            </button>
          ))}
          <button type="button" className="chip chip--add" onClick={() => setAdding(true)} data-testid="date-add-person">
            <Icon name="add" size={18} />
            {es.date.addPerson}
          </button>
        </div>
        {chosen.length === 2 ? null : <p className="section__note">{es.date.pickHint}</p>}
      </section>

      <section className="stack stack--tight" aria-label={es.date.startSet}>
        <h2>{es.date.startSet}</h2>
        <div className="set-picker">
          {SETS.map((set) => (
            <button
              key={set}
              type="button"
              className="set-option glass"
              aria-pressed={startSet === set}
              onClick={() => setStartSet(set)}
              data-testid={`date-set-${set}`}
            >
              <span className="set-option__name">{es.date.sets[set]}</span>
              <span className="set-option__hint">{es.date.setHints[set]}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="screen__footer">
        <Button variant="primary" icon="heart" disabled={chosen.length !== 2} onClick={begin} data-testid="date-begin">
          {es.date.begin}
        </Button>
      </div>

      {adding ? (
        <PlayerSheet
          editing={null}
          addTitle={es.date.addPerson}
          onSaved={(player) => {
            if (picked.length < 2) setPicked([...picked, player.id]);
          }}
          onClose={() => setAdding(false)}
          onPersistError={setPersistError}
        />
      ) : null}
    </Screen>
  );
}

function IosStep({ name, onRate }: { name: string; onRate: (value: number) => void }) {
  const [value, setValue] = useState<number | null>(null);
  return (
    <>
      <div className="stage">
        <h1 className="date-title">{es.date.iosTitle(name)}</h1>
        <p className="date-lead">{es.date.iosHelp}</p>
        <IosPicker value={value} onChange={setValue} />
      </div>
      <div className="screen__footer">
        <Button variant="primary" icon="check" disabled={value === null} onClick={() => value !== null && onRate(value)} data-testid="ios-confirm">
          {es.date.iosConfirm}
        </Button>
      </div>
    </>
  );
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function romanSet(set: DateSet): string {
  return es.date.sets[set];
}

export function DateMode({ tonight, onExit }: DateModeProps) {
  const { update } = useUserState();
  const [session, setSession] = useState<DateSession | null>(null);
  const now = useNow(TIME_CHECK_MS);
  useLevelBackdrop('SPICY');

  const dispatch = (action: DateAction): void => {
    if (session === null) throw new Error(`Date action ${action.type} without a session`);
    const next = reduceDate(session, action, systemClock);
    setSession(next);
    // Saved once, on the step that finishes the date (an event, so StrictMode cannot double it).
    if (next.phase.kind === 'RESULT' && session.phase.kind !== 'RESULT') {
      const record = dateRecordFrom(next, systemClock.now(), newId('date'));
      update((current) => ({ ...current, dates: [...current.dates, record] }));
    }
  };

  const questions = useMemo(() => session?.questions ?? [], [session]);

  if (session === null) return <Setup tonight={tonight} onStart={setSession} onExit={onExit} />;
  const { phase, names } = session;

  return (
    <main className="screen date" data-testid="date">
      <header className="screen__bar">
        <Button className="btn--back" icon="back" onClick={onExit} data-testid="screen-back">
          {es.common.back}
        </Button>
        <p className="pill pill--accent">
          <span className="pill__dot" />
          {es.date.title}
        </p>
      </header>

      {phase.kind === 'CONSENT' ? (
        <>
          <div className="stage">
            <h1 className="date-title">{es.date.consentTitle}</h1>
            <Glass thick className="consent">
              <p>{es.date.consentBody}</p>
              <ul className="consent__rules">
                {es.date.consentRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </Glass>
          </div>
          <div className="screen__footer">
            <Button variant="primary" icon="check" onClick={() => dispatch({ type: 'AGREE' })} data-testid="date-agree">
              {es.date.agree}
            </Button>
          </div>
        </>
      ) : null}

      {phase.kind === 'IOS' ? (
        <IosStep key={`${phase.moment}-${phase.seat}`} name={names[phase.seat]} onRate={(value) => dispatch({ type: 'RATE', value })} />
      ) : null}

      {phase.kind === 'QUESTION'
        ? (() => {
            const question = questions[phase.index];
            if (question === undefined) throw new Error(`No date question at index ${phase.index}`);
            const reader = readerSeat(session, phase.index);
            const tips = es.date.tips[question.set];
            const tip = tips[phase.index % tips.length];
            return (
              <div className="stage stage--date-question" key={phase.index}>
                <h1 className="visually-hidden">{es.date.questionOf(question.number)}</h1>
                <div className="stack stack--tight">
                  <div className="date-progress-row">
                    <span className="date-progress-row__set">
                      <Icon name="heart" size={16} />
                      {romanSet(question.set)}
                    </span>
                    <span className="date-progress-row__count">{es.date.questionOf(question.number)}</span>
                  </div>
                  <div className="date-progress" aria-hidden="true">
                    <span style={{ width: `${(question.number / 36) * 100}%` }} />
                  </div>
                </div>
                <div className="date-reader glass">
                  <span className="avatar-stack" aria-hidden="true">
                    <Avatar name={names[reader]} size={2.5} />
                    <Avatar name={names[reader === 0 ? 1 : 0]} size={2.5} />
                  </span>
                  <span className="date-reader__text">
                    <span className="date-reader__name" data-testid="date-reader">
                      {es.date.readsFirst(names[reader])}
                    </span>
                    <span className="date-reader__then">{es.date.thenOther(names[reader === 0 ? 1 : 0])}</span>
                  </span>
                </div>
                <LensGlass thick className="stage__card" data-testid="date-question">
                  {question.text}
                </LensGlass>
                {question.timerSeconds === undefined ? null : <Countdown seconds={question.timerSeconds} />}
                {tip === undefined ? null : (
                  <p className="date-tip glass">
                    <span className="date-tip__icon">
                      <Icon name="sparkle" size={18} />
                    </span>
                    <span>
                      <strong>{es.date.tipLabel}</strong>
                      <br />
                      {tip}
                    </span>
                  </p>
                )}
                {isSetTimeUp(session, now) ? (
                  <p className="banner" role="status">
                    {es.date.setTimeUp}
                  </p>
                ) : null}
                <div className="date-actions">
                  <Button variant="primary" icon="next" onClick={() => dispatch({ type: 'NEXT' })} data-testid="date-next">
                    {es.date.next}
                  </Button>
                  <Button variant="quiet" icon="remove" onClick={() => dispatch({ type: 'FINISH' })} data-testid="date-finish">
                    {es.date.finish}
                  </Button>
                </div>
              </div>
            );
          })()
        : null}

      {phase.kind === 'SET_BREAK' ? (
        <div className="stage">
          <h1 className="stage__name">{es.date.breakTitle(romanSet(phase.nextSet === 2 ? 1 : 2))}</h1>
          <p className="stage__label">{es.date.breakBody}</p>
          <div className="date-actions">
            <Button variant="primary" icon="next" onClick={() => dispatch({ type: 'NEXT' })} data-testid="date-next">
              {es.date.continueSet(romanSet(phase.nextSet))}
            </Button>
            <Button variant="quiet" onClick={() => dispatch({ type: 'FINISH' })} data-testid="date-finish">
              {es.date.finish}
            </Button>
          </div>
        </div>
      ) : null}

      {phase.kind === 'RESULT' ? (
        <div className="stage" data-testid="date-result">
          <div className="stack stack--tight">
            <h1 className="date-title">{es.date.resultTitle}</h1>
            <p className="date-lead">{es.date.resultSubtitle}</p>
          </div>
          <div className="date-result">
            {names.map((name, seat) => {
              const before = session.ios.before[seat];
              const after = session.ios.after[seat];
              if (before == null || after == null) throw new Error(`Missing IOS for ${name}: before ${before}, after ${after}`);
              return (
                <Glass thick key={name} className="date-result__person">
                  <span className="date-result__name">{name}</span>
                  <span className="date-result__row">
                    <span className="eyebrow">{es.date.before}</span>
                    <IosCircles value={before} size={48} />
                    <strong>{before}</strong>
                  </span>
                  <span className="date-result__row">
                    <span className="eyebrow">{es.date.after}</span>
                    <IosCircles value={after} from={before} size={48} />
                    <strong>{after}</strong>
                  </span>
                </Glass>
              );
            })}
          </div>
          <p className="banner banner--icon banner--soft">
            <Icon name="info" />
            <span>{es.date.resultReference}</span>
          </p>
          <Button variant="primary" icon="back" onClick={onExit} data-testid="date-done">
            {es.date.done}
          </Button>
        </div>
      ) : null}
    </main>
  );
}

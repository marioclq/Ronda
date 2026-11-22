import { useState } from 'react';
import { useCards } from '../../app/CardsContext';
import { useGame } from '../../app/GameContext';
import { useUserState } from '../../app/UserStateContext';
import { GAME_MODES, LEVELS, type Level } from '../../core/content/types';
import { es } from '../../i18n/es';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { Segmented } from '../components/Segmented';
import { MODE_ICONS } from '../components/typeIcons';
import {
  draftFromLastConfig,
  setLevel,
  startBlockers,
  toConfig,
  toggleMode,
  type SetupDraft,
  type StartBlocker,
} from '../logic/setupLogic';
import { useLevelBackdrop } from '../theme/useAppearance';

const DRINK_COUNTS = [1, 2, 3, 4, 5] as const;

interface SetupProps {
  readonly tonight: readonly string[];
  readonly onTonightChange: (ids: readonly string[]) => void;
  /** Level chosen on the home screen; changing it here updates that choice too. */
  readonly level: Level;
  readonly onLevelChange: (level: Level) => void;
  readonly onEditPlayers: () => void;
  readonly onBack: () => void;
  readonly onStarted: () => void;
}

function blockerText(blocker: StartBlocker): string {
  switch (blocker.kind) {
    case 'MISSING_CONTENT':
      return es.setup.blockers.MISSING_CONTENT(blocker.modes.map((mode) => es.setup.modeNames[mode]).join(', '));
    case 'NO_MODES':
      return es.setup.blockers.NO_MODES;
    case 'NOT_ENOUGH_PLAYERS':
      return es.setup.blockers.NOT_ENOUGH_PLAYERS;
    case 'ADULT_UNCONFIRMED':
      return es.setup.blockers.ADULT_UNCONFIRMED;
  }
}

export function Setup({ tonight, onTonightChange, level, onLevelChange, onEditPlayers, onBack, onStarted }: SetupProps) {
  const { state, update } = useUserState();
  const { cards, loadExtreme, loadError } = useCards();
  const { start, error } = useGame();
  const [draft, setDraft] = useState<SetupDraft>(() => setLevel(draftFromLastConfig(state.settings.lastConfig), level));
  const [askingAdult, setAskingAdult] = useState(false);
  const [loadingExtreme, setLoadingExtreme] = useState(false);
  useLevelBackdrop(draft.level);

  const players = state.players.filter((player) => tonight.includes(player.id));
  const blockers = startBlockers(draft, cards, players.length);

  const chooseLevel = (next: Level): void => {
    if (next === 'EXTREME' && !draft.adultConfirmed) {
      setAskingAdult(true);
      return;
    }
    setDraft(setLevel(draft, next));
    onLevelChange(next);
  };

  const confirmAdult = async (): Promise<void> => {
    setLoadingExtreme(true);
    const loaded = await loadExtreme();
    setLoadingExtreme(false);
    setAskingAdult(false);
    if (loaded) {
      setDraft({ ...setLevel(draft, 'EXTREME'), adultConfirmed: true });
      onLevelChange('EXTREME');
    }
  };

  const begin = (): void => {
    const config = toConfig(draft);
    if (!start(config, players, draft.adultConfirmed)) return;
    update((current) => ({ ...current, settings: { ...current.settings, lastConfig: config } }));
    onStarted();
  };

  return (
    <Screen title={es.setup.title} onBack={onBack}>
      <Section
        title={es.setup.tonight}
        icon="users"
        aside={
          <Button variant="quiet" className="btn--link" onClick={onEditPlayers} data-testid="setup-edit-players">
            {es.setup.editPlayers}
            <Icon name="edit" size={16} />
          </Button>
        }
      >
        <div className="row">
          {state.players.map((player) => (
            <button
              key={player.id}
              type="button"
              className="chip chip--person"
              aria-pressed={tonight.includes(player.id)}
              onClick={() =>
                onTonightChange(tonight.includes(player.id) ? tonight.filter((id) => id !== player.id) : [...tonight, player.id])
              }
              data-testid="setup-player"
            >
              <Avatar name={player.name} size={2} />
              {player.name}
            </button>
          ))}
        </div>
      </Section>

      <Section title={es.setup.modes} icon="settings" aside={<span className="section__hint">{es.setup.modesHint}</span>}>
        <div className="row">
          {GAME_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className="chip"
              aria-pressed={draft.modes.includes(mode)}
              onClick={() => setDraft(toggleMode(draft, mode))}
              data-testid={`mode-${mode}`}
            >
              <Icon name={MODE_ICONS[mode]} size={18} />
              {es.setup.modeNames[mode]}
            </button>
          ))}
        </div>
      </Section>

      <Section title={es.setup.level} icon="flame">
        <Segmented
          label={es.setup.level}
          options={LEVELS.map((value) => ({ value, label: es.setup.levelNames[value], level: value }))}
          value={draft.level}
          onChange={chooseLevel}
          testIdPrefix="level"
        />
        <p className="section__note">{es.setup.levelHints[draft.level]}</p>
      </Section>

      <Section title={es.setup.penalty} icon="drink" aside={<span className="section__hint">{es.setup.penaltyHint}</span>}>
        <div className="chip-grid chip-grid--three">
          {(['NONE', 'DRINKS', 'GARMENT'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              className="chip"
              aria-pressed={draft.penalty.kind === kind}
              onClick={() =>
                setDraft({
                  ...draft,
                  penalty: kind === 'DRINKS' ? { kind, count: 2 } : kind === 'GARMENT' ? { kind } : { kind },
                })
              }
              data-testid={`penalty-${kind}`}
            >
              {es.setup.penaltyKinds[kind]}
            </button>
          ))}
        </div>
        {draft.penalty.kind === 'DRINKS' ? (
          <div className="stack stack--tight">
            <p className="section__note" id="drinks-count-label">
              {es.setup.drinksCount}
            </p>
            <div className="chip-grid chip-grid--five" role="group" aria-labelledby="drinks-count-label">
              {DRINK_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className="chip chip--count"
                  aria-pressed={draft.penalty.kind === 'DRINKS' && draft.penalty.count === count}
                  onClick={() => setDraft({ ...draft, penalty: { kind: 'DRINKS', count } })}
                  data-testid={`drinks-${count}`}
                >
                  {es.setup.drinks(count)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Section>

      {blockers.map((blocker) => (
        <p key={blocker.kind} className="banner" role="alert" data-testid="setup-blocker">
          {blockerText(blocker)}
        </p>
      ))}
      {loadError === null ? null : (
        <p className="banner" role="alert">
          {loadError}
        </p>
      )}
      {error === null ? null : (
        <p className="banner" role="alert" data-testid="game-error">
          {error}
        </p>
      )}

      <Button variant="primary" disabled={blockers.length > 0} onClick={begin} icon="play" data-testid="setup-start">
        {es.setup.start}
      </Button>

      {askingAdult ? (
        <Dialog
          title={es.setup.adult.title}
          onClose={() => (loadingExtreme ? undefined : setAskingAdult(false))}
          locked={loadingExtreme}
          testId="adult-dialog"
        >
          <p>{es.setup.adult.body}</p>
          {loadingExtreme ? <p>{es.setup.loadingExtreme}</p> : null}
          <div className="stack">
            <Button variant="primary" disabled={loadingExtreme} onClick={() => void confirmAdult()} data-testid="adult-confirm">
              {es.setup.adult.confirm}
            </Button>
            <Button variant="quiet" disabled={loadingExtreme} data-autofocus onClick={() => setAskingAdult(false)} data-testid="adult-cancel">
              {es.setup.adult.cancel}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </Screen>
  );
}

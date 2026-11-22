import { useState } from 'react';
import { useUserState } from '../../app/UserStateContext';
import { MIN_PLAYERS } from '../../core/game/engine';
import type { Player } from '../../core/game/player';
import { es } from '../../i18n/es';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { PlayerSheet } from '../components/PlayerSheet';
import { Screen } from '../components/Screen';

interface PlayersProps {
  readonly tonight: readonly string[];
  readonly onTonightChange: (ids: readonly string[]) => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
}

/** null: sheet closed; 'new': adding; otherwise the player being edited. */
type Sheet = null | 'new' | Player;

export function Players({ tonight, onTonightChange, onBack, onContinue }: PlayersProps) {
  const { state, update } = useUserState();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [persistError, setPersistError] = useState<string | null>(null);

  const open = (target: 'new' | Player): void => setSheet(target);
  const close = (): void => setSheet(null);

  const toggle = (id: string): void => {
    onTonightChange(tonight.includes(id) ? tonight.filter((x) => x !== id) : [...tonight, id]);
  };

  const remove = (player: Player): void => {
    update((current) => ({ ...current, players: current.players.filter((p) => p.id !== player.id) }));
    onTonightChange(tonight.filter((id) => id !== player.id));
  };

  const canContinue = tonight.length >= MIN_PLAYERS;
  const isEmpty = state.players.length === 0;

  return (
    <Screen title={es.players.title} onBack={onBack}>
      {persistError === null ? null : (
        <p className="banner" role="alert" data-testid="persist-error">
          {persistError}
        </p>
      )}

      {isEmpty ? (
        <div className="empty">
          <p className="empty__text">{es.players.empty}</p>
          <Button variant="primary" onClick={() => open('new')} data-testid="player-add">
            {es.players.add}
          </Button>
        </div>
      ) : (
        <>
          <header className="roster-head">
            <div className="roster-head__text">
              <h2 className="roster-head__title">
                {es.players.tonight}
                <span className="count-pill" aria-hidden="true">
                  {tonight.length}
                </span>
                <span className="visually-hidden">{es.players.selected(tonight.length)}</span>
              </h2>
              <p className="roster-head__subtitle">{es.players.subtitle}</p>
            </div>
            <button type="button" className="fab" aria-label={es.players.add} onClick={() => open('new')} data-testid="player-add">
              <Icon name="add" size={26} />
            </button>
          </header>
          <ul className="list" aria-label={es.players.tonight}>
            {state.players.map((player) => (
              <li key={player.id} className="seat glass" data-testid="player-row">
                <button
                  type="button"
                  className="seat__pick"
                  aria-pressed={tonight.includes(player.id)}
                  onClick={() => toggle(player.id)}
                  data-testid="player-toggle"
                >
                  <span className="seat__mark">
                    <Icon name="check" size={18} />
                  </span>
                  <span className="seat__body">
                    <span className="seat__name">{player.name}</span>
                    {player.gender === 'UNDISCLOSED' && player.attractedTo === 'UNDISCLOSED' ? null : (
                      <span className="seat__tags">
                        {player.gender === 'UNDISCLOSED' ? null : <span className="tag">{es.players.gender[player.gender]}</span>}
                        {player.attractedTo === 'UNDISCLOSED' ? null : (
                          <span className="tag tag--accent">
                            <Icon name="heart" size={14} />
                            {es.players.attraction[player.attractedTo]}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </button>
                <button type="button" className="icon-btn icon-btn--glass" aria-label={es.players.edit(player.name)} onClick={() => open(player)}>
                  <Icon name="edit" />
                </button>
                <button type="button" className="icon-btn icon-btn--glass" aria-label={es.players.remove(player.name)} onClick={() => remove(player)}>
                  <Icon name="remove" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="screen__footer">
        {canContinue || isEmpty ? null : <p className="stage__label">{es.players.needTwo}</p>}
        <Button variant="primary" disabled={!canContinue} onClick={onContinue} icon="next" data-testid="players-continue">
          {es.players.continue}
        </Button>
      </div>

      {sheet === null ? null : (
        <PlayerSheet
          editing={sheet === 'new' ? null : sheet}
          onSaved={(player, added) => {
            if (added) onTonightChange([...tonight, player.id]);
          }}
          onClose={close}
          onPersistError={setPersistError}
        />
      )}
    </Screen>
  );
}

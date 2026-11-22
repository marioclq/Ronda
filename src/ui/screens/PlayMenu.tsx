import { useState } from 'react';
import { LEVELS, type Level } from '../../core/content/types';
import type { GameAction, GameState } from '../../core/game/engine';
import type { Player } from '../../core/game/player';
import { es } from '../../i18n/es';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { Segmented } from '../components/Segmented';

interface PlayMenuProps {
  readonly game: GameState;
  readonly savedPlayers: readonly Player[];
  readonly dispatch: (action: GameAction) => void;
  loadExtreme(): Promise<boolean>;
  /** Why the extreme chunk could not load, or null. Shown inside the +18 dialog. */
  readonly loadError: string | null;
  readonly onClose: () => void;
}

export function PlayMenu({ game, savedPlayers, dispatch, loadExtreme, loadError, onClose }: PlayMenuProps) {
  const [pending, setPending] = useState<'EXTREME' | 'END' | null>(null);
  const [busy, setBusy] = useState(false);
  const notPlaying = savedPlayers.filter((saved) => !game.players.some((p) => p.id === saved.id));

  const changeLevel = (level: Level): void => {
    if (level === game.config.level) return;
    if (level === 'EXTREME' && !game.adultConfirmed) {
      setPending('EXTREME');
      return;
    }
    dispatch({ type: 'CHANGE_LEVEL', level });
    onClose();
  };

  const confirmExtreme = async (): Promise<void> => {
    setBusy(true);
    const loaded = await loadExtreme();
    setBusy(false);
    if (!loaded) return;
    dispatch({ type: 'CONFIRM_ADULT' });
    dispatch({ type: 'CHANGE_LEVEL', level: 'EXTREME' });
    onClose();
  };

  if (pending === 'EXTREME') {
    return (
      <Dialog title={es.setup.adult.title} onClose={() => (busy ? undefined : onClose())} locked={busy} placement="top" testId="play-menu-dialog">
        <p>{es.setup.adult.body}</p>
        {busy ? <p>{es.setup.loadingExtreme}</p> : null}
        {loadError === null ? null : (
          <p className="banner" role="alert" data-testid="menu-load-error">
            {loadError}
          </p>
        )}
        <div className="stack">
          <Button variant="primary" disabled={busy} onClick={() => void confirmExtreme()} data-testid="menu-adult-confirm">
            {es.setup.adult.confirm}
          </Button>
          <Button variant="quiet" disabled={busy} data-autofocus onClick={() => setPending(null)} data-testid="menu-adult-cancel">
            {es.setup.adult.cancel}
          </Button>
        </div>
      </Dialog>
    );
  }

  if (pending === 'END') {
    return (
      <Dialog title={es.play.menu.end} onClose={onClose} placement="top" testId="play-menu-dialog">
        <p>{es.play.menu.endConfirm}</p>
        <div className="stack">
          <Button
            variant="primary"
            onClick={() => {
              dispatch({ type: 'END' });
              onClose();
            }}
            data-testid="menu-end-yes"
          >
            {es.play.menu.endYes}
          </Button>
          <Button variant="quiet" onClick={() => setPending(null)}>
            {es.common.cancel}
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog title={es.play.menu.title} onClose={onClose} placement="top" testId="play-menu-dialog">
      <section className="stack stack--tight" aria-label={es.play.menu.players}>
        <h3>{es.play.menu.players}</h3>
        <ul className="list">
          {game.players.map((player) => (
            <li key={player.id} className="list__item menu-player glass">
              <span className="menu-player__who">
                <Avatar name={player.name} size={2.25} />
                {player.name}
              </span>
              <Button variant="quiet" onClick={() => dispatch({ type: 'REMOVE_PLAYER', playerId: player.id })} data-testid={`menu-remove-${player.id}`}>
                {es.play.menu.remove(player.name)}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="stack stack--tight" aria-label={es.play.menu.addTitle}>
        <h3>{es.play.menu.addTitle}</h3>
        {notPlaying.length === 0 ? <p className="stage__label">{es.play.menu.nothingToAdd}</p> : null}
        <div className="row">
          {notPlaying.map((player) => (
            <Button key={player.id} onClick={() => dispatch({ type: 'ADD_PLAYER', player })} data-testid={`menu-add-${player.id}`}>
              {es.play.menu.add(player.name)}
            </Button>
          ))}
        </div>
      </section>

      <section className="stack stack--tight" aria-label={es.play.menu.level}>
        <h3>{es.play.menu.level}</h3>
        <Segmented
          label={es.play.menu.level}
          options={LEVELS.map((value) => ({ value, label: es.setup.levelNames[value], level: value }))}
          value={game.config.level}
          onChange={changeLevel}
          testIdPrefix="menu-level"
        />
      </section>

      <Button onClick={() => setPending('END')} icon="remove" data-testid="menu-end">
        {es.play.menu.end}
      </Button>
      <Button variant="quiet" onClick={onClose} data-testid="menu-close">
        {es.common.close}
      </Button>
    </Dialog>
  );
}

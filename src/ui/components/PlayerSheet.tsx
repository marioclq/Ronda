import { useState, type FormEvent } from 'react';
import { useUserState } from '../../app/UserStateContext';
import { ATTRACTIONS, GENDERS, type Player } from '../../core/game/player';
import { es } from '../../i18n/es';
import { requestPersistence } from '../../store/persistence';
import { buildPlayer, EMPTY_DRAFT, validatePlayerDraft, type PlayerDraft, type PlayerFormError } from '../logic/playerForm';
import { newId } from '../newId';
import { Button } from './Button';
import { Dialog } from './Dialog';

interface PlayerSheetProps {
  /** The player being edited, or null to add a new one. */
  readonly editing: Player | null;
  /** Called after the player is saved; `added` is true for a new player. */
  readonly onSaved: (player: Player, added: boolean) => void;
  readonly onClose: () => void;
  /** The browser refused to keep the data; the message is ready to show. */
  readonly onPersistError: (message: string) => void;
}

function errorText(error: PlayerFormError): string {
  return error.kind === 'NAME_EMPTY' ? es.players.errors.nameEmpty : es.players.errors.nameTaken(error.name);
}

/** Bottom sheet to add or edit a player: name, gender and who they are attracted to. Used by Players and date mode. */
export function PlayerSheet({ editing, onSaved, onClose, onPersistError }: PlayerSheetProps) {
  const { state, update } = useUserState();
  const [draft, setDraft] = useState<PlayerDraft>(() =>
    editing === null ? EMPTY_DRAFT : { name: editing.name, gender: editing.gender, attractedTo: editing.attractedTo },
  );
  const [error, setError] = useState<PlayerFormError | null>(null);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const problem = validatePlayerDraft(draft, state.players, editing?.id ?? null);
    if (problem !== null) {
      setError(problem);
      return;
    }
    if (editing === null) {
      const player = buildPlayer(draft, newId());
      const isFirst = state.players.length === 0;
      update((current) => ({ ...current, players: [...current.players, player] }));
      // First saved player is a user gesture: the moment to ask the browser to keep the data (spec section 3).
      if (isFirst) {
        requestPersistence(navigator.storage).catch((failure: unknown) => {
          onPersistError(es.players.persistFailed(failure instanceof Error ? failure.message : String(failure)));
        });
      }
      onSaved(player, true);
    } else {
      const player = buildPlayer(draft, editing.id);
      update((current) => ({ ...current, players: current.players.map((p) => (p.id === editing.id ? player : p)) }));
      onSaved(player, false);
    }
    onClose();
  };

  return (
    <Dialog title={editing === null ? es.players.add : es.players.editTitle} onClose={onClose} testId="player-sheet">
      <form className="stack" onSubmit={submit} data-testid="player-form">
        <label className="field">
          <span className="field__label">{es.players.nameLabel}</span>
          <input
            className="input"
            value={draft.name}
            data-testid="player-name"
            data-autofocus
            autoComplete="off"
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
        </label>
        <fieldset className="field choice-group">
          <legend className="field__label">{es.players.genderLabel}</legend>
          <div className="row">
            {GENDERS.map((gender) => (
              <button
                key={gender}
                type="button"
                className="chip"
                aria-pressed={draft.gender === gender}
                onClick={() => setDraft({ ...draft, gender })}
                data-testid={`player-gender-${gender}`}
              >
                {es.players.gender[gender]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="field choice-group">
          <legend className="field__label">{es.players.attractionLabel}</legend>
          <div className="row">
            {ATTRACTIONS.map((attraction) => (
              <button
                key={attraction}
                type="button"
                className="chip"
                aria-pressed={draft.attractedTo === attraction}
                onClick={() => setDraft({ ...draft, attractedTo: attraction })}
                data-testid={`player-attraction-${attraction}`}
              >
                {es.players.attraction[attraction]}
              </button>
            ))}
          </div>
        </fieldset>
        {error === null ? null : (
          <p className="banner" role="alert" data-testid="player-error">
            {errorText(error)}
          </p>
        )}
        <div className="stage__actions">
          <Button variant="quiet" onClick={onClose}>
            {es.common.cancel}
          </Button>
          <Button variant="primary" type="submit" data-testid="player-save">
            {editing === null ? es.players.addShort : es.common.save}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

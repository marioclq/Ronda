import { useEffect, useState, type ChangeEvent } from 'react';
import { useGame } from '../../app/GameContext';
import { useUserState } from '../../app/UserStateContext';
import type { Player } from '../../core/game/player';
import { es } from '../../i18n/es';
import { parseBackup, serializeBackup } from '../../store/backup';
import { THEMES, type UserState } from '../../store/userState';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Dialog } from '../components/Dialog';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { Segmented } from '../components/Segmented';
import { downloadText } from '../download';
import { DateRecords } from './DateRecords';

const THEME_ICONS = { SYSTEM: 'monitor', LIGHT: 'sun', DARK: 'moon' } as const;

/** Which confirmation is open: clear the card history, show the date log, or erase the whole log. */
type Confirm = null | 'CLEAR_HISTORY' | 'VIEW_LOG' | 'CLEAR_LOG';

interface SettingsProps {
  readonly onBack: () => void;
  readonly onGlass: () => void;
  readonly onBackupImported: (players: readonly Player[]) => void;
}

export function Settings({ onBack, onGlass, onBackupImported }: SettingsProps) {
  const { state, update } = useUserState();
  const { discard } = useGame();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [logVisible, setLogVisible] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<UserState | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof navigator.storage?.persisted !== 'function') return;
    navigator.storage.persisted().then(setPersisted, (error: unknown) => {
      setMessage({ tone: 'error', text: es.settings.persistCheckFailed(error instanceof Error ? error.message : String(error)) });
    });
  }, []);

  const chooseBackup = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const input = event.target;
    const file = input.files?.[0];
    if (file === undefined) return;
    try {
      setPendingBackup(parseBackup(await file.text()));
      setMessage(null);
    } catch (error) {
      setMessage({ tone: 'error', text: `${es.settings.backupFailed} ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      input.value = '';
    }
  };

  const applyBackup = (): void => {
    if (pendingBackup === null) throw new Error('There is no validated backup to apply');
    const next = pendingBackup;
    update(() => next);
    discard();
    onBackupImported(next.players);
    setPendingBackup(null);
    setMessage({ tone: 'ok', text: es.settings.backupImported });
  };

  return (
    <Screen title={es.settings.title} onBack={onBack}>
      <Section plain title={es.settings.theme} aside={<span className="section__hint">{es.settings.themeHint}</span>}>
        <Segmented
          label={es.settings.theme}
          options={THEMES.map((value) => ({ value, label: es.settings.themes[value], icon: THEME_ICONS[value] }))}
          value={state.settings.theme}
          onChange={(theme) => update((current) => ({ ...current, settings: { ...current.settings, theme } }))}
          testIdPrefix="theme"
        />
      </Section>

      <Section plain title={es.glass.title}>
        <p className="section__note">{es.glass.entryHelp}</p>
        <Button icon="sparkle" onClick={onGlass} data-testid="settings-glass">
          {es.glass.entry}
        </Button>
      </Section>

      <Section
        plain
        title={es.settings.history}
        aside={<span className="section__hint">{es.settings.historyCount(Object.keys(state.history).length)}</span>}
      >
        <Button onClick={() => setConfirm('CLEAR_HISTORY')} icon="trash" data-testid="history-clear">
          {es.settings.clearHistory}
        </Button>
      </Section>

      <Section
        plain
        title={es.settings.privacy.title}
        aside={
          <span className="section__hint" data-testid="privacy-count">
            {es.settings.privacy.count(state.dates.length)}
          </span>
        }
      >
        <p className="section__note">{es.settings.privacy.help}</p>
        {logVisible ? <DateRecords /> : null}
        <div className="stack stack--tight">
          <Button
            icon="lock"
            disabled={state.dates.length === 0}
            onClick={() => (logVisible ? setLogVisible(false) : setConfirm('VIEW_LOG'))}
            data-testid="privacy-view"
          >
            {logVisible ? es.settings.privacy.hide : es.settings.privacy.view}
          </Button>
          <Button
            icon="trash"
            disabled={state.dates.length === 0 && state.events.length === 0}
            onClick={() => setConfirm('CLEAR_LOG')}
            data-testid="privacy-clear"
          >
            {es.settings.privacy.clear}
          </Button>
        </div>
      </Section>

      <Section plain title={es.settings.backup}>
        <p className="section__note">{es.settings.backupHelp}</p>
        {persisted === false ? (
          <p className="banner banner--icon">
            <Icon name="info" />
            <span>{es.settings.storageNotPersisted}</span>
          </p>
        ) : null}
        <div className="stack stack--tight">
          <Button onClick={() => downloadText('backup.json', serializeBackup(state, Date.now()))} icon="download" data-testid="backup-export">
            {es.settings.exportBackup}
          </Button>
          <label className="btn btn--glass file-btn">
            <Icon name="upload" />
            <span>{es.settings.importBackup}</span>
            <input
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              data-testid="backup-import"
              onChange={(event) => void chooseBackup(event)}
            />
          </label>
        </div>
        {message === null ? null : (
          <p className="banner" role={message.tone === 'error' ? 'alert' : 'status'} data-testid="settings-message">
            {message.text}
          </p>
        )}
      </Section>

      <Section plain title={es.settings.credits}>
        <p className="credit glass">
          <span className="credit__icon">
            <Icon name="info" />
          </span>
          <span>{es.settings.creditsFonts}</span>
        </p>
      </Section>

      {confirm === 'CLEAR_HISTORY' ? (
        <Dialog title={es.settings.clearHistory} onClose={() => setConfirm(null)} testId="clear-dialog">
          <p>{es.settings.clearHistoryConfirm}</p>
          <div className="stack">
            <Button
              variant="primary"
              onClick={() => {
                update((current) => ({ ...current, history: {} }));
                discard();
                setConfirm(null);
              }}
              data-testid="history-clear-yes"
            >
              {es.settings.clearHistoryYes}
            </Button>
            <Button variant="quiet" onClick={() => setConfirm(null)}>
              {es.common.cancel}
            </Button>
          </div>
        </Dialog>
      ) : null}

      {confirm === 'VIEW_LOG' ? (
        <Dialog title={es.settings.privacy.viewTitle} onClose={() => setConfirm(null)} testId="privacy-view-dialog">
          <p>{es.settings.privacy.viewBody}</p>
          <div className="stack">
            <Button
              variant="primary"
              onClick={() => {
                setLogVisible(true);
                setConfirm(null);
              }}
              data-testid="privacy-view-yes"
            >
              {es.settings.privacy.viewYes}
            </Button>
            <Button variant="quiet" data-autofocus onClick={() => setConfirm(null)}>
              {es.common.cancel}
            </Button>
          </div>
        </Dialog>
      ) : null}

      {confirm === 'CLEAR_LOG' ? (
        <Dialog title={es.settings.privacy.clear} onClose={() => setConfirm(null)} testId="privacy-clear-dialog">
          <p>{es.settings.privacy.clearBody}</p>
          <div className="stack">
            <Button
              variant="primary"
              onClick={() => {
                update((current) => ({ ...current, dates: [], events: [] }));
                setLogVisible(false);
                setConfirm(null);
              }}
              data-testid="privacy-clear-yes"
            >
              {es.settings.privacy.clearYes}
            </Button>
            <Button variant="quiet" data-autofocus onClick={() => setConfirm(null)}>
              {es.common.cancel}
            </Button>
          </div>
        </Dialog>
      ) : null}

      {pendingBackup === null ? null : (
        <Dialog title={es.settings.importConfirmTitle} onClose={() => setPendingBackup(null)} testId="import-dialog">
          <p>{es.settings.backupHelp}</p>
          <div className="stack">
            <Button variant="primary" onClick={applyBackup} data-testid="backup-import-yes">
              {es.settings.importConfirmYes}
            </Button>
            <Button variant="quiet" onClick={() => setPendingBackup(null)}>
              {es.common.cancel}
            </Button>
          </div>
        </Dialog>
      )}
    </Screen>
  );
}

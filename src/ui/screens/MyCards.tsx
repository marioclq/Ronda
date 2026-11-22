import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useUserState } from '../../app/UserStateContext';
import { CARD_TYPES, LEVELS } from '../../core/content/types';
import { es } from '../../i18n/es';
import { importCustomPack, serializeCustomPack } from '../../store/backup';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { Segmented } from '../components/Segmented';
import { CARD_TYPE_ICONS } from '../components/typeIcons';
import { downloadText } from '../download';
import { buildCustomCard, EMPTY_CARD_DRAFT, type CardDraft } from '../logic/cardForm';
import { newId } from '../newId';

interface Message {
  readonly tone: 'ok' | 'error';
  readonly text: string;
}

const LEVEL_ICONS = { SOFT: 'sun', SPICY: 'flame', EXTREME: 'dare' } as const;

function detail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function MyCards({ onBack }: { onBack: () => void }) {
  const { state, update } = useUserState();
  const [draft, setDraft] = useState<CardDraft>(EMPTY_CARD_DRAFT);
  const [message, setMessage] = useState<Message | null>(null);

  const add = (event: FormEvent): void => {
    event.preventDefault();
    try {
      const card = buildCustomCard(draft, newId('custom'));
      update((current) => ({ ...current, customCards: [...current.customCards, card] }));
      setDraft({ ...EMPTY_CARD_DRAFT, type: draft.type, level: draft.level });
      setMessage(null);
    } catch (error) {
      setMessage({ tone: 'error', text: `${es.cards.invalid} ${detail(error)}` });
    }
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const input = event.target;
    const file = input.files?.[0];
    if (file === undefined) return;
    try {
      const text = await file.text();
      let added = 0;
      let skipped = 0;
      update((current) => {
        const result = importCustomPack(current, text, file.name);
        added = result.added;
        skipped = result.skipped;
        return result.state;
      });
      setMessage({ tone: 'ok', text: es.cards.imported(added, skipped) });
    } catch (error) {
      setMessage({ tone: 'error', text: `${es.cards.importFailed} ${detail(error)}` });
    } finally {
      input.value = '';
    }
  };

  return (
    <Screen title={es.cards.title} onBack={onBack}>
      <p className="roster-head__subtitle">{es.cards.subtitle}</p>

      <section className="stack stack--tight" aria-label={es.cards.active}>
        <h2 className="roster-head__title">
          {es.cards.active}
          <span className="count-pill">{state.customCards.length}</span>
        </h2>
        {state.customCards.length === 0 ? <p className="section__note">{es.cards.empty}</p> : null}
        <ul className="list">
          {state.customCards.map((card) => (
            <li key={card.id} className="custom-card glass" data-testid="custom-card">
              <div className="custom-card__body">
                <span className="seat__tags">
                  <span className="tag tag--accent">
                    <Icon name={CARD_TYPE_ICONS[card.type]} size={14} />
                    {es.cards.types[card.type]}
                  </span>
                  <span className="tag" data-level={card.level}>
                    <span className="tag__dot" />
                    {es.setup.levelNames[card.level]}
                  </span>
                </span>
                <span className="custom-card__text">{card.text}</span>
              </div>
              <button
                type="button"
                className="icon-btn icon-btn--glass"
                aria-label={es.cards.remove(card.text)}
                onClick={() => update((current) => ({ ...current, customCards: current.customCards.filter((c) => c.id !== card.id) }))}
              >
                <Icon name="remove" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Section title={es.cards.create} icon="edit">
        <form className="stack" onSubmit={add} data-testid="card-form">
          <div className="field">
            <span className="field__label">{es.cards.typeLabel}</span>
            <Segmented
              label={es.cards.typeLabel}
              options={CARD_TYPES.map((value) => ({ value, label: es.cards.types[value], icon: CARD_TYPE_ICONS[value] }))}
              value={draft.type}
              onChange={(type) => setDraft({ ...draft, type })}
              testIdPrefix="card-type"
              wrap
            />
          </div>
          <div className="field">
            <span className="field__label">{es.cards.levelLabel}</span>
            <Segmented
              label={es.cards.levelLabel}
              options={LEVELS.map((value) => ({ value, label: es.setup.levelNames[value], icon: LEVEL_ICONS[value], level: value }))}
              value={draft.level}
              onChange={(level) => setDraft({ ...draft, level })}
              testIdPrefix="card-level"
            />
          </div>
          <label className="field">
            <span className="field__label">{es.cards.textLabel}</span>
            <textarea
              className="input"
              value={draft.text}
              data-testid="card-input"
              onChange={(event) => setDraft({ ...draft, text: event.target.value })}
            />
            <span className="section__note">{es.cards.textHelp}</span>
          </label>
          {draft.type === 'DARE' ? (
            <label className="field">
              <span className="field__label">{es.cards.timerLabel}</span>
              <input
                className="input"
                inputMode="numeric"
                value={draft.timerSeconds}
                data-testid="card-timer"
                onChange={(event) => setDraft({ ...draft, timerSeconds: event.target.value })}
              />
            </label>
          ) : null}
          {message === null ? null : (
            <p className="banner" role={message.tone === 'error' ? 'alert' : 'status'} data-testid="cards-message">
              {message.text}
            </p>
          )}
          <Button variant="primary" type="submit" icon="add" data-testid="card-add">
            {es.cards.add}
          </Button>
        </form>
      </Section>

      <div className="stack stack--tight">
        <Button
          disabled={state.customCards.length === 0}
          onClick={() => downloadText('custom-cards.json', serializeCustomPack(state.customCards))}
          icon="download" data-testid="cards-export"
        >
          {es.cards.export}
        </Button>
        <label className="btn btn--glass file-btn">
          <Icon name="upload" />
          <span>{es.cards.import}</span>
          <input
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            data-testid="cards-import"
            onChange={(event) => void importFile(event)}
          />
        </label>
      </div>
    </Screen>
  );
}

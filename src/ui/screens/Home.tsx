import { useState } from 'react';
import { useCards } from '../../app/CardsContext';
import { LEVELS, type Card, type Level } from '../../core/content/types';
import { es } from '../../i18n/es';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { CARD_TYPE_ICONS } from '../components/typeIcons';
import { useLevelBackdrop } from '../theme/useAppearance';

interface HomeProps {
  /** Present when the last game can be replayed in one tap; summary describes it. */
  readonly replay: { readonly onReplay: () => void; readonly summary: string } | null;
  /** Sets the atmosphere here and is preselected when configuring the next game. */
  readonly level: Level;
  readonly onLevelChange: (level: Level) => void;
  readonly onNewGame: () => void;
  readonly onDate: () => void;
  readonly onMyCards: () => void;
  readonly onSettings: () => void;
}

/** A real soft card from the deck, so the home screen shows what the game sounds like. */
function useTeaserCard(): Card | null {
  const { cards } = useCards();
  const [card] = useState<Card | null>(() => {
    const soft = cards.filter((c) => c.level === 'SOFT' && !c.text.includes('{'));
    return soft.length === 0 ? null : (soft[Math.floor(Math.random() * soft.length)] ?? null);
  });
  return card;
}

export function Home({ replay, level, onLevelChange, onNewGame, onDate, onMyCards, onSettings }: HomeProps) {
  const teaser = useTeaserCard();
  useLevelBackdrop(level);
  return (
    <main className="screen" data-testid="home">
      <div className="home">
        <Segmented
          label={es.setup.level}
          options={LEVELS.map((value) => ({ value, label: es.setup.levelNames[value], level: value }))}
          value={level}
          onChange={onLevelChange}
          testIdPrefix="home-level"
        />
        <header className="home__head">
          <h1 className="home__title">{es.appName}</h1>
          <p className="home__tagline">{es.home.tagline}</p>
        </header>

        <div className="deck" aria-hidden={teaser === null}>
          <div className="deck__card deck__card--back glass glass--thick" />
          <div className="deck__card deck__card--mid glass glass--thick" />
          <figure className="deck__card deck__card--top glass glass--thick">
            {teaser === null ? null : (
              <>
                <blockquote className="deck__text">{teaser.text}</blockquote>
                <figcaption className="type-tag">
                  <Icon name={CARD_TYPE_ICONS[teaser.type]} size={18} />
                  {es.cards.types[teaser.type]}
                </figcaption>
              </>
            )}
          </figure>
        </div>

        <div className="stack home__actions">
          {replay === null ? null : (
            <div className="stack stack--tight">
              <Button variant="primary" onClick={replay.onReplay} icon="replay" data-testid="home-replay">
                {es.home.replay}
              </Button>
              <p className="home__replay">{replay.summary}</p>
            </div>
          )}
          <Button variant={replay === null ? 'primary' : 'glass'} onClick={onNewGame} icon="play" data-testid="home-new-game">
            {es.home.newGame}
          </Button>
          <div className="stage__actions stage__actions--three">
            <Button onClick={onDate} icon="heart" data-testid="home-date">
              {es.date.entry}
            </Button>
            <Button onClick={onMyCards} icon="cards" data-testid="home-cards">
              {es.home.myCards}
            </Button>
            <Button onClick={onSettings} icon="settings" data-testid="home-settings">
              {es.home.settings}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

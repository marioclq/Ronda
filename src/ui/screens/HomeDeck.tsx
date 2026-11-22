import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { useCards } from '../../app/CardsContext';
import { es } from '../../i18n/es';
import { Icon } from '../components/Icon';
import { CARD_TYPE_ICONS } from '../components/typeIcons';
import { LensGlass } from '../glass/LensGlass';
import { otherIndex, swipeOutcome } from '../logic/swipe';

/** How long a thrown card takes to leave before the next one is dealt. */
const THROW_MS = 260;

type Direction = 'LEFT' | 'RIGHT';

interface Drag {
  readonly pointer: number;
  readonly startX: number;
  readonly dx: number;
}

/**
 * The home deck: real soft cards, so the screen shows what the game sounds like.
 * Overdrive: drag the top card aside (or tap it, or press Enter) and it flies off while the glass keeps
 * bending what is behind it; the next card is dealt. With reduced motion the card simply changes.
 */
export function HomeDeck() {
  const { cards } = useCards();
  const pool = useMemo(() => cards.filter((card) => card.level === 'SOFT' && !card.text.includes('{')), [cards]);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * Math.max(pool.length, 1)));
  const [deal, setDeal] = useState(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [leaving, setLeaving] = useState<Direction | null>(null);
  const timer = useRef<number | null>(null);
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const card = pool[index] ?? null;
  if (card === null) return <div className="deck" aria-hidden="true" />;

  const dealNext = (): void => {
    setIndex((current) => otherIndex(current, pool.length, Math.random));
    setDeal((current) => current + 1);
  };

  const shuffle = (direction: Direction): void => {
    if (leaving !== null) return;
    setDrag(null);
    if (reduced) {
      dealNext();
      return;
    }
    setLeaving(direction);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setLeaving(null);
      dealNext();
    }, THROW_MS);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (leaving !== null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ pointer: event.pointerId, startX: event.clientX, dx: 0 });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (drag === null || drag.pointer !== event.pointerId) return;
    setDrag({ ...drag, dx: event.clientX - drag.startX });
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (drag === null || drag.pointer !== event.pointerId) return;
    const outcome = swipeOutcome(drag.dx, event.currentTarget.getBoundingClientRect().width);
    if (outcome === 'TAP') shuffle('RIGHT');
    else if (outcome === 'BACK') setDrag(null);
    else shuffle(outcome);
  };
  const cancel = (): void => setDrag(null);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    shuffle('RIGHT');
  };

  const dx = drag?.dx ?? 0;
  const transform =
    leaving === null ? `translateX(${dx}px) rotate(${dx / 18}deg)` : `translateX(${leaving === 'RIGHT' ? 130 : -130}%) rotate(${leaving === 'RIGHT' ? 16 : -16}deg)`;
  const style: CSSProperties = { transform, opacity: leaving === null ? 1 : 0 };

  return (
    <div className="deck">
      <div className="deck__card deck__card--back glass glass--thick" />
      <div className="deck__card deck__card--mid glass glass--thick" />
      <LensGlass
        key={deal}
        thick
        className="deck__card deck__card--top"
        style={style}
        data-dragging={drag === null ? undefined : ''}
        data-leaving={leaving ?? undefined}
        role="button"
        tabIndex={0}
        aria-label={es.home.shuffle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={onKeyDown}
        data-testid="home-deck"
      >
        <figure className="deck__figure">
          <span className="deck__hint" aria-hidden="true">
            <Icon name="swap" size={16} />
            {es.home.shuffleHint}
          </span>
          <blockquote className="deck__text">{card.text}</blockquote>
          <figcaption className="type-tag">
            <Icon name={CARD_TYPE_ICONS[card.type]} size={18} />
            {es.cards.types[card.type]}
          </figcaption>
        </figure>
      </LensGlass>
    </div>
  );
}

import { useEffect, useState } from 'react';
import type { PersonalType } from '../../core/game/engine';
import { es } from '../../i18n/es';
import { cx } from '../components/cx';
import { Icon } from '../components/Icon';
import { CARD_TYPE_ICONS } from '../components/typeIcons';
import { FLIP_GAPS, revealFaces } from '../logic/roulette';

const LANDED_HOLD_MS = 520;
const REDUCED_HOLD_MS = 450;

const WORDS: Readonly<Record<PersonalType, string>> = { TRUTH: es.play.truth, DARE: es.play.dare };

/**
 * "Al azar": the engine has already chosen; this only stages the choice so the group sees it land,
 * then the card appears on its own. With reduced motion it shows the result directly, briefly.
 */
export function RandomReveal({ result, onDone }: { result: PersonalType; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const faces = revealFaces(result);
  const last = faces.length - 1;
  const shown = reduced ? result : (faces[step] ?? result);
  const landed = reduced || step === last;

  useEffect(() => {
    if (reduced) {
      const id = window.setTimeout(onDone, REDUCED_HOLD_MS);
      return () => window.clearTimeout(id);
    }
    if (step < last) {
      const id = window.setTimeout(() => setStep(step + 1), FLIP_GAPS[step]);
      return () => window.clearTimeout(id);
    }
    if ('vibrate' in navigator) navigator.vibrate(30);
    const id = window.setTimeout(onDone, LANDED_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [step, last, reduced, onDone]);

  return (
    <div className={cx('roulette glass glass--thick', landed && 'roulette--landed')} data-testid="random-reveal">
      <span key={step} className="roulette__face">
        <Icon name={CARD_TYPE_ICONS[shown]} size={40} />
        <span className="roulette__word">{WORDS[shown]}</span>
      </span>
      <span className="visually-hidden" role="status">
        {landed ? WORDS[result] : es.play.random}
      </span>
    </div>
  );
}

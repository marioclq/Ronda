import { useEffect, useState } from 'react';
import type { PersonalType } from '../../core/game/engine';
import { es } from '../../i18n/es';
import { Button } from '../components/Button';
import { cx } from '../components/cx';
import { Icon } from '../components/Icon';
import { CARD_TYPE_ICONS } from '../components/typeIcons';
import { brakeFaces, brakeGap, OTHER_FACE } from '../logic/roulette';

/** Spinning flips at a steady pace until someone stops it, or on its own after a while. */
const SPIN_GAP_MS = 75;
const AUTO_STOP_MS = 3000;

type Stage = 'SPINNING' | 'BRAKING' | 'LANDED';

const WORDS: Readonly<Record<PersonalType, string>> = { TRUTH: es.play.truth, DARE: es.play.dare };

/**
 * "Al azar": the engine has already chosen. This only stages the choice so the group sees it land:
 * it spins, brakes when stopped (by hand or on its own) and always lands on `result`.
 * The card appears only when someone taps "Revelar pregunta". With reduced motion it starts landed.
 */
export function RandomReveal({ result, onDone }: { result: PersonalType; onDone: () => void }) {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [stage, setStage] = useState<Stage>(reduced ? 'LANDED' : 'SPINNING');
  const [face, setFace] = useState<PersonalType>(reduced ? result : OTHER_FACE[result]);
  const [braking, setBraking] = useState<{ readonly faces: readonly PersonalType[]; readonly step: number } | null>(null);

  useEffect(() => {
    if (stage !== 'SPINNING') return;
    const flip = window.setInterval(() => setFace((current) => OTHER_FACE[current]), SPIN_GAP_MS);
    const autoStop = window.setTimeout(() => setStage('BRAKING'), AUTO_STOP_MS);
    return () => {
      window.clearInterval(flip);
      window.clearTimeout(autoStop);
    };
  }, [stage]);

  useEffect(() => {
    if (stage !== 'BRAKING') return;
    if (braking === null) {
      setBraking({ faces: brakeFaces(face, result), step: 0 });
      return;
    }
    const next = braking.faces[braking.step];
    if (next === undefined) {
      setStage('LANDED');
      if ('vibrate' in navigator) navigator.vibrate(30);
      return;
    }
    const id = window.setTimeout(() => {
      setFace(next);
      setBraking({ faces: braking.faces, step: braking.step + 1 });
    }, brakeGap(braking.step));
    return () => window.clearTimeout(id);
  }, [stage, braking, face, result]);

  const landed = stage === 'LANDED';
  return (
    <div className="reveal" data-testid="random-reveal">
      <div className="reveal__status">
        <span className="pill">
          <Icon name="random" size={16} />
          {es.play.roulette.mode}
        </span>
        <span className="pill pill--live" data-stage={stage}>
          <span className="pill__dot" />
          {es.play.roulette[stage]}
        </span>
      </div>

      <div className={cx('roulette glass glass--thick', landed && 'roulette--landed')}>
        <span key={face} className="roulette__face">
          <span className="roulette__icon">
            <Icon name={CARD_TYPE_ICONS[face]} size={34} />
          </span>
          <span className="roulette__word">{WORDS[face]}</span>
        </span>
        {landed ? <p className="roulette__hint">{es.play.choiceHints[result]}</p> : null}
      </div>
      <span className="visually-hidden" role="status">
        {landed ? WORDS[result] : es.play.random}
      </span>

      {landed ? (
        <Button variant="primary" icon="next" onClick={onDone} data-testid="random-show">
          {es.play.roulette.reveal}
        </Button>
      ) : (
        <>
          <p className="reveal__hint">{es.play.roulette.deciding}</p>
          <Button variant="primary" icon="pause" disabled={stage !== 'SPINNING'} onClick={() => setStage('BRAKING')} data-testid="random-stop">
            {es.play.roulette.stop}
          </Button>
        </>
      )}
    </div>
  );
}

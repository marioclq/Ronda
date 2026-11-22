import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGlassStyle } from '../../app/GlassStyleContext';
import { useUserState } from '../../app/UserStateContext';
import { es } from '../../i18n/es';
import { DEFAULT_GLASS, GLASS_RANGES, GLASS_TINT_COLORS, type GlassNumber, type GlassStyle } from '../../store/glassStyle';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { Section } from '../components/Section';
import { Segmented } from '../components/Segmented';
import { Slider } from '../components/Slider';
import { LensGlass } from '../glass/LensGlass';
import { supportsRefraction } from '../glass/supportsRefraction';

/** Waits this long after the last change before saving, so dragging a slider does not write on every step. */
const SAVE_DELAY_MS = 400;

const GROUPS: readonly { readonly title: string; readonly keys: readonly GlassNumber[] }[] = [
  { title: es.glass.groups.surface, keys: ['frost', 'saturation', 'tint', 'film'] },
  { title: es.glass.groups.rim, keys: ['rim', 'rimDepth', 'curvature', 'dispersion', 'magnify'] },
  { title: es.glass.groups.depth, keys: ['depth'] },
];

function display(key: GlassNumber, value: number): string {
  switch (key) {
    case 'frost':
    case 'rimDepth':
      return es.glass.value.px(value);
    case 'saturation':
      return es.glass.value.percent(value);
    case 'tint':
    case 'rim':
    case 'depth':
      return es.glass.value.times(value);
    case 'film':
    case 'curvature':
    case 'dispersion':
    case 'magnify':
      return es.glass.value.plain(value);
  }
}

/** Ajustes → Vidrio: every glass parameter, previewed live on a card that bends what is behind it. */
export function GlassSettings({ onBack }: { onBack: () => void }) {
  const { update } = useUserState();
  const { style, preview } = useGlassStyle();
  const [draft, setDraft] = useState<GlassStyle>(style);
  const pending = useRef<GlassStyle | null>(null);
  const timer = useRef<number | null>(null);
  const bends = useMemo(() => supportsRefraction(), []);

  const save = useCallback((): void => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    const next = pending.current;
    pending.current = null;
    if (next !== null) update((current) => ({ ...current, settings: { ...current.settings, glass: next } }));
  }, [update]);

  const change = (next: GlassStyle): void => {
    setDraft(next);
    preview(next);
    pending.current = next;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(save, SAVE_DELAY_MS);
  };

  // Leaving the screen saves what is pending and ends the preview: the saved style takes over.
  useEffect(
    () => () => {
      save();
      preview(null);
    },
    [save, preview],
  );

  return (
    <Screen title={es.glass.title} onBack={onBack}>
      <div className="glass-preview" aria-label={es.glass.previewLabel} role="group">
        <div className="glass-preview__backdrop" aria-hidden="true" />
        <LensGlass thick className="stage__card glass-preview__card" data-testid="glass-preview">
          {es.glass.previewCard}
        </LensGlass>
      </div>
      {bends && !draft.reduceTransparency ? null : <p className="section__note">{es.glass.refractionOff}</p>}

      {GROUPS.map((group) => (
        <Section key={group.title} plain title={group.title}>
          {group.keys.map((key) => (
            <Slider
              key={key}
              label={es.glass.labels[key]}
              hint={es.glass.hints[key]}
              value={draft[key]}
              display={display(key, draft[key])}
              {...GLASS_RANGES[key]}
              onChange={(value) => change({ ...draft, [key]: value })}
              testId={`glass-${key}`}
            />
          ))}
          {group.keys.includes('tint') ? (
            <div className="field">
              <span className="field__label">{es.glass.tintColor}</span>
              <Segmented
                label={es.glass.tintColor}
                options={GLASS_TINT_COLORS.map((value) => ({ value, label: es.glass.tintColors[value] }))}
                value={draft.tintColor}
                onChange={(tintColor) => change({ ...draft, tintColor })}
                testIdPrefix="glass-tint-color"
              />
            </div>
          ) : null}
        </Section>
      ))}

      <Section plain title={es.glass.groups.light}>
        <button
          type="button"
          className="chip glass-toggle"
          aria-pressed={draft.tiltLight}
          onClick={() => change({ ...draft, tiltLight: !draft.tiltLight })}
          data-testid="glass-tilt-light"
        >
          <Icon name={draft.tiltLight ? 'check' : 'sparkle'} size={18} />
          {es.glass.tiltLight}
        </button>
        <p className="section__note">{es.glass.tiltHelp}</p>
      </Section>

      <Section plain title={es.glass.groups.access}>
        <button
          type="button"
          className="chip glass-toggle"
          aria-pressed={draft.reduceTransparency}
          onClick={() => change({ ...draft, reduceTransparency: !draft.reduceTransparency })}
          data-testid="glass-reduce-transparency"
        >
          <Icon name={draft.reduceTransparency ? 'check' : 'lock'} size={18} />
          {es.glass.reduceTransparency}
        </button>
        <p className="section__note">{es.glass.reduceHelp}</p>
      </Section>

      <Button icon="replay" onClick={() => change(DEFAULT_GLASS)} data-testid="glass-reset">
        {es.glass.reset}
      </Button>
    </Screen>
  );
}

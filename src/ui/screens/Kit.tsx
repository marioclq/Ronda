import { useState } from 'react';
import type { Level } from '../../core/content/types';
import { LEVELS } from '../../core/content/types';
import { es } from '../../i18n/es';
import { THEMES, type Theme } from '../../store/userState';
import { Aurora } from '../components/Aurora';
import { Avatar, AvatarStack } from '../components/Avatar';
import { Button } from '../components/Button';
import { Glass } from '../components/Glass';
import { Screen } from '../components/Screen';
import { Segmented } from '../components/Segmented';
import { LensGlass } from '../glass/LensGlass';
import { useAppearance } from '../theme/useAppearance';

const THEME_ICONS = { SYSTEM: 'monitor', LIGHT: 'sun', DARK: 'moon' } as const;
const SAMPLE_PLAYERS = ['Ana', 'Beto', 'Cami', 'Dani'];

/** Visual check of every component in every level and theme. Dev only. */
export function Kit() {
  const [level, setLevel] = useState<Level>('SOFT');
  const [theme, setTheme] = useState<Theme>('DARK');
  const [chip, setChip] = useState(true);
  useAppearance(theme, level);

  return (
    <>
      <Aurora />
      <Screen title={es.kit.title}>
        <Segmented
          label={es.kit.level}
          options={LEVELS.map((value) => ({ value, label: es.setup.levelNames[value], icon: 'flame', level: value }))}
          value={level}
          onChange={setLevel}
          testIdPrefix="kit-level"
        />
        <Segmented
          label={es.kit.theme}
          options={THEMES.map((value) => ({ value, label: es.settings.themes[value], icon: THEME_ICONS[value] }))}
          value={theme}
          onChange={setTheme}
          testIdPrefix="kit-theme"
        />

        <div className="row">
          {SAMPLE_PLAYERS.map((name) => (
            <Avatar key={name} name={name} size={2.25} />
          ))}
          <AvatarStack names={SAMPLE_PLAYERS} />
        </div>

        <div className="row">
          <button type="button" className="chip" aria-pressed={chip} onClick={() => setChip(!chip)}>
            {es.setup.modeNames.TRUTH_OR_DARE}
          </button>
          <button type="button" className="chip" aria-pressed={!chip} onClick={() => setChip(!chip)}>
            {es.setup.modeNames.NEVER}
          </button>
        </div>

        <LensGlass thick className="stage__card">
          {es.kit.sampleCard}
        </LensGlass>
        <Glass className="panel">{es.kit.flat}</Glass>

        <Button variant="primary" icon="play">
          {es.kit.primary}
        </Button>
        <div className="stage__actions">
          <Button icon="check">{es.kit.glass}</Button>
          <Button variant="quiet" icon="swap">
            {es.kit.quiet}
          </Button>
        </div>
        <input className="input" placeholder={es.kit.input} />
        <p className="banner">{es.kit.error}</p>
      </Screen>
    </>
  );
}

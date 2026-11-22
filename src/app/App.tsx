import { useState } from 'react';
import type { Level } from '../core/content/types';
import { es } from '../i18n/es';
import type { UserStore } from '../store/userStore';
import { Aurora } from '../ui/components/Aurora';
import { Screen } from '../ui/components/Screen';
import { DateMode } from '../ui/screens/DateMode';
import { Home } from '../ui/screens/Home';
import { Kit } from '../ui/screens/Kit';
import { MyCards } from '../ui/screens/MyCards';
import { Play } from '../ui/screens/Play';
import { Players } from '../ui/screens/Players';
import { Settings } from '../ui/screens/Settings';
import { Setup } from '../ui/screens/Setup';
import { canReplay } from '../ui/logic/setupLogic';
import { useTheme } from '../ui/theme/useAppearance';
import { MIN_PLAYERS } from '../core/game/engine';
import { CardsProvider } from './CardsContext';
import { GameProvider, useGame } from './GameContext';
import { navigate, type Route } from './route';
import { useRoute } from './useRoute';
import { UserStateProvider, useUserState } from './UserStateContext';

interface RouteContext {
  readonly tonight: readonly string[];
  readonly setTonight: (ids: readonly string[]) => void;
  readonly discardGame: () => void;
  readonly replay: { readonly onReplay: () => void; readonly summary: string } | null;
  /** Players screen first only when there are not enough saved players to start. */
  readonly newGameRoute: 'players' | 'setup';
  /** Chosen on the home screen and preselected in setup. */
  readonly level: Level;
  readonly setLevel: (level: Level) => void;
}

function renderRoute(route: Route, ctx: RouteContext) {
  switch (route.name) {
    case 'home':
      return (
        <Home
          replay={ctx.replay}
          level={ctx.level}
          onLevelChange={ctx.setLevel}
          onNewGame={() => {
            ctx.discardGame();
            navigate(ctx.newGameRoute);
          }}
          onDate={() => navigate('date')}
          onMyCards={() => navigate('cards')}
          onSettings={() => navigate('settings')}
        />
      );
    case 'players':
      return (
        <Players
          tonight={ctx.tonight}
          onTonightChange={ctx.setTonight}
          onBack={() => navigate('home')}
          onContinue={() => navigate('setup')}
        />
      );
    case 'setup':
      return (
        <Setup
          tonight={ctx.tonight}
          onTonightChange={ctx.setTonight}
          level={ctx.level}
          onLevelChange={ctx.setLevel}
          onEditPlayers={() => navigate('players')}
          onBack={() => navigate('home')}
          onStarted={() => navigate('play')}
        />
      );
    case 'play':
      return <Play />;
    case 'date':
      return <DateMode tonight={ctx.tonight} onExit={() => navigate('home')} />;
    case 'cards':
      return <MyCards onBack={() => navigate('home')} />;
    case 'settings':
      return (
        <Settings
          onBack={() => navigate('home')}
          onBackupImported={(players) => ctx.setTonight(players.map((p) => p.id))}
        />
      );
    case 'unknown':
      return (
        <Screen title={es.appName} onBack={() => navigate('home')}>
          <p className="banner" role="alert">
            {es.errors.unknownRoute(route.hash)}
          </p>
        </Screen>
      );
    default:
      return (
        <Screen title={es.appName} onBack={() => navigate('home')}>
          <p className="banner" role="alert">
            {es.errors.unknownRoute(route.name)}
          </p>
        </Screen>
      );
  }
}

function Shell() {
  const route = useRoute();
  const { state, saveError } = useUserState();
  const { discard, start } = useGame();
  useTheme(state.settings.theme);
  const [tonight, setTonight] = useState<readonly string[]>(() => state.players.map((p) => p.id));
  const [level, setLevel] = useState<Level>(() => state.settings.lastConfig?.level ?? 'SOFT');

  const playing = state.players.filter((p) => tonight.includes(p.id));
  const last = state.settings.lastConfig;
  const replay = canReplay(last, playing.length)
    ? {
        summary: es.home.replaySummary(
          last.modes.map((mode) => es.setup.modeNames[mode]).join(', '),
          es.setup.levelNames[last.level],
        ),
        onReplay: () => {
          discard();
          // A failed start (e.g. a mode without cards) is shown on the setup screen.
          navigate(start(last, playing, false) ? 'play' : 'setup');
        },
      }
    : null;
  const newGameRoute = state.players.length >= MIN_PLAYERS ? 'setup' : 'players';

  if (import.meta.env.DEV && route.name === 'kit') return <Kit />;
  return (
    <>
      <Aurora />
      {saveError === null ? null : (
        <p className="banner" role="alert" data-testid="save-error">
          {saveError}
        </p>
      )}
      {renderRoute(route, { tonight, setTonight, discardGame: discard, replay, newGameRoute, level, setLevel })}
    </>
  );
}

export function App({ store }: { store: UserStore }) {
  return (
    <UserStateProvider store={store}>
      <CardsProvider>
        <GameProvider>
          <Shell />
        </GameProvider>
      </CardsProvider>
    </UserStateProvider>
  );
}

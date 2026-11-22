import { expect, test, type Page } from '@playwright/test';

// Screenshot tour of the whole app, for review. Not part of the suite: runs only with SHOTS_DIR set.
//   SHOTS_DIR=capturas/v2-fase-a npx playwright test tests/e2e/screenshots.spec.ts
const dir = process.env.SHOTS_DIR;
test.skip(dir === undefined, 'screenshots only when SHOTS_DIR is set');
test.use({ serviceWorkers: 'block' });

const SETTLE_MS = 900;

function shooter(page: Page, theme: string) {
  let n = 0;
  return async (name: string, options: { fullPage?: boolean; settle?: boolean } = {}): Promise<void> => {
    if (options.settle !== false) await page.waitForTimeout(SETTLE_MS);
    n += 1;
    await page.screenshot({ path: `${dir}/${theme}/${String(n).padStart(2, '0')}-${name}.png`, fullPage: options.fullPage ?? false });
  };
}

async function addPlayer(page: Page, name: string, gender: string, attraction: string): Promise<void> {
  await page.getByTestId('player-add').click();
  await page.getByTestId('player-name').fill(name);
  await page.getByTestId(`player-gender-${gender}`).click();
  await page.getByTestId(`player-attraction-${attraction}`).click();
  await page.getByTestId('player-save').click();
  await expect(page.getByTestId('player-sheet')).toHaveCount(0);
}

async function seedPlayers(page: Page): Promise<void> {
  await page.goto('/#/players');
  await addPlayer(page, 'Ana', 'WOMAN', 'MEN');
  await addPlayer(page, 'Beto', 'MAN', 'WOMEN');
  await addPlayer(page, 'Cami', 'OTHER', 'ANYONE');
}

test.describe('dark', () => {
  test.use({ colorScheme: 'dark' });

  test('full tour', async ({ page }) => {
    test.setTimeout(240_000);
    const shot = shooter(page, 'oscuro');

    // Home and players
    await page.goto('/');
    await shot('inicio-primera-vez');
    await page.getByTestId('home-new-game').click();
    await shot('jugadores-vacio');
    await page.getByTestId('player-add').click();
    await page.getByTestId('player-name').fill('Ana');
    await page.getByTestId('player-gender-WOMAN').click();
    await page.getByTestId('player-attraction-MEN').click();
    await shot('jugadores-hoja-agregar');
    await page.getByTestId('player-save').click();
    await addPlayer(page, 'Beto', 'MAN', 'WOMEN');
    await addPlayer(page, 'Cami', 'OTHER', 'ANYONE');
    await shot('jugadores-lista');

    // Setup and levels
    await page.getByTestId('players-continue').click();
    await shot('configurar-suave', { fullPage: true });
    await page.getByTestId('level-SPICY').click();
    await page.waitForTimeout(1200);
    await shot('configurar-picante', { fullPage: true });
    await page.getByTestId('level-EXTREME').click();
    await shot('confirmacion-mas-18');
    await page.getByTestId('adult-confirm').click();
    await page.waitForTimeout(1200);
    await shot('configurar-extremo', { fullPage: true });
    await page.getByTestId('level-SOFT').click();
    await page.getByTestId('penalty-DRINKS').click();
    await page.getByTestId('drinks-2').click();
    await page.waitForTimeout(1200);
    await shot('configurar-castigo-tragos', { fullPage: true });

    // Truth or dare
    await page.getByTestId('setup-start').click();
    await shot('turno-eleccion');
    await page.getByTestId('choice-random').click();
    await page.waitForTimeout(350);
    await shot('al-azar-girando', { settle: false });
    await page.getByTestId('random-stop').click();
    await page.waitForTimeout(250);
    await shot('al-azar-frenando', { settle: false });
    await expect(page.getByTestId('random-show')).toBeVisible({ timeout: 5000 });
    await shot('al-azar-resultado');
    await page.getByTestId('random-show').click();
    await expect(page.getByTestId('card-text')).toBeVisible();
    await shot('carta-personal');
    await page.getByTestId('card-replace').click();
    await shot('otra-carta-motivo');
    await page.getByTestId('replace-unclear').click();
    await shot('otra-carta-nueva');
    await page.getByTestId('card-refuse').click();
    await shot('castigo-y-deshacer');
    await page.getByTestId('undo-button').click();
    await shot('deshacer-vuelve-la-carta');
    await page.getByTestId('card-complete').click();

    // A dare with a countdown (cards are random: keep choosing dare until one has a timer)
    let timed = false;
    for (let turn = 0; turn < 25 && !timed; turn += 1) {
      await page.getByTestId('choice-dare').click();
      await expect(page.getByTestId('card-text')).toBeVisible();
      timed = (await page.getByTestId('timer-start').count()) > 0;
      if (!timed) await page.getByTestId('card-complete').click();
    }
    if (timed) {
      await shot('reto-con-cuenta');
      await page.getByTestId('timer-start').click();
      await page.waitForTimeout(2500);
      await shot('reto-cuenta-corriendo', { settle: false });
      await page.getByTestId('timer-pause').click();
      await shot('reto-cuenta-en-pausa');
      await page.getByTestId('card-complete').click();
    }

    // In-game menu and end
    await page.getByTestId('play-menu').click();
    await shot('menu-partida');
    await page.getByTestId('menu-end').click();
    await shot('menu-terminar-confirmar');
    await page.getByTestId('menu-end-yes').click();
    await shot('partida-terminada');
    await page.getByTestId('ended-home').click();
    await shot('inicio-jugar-otra-vez');

    // Group card
    await page.getByTestId('home-new-game').click();
    await page.getByTestId('mode-TRUTH_OR_DARE').click();
    await page.getByTestId('mode-NEVER').click();
    await page.getByTestId('setup-start').click();
    await expect(page.getByTestId('card-next')).toBeVisible();
    await shot('carta-grupal-yo-nunca');
    await page.goto('/#/');

    // My cards and settings
    await page.getByTestId('home-cards').click();
    await shot('mis-cartas-vacio', { fullPage: true });
    await page.getByTestId('card-input').fill('¿Cuál fue tu primera impresión de mí?');
    await page.getByTestId('card-add').click();
    await shot('mis-cartas-con-una', { fullPage: true });
    await page.goto('/#/settings');
    await shot('ajustes', { fullPage: true });

    // Date mode
    await page.goto('/#/');
    await page.getByTestId('home-date').click();
    await page.getByTestId('date-player').nth(0).click();
    await page.getByTestId('date-player').nth(1).click();
    await shot('cita-configurar', { fullPage: true });
    await page.getByTestId('date-begin').click();
    await shot('cita-acuerdo');
    await page.getByTestId('date-agree').click();
    await page.getByTestId('ios-option-3').click();
    await shot('cita-cercania-antes');
    await page.getByTestId('ios-confirm').click();
    await page.getByTestId('ios-option-4').click();
    await page.getByTestId('ios-confirm').click();
    await shot('cita-pregunta-1');
    for (let i = 0; i < 10; i += 1) await page.getByTestId('date-next').click();
    await shot('cita-pregunta-11-cuenta');
    await page.getByTestId('date-next').click();
    await page.getByTestId('date-next').click();
    await shot('cita-pausa-entre-sets');
    await page.getByTestId('date-finish').click();
    for (const value of [5, 6]) {
      await page.getByTestId(`ios-option-${value}`).click();
      await page.getByTestId('ios-confirm').click();
    }
    await shot('cita-resultado');
    await page.getByTestId('date-done').click();
    await page.getByTestId('home-date').click();
    await page.getByTestId('date-add-person').click();
    await shot('cita-agregar-persona');
    await page.keyboard.press('Escape');
    await page.goto('/#/settings');
    await page.getByTestId('privacy-view').click();
    await shot('ajustes-ver-registro-confirmar');
    await page.getByTestId('privacy-view-yes').click();
    await shot('ajustes-registro-de-citas', { fullPage: true });
  });
});

test.describe('light', () => {
  test.use({ colorScheme: 'light' });

  test('key screens', async ({ page }) => {
    test.setTimeout(120_000);
    const shot = shooter(page, 'claro');
    await page.goto('/');
    await shot('inicio');
    await seedPlayers(page);
    await shot('jugadores-lista');
    await page.getByTestId('players-continue').click();
    await shot('configurar-suave', { fullPage: true });
    await page.getByTestId('level-SPICY').click();
    await page.waitForTimeout(1200);
    await page.getByTestId('setup-start').click();
    await shot('turno-eleccion-picante');
    await page.getByTestId('choice-truth').click();
    await shot('carta-personal-picante');
    await page.goto('/#/');
    await page.getByTestId('home-date').click();
    await page.getByTestId('date-player').nth(0).click();
    await page.getByTestId('date-player').nth(1).click();
    await page.getByTestId('date-begin').click();
    await page.getByTestId('date-agree').click();
    for (const value of [3, 4]) {
      await page.getByTestId(`ios-option-${value}`).click();
      await page.getByTestId('ios-confirm').click();
    }
    await shot('cita-pregunta-1');
    await page.goto('/#/settings');
    await shot('ajustes', { fullPage: true });
  });
});

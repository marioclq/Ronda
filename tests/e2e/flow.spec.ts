import { expect, test, type Page } from '@playwright/test';

// These tests are about the game, not the service worker: block it so request events are not hidden.
test.use({ serviceWorkers: 'block' });

async function addPlayer(page: Page, name: string): Promise<void> {
  await page.getByTestId('player-add').click();
  await page.getByTestId('player-name').fill(name);
  await page.getByTestId('player-save').click();
  await expect(page.getByTestId('player-sheet')).toHaveCount(0);
}

async function reachSetup(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTestId('home-new-game').click();
  await addPlayer(page, 'Ana');
  await addPlayer(page, 'Beto');
  await expect(page.getByTestId('player-row')).toHaveCount(2);
  await page.getByTestId('players-continue').click();
}

test('two players, truth, and a card on screen', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) violations.push(message.text());
  });

  await reachSetup(page);
  await page.getByTestId('setup-start').click();
  await expect(page.getByTestId('turn-name')).toBeVisible();
  await page.getByTestId('choice-truth').click();
  await expect(page.getByTestId('card-text')).not.toBeEmpty();
  // Playwright's Pixel 7 is Chromium, so the refraction layer must be on. This proves the layer is wired, not that it looks right.
  await expect(page.getByTestId('play-card')).toHaveAttribute('data-refract', 'true');
  await page.getByTestId('card-complete').click();
  await expect(page.getByTestId('turn-name')).toBeVisible();
  expect(violations).toEqual([]);
});

test('players survive a reload', async ({ page }) => {
  await page.goto('/#/players');
  await addPlayer(page, 'Ana');
  await page.reload();
  await expect(page.getByTestId('player-row')).toHaveCount(1);
});

test('the extreme level asks for +18 and only then loads its cards', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));

  await reachSetup(page);
  expect(requested.some((url) => url.includes('extreme'))).toBe(false);

  await page.getByTestId('level-EXTREME').click();
  await expect(page.getByTestId('adult-dialog')).toBeVisible();
  // Enter must not confirm +18 by default: focus starts on the cancel button.
  await expect(page.getByTestId('adult-cancel')).toBeFocused();
  await page.getByTestId('adult-cancel').click();
  await expect(page.getByTestId('level-EXTREME')).toHaveAttribute('aria-pressed', 'false');
  expect(requested.some((url) => url.includes('extreme'))).toBe(false);

  await page.getByTestId('level-EXTREME').click();
  await page.getByTestId('adult-confirm').click();
  await expect(page.getByTestId('level-EXTREME')).toHaveAttribute('aria-pressed', 'true');
  expect(requested.some((url) => url.includes('extreme'))).toBe(true);

  await page.getByTestId('setup-start').click();
  await page.getByTestId('choice-truth').click();
  await expect(page.getByTestId('card-text')).not.toBeEmpty();
});

test('makes no requests outside its own origin and blocks them with the CSP', async ({ page, baseURL }) => {
  if (baseURL === undefined) throw new Error('baseURL is not configured');
  const origins = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' || url.protocol === 'https:') origins.add(url.origin);
  });

  await reachSetup(page);
  await page.getByTestId('setup-start').click();
  await page.getByTestId('choice-truth').click();
  await expect(page.getByTestId('card-text')).not.toBeEmpty();
  expect([...origins]).toEqual([new URL(baseURL).origin]);

  const outcome = await page.evaluate(() => fetch('https://example.com/').then(() => 'allowed', () => 'blocked'));
  expect(outcome).toBe('blocked');
});

async function readSavedState(page: Page): Promise<{ history: Record<string, number> }> {
  return page.evaluate(
    () =>
      new Promise<{ history: Record<string, number> }>((resolve, reject) => {
        const open = indexedDB.open('party-questions');
        open.onerror = () => reject(new Error(`Cannot open party-questions: ${open.error?.message ?? 'unknown error'}`));
        open.onsuccess = () => {
          const get = open.result.transaction('state', 'readonly').objectStore('state').get('user-state');
          get.onerror = () => reject(new Error(`Cannot read user-state: ${get.error?.message ?? 'unknown error'}`));
          get.onsuccess = () => resolve(get.result as { history: Record<string, number> });
        };
      }),
  );
}

test('the played card history and the last setup survive a reload', async ({ page }) => {
  await reachSetup(page);
  await page.getByTestId('penalty-GARMENT').click();
  await expect(page.getByTestId('penalty-GARMENT')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('setup-start').click();
  await page.getByTestId('choice-truth').click();
  await expect(page.getByTestId('card-text')).not.toBeEmpty();

  await expect.poll(async () => Object.keys((await readSavedState(page)).history).length).toBeGreaterThanOrEqual(1);

  await page.reload();
  expect(Object.keys((await readSavedState(page)).history).length).toBeGreaterThanOrEqual(1);

  await page.goto('/#/setup');
  await expect(page.getByTestId('penalty-GARMENT')).toHaveAttribute('aria-pressed', 'true');
});

test('home offers to play again with the last setup, in one tap', async ({ page }) => {
  await reachSetup(page);
  await page.getByTestId('setup-start').click();
  await expect(page.getByTestId('turn-name')).toBeVisible();

  await page.goto('/#/');
  await page.getByTestId('home-replay').click();
  await expect(page.getByTestId('turn-name')).toBeVisible();
});

test('new game goes straight to setup once two players are saved, and setup can drop a player', async ({ page }) => {
  await reachSetup(page);
  await page.goto('/#/');
  await page.getByTestId('home-new-game').click();
  await expect(page.getByTestId('setup-start')).toBeVisible();

  await page.getByTestId('setup-player').first().click();
  await expect(page.getByTestId('setup-start')).toBeDisabled();
});

test('the level chosen on home is preselected in setup, and a change in setup shows back on home', async ({ page }) => {
  await reachSetup(page);
  await page.goto('/#/');
  await page.getByTestId('home-level-SPICY').click();
  await page.getByTestId('home-new-game').click();
  await expect(page.getByTestId('level-SPICY')).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('level-SOFT').click();
  await page.getByTestId('screen-back').click();
  await expect(page.getByTestId('home-level-SOFT')).toHaveAttribute('aria-pressed', 'true');
});

test('random choice spins until stopped, lands, and shows the card only when revealed', async ({ page }) => {
  await reachSetup(page);
  await page.getByTestId('setup-start').click();
  await page.getByTestId('choice-random').click();
  await expect(page.getByTestId('random-reveal')).toBeVisible();
  await page.getByTestId('random-stop').click();
  await expect(page.getByTestId('random-show')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('card-text')).toHaveCount(0);
  await page.getByTestId('random-show').click();
  await expect(page.getByTestId('card-text')).not.toBeEmpty();
  await expect(page.getByTestId('random-reveal')).toHaveCount(0);
});

test('random choice stops on its own when nobody stops it', async ({ page }) => {
  await reachSetup(page);
  await page.getByTestId('setup-start').click();
  await page.getByTestId('choice-random').click();
  await expect(page.getByTestId('random-show')).toBeVisible({ timeout: 8000 });
});

test('date mode: agreement, closeness before, the 36 questions in order, closeness after', async ({ page }) => {
  await reachSetup(page);
  await page.goto('/#/');
  await page.getByTestId('home-date').click();
  await expect(page.getByTestId('date-player')).toHaveCount(2);
  await page.getByTestId('date-begin').click();
  await page.getByTestId('date-agree').click();
  for (const value of [3, 4]) {
    await page.getByTestId(`ios-option-${value}`).click();
    await page.getByTestId('ios-confirm').click();
  }
  await expect(page.getByTestId('date-question')).toContainText('invitado a cenar');
  await page.getByTestId('date-next').click();
  await expect(page.getByTestId('date-question')).toContainText('famoso');
  await page.getByTestId('date-finish').click();
  for (const value of [5, 6]) {
    await page.getByTestId(`ios-option-${value}`).click();
    await page.getByTestId('ios-confirm').click();
  }
  await expect(page.getByTestId('date-result')).toBeVisible();

  // The finished date is saved and survives a reload, but date mode never shows it.
  await page.reload();
  await page.goto('/#/date');
  await expect(page.getByTestId('date-begin')).toBeVisible();
  await expect(page.getByTestId('date-record')).toHaveCount(0);

  // It shows only in settings, after an explicit confirmation, and can be erased.
  await page.goto('/#/settings');
  await expect(page.getByTestId('date-record')).toHaveCount(0);
  await page.getByTestId('privacy-view').click();
  await page.getByTestId('privacy-view-yes').click();
  await expect(page.getByTestId('date-record')).toHaveCount(1);
  await page.getByTestId('privacy-clear').click();
  await page.getByTestId('privacy-clear-yes').click();
  await expect(page.getByTestId('date-record')).toHaveCount(0);
  await expect(page.getByTestId('privacy-view')).toBeDisabled();
});

test('date mode can add the other person right there, and picks them for the date', async ({ page }) => {
  await page.goto('/#/date');
  await expect(page.getByTestId('date-begin')).toBeDisabled();
  for (const name of ['Ana', 'Beto']) {
    await page.getByTestId('date-add-person').click();
    await page.getByTestId('player-name').fill(name);
    await page.getByTestId('player-save').click();
    await expect(page.getByTestId('player-sheet')).toHaveCount(0);
  }
  await expect(page.getByTestId('date-player')).toHaveCount(2);
  await expect(page.getByTestId('date-begin')).toBeEnabled();
  await page.getByTestId('date-begin').click();
  await expect(page.getByTestId('date-agree')).toBeVisible();
});

test('a passed card can be undone, and "another card" swaps it and records why', async ({ page }) => {
  await reachSetup(page);
  await page.getByTestId('setup-start').click();
  await page.getByTestId('choice-truth').click();
  const first = await page.getByTestId('card-text').innerText();

  await page.getByTestId('card-refuse').click();
  await expect(page.getByTestId('undo-toast')).toBeVisible();
  await page.getByTestId('undo-button').click();
  await expect(page.getByTestId('card-text')).toHaveText(first);

  await page.getByTestId('card-replace').click();
  await page.getByTestId('replace-unclear').click();
  await expect(page.getByTestId('card-text')).not.toHaveText(first);

  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          new Promise<string[]>((resolve, reject) => {
            const open = indexedDB.open('party-questions');
            open.onerror = () => reject(new Error('cannot open db'));
            open.onsuccess = () => {
              const get = open.result.transaction('state', 'readonly').objectStore('state').get('user-state');
              get.onsuccess = () =>
                resolve((get.result as { events: { outcome: string; reason?: string }[] }).events.map((e) => `${e.outcome}:${e.reason ?? ''}`));
              get.onerror = () => reject(new Error('cannot read user-state'));
            };
          }),
      ),
    )
    .toEqual(['REPLACED:UNCLEAR']);
});

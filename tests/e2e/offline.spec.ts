import { expect, test, type Page } from '@playwright/test';

async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test('opens and plays offline after the first visit, including the extreme level', async ({ page, context }) => {
  await page.goto('/');
  await waitForServiceWorkerControl(page);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('home')).toBeVisible();

  await page.getByTestId('home-new-game').click();
  for (const name of ['Ana', 'Beto']) {
    await page.getByTestId('player-add').click();
    await page.getByTestId('player-name').fill(name);
    await page.getByTestId('player-save').click();
  }
  await page.getByTestId('players-continue').click();
  await page.getByTestId('level-EXTREME').click();
  await page.getByTestId('adult-confirm').click();
  await expect(page.getByTestId('level-EXTREME')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('setup-start').click();
  await page.getByTestId('choice-truth').click();
  await expect(page.getByTestId('card-text')).not.toBeEmpty();
});

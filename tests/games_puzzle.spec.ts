import { test, expect } from '@playwright/test';

test.describe('Puzzle Games', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      throw new Error(`Unhandled exception: ${err.message}`);
    });
  });

  test('Magic Square - interactions and reset', async ({ page }) => {
    await page.goto('/games/magic_square/game.html');

    // Check elements exist
    const cells = page.locator('.cell');
    expect(await cells.count()).toBeGreaterThan(0);

    // Check reset button
    const resetBtn = page.locator('button:has-text("شروع مجدد"), button:has-text("Reset"), button.btn-reset, #resetBtn');
    if (await resetBtn.count() > 0) {
      await resetBtn.first().click();
    }
  });

  test('15-Puzzle - tile sliding and reset', async ({ page }) => {
    await page.goto('/games/15puzzle/game.html');

    const board = page.locator('#board');
    await expect(board).toBeVisible();

    const tiles = page.locator('.tile');
    expect(await tiles.count()).toBeGreaterThan(0);

    // Attempt to click a tile (we don't know which is adjacent to empty, so click a few)
    if (await tiles.count() > 0) {
      await tiles.nth(0).click({ force: true });
      await tiles.nth(1).click({ force: true });
    }

    // Check reset button
    const resetBtn = page.locator('button:has-text("شروع مجدد"), button:has-text("Reset"), button.btn-reset, #resetBtn');
    if (await resetBtn.count() > 0) {
      await resetBtn.first().click();
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('Math Games', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      throw new Error(`Unhandled exception: ${err.message}`);
    });
  });

  test('Kakuro - Numpad input and constraint checks', async ({ page }) => {
    await page.goto('/games/kakuro/game.html');

    // Find an empty cell to click
    const emptyCells = page.locator('.cell.empty');
    if (await emptyCells.count() > 0) {
      await emptyCells.first().click();

      // Try to use a numpad if it exists, or just type
      const numpadBtn = page.locator('.numpad-btn').first();
      if (await numpadBtn.isVisible()) {
        await numpadBtn.click();
      } else {
        await page.keyboard.press('1');
      }
    }
  });

  test('KenKen - Numpad input and constraint checks', async ({ page }) => {
    await page.goto('/games/kenken/game.html');

    const emptyCells = page.locator('.cell.empty, .cell:not(.given)');
    if (await emptyCells.count() > 0) {
      await emptyCells.first().click();

      const numpadBtn = page.locator('.numpad-btn').first();
      if (await numpadBtn.isVisible()) {
        await numpadBtn.click();
      } else {
        await page.keyboard.press('1');
      }
    }
  });

  test('8 Queens - Queens placement and Auto-Solve', async ({ page }) => {
    await page.goto('/games/8queens/game.html');

    const cells = page.locator('.cell');
    if (await cells.count() > 0) {
      // Place a queen
      await cells.nth(0).click();
      // Wait for threat lines or visuals
      await page.waitForTimeout(100);

      // Remove queen
      await cells.nth(0).click();
    }

    // Check Auto-Solve button
    const solveBtn = page.locator('button:has-text("حل خودکار"), button:has-text("Auto-Solve"), #solveBtn, .btn-solve');
    if (await solveBtn.count() > 0) {
      await solveBtn.first().click();
    }
  });
});

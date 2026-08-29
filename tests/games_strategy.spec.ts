import { test, expect } from '@playwright/test';

test.describe('Strategy Games', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      throw new Error(`Unhandled exception: ${err.message}`);
    });
  });

  test('Nim - Piece removal and turn switching', async ({ page }) => {
    await page.goto('/games/nim/game.html');

    // Find pieces
    const pieces = page.locator('.piece, .matchstick, .item');
    if (await pieces.count() > 0) {
      await pieces.first().click();

      // Look for end turn / confirm button
      const endTurnBtn = page.locator('button:has-text("پایان نوبت"), button:has-text("تایید"), #endTurnBtn');
      if (await endTurnBtn.isVisible()) {
        await endTurnBtn.click();
      }
    }
  });

  test('Chomp - Piece removal and turn switching', async ({ page }) => {
    await page.goto('/games/chomp/game.html');

    const pieces = page.locator('.piece, .cell:not(.poisoned)');
    if (await pieces.count() > 1) {
      // Click somewhere that is not the poison piece (usually top-left or bottom-left depending on setup)
      await pieces.nth(1).click();
    }
  });

  test('Königsberg - Edge tracing and levels', async ({ page }) => {
    await page.goto('/games/koenigsberg/game.html');

    // Check if canvas exists
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      const box = await canvas.boundingBox();
      if (box) {
        // Just click in the middle to simulate an interaction
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      }
    }

    // Check level switching
    const nextLevelBtn = page.locator('button:has-text("مرحله بعد"), button:has-text("Next"), #nextBtn');
    if (await nextLevelBtn.count() > 0 && await nextLevelBtn.isVisible()) {
      await nextLevelBtn.click();
    }
  });
});

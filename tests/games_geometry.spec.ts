import { test, expect } from '@playwright/test';

test.describe('Geometry Games', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      throw new Error(`Unhandled exception: ${err.message}`);
    });
  });

  test('Hex - Canvas/SVG interactions', async ({ page }) => {
    await page.goto('/games/hex/game.html');

    // Check if canvas or SVG exists
    const canvas = page.locator('canvas, svg');
    if (await canvas.count() > 0 && await canvas.first().isVisible()) {
      const box = await canvas.first().boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      }
    }
  });

  test('Sprouts - Canvas/SVG interactions', async ({ page }) => {
    await page.goto('/games/sprouts/game.html');

    const canvas = page.locator('canvas, svg');
    if (await canvas.count() > 0 && await canvas.first().isVisible()) {
      const box = await canvas.first().boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 3, box.y + box.height / 3);
        await page.mouse.down();
        await page.mouse.move(box.x + (box.width / 3) * 2, box.y + (box.height / 3) * 2);
        await page.mouse.up();
      }
    }
  });

  test('Tangram - Drag/drop and rotation', async ({ page }) => {
    await page.goto('/games/tangram/game.html');

    const pieces = page.locator('.piece, svg path');
    if (await pieces.count() > 0) {
      const firstPiece = pieces.first();
      // Try to rotate if there is a button or double click
      await firstPiece.click();

      const rotateBtn = page.locator('button:has-text("چرخش"), button:has-text("Rotate"), #rotateBtn');
      if (await rotateBtn.isVisible()) {
        await rotateBtn.click();
      }
    }
  });

  test('Pentominoes - Drag/drop, rotation, flips', async ({ page }) => {
    await page.goto('/games/pentominoes/game.html');

    const pieces = page.locator('.piece, .pentomino');
    if (await pieces.count() > 0) {
      const firstPiece = pieces.first();
      await firstPiece.click();

      const flipBtn = page.locator('button:has-text("قرینه"), button:has-text("Flip"), #flipBtn');
      if (await flipBtn.isVisible()) {
        await flipBtn.click();
      }
    }
  });
});

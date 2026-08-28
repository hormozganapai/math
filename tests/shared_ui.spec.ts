import { test, expect } from '@playwright/test';

// List of games to test the shared UI on
const gamesToTest = [
  '/games/magic_square/game.html',
  '/games/15puzzle/game.html',
  '/games/kakuro/game.html',
  '/games/kenken/game.html',
  '/games/nim/game.html',
  '/games/chomp/game.html',
  '/games/hex/game.html',
  '/games/sprouts/game.html',
  '/games/tangram/game.html',
  '/games/pentominoes/game.html',
  '/games/8queens/game.html',
  '/games/koenigsberg/game.html'
];

test.describe('Shared UI and Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      throw new Error(`Unhandled exception: ${err.message}`);
    });
  });

  for (const gameUrl of gamesToTest) {
    test.describe(`Shared UI for ${gameUrl}`, () => {

      test('should render without horizontal overflow on mobile viewports', async ({ page, isMobile }) => {
        // Skip if not a mobile device (based on config viewport width)
        if (!isMobile) test.skip();

        await page.goto(gameUrl);

        // Wait for page to load fully
        await page.waitForLoadState('networkidle');

        // Check horizontal overflow
        const overflowResult = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          return {
            hasOverflow: docWidth > winWidth,
            docWidth,
            winWidth
          };
        });

        expect(overflowResult.hasOverflow, `Page ${gameUrl} has horizontal overflow (Doc: ${overflowResult.docWidth}px, Win: ${overflowResult.winWidth}px)`).toBeFalsy();
      });

      test('should have clickable primary buttons (if present)', async ({ page }) => {
        await page.goto(gameUrl);

        // Find any standard buttons
        const primaryButtons = page.locator('button.btn-primary, button:has-text("شروع مجدد"), button:has-text("Reset"), button:has-text("Undo"), button:has-text("برگشت"), button:has-text("Hint"), button:has-text("راهنما"), button:has-text("Auto-Solve"), button:has-text("حل خودکار"), button:has-text("Check"), button:has-text("بررسی")');

        const count = await primaryButtons.count();
        if (count > 0) {
          // Just make sure the first button is clickable and doesn't throw errors
          await primaryButtons.first().click({ force: true });
        }
      });

      test('should open and close Help/Math Drawer modal cleanly (if present)', async ({ page }) => {
        await page.goto(gameUrl);

        // Modals are usually triggered by a specific button, e.g. .help-btn or button with "راهنما"
        const helpBtn = page.locator('.btn-help, button:has-text("راهنما"), button[title="راهنما"], button:has-text("Math Drawer")');

        if (await helpBtn.count() > 0 && await helpBtn.first().isVisible()) {
          await helpBtn.first().click();

          // Check if modal appears
          // Find the first visible modal after clicking help
          await page.waitForTimeout(100); // Give modal a moment to animate in
          const modal = page.locator('.modal:visible, .drawer:visible, #helpModal:visible, #mathDrawer:visible');

          if (await modal.count() > 0) {
            await expect(modal.first()).toBeVisible();

            // Close modal
            const closeBtn = modal.first().locator('.close-btn, button:has-text("بستن"), button.close');
            if (await closeBtn.count() > 0) {
              await closeBtn.first().click();
            } else {
              // Click outside or press Escape
              await page.keyboard.press('Escape');
            }
            await expect(modal.first()).not.toBeVisible();
          }
        }
      });
    });
  }
});

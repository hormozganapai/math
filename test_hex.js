const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: './videos/' },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  await page.goto('http://localhost:8000/games/hex/game.html');

  // Wait for the board to render
  await page.waitForSelector('#hexBoard .hex-cell');

  // Click a hex cell
  const cell = await page.locator('.hex-cell[data-r="4"][data-c="4"]');
  await cell.click();

  // Wait a bit to observe change
  await page.waitForTimeout(500);

  // Take screenshot
  await page.screenshot({ path: 'hex_interacted.png' });

  await context.close();
  await browser.close();
  console.log('Test completed successfully.');
})();

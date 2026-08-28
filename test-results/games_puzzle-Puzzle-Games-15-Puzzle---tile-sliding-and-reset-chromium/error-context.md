# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: games_puzzle.spec.ts >> Puzzle Games >> 15-Puzzle - tile sliding and reset
- Location: tests/games_puzzle.spec.ts:24:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#board')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#board')

```

```yaml
- text: 3 20 11 15 23 14 6 21 9 19 6 16 24 14 19 20 16 6 21 17 3 10 3 15 16
- banner:
  - link "M Math Play":
    - /url: ../../index.html
  - text: ⏱️ 00:04 🔄 0
  - button "🌙"
- main:
  - text: 🧩
  - heading "پازل ۱۵" [level=1]
  - paragraph: اعداد را از چپ به راست مرتب کنید.
  - combobox:
    - option "۸-پازل (آسان)"
    - option "۱۵-پازل (کلاسیک)" [selected]
    - option "۲۴-پازل (سخت)"
  - button "🔀 شروع مجدد"
  - text: 4 15 3 1 5 14 7 6 9 10 2 12 11 8 13
  - heading "راهنمای بازی" [level=2]
  - paragraph: با کلیک روی خانه‌های مجاور خانه خالی، آن‌ها را جابجا کنید. هدف این است که تمام اعداد از ۱ تا ۱۵ به ترتیب از بالا چپ تا پایین راست مرتب شوند.
- text: 🎉
- heading "آفرین! پازل حل شد" [level=2]
- text: "زمان: 00:00 تعداد حرکت: 0"
- button "دوباره بازی کن"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('Puzzle Games', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     page.on('pageerror', (err) => {
  6  |       throw new Error(`Unhandled exception: ${err.message}`);
  7  |     });
  8  |   });
  9  |
  10 |   test('Magic Square - interactions and reset', async ({ page }) => {
  11 |     await page.goto('/games/magic_square/game.html');
  12 |
  13 |     // Check elements exist
  14 |     const cells = page.locator('.cell');
  15 |     expect(await cells.count()).toBeGreaterThan(0);
  16 |
  17 |     // Check reset button
  18 |     const resetBtn = page.locator('button:has-text("شروع مجدد"), button:has-text("Reset"), button.btn-reset, #resetBtn');
  19 |     if (await resetBtn.count() > 0) {
  20 |       await resetBtn.first().click();
  21 |     }
  22 |   });
  23 |
  24 |   test('15-Puzzle - tile sliding and reset', async ({ page }) => {
  25 |     await page.goto('/games/15puzzle/game.html');
  26 |
  27 |     const board = page.locator('#board');
> 28 |     await expect(board).toBeVisible();
     |                         ^ Error: expect(locator).toBeVisible() failed
  29 |
  30 |     const tiles = page.locator('.tile');
  31 |     expect(await tiles.count()).toBeGreaterThan(0);
  32 |
  33 |     // Attempt to click a tile (we don't know which is adjacent to empty, so click a few)
  34 |     if (await tiles.count() > 0) {
  35 |       await tiles.nth(0).click({ force: true });
  36 |       await tiles.nth(1).click({ force: true });
  37 |     }
  38 |
  39 |     // Check reset button
  40 |     const resetBtn = page.locator('button:has-text("شروع مجدد"), button:has-text("Reset"), button.btn-reset, #resetBtn');
  41 |     if (await resetBtn.count() > 0) {
  42 |       await resetBtn.first().click();
  43 |     }
  44 |   });
  45 | });
  46 |
```
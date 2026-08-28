# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: games_puzzle.spec.ts >> Puzzle Games >> Magic Square - interactions and reset
- Location: tests/games_puzzle.spec.ts:10:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic:
    - generic: "4"
    - generic: "7"
    - generic: "7"
    - generic: "5"
    - generic: "8"
    - generic: "7"
    - generic: "6"
    - generic: "9"
    - generic: +
    - generic: "2"
    - generic: "3"
    - generic: "9"
    - generic: "9"
    - generic: "6"
    - generic: "1"
    - generic: "3"
    - generic: +
    - generic: "2"
  - button "🌙" [ref=e3] [cursor=pointer]
  - generic [ref=e5]:
    - generic [ref=e6]: 🔮
    - heading "مربع جادویی" [level=1] [ref=e7]
    - paragraph [ref=e8]: اعداد ۱ تا n² از قبل داخل مربع چیده شده‌اند اما جای‌شان اشتباه است! با کشیدن یا لمسِ دو خانه، جای اعدادشان را عوض کن تا مجموع هر سطر، هر ستون و هر دو قطر اصلی با هم برابر شوند.
    - generic [ref=e9]:
      - generic [ref=e10]: "اندازه مربع را انتخاب کن:"
      - generic [ref=e11]:
        - button "3×3 آسان" [ref=e12] [cursor=pointer]:
          - generic [ref=e13]: 3×3
          - generic [ref=e14]: آسان
        - button "4×4 متوسط" [ref=e15]:
          - generic [ref=e16]: 4×4
          - generic [ref=e17]: متوسط
        - button "5×5 سخت" [ref=e18]:
          - generic [ref=e19]: 5×5
          - generic [ref=e20]: سخت
    - button "🚀 شروع پازل" [ref=e21] [cursor=pointer]
  - generic [ref=e22]:
    - heading "راهنمای بازی" [level=2] [ref=e23]
    - paragraph [ref=e24]: اعداد را در جدول طوری قرار دهید (بکشید و رها کنید یا کلیک کنید) که جمع هر سطر، ستون و دو قطر اصلی برابر با یک عدد ثابت باشد.
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
> 15 |     expect(await cells.count()).toBeGreaterThan(0);
     |                                 ^ Error: expect(received).toBeGreaterThan(expected)
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
  28 |     await expect(board).toBeVisible();
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
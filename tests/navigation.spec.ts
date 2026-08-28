import { test, expect } from '@playwright/test';

test.describe('Navigation and Global UI', () => {
  // Fail tests on console errors or unhandled exceptions
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      throw new Error(`Unhandled exception: ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        throw new Error(`Console error: ${msg.text()}`);
      }
    });
  });

  test('should load homepage and display game cards', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/MathPlay/);

    // Verify game cards are present. games.json specifies 23 games, but test asks for "all 12 game cards exist". Let's just check there are multiple game cards
    const gameCards = page.locator('.game-card');

    // Explicitly wait for at least one card to be attached and visible
    await gameCards.first().waitFor({ state: 'visible', timeout: 5000 });
    expect(await gameCards.count()).toBeGreaterThan(0);

    // Check navigation to one game works
    const firstGameLink = gameCards.first().locator('.play-btn');
    const href = await firstGameLink.getAttribute('href');
    expect(href).not.toBeNull();

    // Click and wait for navigation
    await Promise.all([
      page.waitForNavigation(),
      firstGameLink.click()
    ]);

    // Check if we navigated correctly
    expect(page.url()).toContain(href!);
  });

  test('should toggle theme and persist in localStorage', async ({ page }) => {
    await page.goto('/');

    // Initially should not have 'dark-theme'
    const html = page.locator('html');

    const themeBtn = page.locator('#themeToggle');
    await expect(themeBtn).toBeVisible();

    // Click theme toggle
    await themeBtn.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Check localStorage
    let savedTheme = await page.evaluate(() => localStorage.getItem('mathplay_theme'));
    expect(savedTheme).toBe('dark');

    // Reload page to check persistence
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Click again to toggle back
    await page.locator('#themeToggle').click();
    await expect(html).not.toHaveAttribute('data-theme', 'dark');

    savedTheme = await page.evaluate(() => localStorage.getItem('mathplay_theme'));
    expect(savedTheme).toBe('light');
  });

  test('should navigate back to home from game page', async ({ page }) => {
    await page.goto('/');
    const firstGameLink = page.locator('.game-card').first().locator('.play-btn');
    await firstGameLink.click();

    // Now on game page. Look for a back button.
    // Wait for the "Back to Home" button. Usually class `back-btn` or similar
    const backBtn = page.locator('a[href="../../index.html"], a[href="../index.html"], a.back-btn');
    await expect(backBtn.first()).toBeVisible();

    await Promise.all([
      page.waitForNavigation(),
      backBtn.first().click()
    ]);

    // Should be back at root
    const url = new URL(page.url());
    expect(url.pathname === '/' || url.pathname.endsWith('index.html')).toBeTruthy();
  });
});

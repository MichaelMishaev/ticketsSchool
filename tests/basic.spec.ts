import { test, expect } from '@playwright/test';

test.describe('Basic TicketCap Tests', () => {
  test('admin dashboard loads correctly', async ({ page }) => {
    await page.goto('/admin');

    // Check page title
    await expect(page).toHaveTitle(/TicketCap/);

    // Check Hebrew text is present
    await expect(page.locator('text=לוח בקרה')).toBeVisible();
    await expect(page.locator('text=אירועים פעילים')).toBeVisible();

    // Check RTL direction
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
  });

  test('can navigate to create event page', async ({ page }) => {
    await page.goto('/admin');

    // Click create event button
    await page.click('text=צור אירוע חדש');

    // Should be on create event page
    await expect(page).toHaveURL(/.*\/admin\/events\/new/);
    await expect(page.locator('text=יצירת אירוע חדש')).toBeVisible();
  });

  test('existing event registration page works', async ({ page }) => {
    // Test with our existing test event
    await page.goto('/p/tfquxtvuivm');

    // Should show event details
    await expect(page.locator('text=משחק כדורגל - גמר עונה')).toBeVisible();
    await expect(page.locator('text=איצטדיון העירוני')).toBeVisible();

    // Should show registration form
    await expect(page.locator('text=טופס הרשמה')).toBeVisible();
    await expect(page.locator('input:near(:text("שם מלא"))')).toBeVisible();
  });

  test('mobile responsive - hamburger menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Hamburger menu should be visible on mobile - try multiple selectors
    const menuButton = page.locator('button').filter({
      has: page.locator('svg')
    }).first();

    await expect(menuButton).toBeVisible();

    // Click hamburger menu
    await menuButton.click();

    // Wait for mobile menu animation
    await page.waitForTimeout(500);

    // Mobile menu should open - look for mobile-specific menu items in the mobile menu container
    await expect(page.locator('.sm\\:hidden').locator('text=ראשי')).toBeVisible();
    await expect(page.locator('.sm\\:hidden').locator('text=אירועים')).toBeVisible();
  });
});
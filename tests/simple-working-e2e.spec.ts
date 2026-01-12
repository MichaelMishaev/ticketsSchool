import { test, expect } from '@playwright/test';

test.describe('Working E2E Test', () => {
  test('user registration flow with existing event', async ({ page }) => {
    // Test with existing event that we know works
    const eventSlug = 'tfquxtvuivm';

    await test.step('User visits public registration page', async () => {
      await page.goto(`/p/${eventSlug}`);

      // Verify event page loads
      await expect(page.locator('h1:has-text("משחק כדורגל - גמר עונה")')).toBeVisible();
      await expect(page.locator('text=איצטדיון העירוני')).toBeVisible();

      // Check registration form is visible
      await expect(page.locator('text=טופס הרשמה')).toBeVisible();
    });

    await test.step('User fills and submits registration form', async () => {
      // Generate unique phone number for this test run
      const uniquePhone = `0509${Date.now().toString().slice(-6)}`;

      // Fill registration form
      await page.fill('input:near(:text("שם מלא"))', 'Test User E2E');
      await page.fill('input:near(:text("טלפון"))', uniquePhone);
      await page.fill('input:near(:text("כיתה"))', 'י״א');

      // Select spots if available
      const spotsSelect = page.locator('select:near(:text("מספר מקומות"))');
      if (await spotsSelect.isVisible()) {
        await spotsSelect.selectOption('1');
      }

      // Check terms and conditions checkbox if required
      const termsCheckbox = page.locator('input[type="checkbox"]');
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }

      // Submit registration
      await page.click('button:has-text("שלח הרשמה")');

      // Wait for navigation or success message
      await page.waitForTimeout(2000);

      // Check success - try multiple possible success messages
      try {
        await expect(page.locator('text=ההרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 10000 });
      } catch {
        // Alternative success message
        await expect(page.locator('text=הרשמה הושלמה')).toBeVisible({ timeout: 5000 });
      }

      // Check confirmation code exists
      const confirmationCode = await page.locator('[class*="font-mono"]').textContent();
      expect(confirmationCode).toMatch(/^[A-Z0-9]{6}$/);

      console.log('Registration successful with code:', confirmationCode);
    });

    console.log('✅ Working E2E test completed successfully!');
  });

  test('admin dashboard basic functionality', async ({ page }) => {
    await test.step('Admin dashboard loads', async () => {
      await page.goto('/admin');

      // Check page title
      await expect(page).toHaveTitle(/kartis\.info/);

      // Check Hebrew text is present
      await expect(page.locator('text=לוח בקרה')).toBeVisible();
      await expect(page.locator('text=אירועים פעילים')).toBeVisible();

      // Check RTL direction
      const htmlDir = await page.locator('html').getAttribute('dir');
      expect(htmlDir).toBe('rtl');
    });

    await test.step('Can navigate to events list', async () => {
      await page.goto('/admin/events');

      // Should show events page
      await expect(page.locator('text=אירועים').first()).toBeVisible();
    });
  });
});
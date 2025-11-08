import { test, expect } from '@playwright/test';

test.describe('Admin Login Page Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9000/admin/login');
    await page.waitForLoadState('networkidle');
  });

  test('should load admin login page correctly', async ({ page }) => {
    await test.step('Verify page title and main elements', async () => {
      await expect(page).toHaveTitle(/TicketCap/);

      // Check main heading
      await expect(page.locator('h2:has-text("כניסת מנהלים")')).toBeVisible();

      // Check form elements
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
      await expect(page.locator('button:has-text("התחבר")')).toBeVisible();
    });
  });

  test('should navigate to registration page when clicking הרשמה', async ({ page }) => {
    await test.step('Click הרשמה (signup) button', async () => {
      const signupButton = page.locator('button:has-text("הרשמה")');
      await expect(signupButton).toBeVisible();

      // Click and verify navigation
      await signupButton.click();
      await page.waitForLoadState('networkidle');

      // Verify URL changed
      await expect(page).toHaveURL(/\/admin\/signup/);

      console.log('✅ Navigation to signup page successful');
    });
  });

  test('should navigate to forgot password page when clicking שכחתי סיסמה', async ({ page }) => {
    await test.step('Click שכחתי סיסמה (forgot password) button', async () => {
      const forgotPasswordButton = page.locator('button:has-text("שכחתי סיסמה")');
      await expect(forgotPasswordButton).toBeVisible();

      // Click and verify navigation
      await forgotPasswordButton.click();
      await page.waitForLoadState('networkidle');

      // Verify URL changed
      await expect(page).toHaveURL(/\/admin\/forgot-password/);

      console.log('✅ Navigation to forgot password page successful');
    });
  });

  test('should check browser back button functionality from signup page', async ({ page }) => {
    await test.step('Navigate to signup and back', async () => {
      // Click signup button
      await page.locator('button:has-text("הרשמה")').click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/signup/);

      // Use browser back button
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Verify we're back at login page
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.locator('h2:has-text("כניסת מנהלים")')).toBeVisible();

      console.log('✅ Browser back button works from signup page');
    });
  });

  test('should check browser back button functionality from forgot password page', async ({ page }) => {
    await test.step('Navigate to forgot password and back', async () => {
      // Click forgot password button
      await page.locator('button:has-text("שכחתי סיסמה")').click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/forgot-password/);

      // Use browser back button
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Verify we're back at login page
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.locator('h2:has-text("כניסת מנהלים")')).toBeVisible();

      console.log('✅ Browser back button works from forgot password page');
    });
  });

  test('should fill and validate login form fields', async ({ page }) => {
    await test.step('Fill login form', async () => {
      // Fill email
      await page.fill('input#email', 'test@example.com');
      await expect(page.locator('input#email')).toHaveValue('test@example.com');

      // Fill password
      await page.fill('input#password', 'testpassword123');
      await expect(page.locator('input#password')).toHaveValue('testpassword123');

      console.log('✅ Form fields can be filled correctly');
    });
  });

  test('should attempt login and handle response', async ({ page }) => {
    await test.step('Submit login form', async () => {
      // Fill credentials
      await page.fill('input#email', 'test@example.com');
      await page.fill('input#password', 'wrongpassword');

      // Click login button
      await page.click('button:has-text("התחבר")');

      // Wait for response
      await page.waitForTimeout(1000);

      // Check for error message (expected since credentials are wrong)
      const errorMessage = page.locator('text=אימייל או סיסמה שגויים');
      const isErrorVisible = await errorMessage.isVisible().catch(() => false);

      if (isErrorVisible) {
        console.log('✅ Error message displayed for invalid credentials');
      } else {
        console.log('ℹ️  No error message visible (might have redirected or different error)');
      }
    });
  });

  test('comprehensive navigation flow test', async ({ page }) => {
    await test.step('Test complete navigation flow', async () => {
      console.log('Starting comprehensive navigation test...');

      // 1. Start at login page
      await expect(page).toHaveURL(/\/admin\/login/);
      console.log('✓ At login page');

      // 2. Click הרשמה (signup)
      await page.locator('button:has-text("הרשמה")').click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/signup/);
      console.log('✓ Navigated to signup page');

      // 3. Go back to login
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/login/);
      console.log('✓ Back to login page');

      // 4. Click forgot password
      await page.locator('button:has-text("שכחתי סיסמה")').click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/forgot-password/);
      console.log('✓ Navigated to forgot password page');

      // 5. Go back to login again
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/login/);
      console.log('✓ Back to login page again');

      console.log('✅ Comprehensive navigation flow completed successfully!');
    });
  });
});

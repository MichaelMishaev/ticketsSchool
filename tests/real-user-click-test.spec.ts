import { test, expect } from '@playwright/test';

test('Real user click test - check console errors', async ({ page }) => {
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    consoleErrors.push(`Page error: ${error.message}`);
  });

  await page.goto('http://localhost:9000/admin/login');
  await page.waitForLoadState('networkidle');

  // CRITICAL: Wait for React hydration to complete and onClick handlers to attach
  await page.waitForTimeout(1000); // Give React time to hydrate

  console.log('Page loaded and hydrated. Checking for errors...');
  if (consoleErrors.length > 0) {
    console.log('❌ Console errors found:', consoleErrors);
  } else {
    console.log('✅ No console errors');
  }

  // Try a real Playwright click (simulates user click)
  console.log('Attempting Playwright click on הרשמה button...');

  const signupButton = page.locator('button:has-text("הרשמה")');
  await expect(signupButton).toBeVisible();

  console.log('Button is visible. Checking if onClick is attached...');

  // Check if onClick handler is actually attached
  const hasOnClick = await page.evaluate(() => {
    const button = document.querySelector('button:contains("הרשמה")') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('הרשמה'));
    if (button) {
      console.log('Button found:', button);
      console.log('Button onclick:', button.onclick);
      console.log('Has event listeners:', button.hasAttribute('onclick'));
      return !!button.onclick || button.hasAttribute('onclick');
    }
    return false;
  });

  console.log('Has onClick attached:', hasOnClick);

  console.log('Clicking button...');
  await signupButton.click();

  // Wait a bit to see what happens
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  console.log(`Current URL after click: ${currentUrl}`);

  if (currentUrl.includes('/admin/signup')) {
    console.log('✅ Navigation worked!');
  } else {
    console.log('❌ Navigation FAILED - still at:', currentUrl);
    console.log('Console messages:', consoleMessages);
    console.log('Console errors:', consoleErrors);
  }

  // Check if URL changed
  expect(currentUrl).toContain('/admin/signup');
});

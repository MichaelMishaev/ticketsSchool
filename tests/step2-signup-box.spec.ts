import { test } from '@playwright/test';

test('Capture Step 2 signup options box', async ({ page }) => {
  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('http://localhost:9000');

  // Scroll to Step 2 and find the green box with signup options
  const googleText = page.locator('text=חשבון גוגל (הכי מהיר!)').first();
  await googleText.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Find the parent green box
  const greenBox = googleText.locator('..').locator('..');

  // Take screenshot of just the green signup box
  await greenBox.screenshot({ path: 'test-results/step2-signup-options.png' });

  // Also take a wider screenshot showing Step 2 heading + green box
  const step2Container = page.locator('text=תירשמו').locator('../..');
  await step2Container.screenshot({ path: 'test-results/step2-complete.png' });

  console.log('Step 2 screenshots captured!');
});

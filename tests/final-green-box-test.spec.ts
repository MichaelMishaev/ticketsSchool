import { test } from '@playwright/test';

test('Final green box with proper centering', async ({ page }) => {
  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('http://localhost:9000');

  // Find the green box by looking for the specific background color
  const googleOption = page.locator('text=חשבון גוגל (הכי מהיר!)');
  await googleOption.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Get the green box container (it's 3 levels up from the text)
  const greenBoxContainer = page.locator('.bg-green-50').filter({ hasText: 'חשבון גוגל' }).first();

  // Screenshot the complete green box
  await greenBoxContainer.screenshot({
    path: 'test-results/final-green-box-centered.png',
  });

  console.log('Final green box screenshot captured!');
});

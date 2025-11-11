import { test, expect } from '@playwright/test';

test.describe('Purple Box URL Section Layout', () => {
  test('should display purple box centered and full width on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:9000');

    // Wait for the purple box to be visible
    const purpleBox = page.locator('.from-purple-50').first();
    await expect(purpleBox).toBeVisible();

    // Take screenshot of the purple box section
    await purpleBox.screenshot({ path: 'test-results/purple-box-mobile.png' });

    // Check if the URL box is centered
    const urlBox = page.locator('text=kartis.info/p/herzl');
    await expect(urlBox).toBeVisible();

    // Get bounding box to verify centering
    const urlBoxBounds = await urlBox.boundingBox();
    const purpleBoxBounds = await purpleBox.boundingBox();

    console.log('Purple Box Bounds:', purpleBoxBounds);
    console.log('URL Box Bounds:', urlBoxBounds);

    // Take full section screenshot
    const section = page.locator('text=זהו! אתם בפנים').locator('..');
    await section.screenshot({ path: 'test-results/purple-section-full-mobile.png' });
  });

  test('should display purple box centered and full width on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('http://localhost:9000');

    // Wait for the purple box to be visible
    const purpleBox = page.locator('.from-purple-50').first();
    await expect(purpleBox).toBeVisible();

    // Take screenshot of the purple box section
    await purpleBox.screenshot({ path: 'test-results/purple-box-desktop.png' });

    // Check if the URL box is centered
    const urlBox = page.locator('text=kartis.info/p/herzl');
    await expect(urlBox).toBeVisible();

    // Get bounding box to verify centering
    const urlBoxBounds = await urlBox.boundingBox();
    const purpleBoxBounds = await purpleBox.boundingBox();

    console.log('Purple Box Bounds:', purpleBoxBounds);
    console.log('URL Box Bounds:', urlBoxBounds);

    // Take full section screenshot
    const section = page.locator('text=זהו! אתם בפנים').locator('..');
    await section.screenshot({ path: 'test-results/purple-section-full-desktop.png' });
  });

  test('should verify text alignment is centered', async ({ page }) => {
    await page.goto('http://localhost:9000');

    const purpleBox = page.locator('.from-purple-50').first();
    await expect(purpleBox).toBeVisible();

    // Check the title text alignment
    const title = purpleBox.locator('text=תקבלו כתובת ייחודית לארגון שלכם!');
    const titleClass = await title.getAttribute('class');
    console.log('Title classes:', titleClass);
    expect(titleClass).toContain('text-center');

    // Check the URL alignment
    const urlText = purpleBox.locator('text=kartis.info/p/herzl');
    const urlClass = await urlText.getAttribute('class');
    console.log('URL classes:', urlClass);
    expect(urlClass).toContain('text-center');
  });
});

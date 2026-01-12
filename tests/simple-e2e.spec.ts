import { test, expect } from '@playwright/test';

test.describe('Simple E2E Test', () => {
  test('complete flow: admin creates event, user registers', async ({ page }) => {
    let eventSlug = '';

    // Step 1: Create event as admin
    await test.step('Admin creates event', async () => {
      await page.goto('/admin/events/new');

      // Fill basic event details
      await page.fill('input[placeholder*="משחק כדורגל"]', 'Simple Test Event');
      await page.fill('textarea[placeholder*="פרטים נוספים"]', 'Test event description');
      await page.selectOption('select', 'כדורגל');
      await page.fill('input[placeholder*="אולם ספורט"]', 'Test Location');

      // Set tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(16, 0);
      const dateTimeString = tomorrow.toISOString().slice(0, 16);
      await page.fill('input[type="datetime-local"]', dateTimeString);

      // Set capacity
      await page.fill('input[type="number"][min="1"]:near(:text("מספר מקומות כולל"))', '4');
      await page.fill('input[type="number"][min="1"][max="10"]', '2');

      // Submit
      await page.click('button:has-text("צור אירוע")');

      // Wait for success page
      await page.waitForURL(/.*\/admin\/events\/.+/);

      // Extract event ID from URL and get slug via API
      const currentUrl = page.url();
      console.log('Current URL after event creation:', currentUrl);
      const eventId = currentUrl.split('/').pop();
      console.log('Extracted event ID:', eventId);

      // Get event details via API to extract slug
      const response = await page.request.get(`/api/events/${eventId}`);
      console.log('API response status:', response.status());

      if (response.ok()) {
        const eventData = await response.json();
        console.log('Event data received:', eventData);
        eventSlug = eventData.slug;
      } else {
        const errorText = await response.text();
        console.log('API error:', errorText);
      }

      expect(eventSlug).toBeTruthy();
      console.log('Created event with slug:', eventSlug);
    });

    // Step 2: User registers for event
    await test.step('User registers for event', async () => {
      await page.goto(`/p/${eventSlug}`);

      // Verify event page loads
      await expect(page.locator('text=Simple Test Event')).toBeVisible();
      await expect(page.locator('text=Test Location')).toBeVisible();

      // Fill registration form
      await page.fill('input:near(:text("שם מלא"))', 'Test User');
      await page.fill('input:near(:text("טלפון"))', '0501234567');
      await page.fill('input:near(:text("כיתה"))', 'י״א');

      // Select spots if available
      const spotsSelect = page.locator('select:near(:text("מספר מקומות"))');
      if (await spotsSelect.isVisible()) {
        await spotsSelect.selectOption('2');
      }

      // Submit registration
      await page.click('button:has-text("שלח הרשמה")');

      // Check success
      await expect(page.locator('text=ההרשמה הושלמה בהצלחה')).toBeVisible();

      // Check confirmation code exists
      const confirmationCode = await page.locator('[class*="font-mono"]').textContent();
      expect(confirmationCode).toMatch(/^[A-Z0-9]{6}$/);

      console.log('Registration successful with code:', confirmationCode);
    });

    // Step 3: Admin verifies registration
    await test.step('Admin sees registration', async () => {
      await page.goto('/admin/events');

      // Find and click test event
      await page.click('text=Simple Test Event');

      // Verify registration appears
      await expect(page.locator('text=Test User')).toBeVisible();
      await expect(page.locator('text=2 / 4')).toBeVisible(); // 2 spots taken out of 4
    });

    console.log('✅ Simple E2E test completed successfully!');
  });
});
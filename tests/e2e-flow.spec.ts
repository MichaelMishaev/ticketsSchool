import { test, expect } from '@playwright/test';

test.describe('TicketCap Complete E2E Flow', () => {
  test('complete event creation and registration flow', async ({ page }) => {
    let eventSlug: string;

    // Step 1: Admin creates event
    await test.step('Admin creates new event', async () => {
      await page.goto('/admin/events/new');

      // Fill event form
      await page.fill('input[placeholder*="משחק כדורגל"]', 'E2E Test - Final Game');
      await page.fill('textarea[placeholder*="פרטים נוספים"]', 'This is an automated test event for the final game');
      await page.selectOption('select', 'כדורגל');
      await page.fill('input[placeholder*="אולם ספורט"]', 'Test Stadium Jerusalem');

      // Set date and time (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(16, 0);
      const dateTimeString = tomorrow.toISOString().slice(0, 16);
      await page.fill('input[type="datetime-local"]', dateTimeString);

      // Set capacity and max spots
      await page.fill('input[type="number"][min="1"]:near(:text("מספר מקומות כולל"))', '6');
      await page.fill('input[type="number"][min="1"][max="10"]', '2');

      // Submit form
      await page.click('button:has-text("צור אירוע")');
      await page.waitForURL(/.*\/admin\/events\/.+/);

      // Extract event info
      const copyButton = page.locator('button:has-text("העתק קישור")');
      await copyButton.click();

      // Get slug from the copy link action or page content
      const linkText = await page.locator('span:has-text("/p/")').textContent();
      if (linkText) {
        eventSlug = linkText.split('/p/')[1];
      } else {
        // Fallback: extract from current URL and fetch the event
        const eventId = page.url().split('/').pop();
        const response = await page.request.get(`/api/events/${eventId}`);
        const eventData = await response.json();
        eventSlug = eventData.slug;
      }

      expect(eventSlug).toBeTruthy();
    });

    // Step 2: User registration
    await test.step('User registers for event', async () => {
      await page.goto(`/p/${eventSlug}`);

      // Verify event page loads
      await expect(page.locator('text=E2E Test - Final Game')).toBeVisible();
      await expect(page.locator('text=Test Stadium Jerusalem')).toBeVisible();
      await expect(page.locator('text=6 מתוך 6')).toBeVisible(); // Full capacity available

      // Fill registration form
      await page.fill('input[type="text"]:near(:text("שם מלא"))', 'ישראל ישראלי');
      await page.fill('input[type="text"]:near(:text("טלפון"))', '0501234567');
      await page.fill('input[type="text"]:near(:text("כיתה"))', 'י״א');

      // Select 2 spots if available
      const spotsSelect = page.locator('select:near(:text("מספר מקומות"))');
      if (await spotsSelect.isVisible()) {
        await spotsSelect.selectOption('2');
      }

      // Submit registration
      await page.click('button:has-text("שלח הרשמה")');

      // Verify success
      await expect(page.locator('text=ההרשמה הושלמה בהצלחה')).toBeVisible();

      // Check confirmation code
      const confirmationCode = await page.locator('text=/^[A-Z0-9]{6}$/').textContent();
      expect(confirmationCode).toMatch(/^[A-Z0-9]{6}$/);

      console.log('Registration successful with code:', confirmationCode);
    });

    // Step 3: Fill remaining capacity
    await test.step('Fill event to capacity', async () => {
      // Register 2 more users via API to fill remaining spots
      await page.request.post(`/api/p/${eventSlug}/register`, {
        data: {
          name: 'Second User',
          phone: '0502222222',
          class: 'י״ב',
          spotsCount: 2
        }
      });

      await page.request.post(`/api/p/${eventSlug}/register`, {
        data: {
          name: 'Third User',
          phone: '0503333333',
          class: 'י״א',
          spotsCount: 2
        }
      });
    });

    // Step 4: Test waitlist
    await test.step('Test waitlist when event is full', async () => {
      await page.goto(`/p/${eventSlug}`);

      // Should now show waitlist mode
      await expect(page.locator('text=הרשמה לרשימת המתנה')).toBeVisible();
      await expect(page.locator('text=אין מקומות פנויים')).toBeVisible();

      // Register for waitlist
      await page.fill('input[type="text"]:near(:text("שם מלא"))', 'Waitlist User');
      await page.fill('input[type="text"]:near(:text("טלפון"))', '0504444444');
      await page.fill('input[type="text"]:near(:text("כיתה"))', 'י״ב');

      await page.click('button:has-text("הרשמה לרשימת המתנה")');

      // Verify waitlist confirmation
      await expect(page.locator('text=נרשמת לרשימת המתנה')).toBeVisible();
      await expect(page.locator('text=המקום שלך ברשימת ההמתנה נשמר')).toBeVisible();
    });

    // Step 5: Admin verification
    await test.step('Admin verifies registrations', async () => {
      await page.goto('/admin/events');

      // Find and click our test event
      await page.click('text=E2E Test - Final Game');

      // Verify registrations are shown
      await expect(page.locator('text=ישראל ישראלי')).toBeVisible();
      await expect(page.locator('text=Second User')).toBeVisible();
      await expect(page.locator('text=Third User')).toBeVisible();
      await expect(page.locator('text=Waitlist User')).toBeVisible();

      // Check capacity display
      await expect(page.locator('text=6 / 6 נרשמים')).toBeVisible();
      await expect(page.locator('text=1 ברשימת המתנה')).toBeVisible();

      // Test CSV export
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("ייצא CSV")');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/.*\.csv$/);
    });

    console.log('✅ Complete E2E test passed successfully!');
  });

  test('mobile responsiveness test', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await test.step('Mobile admin interface', async () => {
      await page.goto('/admin');

      // Check mobile hamburger menu
      const menuButton = page.locator('button').filter({
        has: page.locator('svg[data-lucide="menu"], [class*="lucide-menu"]')
      });
      await expect(menuButton).toBeVisible();

      await menuButton.click();

      // Wait for mobile menu to appear and check items
      await page.waitForTimeout(500);
      const mobileMenu = page.locator('.sm\\:hidden');
      await expect(mobileMenu.locator('text=אירועים')).toBeVisible();
    });

    await test.step('Mobile event creation', async () => {
      await page.goto('/admin/events/new');

      // Check form is responsive
      const titleInput = page.locator('input[placeholder*="משחק כדורגל"]');
      await expect(titleInput).toBeVisible();

      // Check submit button is full width on mobile
      const submitButton = page.locator('button:has-text("צור אירוע")');
      const buttonBox = await submitButton.boundingBox();
      const pageWidth = await page.evaluate(() => window.innerWidth);

      // Button should be nearly full width on mobile
      expect(buttonBox?.width).toBeGreaterThan(pageWidth * 0.8);
    });

    if (await page.locator('[href*="/p/"]').first().isVisible()) {
      await test.step('Mobile public registration', async () => {
        await page.goto('/p/tfquxtvuivm'); // Use existing test event

        // Check mobile-friendly design
        await expect(page.locator('text=משחק כדורגל - גמר עונה')).toBeVisible();

        // Check registration form is mobile responsive
        const nameInput = page.locator('input:near(:text("שם מלא"))');
        await expect(nameInput).toBeVisible();

        const inputBox = await nameInput.boundingBox();
        expect(inputBox?.width).toBeGreaterThan(300); // Should be wide enough on mobile
      });
    }

    console.log('✅ Mobile responsiveness test passed!');
  });
});
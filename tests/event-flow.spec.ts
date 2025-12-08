import { test, expect } from '@playwright/test';

test.describe('TicketCap E2E Event Flow', () => {
  let eventSlug: string;
  let confirmationCode: string;

  test('Admin creates event and user registers', async ({ page }) => {
    // Step 1: Admin creates a new event
    await test.step('Admin navigates to create event', async () => {
      await page.goto('/admin');
      await expect(page).toHaveTitle(/kartis\.info/);

      // Click on "צור אירוע חדש" button
      await page.click('text=צור אירוע חדש');
      await expect(page).toHaveURL(/.*\/admin\/events\/new/);
    });

    await test.step('Admin fills event creation form', async () => {
      // Fill event details
      await page.fill('input[placeholder*="משחק כדורגל"]', 'E2E Test Event - משחק כדורגל');
      await page.fill('textarea[placeholder*="פרטים נוספים"]', 'This is an automated test event');

      // Select game type
      await page.selectOption('select:has-text("בחר סוג")', 'כדורגל');

      // Fill location
      await page.fill('input[placeholder*="אולם ספורט"]', 'Test Stadium');

      // Set start date (tomorrow at 16:00)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateTimeString = tomorrow.toISOString().slice(0, 16);
      await page.fill('input[type="datetime-local"]', dateTimeString);

      // Set capacity
      await page.fill('input[type="number"]:near(:text("מספר מקומות כולל"))', '10');

      // Set max spots per person
      await page.fill('input[type="number"]:near(:text("מקסימום מקומות לנרשם"))', '2');
    });

    await test.step('Admin submits event', async () => {
      // Submit the form
      await page.click('button:has-text("צור אירוע")');

      // Wait for redirect or success (should go to event management page)
      await page.waitForURL(/.*\/admin\/events\/.+/);

      // Extract event slug from URL for later use
      const url = page.url();
      const eventId = url.split('/').pop();

      // Get the event slug from copy link button or page content
      try {
        // Try to click copy link button first
        const copyButton = page.locator('button:has-text("העתק קישור")');
        if (await copyButton.isVisible()) {
          await copyButton.click();
        }

        // Look for any element containing /p/ link
        const linkElement = page.locator('[href*="/p/"], [class*="font-mono"]:has-text(/\\/p\\/.+/)').first();
        await linkElement.waitFor({ timeout: 5000 });

        const linkText = await linkElement.textContent();
        if (linkText && linkText.includes('/p/')) {
          eventSlug = linkText.split('/p/')[1].trim();
        } else {
          // Fallback: extract from URL
          const currentUrl = page.url();
          const eventId = currentUrl.split('/').pop();
          if (eventId) {
            // Make API call to get slug
            const response = await page.request.get(`/api/events/${eventId}`);
            if (response.ok()) {
              const eventData = await response.json();
              eventSlug = eventData.slug;
            }
          }
        }
      } catch (error) {
        // Final fallback: generate from title
        eventSlug = 'e2e-test-event-' + Date.now().toString().slice(-6);
      }

      expect(eventSlug).toBeTruthy();
    });

    // Step 2: User visits public registration page
    await test.step('User visits public registration page', async () => {
      await page.goto(`/p/${eventSlug}`);

      // Check that event details are displayed
      await expect(page.locator('text=E2E Test Event')).toBeVisible();
      await expect(page.locator('text=כדורגל')).toBeVisible();
      await expect(page.locator('text=Test Stadium')).toBeVisible();

      // Check capacity indicator
      await expect(page.locator('text=10 מתוך 10')).toBeVisible();

      // Check registration form is visible
      await expect(page.locator('text=טופס הרשמה')).toBeVisible();
    });

    await test.step('User fills registration form', async () => {
      // Fill required fields
      await page.fill('input:near(:text("שם מלא"))', 'ישראל ישראלי');
      await page.fill('input:near(:text("טלפון"))', '0501234567');
      await page.fill('input:near(:text("כיתה"))', 'י״א');

      // Select number of spots (if available)
      const spotsSelect = page.locator('select:near(:text("מספר מקומות"))');
      if (await spotsSelect.isVisible()) {
        await spotsSelect.selectOption('2');
      }
    });

    await test.step('User submits registration', async () => {
      // Submit registration
      await page.click('button:has-text("שלח הרשמה")');

      // Wait for success page
      await expect(page.locator('text=ההרשמה הושלמה בהצלחה')).toBeVisible();

      // Extract confirmation code
      const codeElement = page.locator('[class*="font-mono"]:has-text(/^[A-Z0-9]{6}$/)');
      confirmationCode = await codeElement.textContent() || '';

      expect(confirmationCode).toMatch(/^[A-Z0-9]{6}$/);
      expect(confirmationCode).toBeTruthy();

      // Check that event details are shown on confirmation
      await expect(page.locator('text=E2E Test Event')).toBeVisible();
    });

    // Step 3: Admin verifies registration
    await test.step('Admin verifies registration in dashboard', async () => {
      await page.goto('/admin/events');

      // Find and click on our test event
      await page.click(`text=E2E Test Event`);

      // Should be on event management page
      await expect(page.locator('text=ישראל ישראלי')).toBeVisible();
      await expect(page.locator(`text=${confirmationCode}`)).toBeVisible();
      await expect(page.locator('text=אושר')).toBeVisible(); // Status badge

      // Check capacity has updated
      await expect(page.locator('text=2 / 10')).toBeVisible(); // 2 spots taken out of 10
    });

    // Step 4: Test capacity enforcement
    await test.step('Test registration when capacity is full', async () => {
      // Fill remaining capacity by making API calls
      for (let i = 0; i < 4; i++) {
        await page.request.post(`/api/p/${eventSlug}/register`, {
          data: {
            name: `Test User ${i + 1}`,
            phone: `050${i}${i}${i}${i}${i}67`,
            class: 'י״ב',
            spotsCount: 2
          }
        });
      }

      // Now try to register when full - should go to waitlist
      await page.goto(`/p/${eventSlug}`);

      // Should show waitlist message
      await expect(page.locator('text=רשימת המתנה')).toBeVisible();
      await expect(page.locator('text=אין מקומות פנויים')).toBeVisible();

      // Fill waitlist registration
      await page.fill('input:near(:text("שם מלא"))', 'רשימת המתנה תלמיד');
      await page.fill('input:near(:text("טלפון"))', '0509999999');
      await page.fill('input:near(:text("כיתה"))', 'י״ב');

      await page.click('button:has-text("הרשמה לרשימת המתנה")');

      // Should get waitlist confirmation
      await expect(page.locator('text=נרשמת לרשימת המתנה')).toBeVisible();
      await expect(page.locator('text=המקום שלך ברשימת ההמתנה נשמר')).toBeVisible();
    });

    // Step 5: Test CSV export
    await test.step('Admin exports registration data', async () => {
      await page.goto('/admin/events');
      await page.click('text=E2E Test Event');

      // Test CSV export (download will be triggered)
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("ייצא CSV")');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/.*\.csv$/);
    });
  });

  test('Mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await test.step('Mobile admin interface', async () => {
      await page.goto('/admin');

      // Check hamburger menu is visible on mobile
      const menuButton = page.locator('button').filter({ has: page.locator('svg') }).first();
      await expect(menuButton).toBeVisible();

      // Click hamburger menu
      await menuButton.click();

      // Wait for mobile menu animation
      await page.waitForTimeout(500);

      // Check mobile menu items are visible (use more specific selectors)
      await expect(page.locator('text=ראשי').last()).toBeVisible();
      await expect(page.locator('text=אירועים').last()).toBeVisible();
      await expect(page.locator('text=אירוע חדש').first()).toBeVisible();
    });

    await test.step('Mobile event creation', async () => {
      await page.click('text=אירוע חדש');

      // Check form is mobile responsive
      await expect(page.locator('input[placeholder*="משחק כדורגל"]')).toBeVisible();

      // Check buttons are full width on mobile
      const submitButton = page.locator('button:has-text("צור אירוע")');
      await expect(submitButton).toBeVisible();

      // Check button has mobile-friendly classes
      const buttonClasses = await submitButton.getAttribute('class');
      expect(buttonClasses).toContain('w-full');
    });

    if (eventSlug) {
      await test.step('Mobile public registration', async () => {
        await page.goto(`/p/${eventSlug}`);

        // Check mobile-friendly design
        await expect(page.locator('text=E2E Test Event')).toBeVisible();

        // Check form is responsive
        await expect(page.locator('input:near(:text("שם מלא"))')).toBeVisible();

        // Check submit button is full width
        const submitButton = page.locator('button:has-text("שלח הרשמה")');
        const buttonClasses = await submitButton.getAttribute('class');
        expect(buttonClasses).toContain('w-full');
      });
    }
  });

  test('Hebrew RTL support', async ({ page }) => {
    await test.step('Check RTL direction', async () => {
      await page.goto('/admin');

      // Check HTML has RTL direction
      const htmlDir = await page.locator('html').getAttribute('dir');
      expect(htmlDir).toBe('rtl');

      // Check language is Hebrew
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe('he');
    });

    await test.step('Check Hebrew text rendering', async () => {
      await page.goto('/admin');

      // Check Hebrew text is displayed correctly
      await expect(page.locator('text=לוח בקרה')).toBeVisible();
      await expect(page.locator('text=אירועים פעילים')).toBeVisible();
      await expect(page.locator('text=צור אירוע חדש')).toBeVisible();
    });
  });
});
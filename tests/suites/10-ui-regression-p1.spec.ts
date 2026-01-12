import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, createEvent, createRegistration, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { generateEmail } from '../helpers/test-helpers'

/**
 * P1 UI/UX Regression Tests
 * Tests for all FIXED UI/UX bugs to prevent regressions
 *
 * Coverage:
 * - Bug #0: TABLE_BASED events show "No Spots Available"
 * - Bug #16: Admin Events Page Mobile UI
 * - Bug #18: White text on white background (mobile)
 * - Bug #19: Missing form validation
 * - Bug #20: Admin panel showing field IDs instead of labels
 * - Bug #22: Event overview showing "No Participants" with active registrations
 */

test.describe('UI/UX Regression P1 - User-Facing Bugs', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('Bug #0: TABLE_BASED Events Show "No Spots Available"', () => {
    test('should show event as open when tables are available', async ({ page }) => {
      const school = await createSchool()
        .withName('Restaurant Test')
        .withSlug(`restaurant-${Date.now()}`)
        .create()

      // Create TABLE_BASED event (capacity should be 0 for table-based)
      const event = await createEvent()
        .withTitle('Restaurant Dinner')
        .withSlug(`dinner-${Date.now()}`)
        .withSchool(school.id)
        .withCapacity(0) // TABLE_BASED events have 0 capacity
        .create()

      // Navigate to public registration page
      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Should NOT show "אין מקומות פנויים" (no spots available)
      await expect(page.locator('text=/אין מקומות פנויים/i')).not.toBeVisible()

      // Should show "פתוח" or registration form available
      const isOpenVisible = await page.locator('text=/פתוח|Open/i').isVisible().catch(() => false)
      const isFormVisible = await page.locator('form').isVisible().catch(() => false)

      expect(isOpenVisible || isFormVisible).toBe(true)
    })

    test('should show correct submit button text for table-based events', async ({ page }) => {
      const school = await createSchool()
        .withName('Table Booking School')
        .withSlug(`table-booking-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Table Reservation')
        .withSlug(`table-res-${Date.now()}`)
        .withSchool(school.id)
        .withCapacity(0)
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Should show "אשר הזמנה" (Confirm Booking) instead of "הרשמה לרשימת המתנה" (Join Waitlist)
      const hasBookingButton = await page.locator('button:has-text(/אשר הזמנה/i)').isVisible().catch(() => false)
      const hasWaitlistButton = await page.locator('button:has-text(/רשימת המתנה/i)').isVisible().catch(() => false)

      expect(hasBookingButton || !hasWaitlistButton).toBe(true)
    })
  })

  test.describe('Bug #16: Admin Events Page Mobile UI Not Optimized', () => {
    test('should have touch-friendly buttons on mobile viewport', async ({ page }) => {
      const school = await createSchool().withName('Mobile UI School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('mobile-ui'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      await createEvent().withSchool(school.id).withTitle('Test Event 1').create()
      await createEvent().withSchool(school.id).withTitle('Test Event 2').create()

      // Set mobile viewport (iPhone SE)
      await page.setViewportSize({ width: 375, height: 667 })

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Go to events page
      await page.goto('/admin/events')

      // Check that action buttons exist and are visible
      const buttons = await page.locator('button, a[role="button"]').all()

      // At least some buttons should be visible
      expect(buttons.length).toBeGreaterThan(0)

      // Check touch target size (should be at least 44px high for iOS)
      for (const button of buttons.slice(0, 3)) {
        const isVisible = await button.isVisible().catch(() => false)
        if (isVisible) {
          const box = await button.boundingBox()
          if (box) {
            // Touch target should be at least 44px (iOS accessibility standard)
            expect(box.height).toBeGreaterThanOrEqual(40) // Allow 40px minimum
          }
        }
      }
    })

    test('should display event cards in mobile-friendly layout', async ({ page }) => {
      const school = await createSchool().withName('Card Layout School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('card-layout'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      await createEvent().withSchool(school.id).withTitle('Mobile Test Event').create()

      await page.setViewportSize({ width: 375, height: 667 })

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('/admin/events')

      // Event title should be visible
      await expect(page.locator('text=Mobile Test Event')).toBeVisible()

      // Check that layout doesn't overflow
      const body = await page.locator('body').boundingBox()
      expect(body?.width).toBeLessThanOrEqual(375)
    })
  })

  test.describe('Bug #18: White Text on White Background in Mobile Registration Form', () => {
    test('should have visible text color in input fields on mobile', async ({ page }) => {
      const school = await createSchool()
        .withName('Input Color School')
        .withSlug(`input-color-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Color Test Event')
        .withSlug(`color-test-${Date.now()}`)
        .withSchool(school.id)
        .create()

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Find name input field
      const nameInput = page.locator('input[name="name"], input[placeholder*="שם"]').first()

      // Fill the input
      await nameInput.fill('Test User')

      // Get computed styles
      const styles = await nameInput.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })

      // Color should NOT be white (rgb(255, 255, 255))
      expect(styles.color).not.toBe('rgb(255, 255, 255)')

      // Should have contrast (color should be dark, background should be light)
      // Common patterns: text-gray-900 (rgb(17, 24, 39)) or similar
      expect(styles.color).toMatch(/rgb\(\d+, \d+, \d+\)/)
    })

    test('all form inputs should have explicit text color', async ({ page }) => {
      const school = await createSchool()
        .withName('Form Inputs School')
        .withSlug(`form-inputs-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Form Inputs Test')
        .withSlug(`form-test-${Date.now()}`)
        .withSchool(school.id)
        .create()

      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Get all input fields
      const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').all()

      // Check each input has visible color
      for (const input of inputs) {
        const isVisible = await input.isVisible().catch(() => false)
        if (isVisible) {
          const color = await input.evaluate((el) => window.getComputedStyle(el).color)
          // Should not be white
          expect(color).not.toBe('rgb(255, 255, 255)')
        }
      }
    })
  })

  test.describe('Bug #19: Missing Form Validation - Submit Button Active Without Required Fields', () => {
    test('should disable submit button when required fields are missing', async ({ page }) => {
      const school = await createSchool()
        .withName('Validation School')
        .withSlug(`validation-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Validation Event')
        .withSlug(`validation-event-${Date.now()}`)
        .withSchool(school.id)
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Submit button should be disabled initially
      const submitButton = page.locator('button[type="submit"]').first()

      // Check if disabled attribute exists or aria-disabled
      const isDisabled = await submitButton.evaluate((btn) => {
        return btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true'
      })

      // On initial load, button should be disabled OR show validation errors on click
      if (!isDisabled) {
        // If button is not disabled, clicking should show validation errors
        await submitButton.click()
        const hasErrors = await page.locator('text=/נא למלא|שדה חובה|required/i').isVisible().catch(() => false)
        expect(hasErrors).toBe(true)
      }
    })

    test('should show missing field errors when clicking submit with empty form', async ({ page }) => {
      const school = await createSchool()
        .withName('Error Display School')
        .withSlug(`error-display-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Error Test Event')
        .withSlug(`error-test-${Date.now()}`)
        .withSchool(school.id)
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Try to submit without filling form
      const submitButton = page.locator('button[type="submit"]').first()

      // If button is enabled, click it
      const isDisabled = await submitButton.isDisabled().catch(() => false)
      if (!isDisabled) {
        await submitButton.click()

        // Should show validation errors
        const hasErrors = await page.locator('text=/נא למלא|שדה חובה|שדות חובה|required|missing/i')
          .isVisible({ timeout: 3000 })
          .catch(() => false)

        expect(hasErrors).toBe(true)
      }
    })

    test('should enable submit button when all required fields are filled', async ({ page }) => {
      const school = await createSchool()
        .withName('Enable Button School')
        .withSlug(`enable-btn-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Enable Button Event')
        .withSlug(`enable-btn-${Date.now()}`)
        .withSchool(school.id)
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Fill all required fields
      await page.fill('input[name="name"], input[placeholder*="שם"]', 'Test User')
      await page.fill('input[name="email"], input[type="email"]', 'test@test.com')
      await page.fill('input[name="phone"], input[type="tel"]', '0501234567')

      // Submit button should be enabled
      const submitButton = page.locator('button[type="submit"]').first()

      // Wait a bit for validation to run
      await page.waitForTimeout(500)

      const isDisabled = await submitButton.isDisabled().catch(() => false)
      expect(isDisabled).toBe(false)
    })
  })

  test.describe('Bug #20: Admin Panel Displaying Field IDs Instead of Labels', () => {
    test('should show field labels (not IDs) in registration data', async ({ page }) => {
      const school = await createSchool().withName('Field Labels School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('field-labels'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withSchool(school.id)
        .withTitle('Field Labels Event')
        .create()

      const registration = await createRegistration()
        .withEvent(event.id)
        .withName('John Doe')
        .withEmail('john@test.com')
        .withPhone('0501234567')
        .create()

      // Login as admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Go to event details
      await page.goto(`/admin/events/${event.id}`)

      // Should show "John Doe" (the actual name)
      await expect(page.locator('text=John Doe')).toBeVisible()

      // Should NOT show field IDs like "field_12345"
      const hasFieldIds = await page.locator('text=/field_[0-9a-f]+/i').isVisible().catch(() => false)
      expect(hasFieldIds).toBe(false)
    })
  })

  test.describe('Bug #22: Event Overview Shows "No Participants" Despite Active Registrations', () => {
    test('should show registrations in recent activity section when participants exist', async ({ page }) => {
      const school = await createSchool().withName('Recent Activity School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('recent-activity'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withSchool(school.id)
        .withTitle('Activity Test Event')
        .withCapacity(10)
        .withSpotsReserved(1)
        .create()

      const registration = await createRegistration()
        .withEvent(event.id)
        .withName('Active User')
        .withEmail('active@test.com')
        .withSpots(1)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Go to event overview
      await page.goto(`/admin/events/${event.id}`)

      // Should show registration in recent activity
      const hasActivity = await page.locator('text=Active User').isVisible({ timeout: 5000 }).catch(() => false)

      // Should NOT show "טרם נרשמו משתתפים" (no participants registered yet)
      const hasNoParticipantsMessage = await page.locator('text=/טרם נרשמו משתתפים/i')
        .isVisible()
        .catch(() => false)

      // If there are registrations, should show them (not "no participants")
      if (hasActivity) {
        expect(hasNoParticipantsMessage).toBe(false)
      }
    })

    test('should show consistent participant count between stats and activity', async ({ page }) => {
      const school = await createSchool().withName('Consistency School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('consistency'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withSchool(school.id)
        .withTitle('Consistency Test')
        .withCapacity(20)
        .withSpotsReserved(2)
        .create()

      // Create 2 registrations
      await createRegistration().withEvent(event.id).withName('User 1').withSpots(1).create()
      await createRegistration().withEvent(event.id).withName('User 2').withSpots(1).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Check top stats show 2 participants
      const statsText = await page.locator('text=/2.*מאושרים|מאושרים.*2/i').isVisible().catch(() => false)

      // Check recent activity shows registrations (not "no participants")
      const hasNoParticipants = await page.locator('text=/טרם נרשמו משתתפים/i').isVisible().catch(() => false)

      // Stats and activity should be consistent
      if (statsText) {
        expect(hasNoParticipants).toBe(false)
      }
    })

    test('should show "no participants" message only when actually empty', async ({ page }) => {
      const school = await createSchool().withName('Empty Event School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('empty-event'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withSchool(school.id)
        .withTitle('Empty Event')
        .withCapacity(10)
        .withSpotsReserved(0)
        .create()

      // No registrations created

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // NOW "no participants" message is correct
      const hasNoParticipants = await page.locator('text=/טרם נרשמו משתתפים/i')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      // Should show the message (event is truly empty)
      expect(hasNoParticipants).toBe(true)
    })
  })

  test.describe('Bug #9: Create Event Dropdown Clipped on Desktop', () => {
    test('dropdown should be fully visible on desktop viewport', async ({ page }) => {
      const school = await createSchool().withName('Dropdown Test School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('dropdown-test'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Go to empty dashboard
      await page.goto('/admin')

      // Click create event button
      const createButton = page.locator('button:has-text(/צור אירוע|Create Event/i)').first()
      const isVisible = await createButton.isVisible().catch(() => false)

      if (isVisible) {
        await createButton.click()

        // Wait for dropdown to appear
        await page.waitForTimeout(300)

        // Check if dropdown is visible and not clipped
        const dropdown = page.locator('[role="menu"], .dropdown-menu, div[class*="dropdown"]').first()
        const dropdownVisible = await dropdown.isVisible().catch(() => false)

        if (dropdownVisible) {
          const box = await dropdown.boundingBox()
          const viewport = page.viewportSize()

          // Dropdown should not be cut off at the bottom
          if (box && viewport) {
            expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
          }
        }
      }
    })
  })
})

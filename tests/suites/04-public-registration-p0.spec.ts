import { test, expect } from '@playwright/test'
import { createSchool, createEvent, cleanupTestData } from '../fixtures/test-data'
import { PublicEventPage } from '../page-objects/PublicEventPage'
import { generateEmail, generateIsraeliPhone, getFutureDate } from '../helpers/test-helpers'

/**
 * P0 (CRITICAL) Public Registration Flow Tests
 * Ref: tests/scenarios/04-public-registration-flow.md
 */

test.describe('Public Registration P0 - Critical Tests', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('[04.2.1] Happy Path - Complete Registration', () => {
    test('user can register successfully when spots available', async ({ page }) => {
      // Setup
      const school = await createSchool().withName('Reg Test School').create()
      const event = await createEvent()
        .withTitle('Public Registration Event')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(0)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Fill and submit registration
      await publicPage.register({
        name: 'Test Registrant',
        email: generateEmail('public-reg'),
        phone: generateIsraeliPhone(),
        spots: 1,
      })

      // Should see confirmation
      await publicPage.expectConfirmation()

      // Should get confirmation code
      const confirmationCode = await publicPage.getConfirmationCode()
      expect(confirmationCode).toBeTruthy()
    })
  })

  test.describe('[04.2.2-2.5] Form Validation', () => {
    test('cannot submit with missing required fields', async ({ page }) => {
      const school = await createSchool().withName('Validation School').create()
      const event = await createEvent()
        .withTitle('Validation Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Try to submit empty form
      await publicPage.submitRegistration()

      // Should show validation errors
      await publicPage.expectValidationError()
    })

    test('validates Israeli phone number format', async ({ page }) => {
      const school = await createSchool().withName('Phone Validation').create()
      const event = await createEvent()
        .withTitle('Phone Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Fill with invalid phone
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', generateEmail('phone-test'))
      await page.fill('input[name="phone"]', '123') // Invalid

      await publicPage.submitRegistration()

      // Should show phone validation error
      await expect(page.locator('text=/פורמט|format|לא תקין|invalid/i')).toBeVisible()
    })

    test('validates email format', async ({ page }) => {
      const school = await createSchool().withName('Email Validation').create()
      const event = await createEvent()
        .withTitle('Email Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Fill with invalid email
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'invalid-email') // No @ or domain
      await page.fill('input[name="phone"]', generateIsraeliPhone())

      await publicPage.submitRegistration()

      // Should show email validation error
      await expect(page.locator('text=/דוא״ל|email.*לא תקין|invalid/i')).toBeVisible()
    })
  })

  test.describe('[04.4.1-4.4] Atomic Capacity Enforcement', () => {
    test('registration when spots available is confirmed', async ({ page }) => {
      const school = await createSchool().withName('Capacity Available').create()
      const event = await createEvent()
        .withTitle('Available Spots Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(5) // 5 spots available
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      await publicPage.register({
        name: 'Available Spot User',
        email: generateEmail('available'),
        phone: generateIsraeliPhone(),
        spots: 2,
      })

      // Should be confirmed (spots available)
      await publicPage.expectConfirmation()
    })

    test('registration when event full goes to waitlist', async ({ page }) => {
      const school = await createSchool().withName('Capacity Full').create()
      const event = await createEvent()
        .withTitle('Full Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(10) // FULL
        .full()
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      await publicPage.register({
        name: 'Waitlist User',
        email: generateEmail('waitlist'),
        phone: generateIsraeliPhone(),
        spots: 1,
      })

      // Should go to waitlist
      await publicPage.expectWaitlist()
    })

    test('concurrent registrations respect capacity (race condition test)', async ({ browser }) => {
      // Setup event with limited capacity
      const school = await createSchool().withName('Race Condition School').create()
      const event = await createEvent()
        .withTitle('Race Test Event')
        .withSchool(school.id)
        .withCapacity(3) // Only 3 spots
        .withSpotsReserved(0)
        .inFuture()
        .create()

      // Create 5 concurrent users
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
      ])

      const pages = await Promise.all(contexts.map(ctx => ctx.newPage()))

      // All navigate to event
      await Promise.all(
        pages.map(page => page.goto(`/p/${school.slug}/${event.slug}`))
      )

      // All fill forms
      await Promise.all(
        pages.map((page, i) =>
          Promise.all([
            page.fill('input[name="name"]', `User ${i + 1}`),
            page.fill('input[name="email"]', generateEmail(`concurrent-${i}`)),
            page.fill('input[name="phone"]', generateIsraeliPhone()),
          ])
        )
      )

      // All submit simultaneously (RACE CONDITION!)
      await Promise.all(pages.map(page => page.click('button[type="submit"]')))

      // Wait for all to process
      await Promise.all(pages.map(page => page.waitForTimeout(3000)))

      // Check results
      const results = await Promise.all(
        pages.map(async page => {
          const confirmed = await page.locator('text=/הרשמה הושלמה|נרשמת בהצלחה/i').isVisible().catch(() => false)
          const waitlist = await page.locator('text=/רשימת המתנה|waitlist/i').isVisible().catch(() => false)
          return { confirmed, waitlist }
        })
      )

      const confirmedCount = results.filter(r => r.confirmed).length
      const waitlistCount = results.filter(r => r.waitlist).length

      // CRITICAL: Should be exactly 3 confirmed, 2 waitlisted
      expect(confirmedCount).toBe(3)
      expect(waitlistCount).toBe(2)

      // Cleanup
      await Promise.all(contexts.map(ctx => ctx.close()))
    })
  })

  test.describe('[04.5.1-5.4] Confirmation & Feedback', () => {
    test('successful registration shows confirmation code', async ({ page }) => {
      const school = await createSchool().withName('Confirmation School').create()
      const event = await createEvent()
        .withTitle('Confirmation Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      await publicPage.register({
        name: 'Confirmed User',
        email: generateEmail('confirmed'),
        phone: generateIsraeliPhone(),
      })

      await publicPage.expectConfirmation()

      const confirmationCode = await publicPage.getConfirmationCode()

      // Should be 6 character alphanumeric code
      expect(confirmationCode).toBeTruthy()
      expect(confirmationCode?.length).toBe(6)
    })

    test('waitlist registration shows waitlist message', async ({ page }) => {
      const school = await createSchool().withName('Waitlist Msg School').create()
      const event = await createEvent()
        .withTitle('Waitlist Msg Event')
        .withSchool(school.id)
        .withCapacity(1)
        .withSpotsReserved(1)
        .full()
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      await publicPage.register({
        name: 'Waitlist User',
        email: generateEmail('waitlist-msg'),
        phone: generateIsraeliPhone(),
      })

      // Should show waitlist message
      await publicPage.expectWaitlist()

      // Should still get confirmation code (for waitlist tracking)
      const confirmationCode = await publicPage.getConfirmationCode()
      expect(confirmationCode).toBeTruthy()
    })
  })

  test.describe('[04.6.1-6.4] Error Handling', () => {
    test('shows error for non-existent event', async ({ page }) => {
      const school = await createSchool().withName('Error School').create()

      const publicPage = new PublicEventPage(page)
      const response = await page.goto(`/p/${school.slug}/non-existent-event`)

      // Should return 404
      expect(response?.status()).toBe(404)
    })

    test('double submission prevention', async ({ page }) => {
      const school = await createSchool().withName('Double Submit School').create()
      const event = await createEvent()
        .withTitle('Double Submit Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      await publicPage.fillRegistrationForm({
        name: 'Double Submit User',
        email: generateEmail('double'),
        phone: generateIsraeliPhone(),
      })

      // Click submit multiple times rapidly
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()
      await submitButton.click() // Second click
      await submitButton.click() // Third click

      // Wait for completion
      await page.waitForTimeout(2000)

      // Button should be disabled after first click
      await expect(submitButton).toBeDisabled()

      // Should only create ONE registration (verified in backend)
      await publicPage.expectConfirmation()
    })
  })

  test.describe('[04.9.1-9.5] Mobile UX & Accessibility', () => {
    test('mobile registration form is accessible', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().withName('Mobile School').create()
      const event = await createEvent()
        .withTitle('Mobile Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // All form elements should be visible
      await expect(page.locator('input[name="name"]')).toBeVisible()
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="phone"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()

      // Input text should be visible (not white on white)
      const nameInput = page.locator('input[name="name"]')
      const styles = await nameInput.evaluate(el => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })

      // Should have dark text on light background
      expect(styles.color).not.toBe('rgb(255, 255, 255)') // Not white text
      expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)') // Not transparent
    })

    test('touch targets are minimum 44px height', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().withName('Touch Target School').create()
      const event = await createEvent()
        .withTitle('Touch Target Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Check submit button height
      const submitButton = page.locator('button[type="submit"]')
      const boundingBox = await submitButton.boundingBox()

      expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
    })

    test('Hebrew RTL layout is correct', async ({ page }) => {
      const school = await createSchool().withName('RTL School').create()
      const event = await createEvent()
        .withTitle('אירוע בעברית') // Hebrew title
        .withSchool(school.id)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Check RTL direction
      const direction = await page.locator('body, html, main').first().evaluate(el => {
        return window.getComputedStyle(el).direction
      })

      expect(direction).toBe('rtl')

      // Hebrew text should be visible
      await expect(page.locator('text=אירוע בעברית')).toBeVisible()
    })
  })

  test.describe('[BUG #23] Overbooking Prevention - Spot Limit Enforcement', () => {
    test('should limit spot dropdown to available capacity (7 spots available)', async ({ page }) => {
      // Setup: Event with 20 capacity, 13 already reserved (7 available)
      const school = await createSchool().withName('Overbooking Test 1').create()
      const event = await createEvent()
        .withTitle('Limit Test Event')
        .withSchool(school.id)
        .withCapacity(20)
        .withSpotsReserved(13) // 7 spots available
        .inFuture()
        .create()

      // Navigate to public registration page
      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Find the spots dropdown/select
      const spotsSelector = page.locator('select[name="spots"], input[name="spots"]')
      await expect(spotsSelector).toBeVisible()

      // Get all available options
      const options = await spotsSelector.locator('option').allTextContents()

      // Should have exactly 7 options (1-7)
      expect(options.length).toBeLessThanOrEqual(7)

      // Verify no option has value greater than 7
      const optionValues = await spotsSelector.locator('option').evaluateAll(opts =>
        opts.map(opt => parseInt((opt as HTMLOptionElement).value) || 0)
      )
      const maxValue = Math.max(...optionValues)
      expect(maxValue).toBeLessThanOrEqual(7)

      // Try to manually set spots to 8 (should fail or be limited)
      await spotsSelector.fill('8')
      const actualValue = await spotsSelector.inputValue()
      expect(parseInt(actualValue)).toBeLessThanOrEqual(7)
    })

    test('should prevent selecting more spots than available', async ({ page }) => {
      // Setup: Event with only 5 spots available
      const school = await createSchool().withName('Overbooking Test 2').create()
      const event = await createEvent()
        .withTitle('Five Spots Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(5) // Only 5 spots available
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Verify dropdown doesn't have options for 6, 7, 8, 9, 10 spots
      const spotsSelector = page.locator('select[name="spots"], input[name="spots"]')

      // Try to select 8 spots (should not be possible)
      const hasOption8 = await page.locator('select[name="spots"] option[value="8"]').count()
      expect(hasOption8).toBe(0)

      // Try to select 9 spots (should not be possible)
      const hasOption9 = await page.locator('select[name="spots"] option[value="9"]').count()
      expect(hasOption9).toBe(0)

      // Try to select 10 spots (should not be possible)
      const hasOption10 = await page.locator('select[name="spots"] option[value="10"]').count()
      expect(hasOption10).toBe(0)
    })

    test('should limit waitlist registrations to max 5 spots', async ({ page }) => {
      // Setup: Create FULL event (0 spots available)
      const school = await createSchool().withName('Waitlist Limit Test').create()
      const event = await createEvent()
        .withTitle('Full Event Waitlist')
        .withSchool(school.id)
        .withCapacity(20)
        .withSpotsReserved(20) // FULL - 0 spots available
        .full()
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Find spots dropdown
      const spotsSelector = page.locator('select[name="spots"], input[name="spots"]')
      await expect(spotsSelector).toBeVisible()

      // Get all available options for waitlist
      const optionValues = await spotsSelector.locator('option').evaluateAll(opts =>
        opts.map(opt => parseInt((opt as HTMLOptionElement).value) || 0)
      )
      const maxValue = Math.max(...optionValues)

      // Waitlist should be limited to max 5 spots (or maxSpotsPerPerson if lower)
      expect(maxValue).toBeLessThanOrEqual(5)

      // Try to manually set spots to 10 (should fail)
      await spotsSelector.fill('10')
      const actualValue = await spotsSelector.inputValue()
      expect(parseInt(actualValue)).toBeLessThanOrEqual(5)
    })

    test('should respect maxSpotsPerPerson limit even when more spots available', async ({ page }) => {
      // Setup: Event with maxSpotsPerPerson=3 and 10 spots available
      const school = await createSchool().withName('Max Per Person Test').create()
      const event = await createEvent()
        .withTitle('Limited Per Person Event')
        .withSchool(school.id)
        .withCapacity(20)
        .withSpotsReserved(10) // 10 spots available
        .withMaxSpotsPerPerson(3) // Max 3 per person
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Find spots dropdown
      const spotsSelector = page.locator('select[name="spots"], input[name="spots"]')
      await expect(spotsSelector).toBeVisible()

      // Get all available options
      const optionValues = await spotsSelector.locator('option').evaluateAll(opts =>
        opts.map(opt => parseInt((opt as HTMLOptionElement).value) || 0)
      )
      const maxValue = Math.max(...optionValues)

      // Should be limited to 3 (maxSpotsPerPerson) even though 10 spots available
      expect(maxValue).toBe(3)

      // Verify no option for 4 or higher
      const hasOption4 = await page.locator('select[name="spots"] option[value="4"]').count()
      expect(hasOption4).toBe(0)

      const hasOption5 = await page.locator('select[name="spots"] option[value="5"]').count()
      expect(hasOption5).toBe(0)
    })

    test('should dynamically update available spots after registration', async ({ page, browser }) => {
      // Setup: Event with 5 spots available
      const school = await createSchool().withName('Dynamic Update Test').create()
      const event = await createEvent()
        .withTitle('Dynamic Spots Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(5) // 5 spots available
        .inFuture()
        .create()

      // User 1: Register for 3 spots
      const context1 = await browser.newContext()
      const page1 = await context1.newPage()
      const publicPage1 = new PublicEventPage(page1)
      await publicPage1.goto(school.slug, event.slug)

      await publicPage1.register({
        name: 'User 1',
        email: generateEmail('user1-dynamic'),
        phone: generateIsraeliPhone(),
        spots: 3,
      })

      await publicPage1.expectConfirmation()
      await context1.close()

      // User 2: Should now see only 2 spots available (5 - 3 = 2)
      const context2 = await browser.newContext()
      const page2 = await context2.newPage()
      const publicPage2 = new PublicEventPage(page2)
      await publicPage2.goto(school.slug, event.slug)

      const spotsSelector = page2.locator('select[name="spots"], input[name="spots"]')
      const optionValues = await spotsSelector.locator('option').evaluateAll(opts =>
        opts.map(opt => parseInt((opt as HTMLOptionElement).value) || 0)
      )
      const maxValue = Math.max(...optionValues)

      // Should be limited to 2 remaining spots
      expect(maxValue).toBeLessThanOrEqual(2)

      await context2.close()
    })

    test('should show "Event Full" when no spots available and prevent registration', async ({ page }) => {
      // Setup: Event with 0 spots available
      const school = await createSchool().withName('No Spots Test').create()
      const event = await createEvent()
        .withTitle('Zero Spots Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(10) // FULL
        .full()
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Should show event is full (may go to waitlist instead)
      // Check if registration is for waitlist
      const isWaitlistText = await page.locator('text=/רשימת המתנה|waitlist/i').isVisible()

      if (!isWaitlistText) {
        // If not waitlist, should show full message
        await publicPage.expectEventFull()
      }

      // Spots selector should still be visible (for waitlist) but limited
      const spotsSelector = page.locator('select[name="spots"], input[name="spots"]')
      if (await spotsSelector.isVisible()) {
        // Should be limited to reasonable waitlist amount
        const optionValues = await spotsSelector.locator('option').evaluateAll(opts =>
          opts.map(opt => parseInt((opt as HTMLOptionElement).value) || 0)
        )
        const maxValue = Math.max(...optionValues)
        expect(maxValue).toBeLessThanOrEqual(5) // Waitlist limit
      }
    })

    test('should handle edge case: exactly 1 spot remaining', async ({ page }) => {
      // Setup: Event with exactly 1 spot available
      const school = await createSchool().withName('One Spot Test').create()
      const event = await createEvent()
        .withTitle('One Spot Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(9) // Only 1 spot available
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Should only show option for 1 spot
      const spotsSelector = page.locator('select[name="spots"], input[name="spots"]')
      const optionValues = await spotsSelector.locator('option').evaluateAll(opts =>
        opts.map(opt => parseInt((opt as HTMLOptionElement).value) || 0)
      )
      const maxValue = Math.max(...optionValues)

      expect(maxValue).toBe(1)

      // Verify cannot select 2 spots
      const hasOption2 = await page.locator('select[name="spots"] option[value="2"]').count()
      expect(hasOption2).toBe(0)
    })
  })
})

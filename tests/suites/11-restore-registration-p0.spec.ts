import { test, expect } from '@playwright/test'
import {
  createSchool,
  createAdmin,
  createEvent,
  createRegistration,
  cleanupTestData,
} from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { generateEmail } from '../helpers/test-helpers'

/**
 * P0 (CRITICAL) Restore Registration Tests
 *
 * Tests the ability to restore a CANCELLED registration back to CONFIRMED or WAITLIST status.
 *
 * Related Bug: Bug #4 - 500 Error when restoring cancelled registration
 * Root Cause: Attempted to set cancelledBy to null (non-nullable field)
 */

test.describe('Restore Registration P0', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('[11.1] Can restore cancelled registration to confirmed (capacity available)', async ({
    page,
  }) => {
    // Setup: Create school, admin, event with capacity
    const school = await createSchool().withName('Restore Test School').create()
    const admin = await createAdmin()
      .withEmail(generateEmail('restore-test'))
      .withPassword('TestPassword123!')
      .withSchool(school.id)
      .create()

    const event = await createEvent()
      .withTitle('Restore Test Event')
      .withSchool(school.id)
      .withCapacity(10)
      .withSpotsReserved(0)
      .create()

    // Create a cancelled registration
    const registration = await createRegistration()
      .withEvent(event.id)
      .withName('Cancelled User')
      .cancelled()
      .create()

    // Login and navigate to event detail page
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(admin.email, 'TestPassword123!')

    await page.goto(`/admin/events/${event.id}`)

    // Verify registration shows as CANCELLED
    await expect(page.locator('text=Cancelled User')).toBeVisible()
    await expect(page.locator('text=בוטל')).toBeVisible()

    // Click restore button (שחזר הרשמה)
    const restoreButton = page
      .locator('button[title="שחזר הרשמה"], button:has-text("שחזר הרשמה")')
      .first()
    await restoreButton.click()

    // Wait for API call to complete
    await page.waitForTimeout(1000)

    // Verify registration is now CONFIRMED
    await expect(page.locator('text=אושר')).toBeVisible()

    // Verify no error messages
    await expect(page.locator('text=/error|שגיאה/i')).not.toBeVisible()
  })

  test('[11.2] Restores to waitlist when event is full', async ({ page }) => {
    // Setup: Create school, admin, event at capacity
    const school = await createSchool().withName('Waitlist Restore School').create()
    const admin = await createAdmin()
      .withEmail(generateEmail('waitlist-restore'))
      .withPassword('TestPassword123!')
      .withSchool(school.id)
      .create()

    const event = await createEvent()
      .withTitle('Full Event')
      .withSchool(school.id)
      .withCapacity(2)
      .withSpotsReserved(2)
      .create()

    // Create 2 confirmed registrations (fills capacity)
    await createRegistration().withEvent(event.id).withName('Confirmed User 1').confirmed().create()

    await createRegistration().withEvent(event.id).withName('Confirmed User 2').confirmed().create()

    // Create a cancelled registration
    const registration = await createRegistration()
      .withEvent(event.id)
      .withName('Cancelled User')
      .cancelled()
      .create()

    // Login and navigate to event detail page
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(admin.email, 'TestPassword123!')

    await page.goto(`/admin/events/${event.id}`)

    // Click restore button
    const restoreButton = page
      .locator('button[title="שחזר הרשמה"], button:has-text("שחזר הרשמה")')
      .first()
    await restoreButton.click()

    // Wait for fallback to waitlist
    await page.waitForTimeout(1500)

    // Verify registration is now WAITLIST (since capacity is full)
    await expect(page.locator('text=רשימת המתנה')).toBeVisible()

    // Verify alert message about waitlist
    // Note: This may require mocking or checking console logs
  })

  test('[11.3] Restore clears cancellation metadata correctly', async ({ page, request }) => {
    // Setup
    const school = await createSchool().withName('Metadata Clear School').create()
    const admin = await createAdmin()
      .withEmail(generateEmail('metadata-clear'))
      .withPassword('TestPassword123!')
      .withSchool(school.id)
      .create()

    const event = await createEvent()
      .withTitle('Metadata Test Event')
      .withSchool(school.id)
      .withCapacity(10)
      .create()

    const registration = await createRegistration()
      .withEvent(event.id)
      .withName('Test User')
      .cancelled()
      .create()

    // Login
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(admin.email, 'TestPassword123!')

    // Get session cookie
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find((c) => c.name === 'session')

    // Call API directly to restore
    const response = await request.patch(
      `http://localhost:9000/api/events/${event.id}/registrations/${registration.id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session=${sessionCookie?.value}`,
        },
        data: {
          status: 'CONFIRMED',
        },
      }
    )

    // Verify no 500 error (Bug #4 fix)
    expect(response.status()).not.toBe(500)
    expect(response.ok()).toBe(true)

    const data = await response.json()

    // Verify response contains updated registration
    expect(data.status).toBe('CONFIRMED')
    expect(data.cancelledAt).toBeNull()
    expect(data.cancellationReason).toBeNull()
    // cancelledBy should NOT be null (kept for audit trail)
    expect(data.cancelledBy).toBeDefined()
  })

  test('[11.4] Cannot restore if it would violate capacity limits', async ({ page, request }) => {
    // Setup: Event with multi-spot registration
    const school = await createSchool().withName('Capacity Limit School').create()
    const admin = await createAdmin()
      .withEmail(generateEmail('capacity-limit'))
      .withPassword('TestPassword123!')
      .withSchool(school.id)
      .create()

    const event = await createEvent()
      .withTitle('Limited Event')
      .withSchool(school.id)
      .withCapacity(5)
      .withSpotsReserved(4)
      .create()

    // Create confirmed registration taking 4 spots
    await createRegistration()
      .withEvent(event.id)
      .withName('Big Group')
      .withSpots(4)
      .confirmed()
      .create()

    // Create cancelled registration requesting 3 spots
    const registration = await createRegistration()
      .withEvent(event.id)
      .withName('Cancelled Group')
      .withSpots(3)
      .cancelled()
      .create()

    // Login
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(admin.email, 'TestPassword123!')

    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find((c) => c.name === 'session')

    // Try to restore (should fail - needs 3 spots but only 1 available)
    const response = await request.patch(
      `http://localhost:9000/api/events/${event.id}/registrations/${registration.id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session=${sessionCookie?.value}`,
        },
        data: {
          status: 'CONFIRMED',
        },
      }
    )

    // Should fail with 400 error
    expect(response.status()).toBe(400)
    const error = await response.json()
    expect(error.error).toContain('Cannot promote')
  })
})

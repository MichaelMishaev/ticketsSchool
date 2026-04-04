import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { generateCheckInToken } from '@/lib/check-in-token'
import { generateQRCodeData } from '@/lib/qr-code'
import { cleanupTestData, createSchool, createAdmin, createEvent, createRegistration } from '../fixtures/test-data'

test.describe('Check-In System (P0)', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should display check-in page with registrations', async ({ page }) => {
    // Setup: Create test data
    const school = await createSchool().withName('Test School').create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Test Event')
      .withCapacity(50)
      .create()

    // Generate check-in token
    const token = generateCheckInToken()
    await prisma.event.update({
      where: { id: event.id },
      data: { checkInToken: token }
    })

    // Create registrations
    const reg1 = await createRegistration()
      .withEvent(event.id)
      .withName('אבי כהן')
      .withPhone('0501234567')
      .withSpots(2)
      .withCustomFields({ childName: 'יוסי' })
      .create()

    const reg2 = await createRegistration()
      .withEvent(event.id)
      .withName('שרה לוי')
      .withPhone('0521234567')
      .withSpots(1)
      .create()

    // Visit check-in page
    await page.goto(`/check-in/${event.id}/${token}`)

    // Verify page loads
    await expect(page.locator('text=Test Event')).toBeVisible()

    // Verify stats bar
    await expect(page.locator('text=0 / 2')).toBeVisible()
    await expect(page.locator('text=0%')).toBeVisible()

    // Verify registrations are displayed
    await expect(page.locator('text=אבי כהן')).toBeVisible()
    await expect(page.locator('text=שרה לוי')).toBeVisible()

    // Verify filter tabs
    await expect(page.locator('button:has-text("הכל (2)")')).toBeVisible()
    await expect(page.locator('button:has-text("הגיעו ✅ (0)")')).toBeVisible()
    await expect(page.locator('button:has-text("לא הגיעו ⏳ (2)")')).toBeVisible()
  })

  test('should check in registration manually', async ({ page }) => {
    // Setup
    const school = await createSchool().withName('Test School 2').create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Manual Check-In Event')
      .create()

    const token = generateCheckInToken()
    await prisma.event.update({
      where: { id: event.id },
      data: { checkInToken: token }
    })

    const registration = await createRegistration()
      .withEvent(event.id)
      .withName('דני אביב')
      .withPhone('0531234567')
      .create()

    // Visit page
    await page.goto(`/check-in/${event.id}/${token}`)

    // Wait for page to load
    await expect(page.locator('text=דני אביב')).toBeVisible()

    // Initial state: not checked in (amber)
    const card = page.locator('div').filter({ hasText: 'דני אביב' }).first()
    await expect(card).toHaveClass(/bg-amber-50/)
    await expect(card.locator('text=ממתין לנוכחות')).toBeVisible()

    // Click check-in button
    await card.locator('button:has-text("סמן נוכח")').click()

    // Wait for optimistic update
    await page.waitForTimeout(500)

    // Verify card turns green
    await expect(card).toHaveClass(/bg-green-50/)
    await expect(card.locator('text=הגיע')).toBeVisible()

    // Verify toast notification
    await expect(page.locator('text=נוכחות נרשמה בהצלחה')).toBeVisible()

    // Verify stats updated
    await expect(page.locator('text=1 / 1')).toBeVisible()
    await expect(page.locator('text=100%')).toBeVisible()

    // Verify database
    const checkIn = await prisma.checkIn.findFirst({
      where: { registrationId: registration.id }
    })
    expect(checkIn).toBeTruthy()
    expect(checkIn?.undoneAt).toBeNull()
  })

  test('should undo check-in', async ({ page }) => {
    // Setup
    const school = await createSchool().withName('Test School 3').create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Undo Check-In Event')
      .create()

    const token = generateCheckInToken()
    await prisma.event.update({
      where: { id: event.id },
      data: { checkInToken: token }
    })

    const registration = await createRegistration()
      .withEvent(event.id)
      .withName('רונית שלום')
      .create()

    // Create check-in record
    await prisma.checkIn.create({
      data: { registrationId: registration.id }
    })

    // Visit page
    await page.goto(`/check-in/${event.id}/${token}`)

    // Wait for page to load
    await expect(page.locator('text=רונית שלום')).toBeVisible()

    // Card should be green (checked in)
    const card = page.locator('div').filter({ hasText: 'רונית שלום' }).first()
    await expect(card).toHaveClass(/bg-green-50/)

    // Click undo button
    await card.locator('button:has-text("בטל נוכחות")').click()

    // Wait for update
    await page.waitForTimeout(500)

    // Verify card turns amber (not checked in)
    await expect(card).toHaveClass(/bg-amber-50/)
    await expect(card.locator('text=ממתין לנוכחות')).toBeVisible()

    // Verify toast
    await expect(page.locator('text=נוכחות בוטלה בהצלחה')).toBeVisible()

    // Verify database
    const checkIn = await prisma.checkIn.findFirst({
      where: { registrationId: registration.id }
    })
    expect(checkIn?.undoneAt).toBeTruthy()
  })

  test('should search registrations', async ({ page }) => {
    // Setup
    const school = await createSchool().withName('Test School 4').create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Search Test Event')
      .create()

    const token = generateCheckInToken()
    await prisma.event.update({
      where: { id: event.id },
      data: { checkInToken: token }
    })

    await createRegistration()
      .withEvent(event.id)
      .withName('אברהם כהן')
      .withPhone('0501111111')
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('שרה לוי')
      .withPhone('0502222222')
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('דוד משה')
      .withPhone('0503333333')
      .create()

    // Visit page
    await page.goto(`/check-in/${event.id}/${token}`)

    // Wait for all registrations to load
    await expect(page.locator('text=אברהם כהן')).toBeVisible()
    await expect(page.locator('text=שרה לוי')).toBeVisible()
    await expect(page.locator('text=דוד משה')).toBeVisible()

    // Search by name
    await page.fill('input[placeholder*="חיפוש"]', 'שרה')
    await page.waitForTimeout(300)

    // Should only show matching registration
    await expect(page.locator('text=שרה לוי')).toBeVisible()
    await expect(page.locator('text=אברהם כהן')).not.toBeVisible()
    await expect(page.locator('text=דוד משה')).not.toBeVisible()

    // Clear search
    await page.fill('input[placeholder*="חיפוש"]', '')
    await page.waitForTimeout(300)

    // All should be visible again
    await expect(page.locator('text=אברהם כהן')).toBeVisible()
    await expect(page.locator('text=שרה לוי')).toBeVisible()
    await expect(page.locator('text=דוד משה')).toBeVisible()

    // Search by phone
    await page.fill('input[placeholder*="חיפוש"]', '0502222222')
    await page.waitForTimeout(300)

    await expect(page.locator('text=שרה לוי')).toBeVisible()
    await expect(page.locator('text=אברהם כהן')).not.toBeVisible()
  })

  test('should filter by check-in status', async ({ page }) => {
    // Setup
    const school = await createSchool().withName('Test School 5').create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Filter Test Event')
      .create()

    const token = generateCheckInToken()
    await prisma.event.update({
      where: { id: event.id },
      data: { checkInToken: token }
    })

    const reg1 = await createRegistration()
      .withEvent(event.id)
      .withName('נוכח א')
      .create()

    const reg2 = await createRegistration()
      .withEvent(event.id)
      .withName('נוכח ב')
      .create()

    const reg3 = await createRegistration()
      .withEvent(event.id)
      .withName('לא נוכח')
      .create()

    // Check in first two
    await prisma.checkIn.createMany({
      data: [
        { registrationId: reg1.id },
        { registrationId: reg2.id }
      ]
    })

    // Visit page
    await page.goto(`/check-in/${event.id}/${token}`)

    // Wait for page to load
    await expect(page.locator('text=נוכח א')).toBeVisible()

    // Verify all visible initially
    await expect(page.locator('text=נוכח א')).toBeVisible()
    await expect(page.locator('text=נוכח ב')).toBeVisible()
    await expect(page.locator('text=לא נוכח')).toBeVisible()

    // Click "checked-in" filter
    await page.click('button:has-text("הגיעו ✅")')
    await page.waitForTimeout(300)

    // Should only show checked-in registrations
    await expect(page.locator('text=נוכח א')).toBeVisible()
    await expect(page.locator('text=נוכח ב')).toBeVisible()
    await expect(page.locator('text=לא נוכח')).not.toBeVisible()

    // Click "not checked-in" filter
    await page.click('button:has-text("לא הגיעו ⏳")')
    await page.waitForTimeout(300)

    // Should only show not checked-in registrations
    await expect(page.locator('text=נוכח א')).not.toBeVisible()
    await expect(page.locator('text=נוכח ב')).not.toBeVisible()
    await expect(page.locator('text=לא נוכח')).toBeVisible()

    // Click "all" filter
    await page.click('button:has-text("הכל")')
    await page.waitForTimeout(300)

    // All should be visible
    await expect(page.locator('text=נוכח א')).toBeVisible()
    await expect(page.locator('text=נוכח ב')).toBeVisible()
    await expect(page.locator('text=לא נוכח')).toBeVisible()
  })

  test('should display banned users correctly', async ({ page }) => {
    // Setup
    const school = await createSchool().withName('Test School 6').create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Banned User Event')
      .create()

    const token = generateCheckInToken()
    await prisma.event.update({
      where: { id: event.id },
      data: { checkInToken: token }
    })

    // Create banned user
    const bannedPhone = '0509999999'
    await prisma.userBan.create({
      data: {
        schoolId: school.id,
        phoneNumber: bannedPhone,
        reason: 'התנהגות לא הולמת',
        bannedGamesCount: 3,
        eventsBlocked: 1,
        active: true
      }
    })

    // Create registration for banned user
    await createRegistration()
      .withEvent(event.id)
      .withName('משתמש חסום')
      .withPhone(bannedPhone)
      .create()

    // Visit page
    await page.goto(`/check-in/${event.id}/${token}`)

    // Wait for page to load
    await expect(page.locator('text=משתמש חסום')).toBeVisible()

    // Verify banned card styling (red)
    const card = page.locator('div').filter({ hasText: 'משתמש חסום' }).first()
    await expect(card).toHaveClass(/bg-red-50/)
    await expect(card.locator('text=חסום')).toBeVisible()

    // Verify ban reason displayed
    await expect(card.locator('text=התנהגות לא הולמת')).toBeVisible()
    await expect(card.locator('text=נותרו 2 משחקים')).toBeVisible()

    // Verify no check-in button for banned user
    await expect(card.locator('button:has-text("סמן נוכח")')).not.toBeVisible()
  })

  test('should show invalid token error', async ({ page }) => {
    // Setup
    const school = await createSchool().withName('Test School 7').create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Invalid Token Event')
      .create()

    const correctToken = generateCheckInToken()
    await prisma.event.update({
      where: { id: event.id },
      data: { checkInToken: correctToken }
    })

    // Visit with wrong token
    await page.goto(`/check-in/${event.id}/wrong-token-123`)

    // Should show error
    await expect(page.locator('text=שגיאה')).toBeVisible()
  })

  test('should handle QR scanner modal', async ({ page, context }) => {
    // Grant camera permissions (mock)
    await context.grantPermissions(['camera'])

    // Setup
    const school = await createSchool().withName('Test School 8').create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('QR Scanner Event')
      .create()

    const token = generateCheckInToken()
    await prisma.event.update({
      where: { id: event.id },
      data: { checkInToken: token }
    })

    // Visit page
    await page.goto(`/check-in/${event.id}/${token}`)

    // Click QR scanner button
    await page.click('button[aria-label="סרוק QR"]')

    // Wait for modal to open
    await page.waitForTimeout(500)

    // Verify modal is visible
    await expect(page.locator('text=סריקת QR')).toBeVisible()
    await expect(page.locator('text=מכוון את המצלמה לקוד QR')).toBeVisible()

    // Close modal
    await page.click('button[aria-label="סגור"]')

    // Verify modal closed
    await expect(page.locator('text=סריקת QR')).not.toBeVisible()
  })

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 })

    // Setup
    const school = await createSchool().withName('Test School 9').create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Mobile Test Event')
      .create()

    const token = generateCheckInToken()
    await prisma.event.update({
      where: { id: event.id },
      data: { checkInToken: token }
    })

    await createRegistration()
      .withEvent(event.id)
      .withName('משתמש מובייל')
      .create()

    // Visit page
    await page.goto(`/check-in/${event.id}/${token}`)

    // Verify page loads on mobile
    await expect(page.locator('text=Mobile Test Event')).toBeVisible()
    await expect(page.locator('text=משתמש מובייל')).toBeVisible()

    // Verify touch targets are large enough (48px+)
    const checkInButton = page.locator('button:has-text("סמן נוכח")').first()
    const buttonBox = await checkInButton.boundingBox()
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)

    const qrButton = page.locator('button[aria-label="סרוק QR"]')
    const qrBox = await qrButton.boundingBox()
    expect(qrBox?.height).toBeGreaterThanOrEqual(48)
  })
})

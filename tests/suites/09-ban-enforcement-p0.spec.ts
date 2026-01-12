import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { cleanupTestData, createSchool, createAdmin, createEvent, createRegistration } from '../fixtures/test-data'
import { generateEmail, generateSchoolName } from '../helpers/test-helpers'

test.describe('Ban Enforcement System (P0)', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should block banned user from registering (date-based ban)', async ({ page }) => {
    // Setup: Create school and event
    const school = await createSchool().withName(generateSchoolName()).create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Soccer Game')
      .withCapacity(30)
      .create()

    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('ban-admin'))
      .create()

    // Create a date-based ban
    const bannedPhone = '0501234567'
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 7) // Ban for 7 days

    await prisma.userBan.create({
      data: {
        phoneNumber: bannedPhone,
        name: 'דני חסום',
        schoolId: school.id,
        reason: 'לא הגיע 3 פעמים',
        bannedGamesCount: 0,
        expiresAt: expirationDate,
        eventsBlocked: 0,
        active: true,
        createdBy: admin.id
      }
    })

    // Visit public registration page
    await page.goto(`/p/${school.slug}/${event.slug}`)

    // Try to register with banned phone
    await page.fill('input[name="name"]', 'דני חסום')
    await page.fill('input[name="phone"]', bannedPhone)

    // Submit form
    await page.click('button[type="submit"]')

    // Should see ban error message
    await expect(page.locator('text=חשבונך חסום')).toBeVisible()
    await expect(page.locator(`text=${expirationDate.toLocaleDateString('he-IL')}`)).toBeVisible()
    await expect(page.locator('text=לא הגיע 3 פעמים')).toBeVisible()
  })

  test('should block banned user from registering (game-based ban)', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Soccer Match')
      .create()

    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('ban-admin'))
      .create()

    // Create a game-based ban (3 games, 1 already blocked)
    const bannedPhone = '0522222222'
    await prisma.userBan.create({
      data: {
        phoneNumber: bannedPhone,
        name: 'מיכל חסומה',
        schoolId: school.id,
        reason: 'אי-הגעות חוזרות',
        bannedGamesCount: 3,
        expiresAt: null, // Game-based
        eventsBlocked: 1, // 1 game already counted
        active: true,
        createdBy: admin.id
      }
    })

    // Visit registration page
    await page.goto(`/p/${school.slug}/${event.slug}`)

    // Try to register
    await page.fill('input[name="name"]', 'מיכל חסומה')
    await page.fill('input[name="phone"]', bannedPhone)
    await page.click('button[type="submit"]')

    // Should see ban error with remaining games
    await expect(page.locator('text=חשבונך חסום')).toBeVisible()
    await expect(page.locator('text=2 משחקים נוספים')).toBeVisible() // 3 - 1 = 2 remaining
    await expect(page.locator('text=אי-הגעות חוזרות')).toBeVisible()
  })

  test('should allow registration for expired date-based ban', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('New Event')
      .create()

    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('ban-admin'))
      .create()

    // Create an expired ban
    const phone = '0533333333'
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 1) // Expired yesterday

    await prisma.userBan.create({
      data: {
        phoneNumber: phone,
        name: 'רון משוחרר',
        schoolId: school.id,
        reason: 'חסימה ישנה',
        bannedGamesCount: 0,
        expiresAt: expiredDate,
        eventsBlocked: 0,
        active: true,
        createdBy: admin.id
      }
    })

    // Visit registration page
    await page.goto(`/p/${school.slug}/${event.slug}`)

    // Try to register
    await page.fill('input[name="name"]', 'רון משוחרר')
    await page.fill('input[name="phone"]', phone)
    await page.click('button[type="submit"]')

    // Should succeed (ban expired)
    await expect(page.locator('text=ההרשמה הושלמה בהצלחה')).toBeVisible()
  })

  test('should allow registration for completed game-based ban', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Soccer Final')
      .create()

    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('ban-admin'))
      .create()

    // Create a completed game-based ban (3 games, all blocked)
    const phone = '0544444444'
    await prisma.userBan.create({
      data: {
        phoneNumber: phone,
        name: 'עמית שחרור',
        schoolId: school.id,
        reason: 'סיים חסימה',
        bannedGamesCount: 3,
        expiresAt: null,
        eventsBlocked: 3, // All games blocked
        active: false, // Deactivated
        createdBy: admin.id
      }
    })

    // Visit registration page
    await page.goto(`/p/${school.slug}/${event.slug}`)

    // Register
    await page.fill('input[name="name"]', 'עמית שחרור')
    await page.fill('input[name="phone"]', phone)
    await page.click('button[type="submit"]')

    // Should succeed
    await expect(page.locator('text=ההרשמה הושלמה בהצלחה')).toBeVisible()
  })

  test('should enforce school-level ban isolation', async ({ page }) => {
    // Setup: Create two schools
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const school1 = await createSchool().withName(`School 1 ${uniqueId}`).withSlug(`school1-${uniqueId}`).create()
    const school2 = await createSchool().withName(`School 2 ${uniqueId}`).withSlug(`school2-${uniqueId}`).create()

    const event1 = await createEvent()
      .withSchool(school1.id)
      .withTitle('School 1 Event')
      .withSlug(`event1-${uniqueId}`)
      .create()

    const event2 = await createEvent()
      .withSchool(school2.id)
      .withTitle('School 2 Event')
      .withSlug(`event2-${uniqueId}`)
      .create()

    const admin1 = await createAdmin()
      .withSchool(school1.id)
      .withEmail(generateEmail('ban-admin'))
      .create()

    // Ban user in School 1 only
    const phone = '0555555555'
    await prisma.userBan.create({
      data: {
        phoneNumber: phone,
        name: 'יוסי חצי-חסום',
        schoolId: school1.id, // Only banned in school 1
        reason: 'חסימה בבית ספר 1',
        bannedGamesCount: 3,
        expiresAt: null,
        eventsBlocked: 0,
        active: true,
        createdBy: admin1.id
      }
    })

    // Try to register for School 1 event (should be blocked)
    await page.goto(`/p/${school1.slug}/${event1.slug}`)
    await page.fill('input[name="name"]', 'יוסי חצי-חסום')
    await page.fill('input[name="phone"]', phone)
    await page.click('button[type="submit"]')
    await expect(page.locator('text=חשבונך חסום')).toBeVisible()

    // Try to register for School 2 event (should succeed - different school)
    await page.goto(`/p/${school2.slug}/${event2.slug}`)
    await page.fill('input[name="name"]', 'יוסי חצי-חסום')
    await page.fill('input[name="phone"]', phone)
    await page.click('button[type="submit"]')
    await expect(page.locator('text=ההרשמה הושלמה בהצלחה')).toBeVisible()
  })

  test('should show banned users in check-in UI', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('ban-admin'))
      .create()

    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Check-In Test Event')
      .create()

    // Create registration for banned user (registered before ban)
    const bannedPhone = '0566666666'
    const registration = await createRegistration()
      .withEvent(event.id)
      .withName('חסום אבל רשום')
      .withPhone(bannedPhone)
      .create()

    // Ban the user AFTER they registered
    await prisma.userBan.create({
      data: {
        phoneNumber: bannedPhone,
        schoolId: school.id,
        reason: 'נחסם אחרי הרשמה',
        bannedGamesCount: 2,
        expiresAt: null,
        eventsBlocked: 0,
        active: true,
        createdBy: admin.id
      }
    })

    // Generate check-in token
    const token = 'test-token-123'
    await prisma.event.update({
      where: { id: event.id },
      data: { checkInToken: token }
    })

    // Visit check-in page
    await page.goto(`/check-in/${event.id}/${token}`)

    // Should see registration with ban indicator
    await expect(page.locator('text=חסום אבל רשום')).toBeVisible()
    await expect(page.locator('text=🚫')).toBeVisible() // Ban emoji
    await expect(page.locator('text=נחסם אחרי הרשמה')).toBeVisible()
  })
})

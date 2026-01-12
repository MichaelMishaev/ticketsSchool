import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { cleanupTestData, createSchool, createAdmin, createEvent, createRegistration } from '../fixtures/test-data'
import { generateCheckInToken } from '@/lib/check-in-token'
import { generateEmail, generateSchoolName } from '../helpers/test-helpers'
import { loginViaUI } from '../helpers/auth-helpers'

test.describe('Attendance & Ban Management (P0)', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should display attendance review page with no-shows', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('attendance-admin'))
      .withPassword('Password123!')
      .create()

    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Past Event')
      .create()

    // Create registrations
    const checkedInReg = await createRegistration()
      .withEvent(event.id)
      .withName('הגיע בזמן')
      .withPhone('0501111111')
      .create()

    const noShowReg = await createRegistration()
      .withEvent(event.id)
      .withName('לא הגיע')
      .withPhone('0502222222')
      .create()

    // Check in one registration
    await prisma.checkIn.create({
      data: {
        registrationId: checkedInReg.id,
        checkedInBy: 'Test Admin'
      }
    })

    // Login and visit attendance page
    await loginViaUI(page, admin.email, 'Password123!')
    await page.goto(`/admin/events/${event.id}/attendance`)

    // Should see stats
    await expect(page.locator('text=1 הגיעו')).toBeVisible()
    await expect(page.locator('text=1 לא הגיעו')).toBeVisible()

    // Should see no-show user
    await expect(page.locator('text=לא הגיע')).toBeVisible()
    await expect(page.locator('text=0502222222')).toBeVisible()

    // Should NOT see checked-in user in no-show list
    const noShowSection = page.locator('text=לא הגיעו').locator('..')
    await expect(noShowSection.locator('text=הגיע בזמן')).not.toBeVisible()
  })

  test('should load attendance history on demand', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('attendance-admin'))
      .withPassword('Password123!')
      .create()

    // Create past events with attendance history
    const pastEvent1 = await createEvent()
      .withSchool(school.id)
      .withTitle('Past Event 1')
      .create()

    const pastEvent2 = await createEvent()
      .withSchool(school.id)
      .withTitle('Past Event 2')
      .create()

    const currentEvent = await createEvent()
      .withSchool(school.id)
      .withTitle('Current Event')
      .create()

    const phone = '0503333333'

    // User attended past event 1
    const pastReg1 = await createRegistration()
      .withEvent(pastEvent1.id)
      .withName('יוסי בהיסטוריה')
      .withPhone(phone)
      .create()

    await prisma.checkIn.create({
      data: { registrationId: pastReg1.id }
    })

    // User didn't attend past event 2
    await createRegistration()
      .withEvent(pastEvent2.id)
      .withName('יוסי בהיסטוריה')
      .withPhone(phone)
      .create()

    // User didn't attend current event (no-show)
    await createRegistration()
      .withEvent(currentEvent.id)
      .withName('יוסי בהיסטוריה')
      .withPhone(phone)
      .create()

    // Login and visit attendance page
    await loginViaUI(page, admin.email, 'Password123!')
    await page.goto(`/admin/events/${currentEvent.id}/attendance`)

    // Find the no-show user
    await expect(page.locator('text=יוסי בהיסטוריה')).toBeVisible()

    // Click to expand/load history
    const userCard = page.locator('text=יוסי בהיסטוריה').locator('..')
    await userCard.click()

    // Should see attendance history
    await expect(page.locator('text=הגיע ל-1 מתוך 2')).toBeVisible() // Excluding current event
    await expect(page.locator('text=50%')).toBeVisible() // 1 attended / 2 past events
  })

  test('should create game-based ban for selected users', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('attendance-admin'))
      .withPassword('Password123!')
      .create()

    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Event to Ban From')
      .create()

    // Create no-shows
    const noShow1 = await createRegistration()
      .withEvent(event.id)
      .withName('נועם לחסימה')
      .withPhone('0504444444')
      .create()

    const noShow2 = await createRegistration()
      .withEvent(event.id)
      .withName('תמר לחסימה')
      .withPhone('0505555555')
      .create()

    // Login and visit attendance page
    await loginViaUI(page, admin.email, 'Password123!')
    await page.goto(`/admin/events/${event.id}/attendance`)

    // Select both users
    await page.check(`input[type="checkbox"][value="${noShow1.id}"]`)
    await page.check(`input[type="checkbox"][value="${noShow2.id}"]`)

    // Click ban button
    await page.click('button:has-text("חסום למספר משחקים")')

    // Should see ban modal
    await expect(page.locator('text=חסימת משתמשים')).toBeVisible()
    await expect(page.locator('text=נבחרו 2 משתמשים')).toBeVisible()

    // Fill in ban details
    await page.fill('input[name="bannedGamesCount"]', '3')
    await page.fill('textarea[name="reason"]', 'לא הגיעו למשחק חשוב')

    // Submit ban
    await page.click('button:has-text("אישור חסימה")')

    // Should see success message
    await expect(page.locator('text=2 משתמשים נחסמו בהצלחה')).toBeVisible()

    // Verify bans created in database
    const bans = await prisma.userBan.findMany({
      where: {
        schoolId: school.id,
        phoneNumber: { in: ['0504444444', '0505555555'] }
      }
    })

    expect(bans).toHaveLength(2)
    expect(bans[0].bannedGamesCount).toBe(3)
    expect(bans[0].reason).toBe('לא הגיעו למשחק חשוב')
    expect(bans[0].active).toBe(true)
  })

  test('should create date-based ban', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('attendance-admin'))
      .withPassword('Password123!')
      .create()

    const event = await createEvent()
      .withSchool(school.id)
      .withTitle('Event for Date Ban')
      .create()

    const noShow = await createRegistration()
      .withEvent(event.id)
      .withName('אלון תאריך')
      .withPhone('0506666666')
      .create()

    // Login and visit attendance page
    await loginViaUI(page, admin.email, 'Password123!')
    await page.goto(`/admin/events/${event.id}/attendance`)

    // Select user and open ban modal
    await page.check(`input[type="checkbox"][value="${noShow.id}"]`)
    await page.click('button:has-text("חסום למספר משחקים")')

    // Choose date-based ban
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 14) // 2 weeks from now
    const dateString = futureDate.toISOString().split('T')[0]

    await page.fill('input[name="expiresAt"]', dateString)
    await page.fill('textarea[name="reason"]', 'חסימה זמנית')

    // Submit
    await page.click('button:has-text("אישור חסימה")')

    // Verify ban created
    const ban = await prisma.userBan.findFirst({
      where: {
        phoneNumber: '0506666666',
        schoolId: school.id
      }
    })

    expect(ban).not.toBeNull()
    expect(ban!.expiresAt).not.toBeNull()
    expect(ban!.bannedGamesCount).toBe(0) // Date-based, not game-based
  })

  test('should display ban management page with filters', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('attendance-admin'))
      .withPassword('Password123!')
      .create()

    // Create active ban
    const activeBan = await prisma.userBan.create({
      data: {
        phoneNumber: '0507777777',
        name: 'פעיל בן',
        schoolId: school.id,
        reason: 'חסימה פעילה',
        bannedGamesCount: 3,
        expiresAt: null,
        eventsBlocked: 1,
        active: true,
        createdBy: admin.id
      }
    })

    // Create expired ban
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - 1)

    const expiredBan = await prisma.userBan.create({
      data: {
        phoneNumber: '0508888888',
        name: 'פג תוקף',
        schoolId: school.id,
        reason: 'חסימה ישנה',
        bannedGamesCount: 0,
        expiresAt: expiredDate,
        eventsBlocked: 0,
        active: true,
        createdBy: admin.id
      }
    })

    // Login and visit ban management page
    await loginViaUI(page, admin.email, 'Password123!')
    await page.goto('/admin/settings/bans')

    // Should see active ban
    await expect(page.locator('text=פעיל בן')).toBeVisible()
    await expect(page.locator('text=2 משחקים נוספים')).toBeVisible() // 3 - 1 = 2

    // Should see expired ban
    await expect(page.locator('text=פג תוקף')).toBeVisible()

    // Filter to active only
    await page.click('button:has-text("פעילים")')
    await expect(page.locator('text=פעיל בן')).toBeVisible()
    await expect(page.locator('text=פג תוקף')).not.toBeVisible()

    // Filter to expired only
    await page.click('button:has-text("הסתיימו")')
    await expect(page.locator('text=פג תוקף')).toBeVisible()
    await expect(page.locator('text=פעיל בן')).not.toBeVisible()
  })

  test('should lift ban with reason', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('attendance-admin'))
      .withPassword('Password123!')
      .create()

    // Create ban
    const ban = await prisma.userBan.create({
      data: {
        phoneNumber: '0509999999',
        name: 'לשחרור',
        schoolId: school.id,
        reason: 'טעות',
        bannedGamesCount: 5,
        expiresAt: null,
        eventsBlocked: 0,
        active: true,
        createdBy: admin.id
      }
    })

    // Login and visit ban management page
    await loginViaUI(page, admin.email, 'Password123!')
    await page.goto('/admin/settings/bans')

    // Find ban and click lift button
    const banCard = page.locator('text=לשחרור').locator('..')
    await banCard.locator('button:has-text("הסר חסימה")').click()

    // Should see confirmation modal
    await expect(page.locator('text=האם להסיר את החסימה')).toBeVisible()

    // Fill reason
    await page.fill('textarea[name="liftReason"]', 'חסימה בטעות')

    // Confirm
    await page.click('button:has-text("אישור הסרה")')

    // Should see success message
    await expect(page.locator('text=החסימה הוסרה בהצלחה')).toBeVisible()

    // Verify in database
    const updatedBan = await prisma.userBan.findUnique({
      where: { id: ban.id }
    })

    expect(updatedBan!.active).toBe(false)
    expect(updatedBan!.liftedReason).toBe('חסימה בטעות')
    expect(updatedBan!.liftedAt).not.toBeNull()
  })

  test('should search bans by phone', async ({ page }) => {
    // Setup
    const school = await createSchool().withName(generateSchoolName()).create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail(generateEmail('attendance-admin'))
      .withPassword('Password123!')
      .create()

    // Create multiple bans
    await prisma.userBan.create({
      data: {
        phoneNumber: '0501010101',
        name: 'משתמש א',
        schoolId: school.id,
        reason: 'סיבה 1',
        bannedGamesCount: 2,
        active: true,
        createdBy: admin.id
      }
    })

    await prisma.userBan.create({
      data: {
        phoneNumber: '0502020202',
        name: 'משתמש ב',
        schoolId: school.id,
        reason: 'סיבה 2',
        bannedGamesCount: 3,
        active: true,
        createdBy: admin.id
      }
    })

    // Login and visit ban management page
    await loginViaUI(page, admin.email, 'Password123!')
    await page.goto('/admin/settings/bans')

    // Should see both bans initially
    await expect(page.locator('text=משתמש א')).toBeVisible()
    await expect(page.locator('text=משתמש ב')).toBeVisible()

    // Search for specific phone
    await page.fill('input[placeholder*="חיפוש"]', '0501010101')

    // Should only see matching ban
    await expect(page.locator('text=משתמש א')).toBeVisible()
    await expect(page.locator('text=משתמש ב')).not.toBeVisible()
  })
})

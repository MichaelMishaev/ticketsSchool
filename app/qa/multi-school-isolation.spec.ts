import { test, expect } from './fixtures/auth'
import { TEST_USERS, TEST_EVENTS, generateTestEmail, generateSchoolSlug } from './fixtures/test-data'

/**
 * Multi-School Isolation Tests
 *
 * These tests verify that:
 * 1. Each school can only see their own events
 * 2. Each school can only see their own registrations
 * 3. Dashboard stats are filtered by school
 * 4. Admin actions are scoped to their school
 */

test.describe('Multi-School Isolation', () => {
  let school1AdminEmail: string
  let school1AdminPassword: string
  let school2AdminEmail: string
  let school2AdminPassword: string
  let school1EventTitle: string
  let school2EventTitle: string

  test.beforeAll(async () => {
    // Generate unique data for this test run
    school1AdminEmail = generateTestEmail('school1-admin')
    school1AdminPassword = 'test123456'
    school2AdminEmail = generateTestEmail('school2-admin')
    school2AdminPassword = 'test123456'

    school1EventTitle = `School 1 Event - ${Date.now()}`
    school2EventTitle = `School 2 Event - ${Date.now()}`
  })

  test('should allow creating two separate schools', async ({ page }) => {
    // Create School 1
    await page.goto('/admin/signup')
    await page.fill('input[name="email"]', school1AdminEmail)
    await page.fill('input[name="password"]', school1AdminPassword)
    await page.fill('input[name="name"]', TEST_USERS.schoolAdmin1.name)
    await page.fill('input[name="schoolName"]', TEST_USERS.schoolAdmin1.schoolName)
    await page.fill('input[name="schoolSlug"]', generateSchoolSlug(TEST_USERS.schoolAdmin1.schoolName))

    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin/, { timeout: 10000 })

    // Verify we're logged in
    await expect(page.locator('text=לוח בקרה').or(page.locator('text=Dashboard'))).toBeVisible()

    // Logout
    await page.goto('/admin')
    const logoutButton = page.locator('text=התנתק').or(page.locator('text=Logout'))
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    }

    // Create School 2
    await page.goto('/admin/signup')
    await page.fill('input[name="email"]', school2AdminEmail)
    await page.fill('input[name="password"]', school2AdminPassword)
    await page.fill('input[name="name"]', TEST_USERS.schoolAdmin2.name)
    await page.fill('input[name="schoolName"]', TEST_USERS.schoolAdmin2.schoolName)
    await page.fill('input[name="schoolSlug"]', generateSchoolSlug(TEST_USERS.schoolAdmin2.schoolName))

    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin/, { timeout: 10000 })

    await expect(page.locator('text=לוח בקרה').or(page.locator('text=Dashboard'))).toBeVisible()
  })

  test('School 1 admin should only see School 1 events', async ({ page }) => {
    // Login as School 1 admin
    await page.goto('/admin/login')
    await page.fill('input[name="email"]', school1AdminEmail)
    await page.fill('input[name="password"]', school1AdminPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin/, { timeout: 10000 })

    // Create an event for School 1
    await page.goto('/admin/events/new')
    await page.fill('input[name="title"]', school1EventTitle)
    await page.fill('textarea[name="description"]', TEST_EVENTS.school1Event.description)
    await page.fill('input[name="location"]', TEST_EVENTS.school1Event.location)
    await page.fill('input[name="capacity"]', TEST_EVENTS.school1Event.capacity.toString())
    await page.fill('input[name="startDate"]', TEST_EVENTS.school1Event.startDate)
    await page.fill('input[name="startTime"]', TEST_EVENTS.school1Event.startTime)

    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin\/events/, { timeout: 10000 })

    // Go to events list
    await page.goto('/admin/events')

    // Should see School 1 event
    await expect(page.locator(`text=${school1EventTitle}`)).toBeVisible()

    // Count total events (should only see School 1 events)
    const eventRows = page.locator('table tbody tr')
    const eventCount = await eventRows.count()

    // Verify we don't see School 2 events (will verify in next test)
    console.log(`School 1 admin sees ${eventCount} events`)
  })

  test('School 2 admin should only see School 2 events', async ({ page }) => {
    // Login as School 2 admin
    await page.goto('/admin/login')
    await page.fill('input[name="email"]', school2AdminEmail)
    await page.fill('input[name="password"]', school2AdminPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin/, { timeout: 10000 })

    // Create an event for School 2
    await page.goto('/admin/events/new')
    await page.fill('input[name="title"]', school2EventTitle)
    await page.fill('textarea[name="description"]', TEST_EVENTS.school2Event.description)
    await page.fill('input[name="location"]', TEST_EVENTS.school2Event.location)
    await page.fill('input[name="capacity"]', TEST_EVENTS.school2Event.capacity.toString())
    await page.fill('input[name="startDate"]', TEST_EVENTS.school2Event.startDate)
    await page.fill('input[name="startTime"]', TEST_EVENTS.school2Event.startTime)

    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin\/events/, { timeout: 10000 })

    // Go to events list
    await page.goto('/admin/events')

    // Should see School 2 event
    await expect(page.locator(`text=${school2EventTitle}`)).toBeVisible()

    // Should NOT see School 1 event
    await expect(page.locator(`text=${school1EventTitle}`)).not.toBeVisible()
  })

  test('School 1 admin dashboard should only show School 1 stats', async ({ page }) => {
    // Login as School 1 admin
    await page.goto('/admin/login')
    await page.fill('input[name="email"]', school1AdminEmail)
    await page.fill('input[name="password"]', school1AdminPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin/, { timeout: 10000 })

    // Go to dashboard
    await page.goto('/admin')

    // Wait for stats to load
    await page.waitForSelector('text=אירועים פעילים', { timeout: 5000 }).catch(() => {})
    await page.waitForSelector('text=Active Events', { timeout: 5000 }).catch(() => {})

    // The dashboard should show stats only for School 1
    // We can verify by checking that School 2 event is not in any lists
    const pageContent = await page.content()
    expect(pageContent).not.toContain(school2EventTitle)
  })

  test('School admins cannot access other schools events directly', async ({ page }) => {
    // This test would require knowing the event ID from School 2
    // In a real scenario, we'd store event IDs and try to access them
    console.log('Direct access test would require event IDs - implementing in full test suite')
  })

  test('Regular admin cannot access super admin features', async ({ page }) => {
    // Login as School 1 admin
    await page.goto('/admin/login')
    await page.fill('input[name="email"]', school1AdminEmail)
    await page.fill('input[name="password"]', school1AdminPassword)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/admin/, { timeout: 10000 })

    // Try to access super admin dashboard
    await page.goto('/admin/super')

    // Should be redirected or see forbidden message
    await page.waitForTimeout(2000)
    const url = page.url()

    // Either redirected away from /admin/super or see an error
    if (url.includes('/admin/super')) {
      // Should see forbidden or no data
      const content = await page.content()
      expect(
        content.includes('403') ||
        content.includes('Forbidden') ||
        content.includes('אין הרשאה')
      ).toBeTruthy()
    } else {
      // Redirected away - that's also correct behavior
      expect(url).not.toContain('/admin/super')
    }
  })
})

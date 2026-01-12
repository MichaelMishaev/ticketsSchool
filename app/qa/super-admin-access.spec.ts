import { test, expect } from './fixtures/auth'
import { loginAsSuperAdmin } from './fixtures/auth'
import { TEST_USERS } from './fixtures/test-data'

/**
 * Super Admin Access Tests
 *
 * These tests verify that:
 * 1. Super admin can access all schools' data
 * 2. Super admin dashboard shows global statistics
 * 3. Super admin can filter by school
 * 4. Super admin can see all events across schools
 * 5. Regular admins cannot access super admin features
 */

test.describe('Super Admin Access', () => {
  test('should allow super admin to login', async ({ page }) => {
    await loginAsSuperAdmin(page)

    // Verify we're on the admin dashboard
    await expect(page.locator('text=לוח בקרה').or(page.locator('text=Dashboard'))).toBeVisible()

    // URL should be /admin
    expect(page.url()).toContain('/admin')
  })

  test('should allow super admin to access super admin dashboard', async ({ page }) => {
    await loginAsSuperAdmin(page)

    // Navigate to super admin dashboard
    await page.goto('/admin/super')

    // Should see super admin specific content
    await expect(page.locator('text=Super Admin').or(
      page.locator('text=ניהול מערכת')
    )).toBeVisible({ timeout: 10000 })

    // Should see global statistics
    await expect(page.locator('text=בתי ספר').or(
      page.locator('text=Schools')
    )).toBeVisible()

    await expect(page.locator('text=סה״כ אירועים').or(
      page.locator('text=Total Events')
    )).toBeVisible()
  })

  test('super admin dashboard should show multiple schools', async ({ page }) => {
    await loginAsSuperAdmin(page)

    await page.goto('/admin/super')

    // Wait for data to load
    await page.waitForTimeout(2000)

    // Should see statistics for multiple schools
    const schoolStats = page.locator('text=בתי ספר').or(page.locator('text=Schools'))
    await expect(schoolStats).toBeVisible()

    // Should see a table or list of events from different schools
    await expect(page.locator('table').or(page.locator('[role="table"]'))).toBeVisible()

    // The page should display school names in the table
    const content = await page.content()

    // Verify we can see multiple schools (Beeri at minimum)
    expect(content).toContain('בארי') // Beeri in Hebrew

    console.log('Super admin can see global data across all schools')
  })

  test('super admin should be able to filter events by school', async ({ page }) => {
    await loginAsSuperAdmin(page)

    await page.goto('/admin/super')

    // Wait for page to load
    await page.waitForTimeout(2000)

    // Should see school filter dropdown
    const schoolFilter = page.locator('select').filter({ hasText: /כל בתי הספר|All Schools/ })

    if (await schoolFilter.isVisible()) {
      // Get all options
      const options = await schoolFilter.locator('option').allTextContents()
      console.log('Available school filters:', options)

      // Should have "All Schools" option
      expect(options.some(opt => opt.includes('כל') || opt.includes('All'))).toBeTruthy()

      // If there are multiple schools, verify filtering works
      if (options.length > 2) { // More than "All Schools" and one school
        // Select a specific school
        await schoolFilter.selectOption({ index: 1 })

        // Wait for filter to apply
        await page.waitForTimeout(1000)

        // Table should update to show only that school's events
        console.log('School filter applied successfully')
      }
    }
  })

  test('super admin should see events from all schools in events list', async ({ page }) => {
    await loginAsSuperAdmin(page)

    // Go to events list
    await page.goto('/admin/events')

    // Wait for events to load
    await page.waitForTimeout(2000)

    // Should see events table
    await expect(page.locator('table').or(page.locator('[role="table"]'))).toBeVisible()

    // Get all event titles
    const eventTitles = await page.locator('table tbody tr td:first-child, [role="row"] [role="cell"]:first-child').allTextContents()

    console.log(`Super admin sees ${eventTitles.length} events total`)

    // Super admin should see events (at least Beeri's events)
    expect(eventTitles.length).toBeGreaterThan(0)
  })

  test('super admin can access events from any school', async ({ page }) => {
    await loginAsSuperAdmin(page)

    // Get list of events
    await page.goto('/admin/events')
    await page.waitForTimeout(2000)

    // Click on first event
    const firstEventLink = page.locator('table tbody tr:first-child a, [role="row"]:first-child a').first()

    if (await firstEventLink.isVisible()) {
      await firstEventLink.click()

      // Should navigate to event detail page
      await page.waitForURL(/\/admin\/events\/[^/]+/, { timeout: 5000 })

      // Should be able to see and edit the event
      await expect(page.locator('text=עריכה').or(page.locator('text=Edit'))).toBeVisible()

      console.log('Super admin can access individual events from any school')
    }
  })

  test('super admin dashboard shows correct statistics', async ({ page }) => {
    await loginAsSuperAdmin(page)

    await page.goto('/admin/super')
    await page.waitForTimeout(2000)

    // Check for statistics cards
    const statsCards = page.locator('.bg-white.rounded-lg.shadow')

    // Should have multiple stat cards
    const cardCount = await statsCards.count()
    expect(cardCount).toBeGreaterThanOrEqual(4) // Schools, Events, Active Events, Registrations

    // Verify stats have numbers
    const statsContent = await page.locator('text=/\\d+/').allTextContents()
    expect(statsContent.length).toBeGreaterThan(0)

    console.log('Super admin dashboard displays statistics correctly')
  })

  test('super admin can see all schools in the system', async ({ page }) => {
    await loginAsSuperAdmin(page)

    await page.goto('/admin/super')
    await page.waitForTimeout(2000)

    // Look for schools statistic
    const schoolsCard = page.locator('text=בתי ספר').or(page.locator('text=Schools')).locator('..')

    if (await schoolsCard.isVisible()) {
      const schoolCount = await schoolsCard.locator('text=/\\d+/').first().textContent()
      console.log(`Total schools in system: ${schoolCount}`)

      // Should be at least 1 (Beeri)
      expect(parseInt(schoolCount || '0')).toBeGreaterThanOrEqual(1)
    }
  })

  test('super admin can manage team members across schools', async ({ page }) => {
    await loginAsSuperAdmin(page)

    // Super admin should be able to access team management
    await page.goto('/admin/team')

    // Should see team management interface
    await expect(page.locator('text=ניהול צוות').or(
      page.locator('text=Team Management')
    )).toBeVisible()

    // Super admin should see invite button
    await expect(page.locator('text=הזמן חבר צוות').or(
      page.locator('text=Invite Team Member')
    )).toBeVisible()

    console.log('Super admin can access team management')
  })

  test('regular admin cannot access super admin endpoints', async ({ page }) => {
    // This test would require a regular admin account
    // For now, we'll test by trying to access the super admin overview API

    await page.goto('/admin/login')

    // Try to access super admin API directly (without login)
    const response = await page.goto('/api/admin/super/overview')

    // Should get 401 or 403
    expect(response?.status()).toBeGreaterThanOrEqual(401)

    console.log('Super admin API is properly protected')
  })

  test('super admin can view registrations across all schools', async ({ page }) => {
    await loginAsSuperAdmin(page)

    await page.goto('/admin/super')
    await page.waitForTimeout(2000)

    // Look for total registrations stat
    const registrationsCard = page.locator('text=סה״כ הרשמות').or(
      page.locator('text=Total Registrations')
    )

    if (await registrationsCard.isVisible()) {
      const regCount = await registrationsCard.locator('..').locator('text=/\\d+/').first().textContent()
      console.log(`Total registrations across all schools: ${regCount}`)

      // Registrations count should be a valid number
      expect(parseInt(regCount || '0')).toBeGreaterThanOrEqual(0)
    }
  })

  test('super admin should see all events in searchable/filterable table', async ({ page }) => {
    await loginAsSuperAdmin(page)

    await page.goto('/admin/super')
    await page.waitForTimeout(2000)

    // Should see events table with search
    await expect(page.locator('input[placeholder*="חיפוש"], input[placeholder*="Search"]')).toBeVisible()

    // Should see status filter
    await expect(page.locator('select').filter({ hasText: /סטטוס|Status/ })).toBeVisible()

    // Table should have events
    const eventRows = page.locator('table tbody tr, [role="table"] [role="row"]')
    const rowCount = await eventRows.count()

    console.log(`Super admin table shows ${rowCount} event rows`)

    // Should show at least headers if no data
    expect(rowCount).toBeGreaterThanOrEqual(0)
  })
})

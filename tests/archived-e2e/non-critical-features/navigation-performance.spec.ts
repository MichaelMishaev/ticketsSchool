import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, cleanupTestData } from './fixtures/test-data'

/**
 * Navigation Performance Test
 *
 * Measures time to switch between admin menu items.
 * Target: < 500ms for instant navigation feel
 * Current: 2-3 seconds (TOO SLOW)
 */
test.describe('Navigation Performance', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should navigate between menu items quickly', async ({ page }) => {
    // Setup: Create test school and admin
    // Note: Removed hardcoded slug to allow UUID generation for parallel test safety
    const school = await createSchool().withName('Performance Test School').create()

    const admin = await createAdmin().withPassword('Password123!').withSchool(school.id).create()

    // Login
    await page.goto('http://localhost:9000/admin/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[name="email"]', admin.email)
    await page.fill('input[name="password"]', 'Password123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:9000/admin')

    // Measure navigation time: Dashboard → Events
    const startTime1 = Date.now()
    await page.click('a[href="/admin/events"]')
    await page.waitForURL('http://localhost:9000/admin/events')
    await page.waitForSelector('h1:has-text("אירועים")')
    const navTime1 = Date.now() - startTime1
    console.log(`Navigation time (Dashboard → Events): ${navTime1}ms`)

    // Measure navigation time: Events → Dashboard
    const startTime2 = Date.now()
    await page.click('a[href="/admin"]')
    await page.waitForURL('http://localhost:9000/admin')
    await page.waitForSelector('h2:has-text("לוח בקרה")')
    const navTime2 = Date.now() - startTime2
    console.log(`Navigation time (Events → Dashboard): ${navTime2}ms`)

    // Measure navigation time: Dashboard → Team
    const startTime3 = Date.now()
    await page.click('a[href="/admin/team"]')
    await page.waitForURL('http://localhost:9000/admin/team')
    const navTime3 = Date.now() - startTime3
    console.log(`Navigation time (Dashboard → Team): ${navTime3}ms`)

    // Average navigation time
    const avgTime = (navTime1 + navTime2 + navTime3) / 3
    console.log(`Average navigation time: ${avgTime}ms`)

    // Assert: Should be under 1000ms (current is 2000-3000ms)
    expect(avgTime).toBeLessThan(1000)

    // Ideal: Should be under 500ms for instant feel
    // expect(avgTime).toBeLessThan(500)
  })

  test('should not refetch admin info on every navigation', async ({ page }) => {
    // Setup
    // Note: Removed hardcoded slug to allow UUID generation for parallel test safety
    const school = await createSchool().withName('API Test School').create()

    const admin = await createAdmin().withPassword('Password123!').withSchool(school.id).create()

    // Monitor network requests
    const apiRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/admin/me')) {
        apiRequests.push(request.url())
      }
    })

    // Login
    await page.goto('http://localhost:9000/admin/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[name="email"]', admin.email)
    await page.fill('input[name="password"]', 'Password123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:9000/admin')

    // Clear requests from initial load
    apiRequests.length = 0

    // Navigate between pages
    await page.click('a[href="/admin/events"]')
    await page.waitForURL('http://localhost:9000/admin/events')
    await page.waitForTimeout(500)

    await page.click('a[href="/admin"]')
    await page.waitForURL('http://localhost:9000/admin')
    await page.waitForTimeout(500)

    await page.click('a[href="/admin/team"]')
    await page.waitForURL('http://localhost:9000/admin/team')
    await page.waitForTimeout(500)

    // Count API calls to /api/admin/me
    console.log(`API calls to /api/admin/me during navigation: ${apiRequests.length}`)
    console.log('API requests:', apiRequests)

    // Assert: Should be 0 calls after initial load
    // Currently: 3-6 calls (one per navigation, sometimes page also fetches)
    expect(apiRequests.length).toBe(0)
  })
})

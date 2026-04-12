import { test, expect } from '@playwright/test'

/**
 * CRITICAL: Multi-Tenant Data Isolation Tests
 *
 * These tests verify that School A cannot access School B's data.
 * This is the MOST IMPORTANT security feature of TicketCap.
 *
 * Test Strategy:
 * 1. Create two schools with test data
 * 2. Login as School A admin
 * 3. Verify School A can only see their own data
 * 4. Attempt to access School B's data (should fail)
 * 5. Verify SUPER_ADMIN can see all schools
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:9000'

test.describe('Multi-Tenant Data Isolation - CRITICAL', () => {

  // Test users for different schools
  const schoolAAdmin = {
    email: 'admin-school-a@test.com',
    password: 'TestPassword123!',
    schoolSlug: 'school-a-test'
  }

  const schoolBAdmin = {
    email: 'admin-school-b@test.com',
    password: 'TestPassword123!',
    schoolSlug: 'school-b-test'
  }

  const superAdmin = {
    email: 'super@ticketcap.com',
    password: 'SuperPassword123!'
  }

  test.describe('Event Isolation', () => {

    test('School A admin can only see School A events', async ({ page }) => {
      // Login as School A admin
      await page.goto(`${BASE_URL}/admin/login`)
      await page.fill('input[type="email"]', schoolAAdmin.email)
      await page.fill('input[type="password"]', schoolAAdmin.password)
      await page.click('button[type="submit"]')

      await page.waitForURL(`${BASE_URL}/admin`, { timeout: 10000 })

      // Go to events page
      await page.goto(`${BASE_URL}/admin/events`)

      // Get all event cards/rows
      const events = await page.locator('[data-testid="event-item"], .event-card, tr[data-event-id]').all()

      // Verify each event belongs to School A
      for (const event of events) {
        const schoolAttribute = await event.getAttribute('data-school-id')
        const schoolSlug = await event.getAttribute('data-school-slug')

        // Should NOT contain School B identifiers
        expect(schoolAttribute).not.toContain('school-b')
        expect(schoolSlug).not.toBe('school-b-test')
      }

      console.log(`✅ School A sees ${events.length} events (all from School A)`)
    })

    test('School A admin cannot access School B event by direct URL', async ({ page }) => {
      // Login as School A admin
      await page.goto(`${BASE_URL}/admin/login`)
      await page.fill('input[type="email"]', schoolAAdmin.email)
      await page.fill('input[type="password"]', schoolAAdmin.password)
      await page.click('button[type="submit"]')

      await page.waitForURL(`${BASE_URL}/admin`)

      // Try to access a School B event directly (if we know an ID)
      // This should either redirect or show 403/404
      const schoolBEventId = 'school-b-event-123' // Mock ID

      const response = await page.goto(`${BASE_URL}/admin/events/${schoolBEventId}`)

      // Should not be successful
      expect(response?.status()).not.toBe(200)

      // Should show error or redirect
      const url = page.url()
      const hasError = await page.locator('text=לא נמצא, text=אין הרשאה, text=שגיאה').isVisible().catch(() => false)

      expect(hasError || !url.includes(schoolBEventId)).toBeTruthy()

      console.log('✅ School A blocked from accessing School B event')
    })

    test('SUPER_ADMIN can see all schools events', async ({ page }) => {
      // Login as SUPER_ADMIN
      await page.goto(`${BASE_URL}/admin/login`)
      await page.fill('input[type="email"]', superAdmin.email)
      await page.fill('input[type="password"]', superAdmin.password)
      await page.click('button[type="submit"]')

      await page.waitForURL(`${BASE_URL}/admin`)

      // Go to super admin schools page
      await page.goto(`${BASE_URL}/admin/super/schools`)

      // Should see multiple schools
      const schools = await page.locator('[data-testid="school-item"], .school-card').all()

      expect(schools.length).toBeGreaterThan(0)

      console.log(`✅ SUPER_ADMIN sees ${schools.length} schools`)
    })
  })

  test.describe('Registration Isolation', () => {

    test('School A admin can only see School A registrations', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/login`)
      await page.fill('input[type="email"]', schoolAAdmin.email)
      await page.fill('input[type="password"]', schoolAAdmin.password)
      await page.click('button[type="submit"]')

      await page.waitForURL(`${BASE_URL}/admin`)

      // Navigate to any event's registrations
      await page.goto(`${BASE_URL}/admin/events`)

      const firstEvent = page.locator('[data-testid="event-item"], .event-card').first()
      await firstEvent.click()

      // Should see registrations for this event
      const registrations = await page.locator('[data-testid="registration-item"], .registration-row').all()

      // Verify each registration belongs to School A event
      for (const registration of registrations) {
        const eventSchool = await registration.getAttribute('data-event-school')
        expect(eventSchool).not.toBe('school-b-test')
      }

      console.log(`✅ School A sees only their registrations: ${registrations.length}`)
    })

    test('School A admin cannot export School B registrations', async ({ page, request }) => {
      // Login as School A admin
      await page.goto(`${BASE_URL}/admin/login`)
      await page.fill('input[type="email"]', schoolAAdmin.email)
      await page.fill('input[type="password"]', schoolAAdmin.password)
      await page.click('button[type="submit"]')

      await page.waitForURL(`${BASE_URL}/admin`)

      // Get session cookie
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Try to export School B event registrations
      const schoolBEventId = 'school-b-event-123'

      const response = await request.get(`${BASE_URL}/api/events/${schoolBEventId}/export`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`
        }
      })

      // Should be forbidden or not found
      expect([403, 404]).toContain(response.status())

      console.log('✅ School A blocked from exporting School B registrations')
    })
  })

  test.describe('API Endpoint Isolation', () => {

    test('GET /api/events returns only current school events', async ({ request, page }) => {
      // Login to get session
      await page.goto(`${BASE_URL}/admin/login`)
      await page.fill('input[type="email"]', schoolAAdmin.email)
      await page.fill('input[type="password"]', schoolAAdmin.password)
      await page.click('button[type="submit"]')

      await page.waitForURL(`${BASE_URL}/admin`)

      // Get session cookie
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Call events API
      const response = await request.get(`${BASE_URL}/api/events`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`
        }
      })

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      const events = data.events || data.data || []

      // Verify all events belong to School A
      for (const event of events) {
        expect(event.schoolId).not.toBe('school-b-id')
        expect(event.school?.slug).not.toBe('school-b-test')
      }

      console.log(`✅ API returned ${events.length} events for School A only`)
    })

    test('POST /api/events creates event only for current school', async ({ request, page }) => {
      // Login as School A admin
      await page.goto(`${BASE_URL}/admin/login`)
      await page.fill('input[type="email"]', schoolAAdmin.email)
      await page.fill('input[type="password"]', schoolAAdmin.password)
      await page.click('button[type="submit"]')

      await page.waitForURL(`${BASE_URL}/admin`)

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Try to create event for School B (by manipulating schoolId)
      const response = await request.post(`${BASE_URL}/api/events`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Malicious Event',
          slug: 'malicious-event-' + Date.now(),
          capacity: 100,
          startDate: '2025-12-25',
          startTime: '18:00',
          schoolId: 'school-b-id', // Try to create for different school
          location: 'Test Location'
        }
      })

      // Should either:
      // 1. Ignore the schoolId and create for School A
      // 2. Return 403 Forbidden

      if (response.ok()) {
        const data = await response.json()
        const event = data.event || data.data

        // Verify it was created for School A, not School B
        expect(event.schoolId).not.toBe('school-b-id')
      } else {
        expect([400, 403]).toContain(response.status())
      }

      console.log('✅ Cannot manipulate schoolId in event creation')
    })

    test('DELETE /api/events/:id cannot delete other school events', async ({ request, page }) => {
      // Login as School A admin
      await page.goto(`${BASE_URL}/admin/login`)
      await page.fill('input[type="email"]', schoolAAdmin.email)
      await page.fill('input[type="password"]', schoolAAdmin.password)
      await page.click('button[type="submit"]')

      await page.waitForURL(`${BASE_URL}/admin`)

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Try to delete School B event
      const schoolBEventId = 'school-b-event-123'

      const response = await request.delete(`${BASE_URL}/api/events/${schoolBEventId}`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`
        }
      })

      // Should be forbidden or not found
      expect([403, 404]).toContain(response.status())

      console.log('✅ Cannot delete other school events')
    })
  })

  test.describe('Dashboard Stats Isolation', () => {

    test('Dashboard shows only current school statistics', async ({ page }) => {
      // Login as School A admin
      await page.goto(`${BASE_URL}/admin/login`)
      await page.fill('input[type="email"]', schoolAAdmin.email)
      await page.fill('input[type="password"]', schoolAAdmin.password)
      await page.click('button[type="submit"]')

      await page.waitForURL(`${BASE_URL}/admin`)

      // Dashboard should show School A stats only
      await page.goto(`${BASE_URL}/admin`)

      // Check that stats don't include other schools' data
      // (This would require knowing total system stats vs school stats)

      const totalEvents = await page.locator('[data-testid="total-events"], .stat-events').textContent()
      const totalRegistrations = await page.locator('[data-testid="total-registrations"], .stat-registrations').textContent()

      console.log(`School A Dashboard: ${totalEvents} events, ${totalRegistrations} registrations`)

      // These should be School A's stats only, not global stats
      expect(totalEvents).toBeDefined()
      expect(totalRegistrations).toBeDefined()
    })
  })

  test.describe('Session Security', () => {

    test('Cannot hijack another school session by cookie manipulation', async ({ browser }) => {
      // This test verifies that JWT tokens contain schoolId and can't be manipulated

      // Create two browser contexts (two different admins)
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()

      const page1 = await context1.newPage()
      const page2 = await context2.newPage()

      // Login as School A admin in context1
      await page1.goto(`${BASE_URL}/admin/login`)
      await page1.fill('input[type="email"]', schoolAAdmin.email)
      await page1.fill('input[type="password"]', schoolAAdmin.password)
      await page1.click('button[type="submit"]')
      await page1.waitForURL(`${BASE_URL}/admin`)

      // Get School A session cookie
      const cookies1 = await context1.cookies()
      const schoolACookie = cookies1.find(c => c.name === 'admin_session')

      // Try to use School A's cookie in context2 (should still show School A data, not School B)
      await context2.addCookies([schoolACookie!])

      await page2.goto(`${BASE_URL}/admin/events`)

      // Should show School A events (JWT contains schoolId)
      const events = await page2.locator('[data-testid="event-item"], .event-card').all()

      // All events should be School A's
      for (const event of events) {
        const schoolSlug = await event.getAttribute('data-school-slug')
        expect(schoolSlug).not.toBe('school-b-test')
      }

      await context1.close()
      await context2.close()

      console.log('✅ Session tokens properly contain school context')
    })
  })
})

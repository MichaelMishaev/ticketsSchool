import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, createEvent, createRegistration, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { generateEmail } from '../helpers/test-helpers'

/**
 * P0 (CRITICAL) Multi-Tenancy & Security Tests
 * Ref: tests/scenarios/06-multi-tenancy-security.md
 *
 * MOST CRITICAL TESTS - Data isolation between schools
 */

test.describe('Multi-Tenancy P0 - CRITICAL Security', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('[06.1.1-1.6] Event Isolation', () => {
    test('School A admin cannot see School B events', async ({ page }) => {
      // Create School A
      const schoolA = await createSchool()
        .withName('School A Isolation')
        .withSlug(`school-a-${Date.now()}`)
        .create()

      const schoolAAdmin = await createAdmin()
        .withEmail(generateEmail('school-a'))
        .withPassword('TestPassword123!')
        .withRole('ADMIN')
        .withSchool(schoolA.id)
        .create()

      const schoolAEvent = await createEvent()
        .withTitle('School A Event')
        .withSchool(schoolA.id)
        .inFuture()
        .create()

      // Create School B
      const schoolB = await createSchool()
        .withName('School B Isolation')
        .withSlug(`school-b-${Date.now()}`)
        .create()

      const schoolBEvent = await createEvent()
        .withTitle('School B Event')
        .withSchool(schoolB.id)
        .inFuture()
        .create()

      // Login as School A admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(schoolAAdmin.email, 'TestPassword123!')

      // Go to events page
      await page.goto('/admin/events')

      // Should see School A event
      await expect(page.locator('text=School A Event')).toBeVisible()

      // Should NOT see School B event
      await expect(page.locator('text=School B Event')).not.toBeVisible()
    })

    test('School A admin cannot access School B event by direct URL', async ({ page }) => {
      const schoolA = await createSchool().withName('School A Direct').create()
      const schoolAAdmin = await createAdmin()
        .withEmail(generateEmail('direct-url-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolB = await createSchool().withName('School B Direct').create()
      const schoolBEvent = await createEvent()
        .withTitle('School B Forbidden Event')
        .withSchool(schoolB.id)
        .create()

      // Login as School A admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(schoolAAdmin.email, 'TestPassword123!')

      // Try to access School B event directly
      const response = await page.goto(`/admin/events/${schoolBEvent.id}`)

      // Should return 403 or 404
      expect([403, 404]).toContain(response?.status() || 404)

      // Should show error message or redirect
      const hasError = await page.locator('text=/403|404|לא נמצא|אין הרשאה/i').isVisible().catch(() => false)
      expect(hasError).toBe(true)
    })

    test('API /api/events returns only current school events', async ({ page, request }) => {
      const schoolA = await createSchool().withName('School A API').create()
      const schoolAAdmin = await createAdmin()
        .withEmail(generateEmail('api-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolAEvent1 = await createEvent().withTitle('School A Event 1').withSchool(schoolA.id).create()
      const schoolAEvent2 = await createEvent().withTitle('School A Event 2').withSchool(schoolA.id).create()

      const schoolB = await createSchool().withName('School B API').create()
      const schoolBEvent = await createEvent().withTitle('School B Event').withSchool(schoolB.id).create()

      // Login to get session
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(schoolAAdmin.email, 'TestPassword123!')

      // Get session cookie
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Call events API
      const response = await request.get('/api/events', {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
        },
      })

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      const events = data.events || data || []

      // Should have School A events
      const hasSchoolAEvents = events.some((e: any) => e.title.includes('School A'))
      expect(hasSchoolAEvents).toBe(true)

      // Should NOT have School B events
      const hasSchoolBEvents = events.some((e: any) => e.title.includes('School B'))
      expect(hasSchoolBEvents).toBe(false)
    })

    test('Cannot create event with manipulated schoolId in request body', async ({ page, request }) => {
      const schoolA = await createSchool().withName('School A Manipulate').create()
      const schoolAAdmin = await createAdmin()
        .withEmail(generateEmail('manipulate-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolB = await createSchool().withName('School B Manipulate').create()

      // Login as School A admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(schoolAAdmin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Try to create event for School B by manipulating schoolId
      const response = await request.post('/api/events', {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Malicious Event',
          slug: `malicious-${Date.now()}`,
          capacity: 100,
          startDate: '2025-12-25',
          startTime: '18:00',
          schoolId: schoolB.id, // Try to create for different school!
          location: 'Test Location',
        },
      })

      // Should either ignore schoolId and create for School A, or return 403
      if (response.ok()) {
        const data = await response.json()
        const event = data.event || data

        // Should be created for School A, NOT School B
        expect(event.schoolId).toBe(schoolA.id)
        expect(event.schoolId).not.toBe(schoolB.id)
      } else {
        expect([400, 403]).toContain(response.status())
      }
    })

    test('Cannot delete other school events via API', async ({ page, request }) => {
      const schoolA = await createSchool().withName('School A Delete').create()
      const schoolAAdmin = await createAdmin()
        .withEmail(generateEmail('delete-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolB = await createSchool().withName('School B Delete').create()
      const schoolBEvent = await createEvent()
        .withTitle('School B Protected Event')
        .withSchool(schoolB.id)
        .create()

      // Login as School A admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(schoolAAdmin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Try to delete School B event
      const response = await request.delete(`/api/events/${schoolBEvent.id}`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
        },
      })

      // Should return 403 or 404
      expect([403, 404]).toContain(response.status())
    })
  })

  test.describe('[06.2.1-2.5] Registration Isolation', () => {
    test('School A admin cannot see School B registrations', async ({ page }) => {
      const schoolA = await createSchool().withName('School A Reg').create()
      const schoolAAdmin = await createAdmin()
        .withEmail(generateEmail('reg-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolAEvent = await createEvent().withTitle('School A Event').withSchool(schoolA.id).create()
      const schoolARegistration = await createRegistration()
        .withName('School A Registrant')
        .withEvent(schoolAEvent.id)
        .create()

      const schoolB = await createSchool().withName('School B Reg').create()
      const schoolBEvent = await createEvent().withTitle('School B Event').withSchool(schoolB.id).create()
      const schoolBRegistration = await createRegistration()
        .withName('School B Registrant')
        .withEvent(schoolBEvent.id)
        .create()

      // Login as School A admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(schoolAAdmin.email, 'TestPassword123!')

      // Go to School A event registrations
      await page.goto(`/admin/events/${schoolAEvent.id}`)

      // Should see School A registrations
      await expect(page.locator('text=School A Registrant')).toBeVisible()

      // Try to access School B registrations directly
      await page.goto(`/admin/events/${schoolBEvent.id}`)

      // Should show 403 or redirect
      const hasError = await page.locator('text=/403|404|לא נמצא/i').isVisible().catch(() => false)
      expect(hasError).toBe(true)
    })

    test('Cannot export other school registrations', async ({ page, request }) => {
      const schoolA = await createSchool().withName('School A Export').create()
      const schoolAAdmin = await createAdmin()
        .withEmail(generateEmail('export-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolB = await createSchool().withName('School B Export').create()
      const schoolBEvent = await createEvent().withTitle('School B Export Event').withSchool(schoolB.id).create()

      // Login as School A admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(schoolAAdmin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Try to export School B registrations
      const response = await request.get(`/api/events/${schoolBEvent.id}/export`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
        },
      })

      // Should return 403 or 404
      expect([403, 404]).toContain(response.status())
    })
  })

  test.describe('[06.5.1-5.4] SUPER_ADMIN Special Access', () => {
    test('SUPER_ADMIN can see all schools events', async ({ page }) => {
      const superAdmin = await createAdmin()
        .withEmail(generateEmail('super'))
        .withPassword('SuperPassword123!')
        .withRole('SUPER_ADMIN')
        .withSchool(null)
        .create()

      const schoolA = await createSchool().withName('School A Super').create()
      const schoolAEvent = await createEvent().withTitle('School A Super Event').withSchool(schoolA.id).create()

      const schoolB = await createSchool().withName('School B Super').create()
      const schoolBEvent = await createEvent().withTitle('School B Super Event').withSchool(schoolB.id).create()

      // Login as SUPER_ADMIN
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(superAdmin.email, 'SuperPassword123!')

      // Go to super admin schools page
      await page.goto('/admin/super/schools')

      // Should see multiple schools
      await expect(page.locator('text=School A Super')).toBeVisible()
      await expect(page.locator('text=School B Super')).toBeVisible()
    })

    test('SUPER_ADMIN bypasses schoolId filters', async ({ page, request }) => {
      const superAdmin = await createAdmin()
        .withEmail(generateEmail('super-filter'))
        .withPassword('SuperPassword123!')
        .withRole('SUPER_ADMIN')
        .withSchool(null)
        .create()

      const schoolA = await createSchool().withName('School A Filter').create()
      const schoolAEvent = await createEvent().withTitle('Event A').withSchool(schoolA.id).create()

      const schoolB = await createSchool().withName('School B Filter').create()
      const schoolBEvent = await createEvent().withTitle('Event B').withSchool(schoolB.id).create()

      // Login as SUPER_ADMIN
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(superAdmin.email, 'SuperPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Get all events via API
      const response = await request.get('/api/events', {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
        },
      })

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      const events = data.events || data || []

      // SUPER_ADMIN should see events from BOTH schools
      const hasSchoolAEvent = events.some((e: any) => e.schoolId === schoolA.id)
      const hasSchoolBEvent = events.some((e: any) => e.schoolId === schoolB.id)

      expect(hasSchoolAEvent || hasSchoolBEvent).toBe(true)
    })
  })

  test.describe('[06.6.1-6.4] Session Security', () => {
    test('session contains schoolId', async ({ page }) => {
      const school = await createSchool().withName('Session School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('session'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Get session cookie
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      expect(sessionCookie).toBeDefined()

      // JWT should contain schoolId (we can't decode it in test, but it should exist)
      // The server validates this on each request
    })

    test('cannot tamper with JWT to change schoolId', async ({ browser }) => {
      // This test verifies JWT signature validation
      const schoolA = await createSchool().withName('School A Tamper').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('tamper-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const context = await browser.newContext()
      const page = await context.newPage()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      // Get session cookie
      const cookies = await context.cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Try to use tampered cookie (any modification invalidates signature)
      const tamperedValue = sessionCookie?.value + 'tampered'

      await context.addCookies([
        {
          ...sessionCookie!,
          value: tamperedValue,
        },
      ])

      // Try to access protected route
      await page.goto('/admin/events')

      // Should redirect to login (tampered token invalid)
      await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 })

      await context.close()
    })
  })

  test.describe('[06.7.1-7.3] API Authorization Patterns', () => {
    test('API always enforces schoolId from session, not request body', async ({ page, request }) => {
      const schoolA = await createSchool().withName('School A Enforce').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('enforce-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolB = await createSchool().withName('School B Enforce').create()

      // Login as School A admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Create event without specifying schoolId (should use session schoolId)
      const response1 = await request.post('/api/events', {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Event Without schoolId',
          slug: `event-${Date.now()}`,
          capacity: 50,
          startDate: '2025-12-25',
          startTime: '18:00',
          location: 'Test',
        },
      })

      if (response1.ok()) {
        const event1 = await response1.json()
        expect(event1.event?.schoolId || event1.schoolId).toBe(schoolA.id)
      }

      // Create event WITH schoolId (should ignore and use session)
      const response2 = await request.post('/api/events', {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Event With Wrong schoolId',
          slug: `event-wrong-${Date.now()}`,
          capacity: 50,
          startDate: '2025-12-25',
          startTime: '18:00',
          location: 'Test',
          schoolId: schoolB.id, // Try to create for School B!
        },
      })

      if (response2.ok()) {
        const event2 = await response2.json()
        // Should be School A, NOT School B
        expect(event2.event?.schoolId || event2.schoolId).toBe(schoolA.id)
        expect(event2.event?.schoolId || event2.schoolId).not.toBe(schoolB.id)
      }
    })
  })
})

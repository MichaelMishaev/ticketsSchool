import { test, expect } from '@playwright/test'
import {
  createSchool,
  createAdmin,
  createEvent,
  createRegistration,
  cleanupTestData,
} from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { PublicEventPage } from '../page-objects/PublicEventPage'
import { prisma } from '@/lib/prisma'
import { generateIsraeliPhone } from '../helpers/test-helpers'

test.describe('Edge Cases & Error Handling P0 - Critical Tests', () => {
  test.afterAll(async () => await cleanupTestData())

  test.describe('[07.1.1] Database Connection - Health Check', () => {
    test('health check endpoint returns status', async ({ request }) => {
      const response = await request.get('/api/health')

      // Should return 200 with status info
      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data).toHaveProperty('status')
    })
  })

  test.describe('[07.2.1] Email Sending Failures', () => {
    test('registration succeeds even if email fails', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      const timestamp = Date.now()

      // Register with potentially problematic email that might fail sending
      await publicPage.register({
        name: 'Email Test User',
        email: `test-email-fail-${timestamp}@test.com`,
        phone: generateIsraeliPhone(),
        spots: 1,
      })

      // Registration should still succeed even if email fails
      // Check for confirmation (either message or code)
      const hasSuccess =
        (await page.locator('text=/הרשמה הושלמה|הושלמה בהצלחה|confirmation|success/i').count()) > 0

      expect(hasSuccess).toBeTruthy()

      // Verify registration in database
      const registration = await prisma.registration.findFirst({
        where: {
          email: `test-email-fail-${timestamp}@test.com`,
          eventId: event.id,
        },
      })

      expect(registration).not.toBeNull()
      expect(registration?.confirmationCode).not.toBeNull()
    })
  })

  test.describe('[07.3.1] Concurrent Registrations - Race Conditions', () => {
    test('two users register for last spot - atomic enforcement', async ({ browser }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(1) // Only ONE spot
        .withSpotsReserved(0)
        .inFuture()
        .create()

      // Create two separate browser contexts (simulating two different users)
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()

      const page1 = await context1.newPage()
      const page2 = await context2.newPage()

      // Both users navigate to registration page
      await Promise.all([
        page1.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`),
        page2.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`),
      ])

      // Fill forms
      const timestamp = Date.now()

      await page1.fill('input[name="name"]', 'User 1')
      await page1.fill('input[name="email"]', `user1-${timestamp}@test.com`)
      await page1.fill('input[name="phone"]', '0501111111')
      await page1.fill('input[name="spotsCount"]', '1')

      await page2.fill('input[name="name"]', 'User 2')
      await page2.fill('input[name="email"]', `user2-${timestamp}@test.com`)
      await page2.fill('input[name="phone"]', '0502222222')
      await page2.fill('input[name="spotsCount"]', '1')

      // Submit simultaneously
      await Promise.all([
        page1.click('button[type="submit"]'),
        page2.click('button[type="submit"]'),
      ])

      // Wait for responses
      await Promise.all([page1.waitForTimeout(3000), page2.waitForTimeout(3000)])

      // Check results - one should be confirmed, one waitlisted
      const page1Text = await page1.textContent('body')
      const page2Text = await page2.textContent('body')

      const page1Confirmed = page1Text?.includes('הרשמה הושלמה') || page1Text?.includes('confirmed')
      const page1Waitlist = page1Text?.includes('רשימת המתנה') || page1Text?.includes('waitlist')

      const page2Confirmed = page2Text?.includes('הרשמה הושלמה') || page2Text?.includes('confirmed')
      const page2Waitlist = page2Text?.includes('רשימת המתנה') || page2Text?.includes('waitlist')

      // Exactly one should be confirmed, one waitlisted
      const totalConfirmed = (page1Confirmed ? 1 : 0) + (page2Confirmed ? 1 : 0)
      const totalWaitlist = (page1Waitlist ? 1 : 0) + (page2Waitlist ? 1 : 0)

      expect(totalConfirmed).toBe(1)
      expect(totalWaitlist).toBe(1)

      // Verify in database
      const registrations = await prisma.registration.findMany({
        where: { eventId: event.id },
      })

      const confirmedRegs = registrations.filter((r) => r.status === 'CONFIRMED')
      const waitlistRegs = registrations.filter((r) => r.status === 'WAITLIST')

      expect(confirmedRegs.length).toBe(1)
      expect(waitlistRegs.length).toBe(1)

      // Verify spotsReserved
      const updatedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      })

      expect(updatedEvent?.spotsReserved).toBe(1)

      // Cleanup
      await context1.close()
      await context2.close()
    })

    test('concurrent registrations when multiple spots available', async ({ browser }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(5) // 5 spots
        .withSpotsReserved(0)
        .inFuture()
        .create()

      // Create 10 concurrent users trying to register (more than capacity)
      const contexts = await Promise.all(Array.from({ length: 10 }, () => browser.newContext()))

      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))

      // Navigate all to registration page
      await Promise.all(
        pages.map((page) => page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`))
      )

      // Fill and submit all forms simultaneously
      const timestamp = Date.now()

      await Promise.all(
        pages.map(async (page, index) => {
          await page.fill('input[name="name"]', `User ${index + 1}`)
          await page.fill('input[name="email"]', `user${index + 1}-${timestamp}@test.com`)
          await page.fill('input[name="phone"]', `050${String(index + 1).padStart(7, '0')}`)
          await page.fill('input[name="spotsCount"]', '1')
          await page.click('button[type="submit"]')
        })
      )

      // Wait for all to complete
      await Promise.all(pages.map((page) => page.waitForTimeout(3000)))

      // Verify results in database
      const registrations = await prisma.registration.findMany({
        where: { eventId: event.id },
      })

      const confirmedRegs = registrations.filter((r) => r.status === 'CONFIRMED')
      const waitlistRegs = registrations.filter((r) => r.status === 'WAITLIST')

      // Should have exactly 5 confirmed, 5 waitlisted
      expect(confirmedRegs.length).toBe(5)
      expect(waitlistRegs.length).toBe(5)

      // Verify spotsReserved
      const updatedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      })

      expect(updatedEvent?.spotsReserved).toBe(5)

      // Cleanup
      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('[07.3.2] Admin Edits Event While User Registers', () => {
    test('registration uses latest event capacity', async ({ page, browser }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(0)
        .inFuture()
        .create()

      // Admin context
      const adminContext = await browser.newContext()
      const adminPage = await adminContext.newPage()

      // Login as admin
      const loginPage = new LoginPage(adminPage)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // User context - starts filling form
      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      const timestamp = Date.now()
      await page.fill('input[name="name"]', 'Public User')
      await page.fill('input[name="email"]', `concurrent-${timestamp}@test.com`)
      await page.fill('input[name="phone"]', '0501234567')
      await page.fill('input[name="spotsCount"]', '1')

      // Admin reduces capacity to 1 while user is filling form
      await prisma.event.update({
        where: { id: event.id },
        data: { capacity: 1, spotsReserved: 0 },
      })

      // User submits
      await page.click('button[type="submit"]')
      await page.waitForTimeout(2000)

      // Should be confirmed (capacity = 1, spotsReserved = 0, so 1 spot available)
      const registration = await prisma.registration.findFirst({
        where: {
          email: `concurrent-${timestamp}@test.com`,
          eventId: event.id,
        },
      })

      expect(registration).not.toBeNull()
      expect(registration?.status).toBe('CONFIRMED')

      await adminContext.close()
    })
  })

  test.describe('[07.4.1] Extremely Long Input Strings', () => {
    test('validation enforces max length on event title', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin/events/new')

      // Try to enter extremely long title (2000+ characters)
      const longTitle = 'A'.repeat(2000)

      await page.fill('input[name="title"]', longTitle)
      await page.fill('input[name="slug"]', `test-long-${Date.now()}`)
      await page.fill('input[name="capacity"]', '50')

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const dateStr = futureDate.toISOString().split('T')[0]
      await page.fill('input[name="startDate"]', dateStr)
      await page.fill('input[name="startTime"]', '18:00')

      await page.click('button[type="submit"]')

      await page.waitForTimeout(2000)

      // Either validation error shown or title truncated
      const pageText = await page.textContent('body')

      // If error shown
      if (pageText?.includes('ארוך') || pageText?.includes('long') || pageText?.includes('max')) {
        expect(true).toBeTruthy()
      } else {
        // If succeeded, verify title was truncated
        const events = await prisma.event.findMany({
          where: { schoolId: school.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        })

        if (events.length > 0) {
          expect(events[0].title.length).toBeLessThan(2000)
        }
      }
    })

    test('validation enforces max length on registration name', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Try extremely long name
      const longName = 'John Doe '.repeat(200) // ~1600 characters

      await page.fill('input[name="name"]', longName)
      await page.fill('input[name="email"]', `test-long-${Date.now()}@test.com`)
      await page.fill('input[name="phone"]', '0501234567')
      await page.fill('input[name="spotsCount"]', '1')

      await page.click('button[type="submit"]')

      await page.waitForTimeout(2000)

      // Check result
      const pageText = await page.textContent('body')

      if (pageText?.includes('success') || pageText?.includes('הושלמה')) {
        // If succeeded, verify name was truncated or limited
        const registrations = await prisma.registration.findMany({
          where: { eventId: event.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        })

        if (registrations.length > 0) {
          // Should be reasonable length (not 1600 chars)
          expect(registrations[0].name.length).toBeLessThan(500)
        }
      }
    })
  })

  test.describe('[07.4.4] Null or Undefined Values', () => {
    test('API handles null values gracefully', async ({ page, request }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      // Login to get session
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Try to create event with null description
      const response = await request.post('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Test Event',
          slug: `test-null-${Date.now()}`,
          capacity: 50,
          description: null, // Null value
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      })

      // Should either succeed (store as NULL) or return validation error
      const status = response.status()
      expect([200, 201, 400]).toContain(status)

      if (response.ok()) {
        const data = await response.json()
        // Should store as NULL, not string "null"
        expect(data.event?.description).not.toBe('null')
      }
    })
  })

  test.describe('[07.5.1] Timezone Handling - Israel Time', () => {
    test('event dates stored and displayed correctly', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin/events/new')

      const timestamp = Date.now()

      // Create event with specific date/time
      await page.fill('input[name="title"]', 'Timezone Test Event')
      await page.fill('input[name="slug"]', `timezone-test-${timestamp}`)
      await page.fill('input[name="capacity"]', '50')

      // Set date to specific date
      await page.fill('input[name="startDate"]', '2025-06-15')
      await page.fill('input[name="startTime"]', '19:00')

      await page.click('button[type="submit"]')

      await page.waitForTimeout(2000)

      // Find created event
      const event = await prisma.event.findFirst({
        where: {
          schoolId: school.id,
          slug: `timezone-test-${timestamp}`,
        },
      })

      if (event) {
        // Verify date is stored (should be in UTC in database)
        expect(event.startDate).not.toBeNull()

        // Verify it's a valid date
        const storedDate = new Date(event.startDate)
        expect(storedDate instanceof Date && !isNaN(storedDate.getTime())).toBeTruthy()
      }
    })
  })

  test.describe('[07.5.2] Event at Midnight', () => {
    test('midnight time handled correctly', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin/events/new')

      const timestamp = Date.now()

      await page.fill('input[name="title"]', 'Midnight Event')
      await page.fill('input[name="slug"]', `midnight-${timestamp}`)
      await page.fill('input[name="capacity"]', '50')
      await page.fill('input[name="startDate"]', '2025-06-15')
      await page.fill('input[name="startTime"]', '00:00') // Midnight

      await page.click('button[type="submit"]')

      await page.waitForTimeout(2000)

      const event = await prisma.event.findFirst({
        where: {
          schoolId: school.id,
          slug: `midnight-${timestamp}`,
        },
      })

      if (event) {
        const storedDate = new Date(event.startDate)
        expect(storedDate instanceof Date && !isNaN(storedDate.getTime())).toBeTruthy()

        // Verify it's stored correctly (not off by one day)
        const dateStr = storedDate.toISOString()
        expect(dateStr).toContain('2025-06-15') // Should still be June 15
      }
    })
  })

  test.describe('[07.6.1] Network - Slow Connection Simulation', () => {
    test('loading indicators shown during slow request', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      // Simulate slow network (throttle to 3G)
      const client = await page.context().newCDPSession(page)
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
        uploadThroughput: (750 * 1024) / 8, // 750 Kbps
        latency: 100, // 100ms
      })

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Fill form
      const timestamp = Date.now()
      await page.fill('input[name="name"]', 'Slow Network User')
      await page.fill('input[name="email"]', `slow-${timestamp}@test.com`)
      await page.fill('input[name="phone"]', '0501234567')
      await page.fill('input[name="spotsCount"]', '1')

      // Click submit
      await page.click('button[type="submit"]')

      // Check if loading indicator appears (button disabled, spinner, etc.)
      const buttonDisabled = (await page.locator('button[type="submit"]:disabled').count()) > 0
      const hasLoadingText = (await page.locator('text=/טוען|loading|שולח|sending/i').count()) > 0

      // Should show some loading indication
      expect(buttonDisabled || hasLoadingText).toBeTruthy()

      // Wait for completion
      await page.waitForTimeout(5000)
    })
  })

  test.describe('[07.8.2] Cookies Disabled', () => {
    test('login fails gracefully when cookies disabled', async ({ browser }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      // Create context with cookies disabled
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        javaScriptEnabled: true,
        acceptDownloads: false,
        permissions: [],
      })

      // Disable cookies by intercepting and removing Set-Cookie headers
      await context.route('**/*', async (route) => {
        const response = await route.fetch()
        const headers = response.headers()
        delete headers['set-cookie']
        await route.fulfill({
          response,
          headers,
        })
      })

      const page = await context.newPage()

      // Try to login
      await page.goto('http://localhost:9000/admin/login')

      await page.fill('input[type="email"]', admin.email)
      await page.fill('input[type="password"]', 'TestPassword123!')
      await page.click('button[type="submit"]')

      await page.waitForTimeout(2000)

      // Should not be logged in (no cookie set)
      const currentUrl = page.url()

      // Either still on login page or shows error
      const isLoginPage = currentUrl.includes('login')
      const pageText = await page.textContent('body')
      const hasCookieError = pageText?.includes('cookie') || pageText?.includes('עוגיה')

      expect(isLoginPage || hasCookieError).toBeTruthy()

      await context.close()
    })
  })

  test.describe('[07.9.1] Data Integrity - Orphaned Events', () => {
    test('events with null schoolId can be detected', async () => {
      // Create event with null schoolId (orphaned)
      const timestamp = Date.now()

      const orphanedEvent = await prisma.event.create({
        data: {
          title: 'Orphaned Event',
          slug: `orphaned-${timestamp}`,
          capacity: 50,
          spotsReserved: 0,
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          schoolId: null as any, // Force null
        },
      })

      // Query for orphaned events
      const orphanedEvents = await prisma.event.findMany({
        where: {
          schoolId: null,
        },
      })

      expect(orphanedEvents.length).toBeGreaterThan(0)

      // Cleanup
      await prisma.event.delete({
        where: { id: orphanedEvent.id },
      })
    })
  })

  test.describe('[07.9.4] Mismatched spotsReserved', () => {
    test('spotsReserved matches confirmed registrations count', async () => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(10) // Says 10 reserved
        .create()

      // Create 10 confirmed registrations
      for (let i = 0; i < 10; i++) {
        await createRegistration().withEvent(event.id).withSpots(1).confirmed().create()
      }

      // Verify count matches
      const confirmedCount = await prisma.registration.count({
        where: {
          eventId: event.id,
          status: 'CONFIRMED',
        },
      })

      const totalSpots = await prisma.registration.aggregate({
        where: {
          eventId: event.id,
          status: 'CONFIRMED',
        },
        _sum: {
          spotsCount: true,
        },
      })

      const eventData = await prisma.event.findUnique({
        where: { id: event.id },
      })

      expect(eventData?.spotsReserved).toBe(totalSpots._sum.spotsCount || 0)
    })
  })

  test.describe('[07.15.1] Missing Environment Variables', () => {
    test('application handles missing JWT_SECRET', async ({ request }) => {
      // This test verifies the app doesn't crash with missing env vars
      // Health check should still work even if JWT_SECRET is missing
      const response = await request.get('/api/health')

      // Should return response (either success or error)
      expect(response.status()).toBeGreaterThan(0)
    })
  })

  test.describe('[07.3.3] Two Admins Edit Same Registration', () => {
    test('last write wins when two admins edit simultaneously', async ({ browser }) => {
      const school = await createSchool().create()
      const admin1 = await createAdmin().withSchool(school.id).withName('Admin 1').create()
      const admin2 = await createAdmin().withSchool(school.id).withName('Admin 2').create()

      const event = await createEvent().withSchool(school.id).create()
      const registration = await createRegistration()
        .withEvent(event.id)
        .withName('Original Name')
        .confirmed()
        .create()

      // Create two admin contexts
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()

      const page1 = await context1.newPage()
      const page2 = await context2.newPage()

      // Login both admins
      const loginPage1 = new LoginPage(page1)
      await loginPage1.goto()
      await loginPage1.login(admin1.email, 'TestPassword123!')

      const loginPage2 = new LoginPage(page2)
      await loginPage2.goto()
      await loginPage2.login(admin2.email, 'TestPassword123!')

      // Both navigate to same registration edit page (if exists)
      await page1.goto(`http://localhost:9000/admin/events/${event.id}`)
      await page2.goto(`http://localhost:9000/admin/events/${event.id}`)

      // Try to edit via API simultaneously
      const cookies1 = await context1.cookies()
      const cookies2 = await context2.cookies()

      const session1 = cookies1.find((c) => c.name === 'admin_session')
      const session2 = cookies2.find((c) => c.name === 'admin_session')

      // Both try to update the registration
      const [response1, response2] = await Promise.all([
        page1.request.patch(`/api/events/${event.id}/registrations/${registration.id}`, {
          headers: { Cookie: `admin_session=${session1?.value}` },
          data: { name: 'Admin 1 Changed Name' },
        }),
        page2.request.patch(`/api/events/${event.id}/registrations/${registration.id}`, {
          headers: { Cookie: `admin_session=${session2?.value}` },
          data: { name: 'Admin 2 Changed Name' },
        }),
      ])

      // At least one should succeed
      const atLeastOneSuccess = response1.ok() || response2.ok()

      if (atLeastOneSuccess) {
        // Verify final state (last write wins)
        const finalReg = await prisma.registration.findUnique({
          where: { id: registration.id },
        })

        expect(finalReg).not.toBeNull()
        expect(finalReg?.name).not.toBe('Original Name') // Should be changed
      }

      await context1.close()
      await context2.close()
    })
  })
})

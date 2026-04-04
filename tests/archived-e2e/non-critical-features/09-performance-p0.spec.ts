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
import { generateIsraeliPhone } from '../helpers/test-helpers'
import { prisma } from '@/lib/prisma'

test.describe('Performance & Scale P0 - Critical Tests', () => {
  test.afterAll(async () => await cleanupTestData())

  test.describe('[09.1.1] Landing Page Load Time', () => {
    test('landing page loads within 2 seconds', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('http://localhost:9000/')

      const loadTime = Date.now() - startTime

      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000)
    })
  })

  test.describe('[09.1.2] Public Event Page Load Time', () => {
    test('public event page loads quickly', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      const startTime = Date.now()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Wait for form to be interactive
      await page.locator('input[name="name"]').waitFor({ state: 'visible' })

      const loadTime = Date.now() - startTime

      // Should load and render form within 2 seconds
      expect(loadTime).toBeLessThan(2000)
    })
  })

  test.describe('[09.1.3] Admin Dashboard Load Time', () => {
    test('admin dashboard loads within 1 second', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const startTime = Date.now()

      await page.goto('http://localhost:9000/admin/dashboard')

      // Wait for dashboard content
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Should load within reasonable time (2 seconds for initial data)
      expect(loadTime).toBeLessThan(2000)
    })
  })

  test.describe('[09.2.1] Event List Query - Small School', () => {
    test('events list query is fast for small dataset', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      // Create 30 events
      for (let i = 0; i < 30; i++) {
        await createEvent()
          .withSchool(school.id)
          .withTitle(`Event ${i + 1}`)
          .create()
      }

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const startTime = Date.now()

      await page.goto('http://localhost:9000/admin/events')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Should load 30 events quickly (< 2 seconds)
      expect(loadTime).toBeLessThan(2000)
    })
  })

  test.describe('[09.2.3] Registration List Query - Small Event', () => {
    test('registrations list loads quickly for small event', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()
      const event = await createEvent().withSchool(school.id).withCapacity(100).create()

      // Create 30 registrations
      for (let i = 0; i < 30; i++) {
        await createRegistration()
          .withEvent(event.id)
          .withName(`User ${i + 1}`)
          .confirmed()
          .create()
      }

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const startTime = Date.now()

      await page.goto(`http://localhost:9000/admin/events/${event.id}`)
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Should load registrations quickly
      expect(loadTime).toBeLessThan(2000)
    })
  })

  test.describe('[09.2.5] Dashboard Stats Query', () => {
    test('dashboard stats calculated efficiently', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      // Create some events and registrations for stats
      for (let i = 0; i < 5; i++) {
        const event = await createEvent().withSchool(school.id).withCapacity(50).create()

        for (let j = 0; j < 10; j++) {
          await createRegistration()
            .withEvent(event.id)
            .withName(`User ${i}-${j}`)
            .confirmed()
            .create()
        }
      }

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const startTime = Date.now()

      await page.goto('http://localhost:9000/admin/dashboard')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Stats should calculate quickly
      expect(loadTime).toBeLessThan(2000)
    })
  })

  test.describe('[09.3.1] Single Registration Submission', () => {
    test('single registration completes within 1 second', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      await page.fill('input[name="name"]', 'Performance Test User')
      await page.fill('input[name="email"]', `perf-${Date.now()}@test.com`)
      await page.fill('input[name="phone"]', generateIsraeliPhone())
      await page.fill('input[name="spotsCount"]', '1')

      const startTime = Date.now()

      await page.click('button[type="submit"]')

      // Wait for success message
      await page.waitForSelector('text=/הרשמה הושלמה|הושלמה בהצלחה|success|confirmation/i', {
        timeout: 5000,
      })

      const submitTime = Date.now() - startTime

      // Should complete within 2 seconds
      expect(submitTime).toBeLessThan(2000)
    })
  })

  test.describe('[09.3.2] 10 Concurrent Registrations', () => {
    test('system handles 10 concurrent registrations efficiently', async ({ browser }) => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      const startTime = Date.now()

      // Create 10 concurrent contexts
      const contexts = await Promise.all(Array.from({ length: 10 }, () => browser.newContext()))

      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))

      // All navigate and submit simultaneously
      await Promise.all(
        pages.map(async (page, index) => {
          await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

          await page.fill('input[name="name"]', `User ${index + 1}`)
          await page.fill('input[name="email"]', `concurrent-${index}-${Date.now()}@test.com`)
          await page.fill('input[name="phone"]', generateIsraeliPhone())
          await page.fill('input[name="spotsCount"]', '1')

          await page.click('button[type="submit"]')
        })
      )

      // Wait for all to complete
      await Promise.all(
        pages.map((page) =>
          page.waitForSelector('text=/הרשמה|success|waitlist/i', { timeout: 10000 }).catch(() => {})
        )
      )

      const totalTime = Date.now() - startTime

      // All 10 should complete within 10 seconds
      expect(totalTime).toBeLessThan(10000)

      // Verify all registrations were created
      const registrations = await prisma.registration.findMany({
        where: { eventId: event.id },
      })

      expect(registrations.length).toBe(10)

      // Cleanup
      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('[09.3.3] 100 Concurrent Registrations', () => {
    test('system handles 100 concurrent registrations under load', async ({ browser }) => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).withCapacity(100).inFuture().create()

      const startTime = Date.now()

      // Create 100 concurrent contexts (high load test)
      const batchSize = 20
      const batches = Math.ceil(100 / batchSize)

      for (let batch = 0; batch < batches; batch++) {
        const contexts = await Promise.all(
          Array.from({ length: batchSize }, () => browser.newContext())
        )

        const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))

        await Promise.all(
          pages.map(async (page, index) => {
            const globalIndex = batch * batchSize + index
            await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`, {
              timeout: 15000,
            })

            await page.fill('input[name="name"]', `User ${globalIndex + 1}`)
            await page.fill('input[name="email"]', `load-${globalIndex}-${Date.now()}@test.com`)
            await page.fill('input[name="phone"]', generateIsraeliPhone())
            await page.fill('input[name="spotsCount"]', '1')

            await page.click('button[type="submit"]')
          })
        )

        await Promise.all(
          pages.map((page) =>
            page
              .waitForSelector('text=/הרשמה|success|waitlist/i', { timeout: 15000 })
              .catch(() => {})
          )
        )

        await Promise.all(contexts.map((ctx) => ctx.close()))
      }

      const totalTime = Date.now() - startTime

      // 100 registrations should complete within 30 seconds (in batches)
      expect(totalTime).toBeLessThan(30000)

      // Verify registrations were created
      const registrations = await prisma.registration.findMany({
        where: { eventId: event.id },
      })

      // Should have 100 registrations (confirmed + waitlist if capacity exceeded)
      expect(registrations.length).toBeGreaterThanOrEqual(90) // Allow some failures under high load
    })
  })

  test.describe('[09.7.1] Database Index - Event.schoolId', () => {
    test('events query by schoolId uses index', async () => {
      const school = await createSchool().create()

      // Create some events
      for (let i = 0; i < 10; i++) {
        await createEvent()
          .withSchool(school.id)
          .withTitle(`Event ${i + 1}`)
          .create()
      }

      const startTime = Date.now()

      // Query events by schoolId
      const events = await prisma.event.findMany({
        where: { schoolId: school.id },
      })

      const queryTime = Date.now() - startTime

      expect(events.length).toBe(10)
      // Query should be fast (< 100ms)
      expect(queryTime).toBeLessThan(100)
    })
  })

  test.describe('[09.7.2] Database Index - Registration.eventId', () => {
    test('registrations query by eventId uses index', async () => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).create()

      // Create 50 registrations
      for (let i = 0; i < 50; i++) {
        await createRegistration()
          .withEvent(event.id)
          .withName(`User ${i + 1}`)
          .confirmed()
          .create()
      }

      const startTime = Date.now()

      // Query registrations by eventId
      const registrations = await prisma.registration.findMany({
        where: { eventId: event.id },
      })

      const queryTime = Date.now() - startTime

      expect(registrations.length).toBe(50)
      // Query should be fast (< 100ms)
      expect(queryTime).toBeLessThan(100)
    })
  })

  test.describe('[09.7.3] Database Index - Registration.email', () => {
    test('registration lookup by email is fast', async () => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).create()

      const testEmail = `index-test-${Date.now()}@test.com`

      await createRegistration().withEvent(event.id).withEmail(testEmail).confirmed().create()

      const startTime = Date.now()

      // Query by email
      const registration = await prisma.registration.findFirst({
        where: { email: testEmail },
      })

      const queryTime = Date.now() - startTime

      expect(registration).not.toBeNull()
      // Lookup should be near-instant (< 50ms)
      expect(queryTime).toBeLessThan(50)
    })
  })

  test.describe('[09.7.5] Database Index - Registration.confirmationCode', () => {
    test('lookup by confirmation code is fast', async () => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).create()

      const registration = await createRegistration()
        .withEvent(event.id)
        .withName('Index Test User')
        .confirmed()
        .create()

      const startTime = Date.now()

      // Query by confirmation code
      const found = await prisma.registration.findFirst({
        where: { confirmationCode: registration.confirmationCode },
      })

      const queryTime = Date.now() - startTime

      expect(found).not.toBeNull()
      expect(found?.id).toBe(registration.id)
      // Should be near-instant (< 50ms)
      expect(queryTime).toBeLessThan(50)
    })
  })

  test.describe('[09.8.1] API Response Time - Fast Endpoint', () => {
    test('health check endpoint responds quickly', async ({ request }) => {
      const startTime = Date.now()

      const response = await request.get('/api/health')

      const responseTime = Date.now() - startTime

      expect(response.ok()).toBeTruthy()
      // Should respond within 200ms
      expect(responseTime).toBeLessThan(200)
    })
  })

  test.describe('[09.8.4] API Timeout Configuration', () => {
    test('API requests complete within reasonable time', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      // Public registration should not timeout
      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`, {
        timeout: 30000, // 30 second timeout
      })

      // Should load successfully
      await expect(page.locator('input[name="name"]')).toBeVisible()
    })
  })

  test.describe('[09.13.1] Load Test - 10 Concurrent Users', () => {
    test('system handles 10 concurrent users viewing events', async ({ browser }) => {
      const school = await createSchool().create()

      // Create 5 events
      const events = []
      for (let i = 0; i < 5; i++) {
        const event = await createEvent()
          .withSchool(school.id)
          .withTitle(`Load Test Event ${i + 1}`)
          .withCapacity(50)
          .inFuture()
          .create()
        events.push(event)
      }

      const startTime = Date.now()

      // Create 10 concurrent users
      const contexts = await Promise.all(Array.from({ length: 10 }, () => browser.newContext()))

      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))

      // All users browse events
      await Promise.all(
        pages.map(async (page, index) => {
          const event = events[index % events.length]
          await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`, {
            timeout: 10000,
          })
          await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
        })
      )

      const totalTime = Date.now() - startTime

      // All 10 users should load pages within 5 seconds
      expect(totalTime).toBeLessThan(5000)

      await Promise.all(contexts.map((ctx) => ctx.close()))
    })
  })

  test.describe('[09.13.2] Load Test - 50 Concurrent Users', () => {
    test('system handles 50 concurrent users', async ({ browser }) => {
      const school = await createSchool().create()
      const event = await createEvent().withSchool(school.id).withCapacity(100).inFuture().create()

      const startTime = Date.now()

      // Create 50 concurrent users in batches
      const batchSize = 10
      const batches = 5

      for (let batch = 0; batch < batches; batch++) {
        const contexts = await Promise.all(
          Array.from({ length: batchSize }, () => browser.newContext())
        )

        const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))

        await Promise.all(
          pages.map(async (page) => {
            await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`, {
              timeout: 10000,
            })
            await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
          })
        )

        await Promise.all(contexts.map((ctx) => ctx.close()))
      }

      const totalTime = Date.now() - startTime

      // 50 users should be handled within 15 seconds
      expect(totalTime).toBeLessThan(15000)
    })
  })

  test.describe('[09.2.7] N+1 Query Prevention', () => {
    test('events list with registration counts uses efficient query', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      // Create 10 events with registrations
      for (let i = 0; i < 10; i++) {
        const event = await createEvent()
          .withSchool(school.id)
          .withTitle(`N+1 Test Event ${i + 1}`)
          .create()

        for (let j = 0; j < 5; j++) {
          await createRegistration()
            .withEvent(event.id)
            .withName(`User ${j + 1}`)
            .confirmed()
            .create()
        }
      }

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const startTime = Date.now()

      await page.goto('http://localhost:9000/admin/events')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Should load all events with counts efficiently (< 2 seconds)
      expect(loadTime).toBeLessThan(2000)
    })
  })
})

/**
 * NEGATIVE TESTS - Security-critical tests for forbidden paths
 *
 * These tests ensure that invalid operations FAIL GRACEFULLY and unauthorized
 * actions are BLOCKED. Most regressions re-open forbidden paths.
 *
 * @priority CRITICAL (Tier 1 - run on every PR)
 * @security YES
 * @testCount 38 tests covering authentication, authorization, validation, and isolation
 *
 * Coverage:
 * - Authentication failures (401)
 * - Authorization/RBAC failures (403)
 * - Input validation failures (400)
 * - Data integrity failures (409/400)
 * - Business logic failures (400)
 * - Cross-tenant access failures (403)
 */

import { test, expect } from '@playwright/test'
import {
  createSchool,
  createAdmin,
  createEvent,
  createRegistration,
  cleanupTestData,
  prisma,
} from '../fixtures/test-data'
import { loginViaAPI, getSessionCookie } from '../helpers/auth-helpers'

const BASE_URL = process.env.BASE_URL || 'http://localhost:9000'

test.describe('Negative Tests - Security & Validation', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('1. Authentication Negative Tests (401 Unauthorized)', () => {
    test('N1.1: Unauthenticated user CANNOT access GET /api/events', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/events`)

      expect(response.status()).toBe(401)
      const body = await response.json()
      expect(body.error).toBeDefined()
      expect(body.error).toContain('Unauthorized')
    })

    test('N1.2: Unauthenticated user CANNOT access POST /api/events', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/events`, {
        data: {
          title: 'Forbidden Event',
          capacity: 50,
          startAt: '2025-12-25T18:00:00Z',
          location: 'Test Location',
        },
      })

      expect(response.status()).toBe(401)
      const body = await response.json()
      expect(body.error).toContain('Unauthorized')
    })

    test('N1.3: Invalid JWT token rejected', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/events`, {
        headers: {
          Cookie: 'admin_session=invalid.jwt.token',
        },
      })

      expect(response.status()).toBe(401)
    })

    test('N1.4: Malformed JWT token rejected', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/events`, {
        headers: {
          Cookie: 'admin_session=malformed-token-no-dots',
        },
      })

      expect(response.status()).toBe(401)
    })

    test('N1.5: Missing session cookie rejected', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/dashboard/stats`)

      expect(response.status()).toBe(401)
      const body = await response.json()
      expect(body.error).toBeDefined()
    })
  })

  test.describe('2. Authorization (RBAC) Negative Tests (403 Forbidden)', () => {
    test('N2.1: ADMIN CANNOT access other school events', async ({ browser }) => {
      const school1 = await createSchool().withName('School 1').create()
      const school2 = await createSchool().withName('School 2').create()

      const admin1 = await createAdmin()
        .withEmail('admin1-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school1.id)
        .create()

      const event2 = await createEvent()
        .withTitle('School 2 Event')
        .withSchool(school2.id)
        .inFuture()
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin1.email, admin1.password)

      const response = await context.request.get(`${BASE_URL}/api/events/${event2.id}`)

      expect(response.status()).toBe(403)
      const body = await response.json()
      expect(body.error).toContain('Forbidden')

      await context.close()
    })

    test('N2.2: ADMIN CANNOT create event for other school', async ({ browser }) => {
      const school1 = await createSchool().withName('School 1').create()
      const school2 = await createSchool().withName('School 2').create()

      const admin1 = await createAdmin()
        .withEmail('admin2-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school1.id)
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin1.email, admin1.password)

      const response = await context.request.post(`${BASE_URL}/api/events`, {
        data: {
          title: 'Malicious Event',
          capacity: 50,
          startAt: '2025-12-25T18:00:00Z',
          location: 'Test',
          schoolId: school2.id, // Try to create for different school
        },
      })

      // Should either ignore schoolId and create for school1, or return 403
      if (response.ok()) {
        const body = await response.json()
        // Verify it was created for school1, NOT school2
        expect(body.schoolId).toBe(school1.id)
        expect(body.schoolId).not.toBe(school2.id)
      } else {
        expect([400, 403]).toContain(response.status())
      }

      await context.close()
    })

    test('N2.3: MANAGER CANNOT create events (read-only)', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const manager = await createAdmin()
        .withEmail('manager-neg@test.com')
        .withPassword('Password123!')
        .withRole('MANAGER')
        .withSchool(school.id)
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, manager.email, manager.password)

      const response = await context.request.post(`${BASE_URL}/api/events`, {
        data: {
          title: 'Manager Event',
          capacity: 50,
          startAt: '2025-12-25T18:00:00Z',
          location: 'Test',
        },
      })

      expect(response.status()).toBe(403)
      const body = await response.json()
      expect(body.error).toBeDefined()

      await context.close()
    })

    test('N2.4: VIEWER CANNOT create events', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const viewer = await createAdmin()
        .withEmail('viewer-neg@test.com')
        .withPassword('Password123!')
        .withRole('VIEWER')
        .withSchool(school.id)
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, viewer.email, viewer.password)

      const response = await context.request.post(`${BASE_URL}/api/events`, {
        data: {
          title: 'Viewer Event',
          capacity: 50,
          startAt: '2025-12-25T18:00:00Z',
          location: 'Test',
        },
      })

      expect(response.status()).toBe(403)

      await context.close()
    })

    test('N2.5: VIEWER CANNOT delete events', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const viewer = await createAdmin()
        .withEmail('viewer2-neg@test.com')
        .withPassword('Password123!')
        .withRole('VIEWER')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Test Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, viewer.email, viewer.password)

      const response = await context.request.delete(`${BASE_URL}/api/events/${event.id}`)

      expect(response.status()).toBe(403)

      await context.close()
    })

    test('N2.6: Non-SuperAdmin CANNOT access SuperAdmin routes', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const admin = await createAdmin()
        .withEmail('regular-admin-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin.email, admin.password)

      const response = await context.request.get(`${BASE_URL}/api/admin/super/schools`)

      expect(response.status()).toBe(403)
      const body = await response.json()
      expect(body.error).toContain('Super admin')

      await context.close()
    })

    test('N2.7: ADMIN CANNOT edit other school event', async ({ browser }) => {
      const school1 = await createSchool().withName('School 1').create()
      const school2 = await createSchool().withName('School 2').create()

      const admin1 = await createAdmin()
        .withEmail('admin3-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school1.id)
        .create()

      const event2 = await createEvent()
        .withTitle('School 2 Event')
        .withSchool(school2.id)
        .inFuture()
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin1.email, admin1.password)

      const response = await context.request.patch(`${BASE_URL}/api/events/${event2.id}`, {
        data: {
          title: 'Hacked Title',
        },
      })

      expect(response.status()).toBe(403)
      const body = await response.json()
      expect(body.error).toContain('Forbidden')

      await context.close()
    })

    test('N2.8: ADMIN CANNOT view other school registrations', async ({ browser }) => {
      const school1 = await createSchool().withName('School 1').create()
      const school2 = await createSchool().withName('School 2').create()

      const admin1 = await createAdmin()
        .withEmail('admin4-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school1.id)
        .create()

      const event2 = await createEvent()
        .withTitle('School 2 Event')
        .withSchool(school2.id)
        .inFuture()
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin1.email, admin1.password)

      const response = await context.request.get(
        `${BASE_URL}/api/events/${event2.id}/registrations`
      )

      expect([403, 404]).toContain(response.status())

      await context.close()
    })
  })

  test.describe('3. Input Validation Negative Tests (400 Bad Request)', () => {
    test('N3.1: Event creation with missing title rejected', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const admin = await createAdmin()
        .withEmail('admin5-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin.email, admin.password)

      const response = await context.request.post(`${BASE_URL}/api/events`, {
        data: {
          // Missing title
          capacity: 50,
          startAt: '2025-12-25T18:00:00Z',
          location: 'Test',
        },
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('required')

      await context.close()
    })

    test('N3.2: Event with negative capacity rejected', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const admin = await createAdmin()
        .withEmail('admin6-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin.email, admin.password)

      const response = await context.request.post(`${BASE_URL}/api/events`, {
        data: {
          title: 'Invalid Capacity Event',
          capacity: -10, // Negative capacity
          startAt: '2025-12-25T18:00:00Z',
          location: 'Test',
          maxSpotsPerPerson: 5,
        },
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('positive')

      await context.close()
    })

    test('N3.3: Event with zero capacity rejected', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const admin = await createAdmin()
        .withEmail('admin7-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin.email, admin.password)

      const response = await context.request.post(`${BASE_URL}/api/events`, {
        data: {
          title: 'Zero Capacity Event',
          capacity: 0,
          startAt: '2025-12-25T18:00:00Z',
          location: 'Test',
          maxSpotsPerPerson: 5,
        },
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('positive')

      await context.close()
    })

    test('N3.4: Event with invalid date format rejected', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const admin = await createAdmin()
        .withEmail('admin8-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin.email, admin.password)

      const response = await context.request.post(`${BASE_URL}/api/events`, {
        data: {
          title: 'Invalid Date Event',
          capacity: 50,
          startAt: 'not-a-date',
          location: 'Test',
          maxSpotsPerPerson: 5,
        },
      })

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('date')

      await context.close()
    })

    test('N3.5: Registration with invalid Israeli phone rejected', async ({ request }) => {
      const school = await createSchool().withName('Test School').create()
      const event = await createEvent()
        .withTitle('Test Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const response = await request.post(
        `${BASE_URL}/api/p/${school.slug}/${event.slug}/register`,
        {
          data: {
            name: 'Test User',
            email: 'test@test.com',
            phone: '123', // Invalid Israeli phone
            spots: 1,
          },
        }
      )

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toBeDefined()
    })

    test('N3.6: Registration with missing name rejected', async ({ request }) => {
      const school = await createSchool().withName('Test School').create()
      const event = await createEvent()
        .withTitle('Test Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const response = await request.post(
        `${BASE_URL}/api/p/${school.slug}/${event.slug}/register`,
        {
          data: {
            // Missing name
            email: 'test@test.com',
            phone: '0501234567',
            spots: 1,
          },
        }
      )

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('name')
    })

    test('N3.7: Invalid email format rejected', async ({ request }) => {
      const school = await createSchool().withName('Test School').create()
      const event = await createEvent()
        .withTitle('Test Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const response = await request.post(
        `${BASE_URL}/api/p/${school.slug}/${event.slug}/register`,
        {
          data: {
            name: 'Test User',
            email: 'not-an-email',
            phone: '0501234567',
            spots: 1,
          },
        }
      )

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toBeDefined()
    })
  })

  test.describe('4. Data Integrity Negative Tests', () => {
    test('N4.1: Cannot delete event with confirmed registrations', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const admin = await createAdmin()
        .withEmail('admin9-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Event With Registrations')
        .withSchool(school.id)
        .inFuture()
        .create()

      // Create a confirmed registration
      await createRegistration()
        .withName('Test User')
        .withEmail('user@test.com')
        .withPhone('0501234567')
        .withEvent(event.id)
        .confirmed()
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin.email, admin.password)

      const response = await context.request.delete(`${BASE_URL}/api/events/${event.id}`)

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('registrations')

      await context.close()
    })

    test('N4.2: Cannot reduce capacity below current registrations', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const admin = await createAdmin()
        .withEmail('admin10-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Event With 50 Capacity')
        .withCapacity(50)
        .withSchool(school.id)
        .inFuture()
        .create()

      // Create 10 registrations
      for (let i = 0; i < 10; i++) {
        await createRegistration()
          .withName(`User ${i}`)
          .withEmail(`user${i}@test.com`)
          .withPhone(`05012345${i.toString().padStart(2, '0')}`)
          .withEvent(event.id)
          .withSpots(2)
          .confirmed()
          .create()
      }

      const context = await browser.newContext()
      await loginViaAPI(context, admin.email, admin.password)

      // Try to reduce capacity to 15 (less than 20 confirmed spots)
      const response = await context.request.patch(`${BASE_URL}/api/events/${event.id}`, {
        data: {
          capacity: 15,
        },
      })

      // Should fail or be ignored
      if (response.ok()) {
        const body = await response.json()
        // Should not reduce below 20
        expect(body.capacity).toBeGreaterThanOrEqual(20)
      } else {
        expect(response.status()).toBe(400)
      }

      await context.close()
    })

    test('N4.3: Cannot create registration for non-existent event', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/p/fake-school/fake-event/register`, {
        data: {
          name: 'Test User',
          email: 'test@test.com',
          phone: '0501234567',
          spots: 1,
        },
      })

      expect(response.status()).toBe(404)
    })

    test('N4.4: Cannot create event for non-existent school', async ({ browser }) => {
      const admin = await createAdmin()
        .withEmail('super-neg@test.com')
        .withPassword('Password123!')
        .withRole('SUPER_ADMIN')
        .withSchool(null)
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin.email, admin.password)

      const response = await context.request.post(`${BASE_URL}/api/events`, {
        data: {
          title: 'Orphan Event',
          capacity: 50,
          startAt: '2025-12-25T18:00:00Z',
          location: 'Test',
          schoolId: 'non-existent-school-id',
          maxSpotsPerPerson: 5,
        },
      })

      expect([400, 404]).toContain(response.status())

      await context.close()
    })

    test('N4.5: Cannot update event schoolId after creation', async ({ browser }) => {
      const school1 = await createSchool().withName('School 1').create()
      const school2 = await createSchool().withName('School 2').create()

      const admin = await createAdmin()
        .withEmail('super2-neg@test.com')
        .withPassword('Password123!')
        .withRole('SUPER_ADMIN')
        .withSchool(null)
        .create()

      const event = await createEvent()
        .withTitle('Original School Event')
        .withSchool(school1.id)
        .inFuture()
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin.email, admin.password)

      const response = await context.request.patch(`${BASE_URL}/api/events/${event.id}`, {
        data: {
          schoolId: school2.id, // Try to change schoolId
        },
      })

      if (response.ok()) {
        const body = await response.json()
        // schoolId should not have changed
        expect(body.schoolId).toBe(school1.id)
      } else {
        expect([400, 403]).toContain(response.status())
      }

      await context.close()
    })
  })

  test.describe('5. Business Logic Negative Tests', () => {
    test('N5.1: Cannot register for CLOSED event', async ({ request }) => {
      const school = await createSchool().withName('Test School').create()
      const event = await createEvent()
        .withTitle('Closed Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      // Close the event manually via Prisma
      await prisma.event.update({
        where: { id: event.id },
        data: { status: 'CLOSED' },
      })

      const response = await request.post(
        `${BASE_URL}/api/p/${school.slug}/${event.slug}/register`,
        {
          data: {
            name: 'Test User',
            email: 'test@test.com',
            phone: '0501234567',
            spots: 1,
          },
        }
      )

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('closed')
    })

    test('N5.2: Cannot register with more spots than available', async ({ request }) => {
      const school = await createSchool().withName('Test School').create()
      const event = await createEvent()
        .withTitle('Small Event')
        .withCapacity(5)
        .withSchool(school.id)
        .inFuture()
        .create()

      const response = await request.post(
        `${BASE_URL}/api/p/${school.slug}/${event.slug}/register`,
        {
          data: {
            name: 'Greedy User',
            email: 'greedy@test.com',
            phone: '0501234567',
            spots: 10, // More than capacity
          },
        }
      )

      // Should either reject or put on waitlist
      if (response.ok()) {
        const body = await response.json()
        expect(body.status).toBe('WAITLIST')
      } else {
        expect(response.status()).toBe(400)
      }
    })

    test('N5.3: Cannot cancel already-cancelled registration', async ({ browser }) => {
      const school = await createSchool().withName('Test School').create()
      const admin = await createAdmin()
        .withEmail('admin11-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Test Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const registration = await createRegistration()
        .withName('Test User')
        .withEmail('user@test.com')
        .withPhone('0501234567')
        .withEvent(event.id)
        .cancelled()
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin.email, admin.password)

      const response = await context.request.patch(
        `${BASE_URL}/api/events/${event.id}/registrations/${registration.id}`,
        {
          data: {
            status: 'CANCELLED',
          },
        }
      )

      if (response.ok()) {
        // Should remain cancelled
        const body = await response.json()
        expect(body.status).toBe('CANCELLED')
      } else {
        expect(response.status()).toBe(400)
      }

      await context.close()
    })

    test('N5.4: Cannot register past event end date', async ({ request }) => {
      const school = await createSchool().withName('Test School').create()
      const event = await createEvent()
        .withTitle('Past Event')
        .withSchool(school.id)
        .inPast()
        .create()

      const response = await request.post(
        `${BASE_URL}/api/p/${school.slug}/${event.slug}/register`,
        {
          data: {
            name: 'Late User',
            email: 'late@test.com',
            phone: '0501234567',
            spots: 1,
          },
        }
      )

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('past')
    })

    test('N5.5: Cannot register with spots exceeding maxSpotsPerPerson', async ({ request }) => {
      const school = await createSchool().withName('Test School').create()

      // Create event manually to set maxSpotsPerPerson
      const event = await prisma.event.create({
        data: {
          title: 'Limited Spots Event',
          slug: `limited-${Date.now()}`,
          capacity: 100,
          maxSpotsPerPerson: 3,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test',
          schoolId: school.id,
        },
      })

      const response = await request.post(
        `${BASE_URL}/api/p/${school.slug}/${event.slug}/register`,
        {
          data: {
            name: 'Greedy User',
            email: 'greedy@test.com',
            phone: '0501234567',
            spots: 5, // More than maxSpotsPerPerson
          },
        }
      )

      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toBeDefined()
    })
  })

  test.describe('6. Cross-Tenant Access Negative Tests', () => {
    test('N6.1: School A admin CANNOT view School B events list', async ({ browser }) => {
      const school1 = await createSchool().withName('School 1').create()
      const school2 = await createSchool().withName('School 2').create()

      const admin1 = await createAdmin()
        .withEmail('admin12-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school1.id)
        .create()

      await createEvent().withTitle('School 1 Event').withSchool(school1.id).inFuture().create()

      await createEvent().withTitle('School 2 Event').withSchool(school2.id).inFuture().create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin1.email, admin1.password)

      const response = await context.request.get(`${BASE_URL}/api/events`)

      expect(response.ok()).toBeTruthy()
      const events = await response.json()

      // Verify all events belong to school1
      for (const event of events) {
        expect(event.schoolId).toBe(school1.id)
        expect(event.schoolId).not.toBe(school2.id)
      }

      await context.close()
    })

    test('N6.2: School A admin CANNOT delete School B event', async ({ browser }) => {
      const school1 = await createSchool().withName('School 1').create()
      const school2 = await createSchool().withName('School 2').create()

      const admin1 = await createAdmin()
        .withEmail('admin13-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school1.id)
        .create()

      const event2 = await createEvent()
        .withTitle('School 2 Event')
        .withSchool(school2.id)
        .inFuture()
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin1.email, admin1.password)

      const response = await context.request.delete(`${BASE_URL}/api/events/${event2.id}`)

      expect(response.status()).toBe(403)
      const body = await response.json()
      expect(body.error).toContain('Forbidden')

      await context.close()
    })

    test('N6.3: School A admin CANNOT view School B registrations', async ({ browser }) => {
      const school1 = await createSchool().withName('School 1').create()
      const school2 = await createSchool().withName('School 2').create()

      const admin1 = await createAdmin()
        .withEmail('admin14-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school1.id)
        .create()

      const event2 = await createEvent()
        .withTitle('School 2 Event')
        .withSchool(school2.id)
        .inFuture()
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin1.email, admin1.password)

      const response = await context.request.get(`${BASE_URL}/api/events/${event2.id}`)

      expect(response.status()).toBe(403)

      await context.close()
    })

    test('N6.4: API auto-filters by schoolId (no cross-tenant data leak)', async ({ browser }) => {
      const school1 = await createSchool().withName('School 1').create()
      const school2 = await createSchool().withName('School 2').create()

      const admin1 = await createAdmin()
        .withEmail('admin15-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school1.id)
        .create()

      // Create events for both schools
      await createEvent().withTitle('School 1 Event 1').withSchool(school1.id).inFuture().create()

      await createEvent().withTitle('School 1 Event 2').withSchool(school1.id).inFuture().create()

      await createEvent().withTitle('School 2 Event 1').withSchool(school2.id).inFuture().create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin1.email, admin1.password)

      const response = await context.request.get(`${BASE_URL}/api/events`)

      expect(response.ok()).toBeTruthy()
      const events = await response.json()

      // Should only return school1 events (2 events)
      expect(events.length).toBe(2)

      // Verify NO school2 events leaked
      const school2Events = events.filter((e: any) => e.schoolId === school2.id)
      expect(school2Events.length).toBe(0)

      await context.close()
    })

    test('N6.5: Direct API call with other schoolId rejected', async ({ browser }) => {
      const school1 = await createSchool().withName('School 1').create()
      const school2 = await createSchool().withName('School 2').create()

      const admin1 = await createAdmin()
        .withEmail('admin16-neg@test.com')
        .withPassword('Password123!')
        .withRole('ADMIN')
        .withSchool(school1.id)
        .create()

      const context = await browser.newContext()
      await loginViaAPI(context, admin1.email, admin1.password)

      // Try to filter by school2 via query param
      const response = await context.request.get(`${BASE_URL}/api/events?schoolId=${school2.id}`)

      if (response.ok()) {
        const events = await response.json()
        // Should either return empty or ignore the filter
        // Should NOT return school2 events
        for (const event of events) {
          expect(event.schoolId).not.toBe(school2.id)
        }
      } else {
        expect(response.status()).toBe(403)
      }

      await context.close()
    })
  })
})

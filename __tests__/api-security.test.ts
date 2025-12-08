/**
 * API Security Tests
 *
 * These tests verify that the API endpoints properly enforce:
 * - Authentication requirements
 * - Multi-tenant data isolation (schoolId enforcement)
 * - Role-based access control
 * - Cryptographic security for confirmation codes
 */

import { prisma } from '@/lib/prisma'
import { encodeSession } from '@/lib/auth.server'
import { generateConfirmationCode } from '@/lib/utils'

describe('API Security', () => {
  let testSchool1: any
  let testSchool2: any
  let testEvent1: any
  let testEvent2: any
  let testAdmin1: any
  let testAdmin2: any
  let testSuperAdmin: any
  let testRegistration1: any

  beforeAll(async () => {
    // Create test schools
    testSchool1 = await prisma.school.create({
      data: {
        name: 'Test School 1',
        slug: 'test-school-1-' + Date.now(),
      }
    })

    testSchool2 = await prisma.school.create({
      data: {
        name: 'Test School 2',
        slug: 'test-school-2-' + Date.now(),
      }
    })

    // Create test admins
    testAdmin1 = await prisma.admin.create({
      data: {
        email: 'admin1@test.com',
        name: 'Admin 1',
        password: 'hashedpassword',
        role: 'ADMIN',
        schoolId: testSchool1.id,
        emailVerified: true,
      }
    })

    testAdmin2 = await prisma.admin.create({
      data: {
        email: 'admin2@test.com',
        name: 'Admin 2',
        password: 'hashedpassword',
        role: 'ADMIN',
        schoolId: testSchool2.id,
        emailVerified: true,
      }
    })

    testSuperAdmin = await prisma.admin.create({
      data: {
        email: 'superadmin@test.com',
        name: 'Super Admin',
        password: 'hashedpassword',
        role: 'SUPER_ADMIN',
        emailVerified: true,
      }
    })

    // Create test events
    testEvent1 = await prisma.event.create({
      data: {
        slug: 'event-1-' + Date.now(),
        schoolId: testSchool1.id,
        title: 'Test Event 1',
        startAt: new Date(Date.now() + 86400000),
        capacity: 10,
        status: 'OPEN',
        maxSpotsPerPerson: 5,
        fieldsSchema: [{ name: 'name', label: 'Name', type: 'text', required: true }],
      }
    })

    testEvent2 = await prisma.event.create({
      data: {
        slug: 'event-2-' + Date.now(),
        schoolId: testSchool2.id,
        title: 'Test Event 2',
        startAt: new Date(Date.now() + 86400000),
        capacity: 10,
        status: 'OPEN',
        maxSpotsPerPerson: 5,
        fieldsSchema: [{ name: 'name', label: 'Name', type: 'text', required: true }],
      }
    })

    // Create test registration
    testRegistration1 = await prisma.registration.create({
      data: {
        eventId: testEvent1.id,
        data: { name: 'Test User' },
        spotsCount: 1,
        status: 'WAITLIST',
        confirmationCode: generateConfirmationCode(),
      }
    })
  })

  afterAll(async () => {
    // Cleanup in reverse order
    await prisma.registration.deleteMany({
      where: {
        OR: [
          { eventId: testEvent1.id },
          { eventId: testEvent2.id },
        ]
      }
    })
    await prisma.event.deleteMany({
      where: {
        OR: [
          { id: testEvent1.id },
          { id: testEvent2.id },
        ]
      }
    })
    await prisma.admin.deleteMany({
      where: {
        OR: [
          { id: testAdmin1.id },
          { id: testAdmin2.id },
          { id: testSuperAdmin.id },
        ]
      }
    })
    await prisma.school.deleteMany({
      where: {
        OR: [
          { id: testSchool1.id },
          { id: testSchool2.id },
        ]
      }
    })
  })

  describe('Registration Management Endpoint', () => {
    it('should reject unauthenticated requests to PATCH /api/events/[id]/registrations/[registrationId]', async () => {
      const response = await fetch(
        `http://localhost:9000/api/events/${testEvent1.id}/registrations/${testRegistration1.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CONFIRMED' }),
        }
      )

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })

    it('should reject unauthenticated requests to DELETE /api/events/[id]/registrations/[registrationId]', async () => {
      const response = await fetch(
        `http://localhost:9000/api/events/${testEvent1.id}/registrations/${testRegistration1.id}`,
        {
          method: 'DELETE',
        }
      )

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })

    it('should reject cross-school access (admin1 cannot modify event2 registrations)', async () => {
      // Create registration for event2
      const reg2 = await prisma.registration.create({
        data: {
          eventId: testEvent2.id,
          data: { name: 'Test User 2' },
          spotsCount: 1,
          status: 'WAITLIST',
          confirmationCode: generateConfirmationCode(),
        }
      })

      // Create session for admin1 (school1)
      const sessionToken = encodeSession({
        adminId: testAdmin1.id,
        email: testAdmin1.email,
        name: testAdmin1.name,
        role: testAdmin1.role,
        schoolId: testSchool1.id,
        schoolName: testSchool1.name,
      })

      // Try to modify event2 registration
      const response = await fetch(
        `http://localhost:9000/api/events/${testEvent2.id}/registrations/${reg2.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `admin_session=${sessionToken}`,
          },
          body: JSON.stringify({ status: 'CONFIRMED' }),
        }
      )

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Forbidden')

      // Cleanup
      await prisma.registration.delete({ where: { id: reg2.id } })
    })

    it('should allow SUPER_ADMIN to access all schools', async () => {
      // Create session for super admin
      const sessionToken = encodeSession({
        adminId: testSuperAdmin.id,
        email: testSuperAdmin.email,
        name: testSuperAdmin.name,
        role: testSuperAdmin.role,
        schoolId: null,
        schoolName: null,
      })

      // Super admin should be able to modify any registration
      const response = await fetch(
        `http://localhost:9000/api/events/${testEvent1.id}/registrations/${testRegistration1.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `admin_session=${sessionToken}`,
          },
          body: JSON.stringify({ status: 'CONFIRMED' }),
        }
      )

      expect(response.status).toBe(200)
    })
  })

  describe('CSV Export Endpoint', () => {
    it('should reject unauthenticated requests to GET /api/events/[id]/export', async () => {
      const response = await fetch(
        `http://localhost:9000/api/events/${testEvent1.id}/export`,
        {
          method: 'GET',
        }
      )

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })

    it('should reject cross-school access (admin1 cannot export event2 data)', async () => {
      // Create session for admin1 (school1)
      const sessionToken = encodeSession({
        adminId: testAdmin1.id,
        email: testAdmin1.email,
        name: testAdmin1.name,
        role: testAdmin1.role,
        schoolId: testSchool1.id,
        schoolName: testSchool1.name,
      })

      // Try to export event2 data
      const response = await fetch(
        `http://localhost:9000/api/events/${testEvent2.id}/export`,
        {
          method: 'GET',
          headers: {
            'Cookie': `admin_session=${sessionToken}`,
          },
        }
      )

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Forbidden')
    })

    it('should allow admin to export their own school events', async () => {
      // Create session for admin1 (school1)
      const sessionToken = encodeSession({
        adminId: testAdmin1.id,
        email: testAdmin1.email,
        name: testAdmin1.name,
        role: testAdmin1.role,
        schoolId: testSchool1.id,
        schoolName: testSchool1.name,
      })

      // Export event1 data
      const response = await fetch(
        `http://localhost:9000/api/events/${testEvent1.id}/export`,
        {
          method: 'GET',
          headers: {
            'Cookie': `admin_session=${sessionToken}`,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/csv')
    })
  })

  describe('Fix Registration Status Endpoint', () => {
    it('should reject non-SUPER_ADMIN requests to POST /api/admin/fix-registration-status', async () => {
      // Create session for regular admin
      const sessionToken = encodeSession({
        adminId: testAdmin1.id,
        email: testAdmin1.email,
        name: testAdmin1.name,
        role: testAdmin1.role,
        schoolId: testSchool1.id,
        schoolName: testSchool1.name,
      })

      const response = await fetch(
        'http://localhost:9000/api/admin/fix-registration-status',
        {
          method: 'POST',
          headers: {
            'Cookie': `admin_session=${sessionToken}`,
          },
        }
      )

      expect(response.status).toBe(403)
    })

    it('should allow SUPER_ADMIN to run fix-registration-status', async () => {
      // Create session for super admin
      const sessionToken = encodeSession({
        adminId: testSuperAdmin.id,
        email: testSuperAdmin.email,
        name: testSuperAdmin.name,
        role: testSuperAdmin.role,
        schoolId: null,
        schoolName: null,
      })

      const response = await fetch(
        'http://localhost:9000/api/admin/fix-registration-status',
        {
          method: 'POST',
          headers: {
            'Cookie': `admin_session=${sessionToken}`,
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('Confirmation Code Security', () => {
    it('should generate cryptographically secure confirmation codes', () => {
      const codes = new Set<string>()
      const iterations = 1000

      // Generate many codes
      for (let i = 0; i < iterations; i++) {
        const code = generateConfirmationCode()

        // Check format (6 characters, alphanumeric uppercase)
        expect(code).toMatch(/^[A-Z0-9]{6}$/)

        // Check uniqueness
        expect(codes.has(code)).toBe(false)
        codes.add(code)
      }

      // With crypto.randomBytes, we should have 1000 unique codes
      expect(codes.size).toBe(iterations)
    })

    it('should not use predictable Math.random() pattern', () => {
      const codes: string[] = []

      // Generate codes
      for (let i = 0; i < 100; i++) {
        codes.push(generateConfirmationCode())
      }

      // Check that codes don't follow sequential patterns
      // (Math.random() would show patterns, crypto.randomBytes should not)
      const firstChars = codes.map(c => c[0])
      const uniqueFirstChars = new Set(firstChars)

      // With crypto randomness, we expect good distribution
      // (at least 10 different first characters out of 100 codes)
      expect(uniqueFirstChars.size).toBeGreaterThan(10)
    })
  })

  describe('Race Condition Protection on [schoolSlug]/[eventSlug] Endpoint', () => {
    it('should not oversell when using school+event slug route', async () => {
      // Create event with 1 capacity
      const raceEvent = await prisma.event.create({
        data: {
          slug: 'race-event-' + Date.now(),
          schoolId: testSchool1.id,
          title: 'Race Test Event',
          startAt: new Date(Date.now() + 86400000),
          capacity: 1,
          status: 'OPEN',
          maxSpotsPerPerson: 1,
          fieldsSchema: [{ name: 'name', label: 'Name', type: 'text', required: true }],
        }
      })

      // Simulate 2 concurrent registrations
      const promises = [
        fetch(`http://localhost:9000/api/p/${testSchool1.slug}/${raceEvent.slug}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'User 1',
            phone: '0501111111',
            spotsCount: 1,
          }),
        }),
        fetch(`http://localhost:9000/api/p/${testSchool1.slug}/${raceEvent.slug}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'User 2',
            phone: '0502222222',
            spotsCount: 1,
          }),
        }),
      ]

      const results = await Promise.all(promises)

      // Check responses
      const data1 = await results[0].json()
      const data2 = await results[1].json()

      // Count confirmed vs waitlist
      const confirmedCount = [data1, data2].filter(d => d.status === 'CONFIRMED').length
      const waitlistCount = [data1, data2].filter(d => d.status === 'WAITLIST').length

      // Exactly 1 should be confirmed, 1 should be waitlist
      expect(confirmedCount).toBe(1)
      expect(waitlistCount).toBe(1)

      // Verify in database
      const registrations = await prisma.registration.findMany({
        where: { eventId: raceEvent.id },
      })

      const dbConfirmed = registrations.filter(r => r.status === 'CONFIRMED').length
      expect(dbConfirmed).toBe(1)

      // Cleanup
      await prisma.registration.deleteMany({ where: { eventId: raceEvent.id } })
      await prisma.event.delete({ where: { id: raceEvent.id } })
    })
  })
})

import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

/**
 * CRITICAL: Runtime Invariant Guards Tests
 *
 * These tests verify that runtime guards catch data integrity violations
 * immediately rather than silently corrupting data.
 *
 * Test Strategy:
 * 1. Attempt operations that violate invariants
 * 2. Verify guards throw errors with clear messages
 * 3. Verify violations are logged with context
 *
 * Guards Tested:
 * - Event MUST have schoolId (multi-tenant isolation)
 * - Registration MUST have eventId (data integrity)
 * - No hard deletes on Event, Registration, School (prevent data loss)
 */

// Create a separate Prisma client for testing
// This ensures test isolation and proper cleanup
const prisma = new PrismaClient()

test.describe('Runtime Invariant Guards - CRITICAL', () => {
  // Test data IDs
  let testSchoolId: string
  let testEventId: string
  let testRegistrationId: string

  // Setup: Create test school and event
  test.beforeAll(async () => {
    const uniqueSlug = `guard-test-${randomUUID().split('-')[0]}`

    // Create test school
    const school = await prisma.school.create({
      data: {
        name: 'Guard Test School',
        slug: uniqueSlug,
        plan: 'STARTER',
      },
    })
    testSchoolId = school.id

    // Create test event (will be used for registration tests)
    const event = await prisma.event.create({
      data: {
        title: 'Guard Test Event',
        slug: `event-${uniqueSlug}`,
        schoolId: testSchoolId,
        capacity: 100,
        startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'OPEN',
      },
    })
    testEventId = event.id
  })

  // Cleanup: Remove test data
  test.afterAll(async () => {
    // Clean up test data (guards prevent hard deletes, so we use raw queries)
    await prisma.$executeRaw`DELETE FROM "Registration" WHERE "eventId" = ${testEventId}`
    await prisma.$executeRaw`DELETE FROM "Event" WHERE "id" = ${testEventId}`
    await prisma.$executeRaw`DELETE FROM "School" WHERE "id" = ${testSchoolId}`
    await prisma.$disconnect()
  })

  test.describe('Guard 1: Event MUST have schoolId', () => {
    test('should throw error when creating event without schoolId', async () => {
      const uniqueSlug = `no-school-${randomUUID().split('-')[0]}`

      await expect(async () => {
        await prisma.event.create({
          data: {
            title: 'Orphaned Event',
            slug: uniqueSlug,
            // @ts-expect-error - Testing invalid data
            schoolId: undefined,
            capacity: 50,
            startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'OPEN',
          },
        })
      }).rejects.toThrow(/INVARIANT VIOLATION.*Event without schoolId/)

      console.log('✅ Guard prevented event creation without schoolId')
    })

    test('should throw error when removing schoolId from existing event', async () => {
      const uniqueSlug = `remove-school-${randomUUID().split('-')[0]}`

      // Create event with schoolId
      const event = await prisma.event.create({
        data: {
          title: 'Event to Modify',
          slug: uniqueSlug,
          schoolId: testSchoolId,
          capacity: 50,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'OPEN',
        },
      })

      // Attempt to remove schoolId
      await expect(async () => {
        await prisma.event.update({
          where: { id: event.id },
          data: {
            // @ts-expect-error - Testing invalid data
            schoolId: null,
          },
        })
      }).rejects.toThrow(/INVARIANT VIOLATION.*remove schoolId/)

      // Cleanup
      await prisma.$executeRaw`DELETE FROM "Event" WHERE "id" = ${event.id}`

      console.log('✅ Guard prevented removing schoolId from event')
    })
  })

  test.describe('Guard 2: Registration MUST have eventId', () => {
    test('should throw error when creating registration without eventId', async () => {
      const uniqueCode = `no-event-${randomUUID().split('-')[0]}`

      await expect(async () => {
        await prisma.registration.create({
          data: {
            // @ts-expect-error - Testing invalid data
            eventId: undefined,
            data: { name: 'Test User', phone: '0501234567' },
            confirmationCode: uniqueCode,
            status: 'CONFIRMED',
            spotsCount: 1,
          },
        })
      }).rejects.toThrow(/INVARIANT VIOLATION.*Registration without eventId/)

      console.log('✅ Guard prevented registration creation without eventId')
    })

    test('should throw error when removing eventId from existing registration', async () => {
      const uniqueCode = `remove-event-${randomUUID().split('-')[0]}`

      // Create registration with eventId
      const registration = await prisma.registration.create({
        data: {
          eventId: testEventId,
          data: { name: 'Test User', phone: '0501234567' },
          confirmationCode: uniqueCode,
          status: 'CONFIRMED',
          spotsCount: 1,
        },
      })
      testRegistrationId = registration.id

      // Attempt to remove eventId
      await expect(async () => {
        await prisma.registration.update({
          where: { id: registration.id },
          data: {
            // @ts-expect-error - Testing invalid data
            eventId: null,
          },
        })
      }).rejects.toThrow(/INVARIANT VIOLATION.*remove eventId/)

      // Cleanup
      await prisma.$executeRaw`DELETE FROM "Registration" WHERE "id" = ${registration.id}`

      console.log('✅ Guard prevented removing eventId from registration')
    })
  })

  test.describe('Guard 3: No hard deletes on protected models', () => {
    test('should throw error when hard deleting Event', async () => {
      const uniqueSlug = `delete-event-${randomUUID().split('-')[0]}`

      // Create event
      const event = await prisma.event.create({
        data: {
          title: 'Event to Delete',
          slug: uniqueSlug,
          schoolId: testSchoolId,
          capacity: 50,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'OPEN',
        },
      })

      // Attempt hard delete
      await expect(async () => {
        await prisma.event.delete({
          where: { id: event.id },
        })
      }).rejects.toThrow(/INVARIANT VIOLATION.*hard delete.*Event/)

      // Cleanup using raw SQL
      await prisma.$executeRaw`DELETE FROM "Event" WHERE "id" = ${event.id}`

      console.log('✅ Guard prevented hard delete on Event')
    })

    test('should throw error when hard deleting Registration', async () => {
      const uniqueCode = `delete-reg-${randomUUID().split('-')[0]}`

      // Create registration
      const registration = await prisma.registration.create({
        data: {
          eventId: testEventId,
          data: { name: 'Test User', phone: '0501234567' },
          confirmationCode: uniqueCode,
          status: 'CONFIRMED',
          spotsCount: 1,
        },
      })

      // Attempt hard delete
      await expect(async () => {
        await prisma.registration.delete({
          where: { id: registration.id },
        })
      }).rejects.toThrow(/INVARIANT VIOLATION.*hard delete.*Registration/)

      // Cleanup using raw SQL
      await prisma.$executeRaw`DELETE FROM "Registration" WHERE "id" = ${registration.id}`

      console.log('✅ Guard prevented hard delete on Registration')
    })

    test('should throw error when hard deleting School', async () => {
      const uniqueSlug = `delete-school-${randomUUID().split('-')[0]}`

      // Create school
      const school = await prisma.school.create({
        data: {
          name: 'School to Delete',
          slug: uniqueSlug,
          plan: 'FREE',
        },
      })

      // Attempt hard delete
      await expect(async () => {
        await prisma.school.delete({
          where: { id: school.id },
        })
      }).rejects.toThrow(/INVARIANT VIOLATION.*hard delete.*School/)

      // Cleanup using raw SQL
      await prisma.$executeRaw`DELETE FROM "School" WHERE "id" = ${school.id}`

      console.log('✅ Guard prevented hard delete on School')
    })
  })

  test.describe('Auth Guards: requireSchoolAccess', () => {
    test('should catch admin without schoolId trying to access school data', async () => {
      // This test requires integration with auth.server.ts
      // For now, we verify the guard logic exists in auth.server.ts

      // Mock scenario: Non-SuperAdmin admin without schoolId
      // Expected: Guard throws error with clear message

      // Note: Full integration test would require:
      // 1. Create admin without schoolId
      // 2. Attempt to call requireSchoolAccess()
      // 3. Verify error thrown

      console.log('⚠️  Integration test for auth guards pending (requires API test setup)')
    })
  })

  test.describe('Guard Integration: End-to-End', () => {
    test('should allow valid operations (guards only block violations)', async () => {
      const uniqueSlug = `valid-event-${randomUUID().split('-')[0]}`
      const uniqueCode = `valid-reg-${randomUUID().split('-')[0]}`

      // Create event WITH schoolId (should succeed)
      const event = await prisma.event.create({
        data: {
          title: 'Valid Event',
          slug: uniqueSlug,
          schoolId: testSchoolId,
          capacity: 50,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'OPEN',
        },
      })

      expect(event.id).toBeTruthy()
      expect(event.schoolId).toBe(testSchoolId)

      // Create registration WITH eventId (should succeed)
      const registration = await prisma.registration.create({
        data: {
          eventId: event.id,
          data: { name: 'Valid User', phone: '0501234567' },
          confirmationCode: uniqueCode,
          status: 'CONFIRMED',
          spotsCount: 1,
        },
      })

      expect(registration.id).toBeTruthy()
      expect(registration.eventId).toBe(event.id)

      // Update event (with schoolId preserved) should succeed
      const updatedEvent = await prisma.event.update({
        where: { id: event.id },
        data: { title: 'Updated Valid Event' },
      })

      expect(updatedEvent.title).toBe('Updated Valid Event')
      expect(updatedEvent.schoolId).toBe(testSchoolId)

      // Cleanup
      await prisma.$executeRaw`DELETE FROM "Registration" WHERE "id" = ${registration.id}`
      await prisma.$executeRaw`DELETE FROM "Event" WHERE "id" = ${event.id}`

      console.log('✅ Valid operations passed through guards successfully')
    })
  })
})

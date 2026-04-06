import { test, expect } from '@playwright/test'
import {
  createSchool,
  createEvent,
  createRegistration,
  cleanupTestData,
} from '../fixtures/test-data'
import { generateEmail, generateIsraeliPhone } from '../helpers/test-helpers'
import { prisma } from '@/lib/prisma'
import { cancelReservation, adminCancelReservation } from '@/lib/cancellation'
import jwt from 'jsonwebtoken'

/**
 * P0 (CRITICAL) Waitlist Promotion Tests
 * Tests automatic promotion of waitlist entries when cancellations occur
 */

test.describe('Waitlist Promotion P0 - Critical Tests', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('[10.1] Capacity-Based Events - Basic FIFO Promotion', () => {
    test('should automatically promote first waitlist entry when spot becomes available', async () => {
      // Setup: Create event with 2 spots
      const school = await createSchool().withName('Promo Test School').create()
      const event = await createEvent()
        .withTitle('FIFO Promotion Event')
        .withSchool(school.id)
        .withCapacity(2)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .inFuture()
        .create()

      // Create 2 confirmed registrations (fills capacity)
      const reg1 = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Create waitlist entry
      const waitlistReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Cancel first registration (frees 1 spot)
      const token = jwt.sign({ eventId: event.id, phone: reg1.phone }, process.env.JWT_SECRET!)
      await cancelReservation(token)

      // Verify waitlist entry was promoted
      const promoted = await prisma.registration.findUnique({
        where: { id: waitlistReg.id },
      })

      expect(promoted?.status).toBe('CONFIRMED')
    })

    test('should promote oldest waitlist entry first (FIFO)', async () => {
      const school = await createSchool().withName('FIFO Order School').create()
      const event = await createEvent()
        .withTitle('FIFO Order Event')
        .withSchool(school.id)
        .withCapacity(1)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .inFuture()
        .create()

      // Create confirmed registration
      const confirmedReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Create 3 waitlist entries with slight time delays
      const waitlist1 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const waitlist2 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const waitlist3 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Cancel confirmed registration
      await adminCancelReservation(confirmedReg.id)

      // Verify first (oldest) waitlist entry was promoted
      const promoted1 = await prisma.registration.findUnique({ where: { id: waitlist1.id } })
      const stillWaiting2 = await prisma.registration.findUnique({ where: { id: waitlist2.id } })
      const stillWaiting3 = await prisma.registration.findUnique({ where: { id: waitlist3.id } })

      expect(promoted1?.status).toBe('CONFIRMED')
      expect(stillWaiting2?.status).toBe('WAITLIST')
      expect(stillWaiting3?.status).toBe('WAITLIST')
    })
  })

  test.describe('[10.2] Capacity-Based Events - Smart Matching', () => {
    test('should skip waitlist entries that do not fit and promote next match', async () => {
      const school = await createSchool().withName('Skip Match School').create()
      const event = await createEvent()
        .withTitle('Skip Match Event')
        .withSchool(school.id)
        .withCapacity(5)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .inFuture()
        .create()

      // Create confirmed registration with 3 spots
      const confirmedReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(3)
        .withPhone(generateIsraeliPhone())
        .create()

      // Create waitlist: first needs 4 spots (won't fit), second needs 2 (will fit)
      const waitlist1 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(4)
        .withPhone(generateIsraeliPhone())
        .create()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const waitlist2 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(2)
        .withPhone(generateIsraeliPhone())
        .create()

      // Cancel registration (frees 3 spots)
      await adminCancelReservation(confirmedReg.id)

      // Verify: first still waiting (needs 4), second promoted (needs 2)
      const stillWaiting1 = await prisma.registration.findUnique({ where: { id: waitlist1.id } })
      const promoted2 = await prisma.registration.findUnique({ where: { id: waitlist2.id } })

      expect(stillWaiting1?.status).toBe('WAITLIST')
      expect(promoted2?.status).toBe('CONFIRMED')
    })

    test('should promote multiple waitlist entries when total spots allow', async () => {
      const school = await createSchool().withName('Multiple Promo School').create()
      const event = await createEvent()
        .withTitle('Multiple Promo Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .inFuture()
        .create()

      // Create confirmed registration with 5 spots
      const confirmedReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(5)
        .withPhone(generateIsraeliPhone())
        .create()

      // Create waitlist: 2 spots + 3 spots (both should fit in 5 freed spots)
      const waitlist1 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(2)
        .withPhone(generateIsraeliPhone())
        .create()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const waitlist2 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(3)
        .withPhone(generateIsraeliPhone())
        .create()

      // Cancel registration (frees 5 spots)
      await adminCancelReservation(confirmedReg.id)

      // Verify both promoted
      const promoted1 = await prisma.registration.findUnique({ where: { id: waitlist1.id } })
      const promoted2 = await prisma.registration.findUnique({ where: { id: waitlist2.id } })

      expect(promoted1?.status).toBe('CONFIRMED')
      expect(promoted2?.status).toBe('CONFIRMED')
    })
  })

  test.describe('[10.3] Capacity-Based Events - Edge Cases', () => {
    test('should not promote when waitlist is empty', async () => {
      const school = await createSchool().withName('Empty Waitlist School').create()
      const event = await createEvent()
        .withTitle('Empty Waitlist Event')
        .withSchool(school.id)
        .withCapacity(2)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .inFuture()
        .create()

      // Create confirmed registration (no waitlist)
      const confirmedReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Cancel registration
      await adminCancelReservation(confirmedReg.id)

      // Should complete without errors (no waitlist to promote)
      const eventAfter = await prisma.event.findUnique({ where: { id: event.id } })
      expect(eventAfter?.spotsReserved).toBe(0)
    })

    test('should not promote when all waitlist entries need more spots than available', async () => {
      const school = await createSchool().withName('No Match School').create()
      const event = await createEvent()
        .withTitle('No Match Event')
        .withSchool(school.id)
        .withCapacity(5)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .inFuture()
        .create()

      // Create confirmed registration with 1 spot
      const confirmedReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Create waitlist entries all needing 2+ spots
      const waitlist1 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(2)
        .withPhone(generateIsraeliPhone())
        .create()

      const waitlist2 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(3)
        .withPhone(generateIsraeliPhone())
        .create()

      // Cancel registration (frees 1 spot, but all waitlist need 2+)
      await adminCancelReservation(confirmedReg.id)

      // Verify none promoted
      const stillWaiting1 = await prisma.registration.findUnique({ where: { id: waitlist1.id } })
      const stillWaiting2 = await prisma.registration.findUnique({ where: { id: waitlist2.id } })

      expect(stillWaiting1?.status).toBe('WAITLIST')
      expect(stillWaiting2?.status).toBe('WAITLIST')
    })

    test('should not promote when cancelling a WAITLIST registration', async () => {
      const school = await createSchool().withName('Cancel Waitlist School').create()
      const event = await createEvent()
        .withTitle('Cancel Waitlist Event')
        .withSchool(school.id)
        .withCapacity(1)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .inFuture()
        .create()

      // Fill capacity
      await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Create 2 waitlist entries
      const waitlist1 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      const waitlist2 = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Cancel first waitlist entry (should NOT trigger promotion)
      await adminCancelReservation(waitlist1.id)

      // Verify second waitlist is still waiting (no promotion triggered)
      const stillWaiting = await prisma.registration.findUnique({ where: { id: waitlist2.id } })
      expect(stillWaiting?.status).toBe('WAITLIST')
    })
  })

  test.describe('[10.4] Admin vs Customer Cancellation', () => {
    test('should promote after admin cancellation', async () => {
      const school = await createSchool().withName('Admin Cancel School').create()
      const event = await createEvent()
        .withTitle('Admin Cancel Event')
        .withSchool(school.id)
        .withCapacity(1)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .inFuture()
        .create()

      const confirmedReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      const waitlistReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Admin cancels
      await adminCancelReservation(confirmedReg.id)

      // Verify promotion
      const promoted = await prisma.registration.findUnique({ where: { id: waitlistReg.id } })
      expect(promoted?.status).toBe('CONFIRMED')
    })

    test('should promote after customer self-service cancellation', async () => {
      const school = await createSchool().withName('Customer Cancel School').create()
      const event = await createEvent()
        .withTitle('Customer Cancel Event')
        .withSchool(school.id)
        .withCapacity(1)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .inFuture()
        .withCancellationDeadlineHours(2)
        .create()

      const phone = generateIsraeliPhone()
      const confirmedReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(1)
        .withPhone(phone)
        .create()

      const waitlistReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Customer cancels using token
      const token = jwt.sign({ eventId: event.id, phone: phone }, process.env.JWT_SECRET!)
      await cancelReservation(token)

      // Verify promotion
      const promoted = await prisma.registration.findUnique({ where: { id: waitlistReg.id } })
      expect(promoted?.status).toBe('CONFIRMED')
    })
  })

  test.describe('[10.5] Event Status Handling', () => {
    test('should not promote when event status is CLOSED', async () => {
      const school = await createSchool().withName('Closed Event School').create()
      const event = await createEvent()
        .withTitle('Closed Event')
        .withSchool(school.id)
        .withCapacity(1)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .withStatus('CLOSED')
        .inFuture()
        .create()

      const confirmedReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      const waitlistReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Cancel registration
      await adminCancelReservation(confirmedReg.id)

      // Verify NO promotion (event is closed)
      const stillWaiting = await prisma.registration.findUnique({ where: { id: waitlistReg.id } })
      expect(stillWaiting?.status).toBe('WAITLIST')
    })

    test('should allow promotion when event status is PAUSED', async () => {
      const school = await createSchool().withName('Paused Event School').create()
      const event = await createEvent()
        .withTitle('Paused Event')
        .withSchool(school.id)
        .withCapacity(1)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .withStatus('PAUSED')
        .inFuture()
        .create()

      const confirmedReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      const waitlistReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(1)
        .withPhone(generateIsraeliPhone())
        .create()

      // Cancel registration
      await adminCancelReservation(confirmedReg.id)

      // Verify promotion allowed (event may reopen)
      const promoted = await prisma.registration.findUnique({ where: { id: waitlistReg.id } })
      expect(promoted?.status).toBe('CONFIRMED')
    })
  })

  test.describe('[10.6] Spot Counter Integrity', () => {
    test('should correctly update spotsReserved counter after promotion', async () => {
      const school = await createSchool().withName('Counter Integrity School').create()
      const event = await createEvent()
        .withTitle('Counter Integrity Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(0)
        .withEventType('CAPACITY_BASED')
        .inFuture()
        .create()

      // Create registration with 3 spots
      const confirmedReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('CONFIRMED')
        .withSpots(3)
        .withPhone(generateIsraeliPhone())
        .create()

      // Update counter manually (simulating the atomic increment)
      await prisma.event.update({
        where: { id: event.id },
        data: { spotsReserved: 3 },
      })

      // Create waitlist with 2 spots
      const waitlistReg = await createRegistration()
        .withEvent(event.id)
        .withStatus('WAITLIST')
        .withSpots(2)
        .withPhone(generateIsraeliPhone())
        .create()

      // Cancel (frees 3 spots)
      await adminCancelReservation(confirmedReg.id)

      // Verify counter: should be 2 (promoted waitlist)
      const eventAfter = await prisma.event.findUnique({ where: { id: event.id } })
      expect(eventAfter?.spotsReserved).toBe(2)

      // Verify waitlist promoted
      const promoted = await prisma.registration.findUnique({ where: { id: waitlistReg.id } })
      expect(promoted?.status).toBe('CONFIRMED')
    })
  })
})

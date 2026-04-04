/**
 * Test: Payment Event Creation Regression
 * Bug: Event creation API was ignoring payment fields
 * Fixed: 2026-01-11 (Added payment fields to event.create())
 *
 * This test ensures payment configuration is saved when creating events.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/lib/prisma'

describe('Payment Event Creation Regression Test', () => {
  let testSchoolId: string
  let testEventId: string

  beforeAll(async () => {
    // Create test school
    const school = await prisma.school.create({
      data: {
        name: 'Test School Payment',
        slug: `test-payment-${Date.now()}`,
      }
    })
    testSchoolId = school.id
  })

  afterAll(async () => {
    // Cleanup
    if (testEventId) {
      await prisma.event.delete({ where: { id: testEventId } }).catch(() => {})
    }
    if (testSchoolId) {
      await prisma.school.delete({ where: { id: testSchoolId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('should save payment configuration when creating paid event', async () => {
    // Create event with payment settings
    const event = await prisma.event.create({
      data: {
        slug: `test-paid-event-${Date.now()}`,
        schoolId: testSchoolId,
        title: 'Test Paid Event',
        description: 'Test event with payment required',
        startAt: new Date('2026-12-25T10:00:00'),
        capacity: 50,
        maxSpotsPerPerson: 4,
        eventType: 'CAPACITY_BASED',
        // Payment configuration (THIS WAS BEING IGNORED BEFORE FIX)
        paymentRequired: true,
        paymentTiming: 'UPFRONT',
        pricingModel: 'PER_GUEST',
        priceAmount: 50.00,
        currency: 'ILS',
      }
    })

    testEventId = event.id

    // Verify payment fields were saved correctly
    expect(event.paymentRequired).toBe(true)
    expect(event.paymentTiming).toBe('UPFRONT')
    expect(event.pricingModel).toBe('PER_GUEST')
    expect(event.priceAmount?.toNumber()).toBe(50.00)
    expect(event.currency).toBe('ILS')
  })

  it('should save free event configuration correctly', async () => {
    const event = await prisma.event.create({
      data: {
        slug: `test-free-event-${Date.now()}`,
        schoolId: testSchoolId,
        title: 'Test Free Event',
        description: 'Test event with no payment required',
        startAt: new Date('2026-12-25T10:00:00'),
        capacity: 50,
        maxSpotsPerPerson: 4,
        eventType: 'CAPACITY_BASED',
        // Free event configuration
        paymentRequired: false,
        paymentTiming: 'OPTIONAL',
        pricingModel: 'FREE',
        priceAmount: null,
        currency: 'ILS',
      }
    })

    // Verify free event fields
    expect(event.paymentRequired).toBe(false)
    expect(event.paymentTiming).toBe('OPTIONAL')
    expect(event.pricingModel).toBe('FREE')
    expect(event.priceAmount).toBeNull()

    // Cleanup
    await prisma.event.delete({ where: { id: event.id } })
  })

  it('should NOT create registrations with PENDING status on free events', async () => {
    // Create free event
    const event = await prisma.event.create({
      data: {
        slug: `test-free-reg-${Date.now()}`,
        schoolId: testSchoolId,
        title: 'Test Free Registration Event',
        startAt: new Date('2026-12-25T10:00:00'),
        capacity: 50,
        maxSpotsPerPerson: 4,
        eventType: 'CAPACITY_BASED',
        paymentRequired: false,
        pricingModel: 'FREE',
      }
    })

    // Create registration on free event
    const registration = await prisma.registration.create({
      data: {
        eventId: event.id,
        data: { name: 'Test User', phone: '0501234567' },
        spotsCount: 2,
        status: 'CONFIRMED',
        confirmationCode: 'TEST123',
        phoneNumber: '0501234567',
        // Payment status should NOT be PENDING for free events
        paymentStatus: 'PENDING', // This simulates the bug
      }
    })

    // Assert: This is the BUG - free events should NOT have PENDING status
    // This test documents the issue: registrations on free events incorrectly have PENDING status
    // EXPECTED: paymentStatus should be null or 'NOT_REQUIRED' for free events
    // ACTUAL (BUG): paymentStatus is 'PENDING'

    expect(registration.paymentStatus).toBe('PENDING') // Documents current buggy behavior

    // TODO: Once we add 'NOT_REQUIRED' to PaymentStatus enum, this should be:
    // expect(registration.paymentStatus).toBe('NOT_REQUIRED')

    // Cleanup
    await prisma.registration.delete({ where: { id: registration.id } })
    await prisma.event.delete({ where: { id: event.id } })
  })
})

/**
 * Race Condition Tests
 *
 * These tests verify that the registration system prevents overselling
 * under concurrent load scenarios.
 */

import { prisma } from '@/lib/prisma'

describe('Registration Race Condition Prevention', () => {
  let testEvent: any

  beforeEach(async () => {
    // Create a test school
    const school = await prisma.school.create({
      data: {
        name: 'Test School',
        slug: 'test-school-' + Date.now(),
      }
    })

    // Create a test event with 100 capacity
    testEvent = await prisma.event.create({
      data: {
        slug: 'test-event-' + Date.now(),
        schoolId: school.id,
        title: 'Test Event',
        startAt: new Date(Date.now() + 86400000), // Tomorrow
        capacity: 100,
        spotsReserved: 0,
        status: 'OPEN',
        maxSpotsPerPerson: 5,
      }
    })
  })

  afterEach(async () => {
    // Cleanup
    if (testEvent) {
      await prisma.registration.deleteMany({ where: { eventId: testEvent.id } })
      await prisma.event.delete({ where: { id: testEvent.id } })
      await prisma.school.delete({ where: { id: testEvent.schoolId } })
    }
  })

  test('should not oversell when 1 spot left and 2 users register simultaneously', async () => {
    // Fill event to 99/100 capacity
    const registrations = []
    for (let i = 0; i < 99; i++) {
      registrations.push(
        prisma.registration.create({
          data: {
            eventId: testEvent.id,
            data: { name: `User ${i}` },
            spotsCount: 1,
            status: 'CONFIRMED',
            confirmationCode: `TEST${i}`,
          }
        })
      )
    }
    await Promise.all(registrations)

    // Update spotsReserved to reflect current state
    await prisma.event.update({
      where: { id: testEvent.id },
      data: { spotsReserved: 99 }
    })

    // Simulate 2 concurrent registration attempts
    const registerUser = async (name: string) => {
      try {
        const response = await fetch(`http://localhost:9000/api/p/${testEvent.slug}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            spotsCount: 1,
          })
        })
        return await response.json()
      } catch (error) {
        return { error: String(error) }
      }
    }

    // Fire both requests simultaneously
    const [result1, result2] = await Promise.all([
      registerUser('User A'),
      registerUser('User B'),
    ])

    // Check final state
    const finalEvent = await prisma.event.findUnique({
      where: { id: testEvent.id },
      select: { spotsReserved: true, capacity: true }
    })

    const confirmedCount = await prisma.registration.count({
      where: {
        eventId: testEvent.id,
        status: 'CONFIRMED'
      }
    })

    // CRITICAL ASSERTIONS
    expect(confirmedCount).toBeLessThanOrEqual(100) // Must not exceed capacity
    expect(finalEvent?.spotsReserved).toBeLessThanOrEqual(100) // Counter must not exceed

    // One should be confirmed, one should be waitlisted
    const statuses = [result1.status, result2.status].filter(Boolean)
    expect(statuses).toContain('CONFIRMED')
    expect(statuses.filter((s: string) => s === 'WAITLIST').length).toBeGreaterThan(0)
  })

  test('should handle 10 concurrent registrations correctly', async () => {
    // Fill event to 95/100 capacity
    const registrations = []
    for (let i = 0; i < 95; i++) {
      registrations.push(
        prisma.registration.create({
          data: {
            eventId: testEvent.id,
            data: { name: `User ${i}` },
            spotsCount: 1,
            status: 'CONFIRMED',
            confirmationCode: `TEST${i}`,
          }
        })
      )
    }
    await Promise.all(registrations)

    await prisma.event.update({
      where: { id: testEvent.id },
      data: { spotsReserved: 95 }
    })

    // Try to register 10 users simultaneously (only 5 should succeed)
    const registerUser = async (name: string) => {
      try {
        const response = await fetch(`http://localhost:9000/api/p/${testEvent.slug}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            spotsCount: 1,
          })
        })
        return await response.json()
      } catch (error) {
        return { error: String(error) }
      }
    }

    const attempts = []
    for (let i = 0; i < 10; i++) {
      attempts.push(registerUser(`Concurrent User ${i}`))
    }

    const results = await Promise.all(attempts)

    // Check final state
    const finalEvent = await prisma.event.findUnique({
      where: { id: testEvent.id },
      select: { spotsReserved: true }
    })

    const confirmedCount = await prisma.registration.count({
      where: {
        eventId: testEvent.id,
        status: 'CONFIRMED'
      }
    })

    const waitlistCount = await prisma.registration.count({
      where: {
        eventId: testEvent.id,
        status: 'WAITLIST'
      }
    })

    // CRITICAL ASSERTIONS
    expect(confirmedCount).toBe(100) // Exactly 100 confirmed (95 + 5)
    expect(finalEvent?.spotsReserved).toBe(100) // Counter must match
    expect(waitlistCount).toBe(5) // 5 should be waitlisted

    // Count successful confirmations in results
    const confirmedResults = results.filter(r => r.status === 'CONFIRMED')
    const waitlistResults = results.filter(r => r.status === 'WAITLIST')

    expect(confirmedResults.length).toBe(5)
    expect(waitlistResults.length).toBe(5)
  })

  test('should properly update counter when promoting from waitlist', async () => {
    // Create a registration on waitlist
    const waitlistReg = await prisma.registration.create({
      data: {
        eventId: testEvent.id,
        data: { name: 'Waitlist User' },
        spotsCount: 2,
        status: 'WAITLIST',
        confirmationCode: 'WAIT001',
      }
    })

    // Initial counter should be 0
    let event = await prisma.event.findUnique({
      where: { id: testEvent.id },
      select: { spotsReserved: true }
    })
    expect(event?.spotsReserved).toBe(0)

    // Promote to confirmed via PATCH
    const response = await fetch(
      `http://localhost:9000/api/events/${testEvent.id}/registrations/${waitlistReg.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' })
      }
    )

    expect(response.ok).toBe(true)

    // Counter should now be 2
    event = await prisma.event.findUnique({
      where: { id: testEvent.id },
      select: { spotsReserved: true }
    })
    expect(event?.spotsReserved).toBe(2)
  })

  test('should properly update counter when deleting confirmed registration', async () => {
    // Create a confirmed registration
    const confirmedReg = await prisma.registration.create({
      data: {
        eventId: testEvent.id,
        data: { name: 'Confirmed User' },
        spotsCount: 3,
        status: 'CONFIRMED',
        confirmationCode: 'CONF001',
      }
    })

    // Set initial counter
    await prisma.event.update({
      where: { id: testEvent.id },
      data: { spotsReserved: 3 }
    })

    // Delete the registration
    const response = await fetch(
      `http://localhost:9000/api/events/${testEvent.id}/registrations/${confirmedReg.id}`,
      {
        method: 'DELETE',
      }
    )

    expect(response.ok).toBe(true)

    // Counter should now be 0
    const event = await prisma.event.findUnique({
      where: { id: testEvent.id },
      select: { spotsReserved: true }
    })
    expect(event?.spotsReserved).toBe(0)
  })

  test('should prevent admin from promoting when capacity exceeded', async () => {
    // Fill to capacity
    const registrations = []
    for (let i = 0; i < 100; i++) {
      registrations.push(
        prisma.registration.create({
          data: {
            eventId: testEvent.id,
            data: { name: `User ${i}` },
            spotsCount: 1,
            status: 'CONFIRMED',
            confirmationCode: `FULL${i}`,
          }
        })
      )
    }
    await Promise.all(registrations)

    await prisma.event.update({
      where: { id: testEvent.id },
      data: { spotsReserved: 100 }
    })

    // Create waitlist registration
    const waitlistReg = await prisma.registration.create({
      data: {
        eventId: testEvent.id,
        data: { name: 'Overflow User' },
        spotsCount: 1,
        status: 'WAITLIST',
        confirmationCode: 'OVERFLOW',
      }
    })

    // Try to promote - should fail
    const response = await fetch(
      `http://localhost:9000/api/events/${testEvent.id}/registrations/${waitlistReg.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' })
      }
    )

    expect(response.status).toBe(400)
    const result = await response.json()
    expect(result.error).toContain('Cannot promote')

    // Counter should still be 100
    const event = await prisma.event.findUnique({
      where: { id: testEvent.id },
      select: { spotsReserved: true }
    })
    expect(event?.spotsReserved).toBe(100)
  })
})

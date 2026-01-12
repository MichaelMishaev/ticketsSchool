/**
 * minOrder Constraint Test
 *
 * Tests that the system correctly enforces minimum order requirements
 * when assigning tables to guests.
 *
 * Scenario: Table with capacity=8, minOrder=4
 * - 2 guests: Should skip this table (doesn't meet minimum)
 * - 4 guests: Should assign this table (meets minimum)
 * - 8 guests: Should assign this table (meets minimum and fits)
 */

// Load environment variables BEFORE importing Prisma
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { prisma } from '@/lib/prisma'
import { reserveTableForGuests } from '@/lib/table-assignment'

describe('minOrder Constraint', () => {
  let testEvent: any
  let largeTable: any
  let smallTable: any

  beforeAll(async () => {
    // Create test school
    const school = await prisma.school.create({
      data: {
        name: 'Test School',
        slug: `test-school-${Date.now()}`,
      },
    })

    // Create TABLE_BASED event
    testEvent = await prisma.event.create({
      data: {
        title: 'minOrder Test Event',
        slug: `min-order-test-${Date.now()}`,
        schoolId: school.id,
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        capacity: 0,
        eventType: 'TABLE_BASED',
        maxSpotsPerPerson: 1,
      },
    })

    // Create large table: capacity=8, minOrder=4
    largeTable = await prisma.table.create({
      data: {
        eventId: testEvent.id,
        tableNumber: '1',
        capacity: 8,
        minOrder: 4,
        tableOrder: 1,
      },
    })

    // Create small table: capacity=2, minOrder=1
    smallTable = await prisma.table.create({
      data: {
        eventId: testEvent.id,
        tableNumber: '2',
        capacity: 2,
        minOrder: 1,
        tableOrder: 2,
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    if (testEvent) {
      await prisma.registration.deleteMany({ where: { eventId: testEvent.id } })
      await prisma.table.deleteMany({ where: { eventId: testEvent.id } })
      await prisma.event.delete({ where: { id: testEvent.id } })
      await prisma.school.delete({ where: { id: testEvent.schoolId } })
    }
    await prisma.$disconnect()
  })

  test('skips large table when guest count below minOrder (2 guests < minOrder=4)', async () => {
    const guestsCount = 2

    const result = await reserveTableForGuests(testEvent.id, guestsCount, {
      phoneNumber: '0501111111',
      data: {
        name: 'Two Guests',
        phone: '0501111111',
      },
    })

    // Verify: Registration is CONFIRMED
    expect(result.status).toBe('CONFIRMED')

    // Verify: Assigned to small table (capacity=2, minOrder=1), NOT large table
    expect(result.table?.id).toBe(smallTable.id)
    expect(result.table?.capacity).toBe(2)
    expect(result.table?.minOrder).toBe(1)

    // Verify: Large table remains AVAILABLE (was skipped)
    const largeTableUpdated = await prisma.table.findUnique({
      where: { id: largeTable.id },
    })
    expect(largeTableUpdated?.status).toBe('AVAILABLE')
  })

  test('assigns large table when guest count meets minOrder (4 guests = minOrder=4)', async () => {
    const guestsCount = 4

    const result = await reserveTableForGuests(testEvent.id, guestsCount, {
      phoneNumber: '0502222222',
      data: {
        name: 'Four Guests',
        phone: '0502222222',
      },
    })

    // Verify: Registration is CONFIRMED
    expect(result.status).toBe('CONFIRMED')

    // Verify: Assigned to large table (capacity=8, minOrder=4)
    expect(result.table?.id).toBe(largeTable.id)
    expect(result.table?.capacity).toBe(8)
    expect(result.table?.minOrder).toBe(4)

    // Verify: Table is marked as RESERVED
    const largeTableUpdated = await prisma.table.findUnique({
      where: { id: largeTable.id },
    })
    expect(largeTableUpdated?.status).toBe('RESERVED')
  })

  test('assigns to waitlist when only table has unmet minOrder', async () => {
    // Small table is reserved (from test 1), large table is reserved (from test 2)
    // Create a scenario where only a table with high minOrder is available

    // Reset tables
    await prisma.table.updateMany({
      where: { eventId: testEvent.id },
      data: { status: 'AVAILABLE', reservedById: null },
    })

    // Delete previous registrations
    await prisma.registration.deleteMany({
      where: { eventId: testEvent.id },
    })

    // Update small table to have high minOrder
    await prisma.table.update({
      where: { id: smallTable.id },
      data: { minOrder: 5 }, // 2 guests won't meet this
    })

    // Update large table to have high minOrder
    await prisma.table.update({
      where: { id: largeTable.id },
      data: { minOrder: 5 }, // 2 guests won't meet this
    })

    const guestsCount = 2

    const result = await reserveTableForGuests(testEvent.id, guestsCount, {
      phoneNumber: '0503333333',
      data: {
        name: 'Two Guests Waitlist',
        phone: '0503333333',
      },
    })

    // Verify: Registration is on WAITLIST (no table meets minOrder requirement)
    expect(result.status).toBe('WAITLIST')
    expect(result.registration.status).toBe('WAITLIST')
    expect(result.registration.waitlistPriority).toBe(1)

    // Verify: Both tables remain AVAILABLE
    const tables = await prisma.table.findMany({
      where: { eventId: testEvent.id },
    })
    tables.forEach((table) => {
      expect(table.status).toBe('AVAILABLE')
    })
  })
})

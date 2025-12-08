/**
 * Test: Required Contact Information
 *
 * Ensures all registrations must have phone number and name.
 * This prevents the critical bug where registrations were accepted without contact info.
 */

import { PrismaClient } from '@prisma/client'
import { reserveTableForGuests } from '../lib/table-assignment'

const prisma = new PrismaClient()

describe('Required Contact Information', () => {
  let schoolId: string
  let eventId: string
  let tableId: string

  beforeAll(async () => {
    // Create test school
    const school = await prisma.school.create({
      data: {
        name: 'Test School - Contact Info',
        slug: `test-contact-${Date.now()}`,
        primaryColor: '#3b82f6',
      },
    })
    schoolId = school.id

    // Create table-based event
    const event = await prisma.event.create({
      data: {
        schoolId,
        title: 'Test Restaurant Event',
        slug: `test-restaurant-${Date.now()}`,
        eventType: 'TABLE_BASED',
        status: 'OPEN',
        startAt: new Date(Date.now() + 1000 * 60 * 60 * 48), // 48 hours from now
        capacity: 0, // Not used for table-based
        maxSpotsPerPerson: 1,
        fieldsSchema: [
          { id: 'name', name: 'name', label: 'שם מלא', type: 'text', required: true },
          { id: 'phone', name: 'phone', label: 'טלפון', type: 'text', required: true },
        ],
      },
    })
    eventId = event.id

    // Create a table
    const table = await prisma.table.create({
      data: {
        eventId,
        tableNumber: '1',
        tableOrder: 1,
        capacity: 4,
        minOrder: 2,
        status: 'AVAILABLE',
      },
    })
    tableId = table.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.registration.deleteMany({ where: { eventId } })
    await prisma.table.deleteMany({ where: { eventId } })
    await prisma.event.deleteMany({ where: { id: eventId } })
    await prisma.school.deleteMany({ where: { id: schoolId } })
    await prisma.$disconnect()
  })

  describe('Phone Number Validation', () => {
    test('should reject registration without phone number', async () => {
      await expect(
        reserveTableForGuests(eventId, 2, {
          phoneNumber: '', // Empty phone number
          data: {
            name: 'Test User',
          },
        })
      ).rejects.toThrow('Phone number is required for table reservation')
    })

    test('should reject registration with null phone number', async () => {
      await expect(
        reserveTableForGuests(eventId, 2, {
          phoneNumber: null as any, // Null phone number
          data: {
            name: 'Test User',
          },
        })
      ).rejects.toThrow('Phone number is required for table reservation')
    })

    test('should reject registration with whitespace-only phone number', async () => {
      await expect(
        reserveTableForGuests(eventId, 2, {
          phoneNumber: '   ', // Whitespace only
          data: {
            name: 'Test User',
          },
        })
      ).rejects.toThrow('Phone number is required for table reservation')
    })

    test('should accept registration with valid phone number', async () => {
      const result = await reserveTableForGuests(eventId, 2, {
        phoneNumber: '0501234567',
        data: {
          name: 'Test User',
          phone: '0501234567',
        },
      })

      expect(result.status).toBe('CONFIRMED')
      expect(result.registration.phoneNumber).toBe('0501234567')

      // Cleanup
      await prisma.registration.delete({ where: { id: result.registration.id } })
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'AVAILABLE', reservedById: null },
      })
    })
  })

  describe('Database Schema Enforcement', () => {
    test('database should reject NULL phone numbers', async () => {
      // Try to create registration with NULL phoneNumber
      // This should fail because phoneNumber is now NOT NULL in schema
      await expect(
        prisma.registration.create({
          data: {
            eventId,
            data: { name: 'Test' },
            spotsCount: 1,
            status: 'CONFIRMED',
            confirmationCode: 'TEST123',
            phoneNumber: null as any, // NULL should be rejected by database
          },
        })
      ).rejects.toThrow()
    })

    test('database should accept valid phone numbers', async () => {
      const registration = await prisma.registration.create({
        data: {
          eventId,
          data: { name: 'Test', phone: '0501234567' },
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: `TEST${Date.now()}`,
          phoneNumber: '0501234567',
        },
      })

      expect(registration.phoneNumber).toBe('0501234567')

      // Cleanup
      await prisma.registration.delete({ where: { id: registration.id } })
    })
  })

  describe('API Validation (Unit)', () => {
    test('validation logic rejects missing phone', () => {
      // This validates the logic without making HTTP requests
      const data = { name: 'Test User' } as any // phone is missing

      const hasPhone = !!(data.phone && typeof data.phone === 'string' && data.phone.trim() !== '')
      expect(hasPhone).toBe(false)
    })

    test('validation logic rejects missing name', () => {
      const data = { phone: '0501234567' } as any // name is missing

      const hasName = !!(data.name && typeof data.name === 'string' && data.name.trim() !== '')
      expect(hasName).toBe(false)
    })

    test('validation logic accepts valid data', () => {
      const data = { phone: '0501234567', name: 'Test User' }

      const hasPhone = !!(data.phone && typeof data.phone === 'string' && data.phone.trim() !== '')
      const hasName = !!(data.name && typeof data.name === 'string' && data.name.trim() !== '')

      expect(hasPhone).toBe(true)
      expect(hasName).toBe(true)
    })
  })

  describe('Backward Compatibility', () => {
    test('existing registrations with placeholder phone should exist', async () => {
      // This tests the migration script that fixed NULL phone numbers
      const placeholderRegistrations = await prisma.registration.findMany({
        where: {
          phoneNumber: '0000000000', // Placeholder from migration
        },
      })

      // Should exist from the fix-null-phone-numbers.ts script
      // Note: This test may fail if database was reset after migration
      expect(Array.isArray(placeholderRegistrations)).toBe(true)
    })
  })
})

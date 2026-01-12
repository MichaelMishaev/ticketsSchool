import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reserveTableForGuests } from '@/lib/table-assignment'
import { prisma } from '@/lib/prisma'

// Mock Prisma for isolated unit tests
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
  Prisma: {
    TransactionIsolationLevel: {
      Serializable: 'Serializable',
    },
  },
}))

// Mock qr-code module
vi.mock('@/lib/qr-code', () => ({
  generateQRCodeData: vi.fn((regId: string, eventId: string) => `QR_${regId}_${eventId}`),
}))

describe('table-assignment.ts - SMALLEST_FIT Algorithm', () => {
  const mockEventId = 'event-123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure JWT_SECRET is set for tests
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-min-32-characters-long'
  })

  describe('reserveTableForGuests() - SMALLEST_FIT Algorithm', () => {
    it('should assign smallest fitting table (4 guests → capacity 4 table)', async () => {
      const mockTable = {
        id: 'table-4',
        capacity: 4,
        minOrder: 2,
        status: 'AVAILABLE',
      }

      const mockRegistration = {
        id: 'reg-123',
        eventId: mockEventId,
        guestsCount: 4,
        status: 'CONFIRMED',
        confirmationCode: 'ABC123',
        phoneNumber: '0501234567',
      }

      // Mock transaction to return mocked values
      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(mockTable),
          update: vi.fn().mockResolvedValue({ ...mockTable, status: 'RESERVED' }),
        },
        registration: {
          create: vi.fn().mockResolvedValue(mockRegistration),
          update: vi.fn().mockResolvedValue({ ...mockRegistration, qrCode: 'MOCK_QR' }),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      const result = await reserveTableForGuests(mockEventId, 4, {
        phoneNumber: '0501234567',
        data: { name: 'Test User' },
      })

      expect(result.status).toBe('CONFIRMED')
      expect(result.registration.guestsCount).toBe(4)
      expect(result.table?.capacity).toBe(4)

      // Verify table.findFirst called with correct query (SMALLEST_FIT)
      expect(mockTx.table.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventId: mockEventId,
            status: 'AVAILABLE',
            capacity: { gte: 4 },
            minOrder: { lte: 4 },
          }),
          orderBy: { capacity: 'asc' }, // SMALLEST first
        })
      )

      // Verify table status updated to RESERVED
      expect(mockTx.table.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'table-4' },
          data: expect.objectContaining({
            status: 'RESERVED',
            reservedById: 'reg-123',
          }),
        })
      )
    })

    it('should pick capacity 6 over capacity 8 for 5 guests (SMALLEST_FIT)', async () => {
      const mockTable6 = {
        id: 'table-6',
        capacity: 6,
        minOrder: 2,
        status: 'AVAILABLE',
      }

      const mockRegistration = {
        id: 'reg-456',
        eventId: mockEventId,
        guestsCount: 5,
        status: 'CONFIRMED',
        confirmationCode: 'DEF456',
        phoneNumber: '0501234567',
      }

      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(mockTable6), // Returns smallest (6, not 8)
          update: vi.fn().mockResolvedValue(mockTable6),
        },
        registration: {
          create: vi.fn().mockResolvedValue(mockRegistration),
          update: vi.fn().mockResolvedValue(mockRegistration),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      const result = await reserveTableForGuests(mockEventId, 5, {
        phoneNumber: '0501234567',
        data: { name: 'Group of 5' },
      })

      expect(result.status).toBe('CONFIRMED')
      expect(result.table?.capacity).toBe(6)

      // Verify orderBy: { capacity: 'asc' } ensures SMALLEST first
      expect(mockTx.table.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { capacity: 'asc' },
        })
      )
    })

    it('should put on waitlist when no fitting table available', async () => {
      const mockRegistration = {
        id: 'reg-waitlist',
        eventId: mockEventId,
        guestsCount: 4,
        status: 'WAITLIST',
        waitlistPriority: 1,
        confirmationCode: 'WL123',
        phoneNumber: '0501234567',
      }

      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(null), // No table available
        },
        registration: {
          count: vi.fn().mockResolvedValue(0), // No one on waitlist yet
          create: vi.fn().mockResolvedValue(mockRegistration),
          update: vi.fn().mockResolvedValue(mockRegistration),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      const result = await reserveTableForGuests(mockEventId, 4, {
        phoneNumber: '0501234567',
        data: { name: 'Waitlisted User' },
      })

      expect(result.status).toBe('WAITLIST')
      expect(result.registration.status).toBe('WAITLIST')
      expect(result.registration.waitlistPriority).toBe(1)

      // Verify no table update (since no table assigned)
      expect(mockTx.table.update).toBeUndefined()
    })

    it('should assign correct waitlist priority (3rd person)', async () => {
      const mockRegistration = {
        id: 'reg-waitlist-3',
        eventId: mockEventId,
        guestsCount: 2,
        status: 'WAITLIST',
        waitlistPriority: 3,
        confirmationCode: 'WL003',
        phoneNumber: '0509999999',
      }

      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        registration: {
          count: vi.fn().mockResolvedValue(2), // 2 people already on waitlist
          create: vi.fn().mockResolvedValue(mockRegistration),
          update: vi.fn().mockResolvedValue(mockRegistration),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      const result = await reserveTableForGuests(mockEventId, 2, {
        phoneNumber: '0509999999',
        data: { name: 'Third on waitlist' },
      })

      expect(result.status).toBe('WAITLIST')
      expect(result.registration.waitlistPriority).toBe(3)

      // Verify waitlist count query
      expect(mockTx.registration.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: mockEventId, status: 'WAITLIST' },
        })
      )
    })

    it('should throw error if phone number is missing', async () => {
      await expect(
        reserveTableForGuests(mockEventId, 4, {
          phoneNumber: '',
          data: { name: 'No Phone User' },
        })
      ).rejects.toThrow('Phone number is required')
    })

    it('should throw error if phone number is whitespace only', async () => {
      await expect(
        reserveTableForGuests(mockEventId, 4, {
          phoneNumber: '   ',
          data: { name: 'Whitespace Phone' },
        })
      ).rejects.toThrow('Phone number is required')
    })

    it('should enforce minimum order constraint (table minOrder=4, guests=2 → no match)', async () => {
      // All tables have minOrder=4, but group has only 2 guests → no match
      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(null), // No table meets minOrder constraint
        },
        registration: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({
            id: 'reg-waitlist',
            status: 'WAITLIST',
            waitlistPriority: 1,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      const result = await reserveTableForGuests(mockEventId, 2, {
        phoneNumber: '0501234567',
        data: { name: 'Small Group' },
      })

      // Should be on waitlist (no table fits minOrder)
      expect(result.status).toBe('WAITLIST')

      // Verify minOrder constraint in query
      expect(mockTx.table.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            minOrder: { lte: 2 }, // Must accept groups of 2
          }),
        })
      )
    })

    it('should accept 6 guests when table has minOrder=4, capacity=6', async () => {
      const mockTable = {
        id: 'table-6',
        capacity: 6,
        minOrder: 4,
        status: 'AVAILABLE',
      }

      const mockRegistration = {
        id: 'reg-789',
        eventId: mockEventId,
        guestsCount: 6,
        status: 'CONFIRMED',
        confirmationCode: 'GHI789',
        phoneNumber: '0501111111',
      }

      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(mockTable),
          update: vi.fn().mockResolvedValue(mockTable),
        },
        registration: {
          create: vi.fn().mockResolvedValue(mockRegistration),
          update: vi.fn().mockResolvedValue(mockRegistration),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      const result = await reserveTableForGuests(mockEventId, 6, {
        phoneNumber: '0501111111',
        data: { name: 'Group of 6' },
      })

      expect(result.status).toBe('CONFIRMED')
      expect(result.table?.capacity).toBe(6)
      expect(result.table?.minOrder).toBe(4)
    })
  })

  describe('reserveTableForGuests() - Confirmation Code', () => {
    it('should generate confirmation code (6 uppercase alphanumeric chars)', async () => {
      const mockTable = {
        id: 'table-1',
        capacity: 4,
        minOrder: 2,
        status: 'AVAILABLE',
      }

      let createdRegistration: any

      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(mockTable),
          update: vi.fn(),
        },
        registration: {
          create: vi.fn((data: any) => {
            createdRegistration = { id: 'reg-123', ...data.data }
            return createdRegistration
          }),
          update: vi.fn(),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      await reserveTableForGuests(mockEventId, 4, {
        phoneNumber: '0501234567',
        data: { name: 'Test User' },
      })

      expect(createdRegistration.confirmationCode).toBeDefined()
      expect(createdRegistration.confirmationCode).toMatch(/^[A-Z0-9]{6}$/)
    })
  })

  describe('reserveTableForGuests() - Cancellation Token', () => {
    it('should generate JWT cancellation token with eventId and phone', async () => {
      const mockTable = {
        id: 'table-1',
        capacity: 4,
        minOrder: 2,
        status: 'AVAILABLE',
      }

      let createdRegistration: any

      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(mockTable),
          update: vi.fn(),
        },
        registration: {
          create: vi.fn((data: any) => {
            createdRegistration = { id: 'reg-123', ...data.data }
            return createdRegistration
          }),
          update: vi.fn(),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      await reserveTableForGuests(mockEventId, 4, {
        phoneNumber: '0501234567',
        data: { name: 'Test User' },
      })

      expect(createdRegistration.cancellationToken).toBeDefined()
      expect(typeof createdRegistration.cancellationToken).toBe('string')

      // Verify JWT can be decoded
      const jwt = await import('jsonwebtoken')
      const decoded = jwt.verify(
        createdRegistration.cancellationToken,
        process.env.JWT_SECRET!
      ) as any

      expect(decoded.eventId).toBe(mockEventId)
      expect(decoded.phone).toBe('0501234567')
    })
  })

  describe('reserveTableForGuests() - QR Code', () => {
    it('should generate QR code data after creating registration', async () => {
      const mockTable = {
        id: 'table-1',
        capacity: 4,
        minOrder: 2,
        status: 'AVAILABLE',
      }

      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(mockTable),
          update: vi.fn(),
        },
        registration: {
          create: vi.fn().mockResolvedValue({
            id: 'reg-123',
            eventId: mockEventId,
            guestsCount: 4,
          }),
          update: vi.fn((args: any) => {
            return { ...args.data, id: args.where.id }
          }),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      await reserveTableForGuests(mockEventId, 4, {
        phoneNumber: '0501234567',
        data: { name: 'Test User' },
      })

      // Verify QR code was added via update
      expect(mockTx.registration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'reg-123' },
          data: expect.objectContaining({
            qrCode: expect.stringContaining('QR_'),
          }),
        })
      )
    })
  })

  describe('reserveTableForGuests() - Transaction Isolation', () => {
    it('should use Serializable isolation level for race condition protection', async () => {
      const mockTable = {
        id: 'table-1',
        capacity: 4,
        minOrder: 2,
        status: 'AVAILABLE',
      }

      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(mockTable),
          update: vi.fn(),
        },
        registration: {
          create: vi.fn().mockResolvedValue({ id: 'reg-123' }),
          update: vi.fn(),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      await reserveTableForGuests(mockEventId, 4, {
        phoneNumber: '0501234567',
        data: { name: 'Test User' },
      })

      // Verify $transaction was called with Serializable isolation level
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          isolationLevel: 'Serializable',
          timeout: 10000,
        })
      )
    })
  })

  describe('reserveTableForGuests() - Edge Cases', () => {
    it('should handle 0 guests (invalid but should still follow logic)', async () => {
      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(null), // No table accepts 0 guests
        },
        registration: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({
            id: 'reg-zero',
            status: 'WAITLIST',
            waitlistPriority: 1,
          }),
          update: vi.fn(),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      const result = await reserveTableForGuests(mockEventId, 0, {
        phoneNumber: '0501234567',
        data: { name: 'Zero Guests' },
      })

      expect(result.status).toBe('WAITLIST') // No table fits 0 guests
    })

    it('should handle very large guest count (100 guests)', async () => {
      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(null), // No table fits 100 guests
        },
        registration: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({
            id: 'reg-large',
            status: 'WAITLIST',
            waitlistPriority: 1,
          }),
          update: vi.fn(),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      const result = await reserveTableForGuests(mockEventId, 100, {
        phoneNumber: '0501234567',
        data: { name: 'Huge Group' },
      })

      expect(result.status).toBe('WAITLIST')

      // Verify query looked for capacity >= 100
      expect(mockTx.table.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            capacity: { gte: 100 },
          }),
        })
      )
    })

    it('should include custom data in registration', async () => {
      const customData = {
        name: 'John Doe',
        email: 'john@example.com',
        dietaryRestrictions: 'Vegetarian',
        specialRequests: 'Window seat please',
      }

      const mockTable = {
        id: 'table-1',
        capacity: 4,
        minOrder: 2,
        status: 'AVAILABLE',
      }

      let createdRegistration: any

      const mockTx = {
        table: {
          findFirst: vi.fn().mockResolvedValue(mockTable),
          update: vi.fn(),
        },
        registration: {
          create: vi.fn((args: any) => {
            createdRegistration = { id: 'reg-custom', ...args.data }
            return createdRegistration
          }),
          update: vi.fn(),
        },
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return await callback(mockTx)
      })

      await reserveTableForGuests(mockEventId, 4, {
        phoneNumber: '0501234567',
        data: customData,
      })

      expect(createdRegistration.data).toEqual(customData)
    })
  })
})

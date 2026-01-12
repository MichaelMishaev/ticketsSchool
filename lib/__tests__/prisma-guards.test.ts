import { describe, it, expect, beforeEach, vi } from 'vitest'
import { registerPrismaGuards, getGuardStats } from '@/lib/prisma-guards'

describe('prisma-guards.ts - Runtime Invariant Guards', () => {
  let mockPrisma: any
  let middlewareFunction: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock Prisma with middleware support
    mockPrisma = {
      $use: vi.fn((fn) => {
        middlewareFunction = fn
      }),
    }
  })

  describe('registerPrismaGuards()', () => {
    it('should register middleware if $use is available', () => {
      registerPrismaGuards(mockPrisma)

      expect(mockPrisma.$use).toHaveBeenCalledTimes(1)
      expect(middlewareFunction).toBeDefined()
    })

    it('should skip registration if $use is not available', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const noPrisma = {}

      registerPrismaGuards(noPrisma)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Prisma middleware not available')
      )
      consoleSpy.mockRestore()
    })

    it('should log success message when guards are registered', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      registerPrismaGuards(mockPrisma)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Runtime invariant guards registered')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('Guard 1: Event MUST have schoolId', () => {
    beforeEach(() => {
      registerPrismaGuards(mockPrisma)
    })

    it('should throw error when creating Event without schoolId', async () => {
      const params = {
        model: 'Event',
        action: 'create',
        args: { data: { title: 'Test Event' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(middlewareFunction(params, next)).rejects.toThrow(
        'INVARIANT VIOLATION: Attempting to create Event without schoolId'
      )

      expect(next).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INVARIANT VIOLATION'),
        expect.any(Object)
      )
      consoleSpy.mockRestore()
    })

    it('should throw error when updating Event to remove schoolId', async () => {
      const params = {
        model: 'Event',
        action: 'update',
        args: { where: { id: '123' }, data: { schoolId: null } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(middlewareFunction(params, next)).rejects.toThrow(
        'INVARIANT VIOLATION: Attempting to remove schoolId from Event'
      )

      expect(next).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should allow upsert if update branch has data (create missing schoolId not checked)', async () => {
      // Note: Current implementation only checks the first branch (create OR update)
      // If update has data, it uses update and doesn't validate create
      const params = {
        model: 'Event',
        action: 'upsert',
        args: {
          where: { id: '123' },
          create: { title: 'Test' }, // missing schoolId but not checked
          update: { title: 'Updated' }, // update has data, so this is used
        },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should use update branch when create is falsy in upsert (OR operator)', async () => {
      // Test OR operator fallback: data = params.args.create || params.args.update
      // When create is undefined, uses update branch
      // Note: upsert actions don't trigger validation (guards only check action === 'create' or 'update')
      const params = {
        model: 'Event',
        action: 'upsert',
        args: {
          where: { id: '123' },
          // create is undefined (falsy) - will use update branch via OR operator
          update: { title: 'Updated' },
        },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      // Upsert actions don't trigger guard validation, so this succeeds
      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should allow creating Event with schoolId', async () => {
      const params = {
        model: 'Event',
        action: 'create',
        args: { data: { title: 'Test Event', schoolId: 'school-123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should allow updating Event with schoolId present', async () => {
      const params = {
        model: 'Event',
        action: 'update',
        args: { where: { id: '123' }, data: { title: 'Updated', schoolId: 'school-456' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should allow updating Event without touching schoolId field', async () => {
      const params = {
        model: 'Event',
        action: 'update',
        args: { where: { id: '123' }, data: { title: 'Updated' } }, // schoolId not in data
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should allow non-guarded actions on Event (findMany)', async () => {
      const params = {
        model: 'Event',
        action: 'findMany',
        args: { where: { schoolId: 'school-123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue([])

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual([])
    })
  })

  describe('Guard 2: Registration MUST have eventId', () => {
    beforeEach(() => {
      registerPrismaGuards(mockPrisma)
    })

    it('should throw error when creating Registration without eventId', async () => {
      const params = {
        model: 'Registration',
        action: 'create',
        args: { data: { email: 'test@test.com' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(middlewareFunction(params, next)).rejects.toThrow(
        'INVARIANT VIOLATION: Attempting to create Registration without eventId'
      )

      expect(next).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INVARIANT VIOLATION'),
        expect.any(Object)
      )
      consoleSpy.mockRestore()
    })

    it('should throw error when updating Registration to remove eventId', async () => {
      const params = {
        model: 'Registration',
        action: 'update',
        args: { where: { id: '123' }, data: { eventId: null } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(middlewareFunction(params, next)).rejects.toThrow(
        'INVARIANT VIOLATION: Attempting to remove eventId from Registration'
      )

      expect(next).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should allow upsert if update branch has data (create missing eventId not checked)', async () => {
      // Note: Current implementation only checks the first branch (create OR update)
      // If update has data, it uses update and doesn't validate create
      const params = {
        model: 'Registration',
        action: 'upsert',
        args: {
          where: { id: '123' },
          create: { email: 'test@test.com' }, // missing eventId but not checked
          update: { email: 'updated@test.com' }, // update has data, so this is used
        },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should use update branch when create is falsy in upsert (OR operator)', async () => {
      // Test OR operator fallback: data = params.args.create || params.args.update
      // When create is undefined, uses update branch
      // Note: upsert actions don't trigger validation (guards only check action === 'create' or 'update')
      const params = {
        model: 'Registration',
        action: 'upsert',
        args: {
          where: { id: '123' },
          // create is undefined (falsy) - will use update branch via OR operator
          update: { email: 'updated@test.com' },
        },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      // Upsert actions don't trigger guard validation, so this succeeds
      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should allow creating Registration with eventId', async () => {
      const params = {
        model: 'Registration',
        action: 'create',
        args: { data: { email: 'test@test.com', eventId: 'event-123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should allow updating Registration with eventId present', async () => {
      const params = {
        model: 'Registration',
        action: 'update',
        args: { where: { id: '123' }, data: { email: 'updated@test.com', eventId: 'event-456' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should allow updating Registration without touching eventId field', async () => {
      const params = {
        model: 'Registration',
        action: 'update',
        args: { where: { id: '123' }, data: { email: 'updated@test.com' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should allow non-guarded actions on Registration (findFirst)', async () => {
      const params = {
        model: 'Registration',
        action: 'findFirst',
        args: { where: { email: 'test@test.com' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue(null)

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual(null)
    })
  })

  describe('Guard 3: No Hard Deletes on Protected Models', () => {
    beforeEach(() => {
      registerPrismaGuards(mockPrisma)
    })

    it('should throw error when hard deleting Event', async () => {
      const params = {
        model: 'Event',
        action: 'delete',
        args: { where: { id: '123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(middlewareFunction(params, next)).rejects.toThrow(
        'INVARIANT VIOLATION: Attempting hard delete on Event'
      )

      expect(next).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('use soft delete instead'),
        expect.any(Object)
      )
      consoleSpy.mockRestore()
    })

    it('should throw error when hard deleting many Registrations', async () => {
      const params = {
        model: 'Registration',
        action: 'deleteMany',
        args: { where: { eventId: 'event-123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(middlewareFunction(params, next)).rejects.toThrow(
        'INVARIANT VIOLATION: Attempting hard delete on Registration'
      )

      expect(next).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should throw error when hard deleting School', async () => {
      const params = {
        model: 'School',
        action: 'delete',
        args: { where: { id: 'school-123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn()

      await expect(middlewareFunction(params, next)).rejects.toThrow(
        'INVARIANT VIOLATION: Attempting hard delete on School'
      )
    })

    it('should allow hard delete on non-protected models (Admin)', async () => {
      const params = {
        model: 'Admin',
        action: 'delete',
        args: { where: { id: 'admin-123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: 'admin-123' })

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: 'admin-123' })
    })

    it('should allow soft delete (update) on protected models', async () => {
      const params = {
        model: 'Event',
        action: 'update',
        args: { where: { id: '123' }, data: { status: 'DELETED', schoolId: 'school-123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })

    it('should allow delete when model is undefined (fallback to empty string)', async () => {
      // Test OR operator fallback: params.model || ''
      const params = {
        model: undefined, // Will use fallback to ''
        action: 'delete',
        args: { where: { id: '123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockResolvedValue({ id: '123' })

      const result = await middlewareFunction(params, next)

      // Should not throw because undefined → '' is not in PROTECTED_MODELS
      expect(next).toHaveBeenCalledWith(params)
      expect(result).toEqual({ id: '123' })
    })
  })

  describe('Middleware Error Handling', () => {
    beforeEach(() => {
      registerPrismaGuards(mockPrisma)
    })

    it('should re-throw guard violations', async () => {
      const params = {
        model: 'Event',
        action: 'create',
        args: { data: { title: 'Test' } }, // missing schoolId
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn()

      await expect(middlewareFunction(params, next)).rejects.toThrow('INVARIANT VIOLATION')
    })

    it('should re-throw non-guard errors from next()', async () => {
      const params = {
        model: 'User',
        action: 'findUnique',
        args: { where: { id: '123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const next = vi.fn().mockRejectedValue(new Error('Database connection failed'))

      await expect(middlewareFunction(params, next)).rejects.toThrow('Database connection failed')
    })

    it('should allow successful queries to pass through', async () => {
      const params = {
        model: 'Event',
        action: 'findMany',
        args: { where: { schoolId: 'school-123' } },
        dataPath: [],
        runInTransaction: false,
      }
      const mockResult = [{ id: '1', title: 'Event 1' }]
      const next = vi.fn().mockResolvedValue(mockResult)

      const result = await middlewareFunction(params, next)

      expect(result).toEqual(mockResult)
      expect(next).toHaveBeenCalledWith(params)
    })
  })

  describe('getGuardStats()', () => {
    it('should return correct guard statistics', () => {
      const stats = getGuardStats()

      expect(stats).toEqual({
        guardsEnabled: true,
        protectedModels: ['Event', 'Registration', 'School'],
        guards: [
          'Event MUST have schoolId',
          'Registration MUST have eventId',
          'No hard deletes on Event, Registration, School',
        ],
      })
    })
  })
})

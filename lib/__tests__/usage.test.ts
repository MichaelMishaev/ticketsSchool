import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PLAN_LIMITS,
  trackUsage,
  getCurrentUsage,
  canUseResource,
  hasFeature,
  getSchoolPlanDetails,
  getNearingLimits,
} from '@/lib/usage'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    usageRecord: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    admin: {
      count: vi.fn(),
    },
  },
}))

describe('usage.ts - Subscription & Usage Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date to have consistent test results
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('PLAN_LIMITS Configuration', () => {
    it('should have FREE plan with correct limits', () => {
      expect(PLAN_LIMITS.FREE).toEqual({
        eventsPerMonth: 3,
        registrationsPerMonth: 100,
        emailsPerMonth: 100,
        smsPerMonth: 0,
        apiCallsPerMonth: 0,
        storageGB: 0.5,
        teamMembers: 1,
        schools: 1,
        features: {
          customBranding: false,
          customDomain: false,
          analytics: false,
          apiAccess: false,
          whatsappIntegration: false,
          prioritySupport: false,
          whiteLabel: false,
        },
      })
    })

    it('should have STARTER plan with unlimited events', () => {
      expect(PLAN_LIMITS.STARTER.eventsPerMonth).toBe(-1)
      expect(PLAN_LIMITS.STARTER.registrationsPerMonth).toBe(1000)
      expect(PLAN_LIMITS.STARTER.features.customBranding).toBe(true)
      expect(PLAN_LIMITS.STARTER.features.analytics).toBe(true)
    })

    it('should have PRO plan with unlimited schools', () => {
      expect(PLAN_LIMITS.PRO.eventsPerMonth).toBe(-1)
      expect(PLAN_LIMITS.PRO.schools).toBe(-1)
      expect(PLAN_LIMITS.PRO.features.customDomain).toBe(true)
      expect(PLAN_LIMITS.PRO.features.apiAccess).toBe(true)
    })

    it('should have ENTERPRISE plan with all unlimited', () => {
      expect(PLAN_LIMITS.ENTERPRISE.eventsPerMonth).toBe(-1)
      expect(PLAN_LIMITS.ENTERPRISE.registrationsPerMonth).toBe(-1)
      expect(PLAN_LIMITS.ENTERPRISE.emailsPerMonth).toBe(-1)
      expect(PLAN_LIMITS.ENTERPRISE.smsPerMonth).toBe(-1)
      expect(PLAN_LIMITS.ENTERPRISE.apiCallsPerMonth).toBe(-1)
      expect(PLAN_LIMITS.ENTERPRISE.storageGB).toBe(-1)
      expect(PLAN_LIMITS.ENTERPRISE.teamMembers).toBe(-1)
      expect(PLAN_LIMITS.ENTERPRISE.schools).toBe(-1)
      expect(PLAN_LIMITS.ENTERPRISE.features.whiteLabel).toBe(true)
      expect(PLAN_LIMITS.ENTERPRISE.features.prioritySupport).toBe(true)
    })
  })

  describe('trackUsage()', () => {
    it('should track usage with upsert (create if not exists)', async () => {
      vi.mocked(prisma.usageRecord.upsert).mockResolvedValue({} as any)

      await trackUsage('school-123', 'EVENT_CREATED', 1)

      expect(prisma.usageRecord.upsert).toHaveBeenCalledWith({
        where: {
          schoolId_resourceType_year_month: {
            schoolId: 'school-123',
            resourceType: 'EVENT_CREATED',
            year: 2026,
            month: 1,
          },
        },
        update: {
          amount: {
            increment: 1,
          },
          metadata: Prisma.JsonNull,
        },
        create: {
          schoolId: 'school-123',
          resourceType: 'EVENT_CREATED',
          year: 2026,
          month: 1,
          amount: 1,
          metadata: Prisma.JsonNull,
        },
      })
    })

    it('should track usage with custom amount', async () => {
      vi.mocked(prisma.usageRecord.upsert).mockResolvedValue({} as any)

      await trackUsage('school-123', 'EMAIL_SENT', 50)

      expect(prisma.usageRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            amount: {
              increment: 50,
            },
            metadata: Prisma.JsonNull,
          },
          create: expect.objectContaining({
            amount: 50,
          }),
        })
      )
    })

    it('should track usage with metadata', async () => {
      vi.mocked(prisma.usageRecord.upsert).mockResolvedValue({} as any)
      const metadata = { eventId: 'event-456', registrations: 10 }

      await trackUsage('school-123', 'REGISTRATION_PROCESSED', 10, metadata)

      expect(prisma.usageRecord.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            metadata: metadata,
          }),
          create: expect.objectContaining({
            metadata: metadata,
          }),
        })
      )
    })

    it('should not throw if database operation fails (fail gracefully)', async () => {
      vi.mocked(prisma.usageRecord.upsert).mockRejectedValue(new Error('Database error'))

      // Should not throw
      await expect(trackUsage('school-123', 'EVENT_CREATED', 1)).resolves.toBeUndefined()
    })
  })

  describe('getCurrentUsage()', () => {
    it('should return current month usage for all resource types', async () => {
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 5 } as any,
        { resourceType: 'EMAIL_SENT', amount: 150 } as any,
        { resourceType: 'REGISTRATION_PROCESSED', amount: 75 } as any,
      ])

      const usage = await getCurrentUsage('school-123')

      expect(prisma.usageRecord.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: 'school-123',
          year: 2026,
          month: 1,
        },
      })

      expect(usage).toEqual({
        EVENT_CREATED: 5,
        REGISTRATION_PROCESSED: 75,
        EMAIL_SENT: 150,
        SMS_SENT: 0,
        API_CALL: 0,
        STORAGE_MB: 0,
      })
    })

    it('should return zero usage if no records exist', async () => {
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([])

      const usage = await getCurrentUsage('school-123')

      expect(usage).toEqual({
        EVENT_CREATED: 0,
        REGISTRATION_PROCESSED: 0,
        EMAIL_SENT: 0,
        SMS_SENT: 0,
        API_CALL: 0,
        STORAGE_MB: 0,
      })
    })
  })

  describe('canUseResource()', () => {
    it('should return false if school not found', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue(null)

      const result = await canUseResource('school-999', 'EVENT_CREATED')

      expect(result).toEqual({ allowed: false, reason: 'School not found' })
    })

    it('should return false if subscription is inactive', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'EXPIRED',
      } as any)

      const result = await canUseResource('school-123', 'EVENT_CREATED')

      expect(result).toEqual({ allowed: false, reason: 'Subscription inactive' })
    })

    it('should allow resource use if subscription is ACTIVE', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE',
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 1 } as any,
      ])

      const result = await canUseResource('school-123', 'EVENT_CREATED', 1)

      expect(result.allowed).toBe(true)
    })

    it('should allow resource use if subscription is TRIAL', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'TRIAL',
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([])

      const result = await canUseResource('school-123', 'EVENT_CREATED', 1)

      expect(result.allowed).toBe(true)
    })

    it('should allow unlimited resource use for limit = -1', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 99999 } as any,
      ])

      const result = await canUseResource('school-123', 'EVENT_CREATED', 1)

      expect(result).toEqual({
        allowed: true,
        current: 99999,
        limit: -1,
      })
    })

    it('should allow resource use within limit', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE',
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 2 } as any,
      ])

      const result = await canUseResource('school-123', 'EVENT_CREATED', 1)

      expect(result).toEqual({
        allowed: true,
        current: 2,
        limit: 3,
      })
    })

    it('should deny resource use if limit exceeded', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE',
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 3 } as any,
      ])

      const result = await canUseResource('school-123', 'EVENT_CREATED', 1)

      expect(result).toEqual({
        allowed: false,
        reason: 'Limit exceeded for EVENT_CREATED',
        current: 3,
        limit: 3,
      })
    })

    it('should convert storage GB to MB correctly', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE',
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'STORAGE_MB', amount: 256 } as any,
      ])

      const result = await canUseResource('school-123', 'STORAGE_MB', 100)

      // FREE plan: 0.5 GB = 512 MB
      expect(result).toEqual({
        allowed: true,
        current: 256,
        limit: 512,
      })
    })

    it('should fail open (allow) if database error occurs', async () => {
      vi.mocked(prisma.school.findUnique).mockRejectedValue(new Error('Database connection failed'))

      const result = await canUseResource('school-123', 'EVENT_CREATED')

      expect(result).toEqual({ allowed: true })
    })
  })

  describe('hasFeature()', () => {
    it('should return false if school not found', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue(null)

      const result = await hasFeature('school-999', 'customBranding')

      expect(result).toBe(false)
    })

    it('should return true if FREE plan has feature', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
      } as any)

      // FREE plan doesn't have customBranding
      const result = await hasFeature('school-123', 'customBranding')
      expect(result).toBe(false)
    })

    it('should return true if STARTER plan has customBranding', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'STARTER',
      } as any)

      const result = await hasFeature('school-123', 'customBranding')
      expect(result).toBe(true)
    })

    it('should return true if PRO plan has customDomain', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'PRO',
      } as any)

      const result = await hasFeature('school-123', 'customDomain')
      expect(result).toBe(true)
    })

    it('should return true if ENTERPRISE plan has prioritySupport', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'ENTERPRISE',
      } as any)

      const result = await hasFeature('school-123', 'prioritySupport')
      expect(result).toBe(true)
    })

    it('should return false if database error occurs', async () => {
      vi.mocked(prisma.school.findUnique).mockRejectedValue(new Error('Database error'))

      const result = await hasFeature('school-123', 'customBranding')
      expect(result).toBe(false)
    })
  })

  describe('getSchoolPlanDetails()', () => {
    it('should throw error if school not found', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue(null)

      await expect(getSchoolPlanDetails('school-999')).rejects.toThrow('School not found')
    })

    it('should return plan details with usage and percentages for FREE plan', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: new Date('2026-12-31'),
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 2 } as any,
        { resourceType: 'EMAIL_SENT', amount: 90 } as any,
      ])
      vi.mocked(prisma.admin.count).mockResolvedValue(1)

      const details = await getSchoolPlanDetails('school-123')

      expect(details.plan).toBe('FREE')
      expect(details.status).toBe('ACTIVE')
      expect(details.teamMembersCount).toBe(1)
      expect(details.limits).toEqual(PLAN_LIMITS.FREE)
      expect(details.usage.EVENT_CREATED).toBe(2)
      expect(details.usage.EMAIL_SENT).toBe(90)
      expect(details.percentages.events).toBe((2 / 3) * 100) // 66.67%
      expect(details.percentages.emails).toBe((90 / 100) * 100) // 90%
    })

    it('should return 0 percentage for unlimited resources (-1)', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: null,
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 99999 } as any,
        { resourceType: 'EMAIL_SENT', amount: 88888 } as any,
      ])
      vi.mocked(prisma.admin.count).mockResolvedValue(50)

      const details = await getSchoolPlanDetails('school-123')

      expect(details.percentages.events).toBe(0)
      expect(details.percentages.emails).toBe(0)
      expect(details.percentages.registrations).toBe(0)
      expect(details.percentages.sms).toBe(0)
    })
  })

  describe('getNearingLimits()', () => {
    it('should return empty array if no limits are nearing 80%', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: null,
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 1 } as any,
        { resourceType: 'EMAIL_SENT', amount: 50 } as any,
      ])
      vi.mocked(prisma.admin.count).mockResolvedValue(1)

      const nearingLimits = await getNearingLimits('school-123')

      expect(nearingLimits).toEqual([])
    })

    it('should return events limit if > 80%', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: null,
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 3 } as any, // 100%
      ])
      vi.mocked(prisma.admin.count).mockResolvedValue(1)

      const nearingLimits = await getNearingLimits('school-123')

      expect(nearingLimits).toHaveLength(1)
      expect(nearingLimits[0]).toEqual({
        resource: 'אירועים',
        current: 3,
        limit: 3,
        percentage: 100,
      })
    })

    it('should return multiple limits if > 80%', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: null,
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 3 } as any, // 100%
        { resourceType: 'EMAIL_SENT', amount: 85 } as any, // 85%
      ])
      vi.mocked(prisma.admin.count).mockResolvedValue(1)

      const nearingLimits = await getNearingLimits('school-123')

      expect(nearingLimits).toHaveLength(2)
      expect(nearingLimits.map((l) => l.resource)).toEqual(['אירועים', 'מיילים'])
    })

    it('should return registrations limit if > 80%', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'FREE',
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: null,
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'REGISTRATION_PROCESSED', amount: 85 } as any, // 85%
      ])
      vi.mocked(prisma.admin.count).mockResolvedValue(1)

      const nearingLimits = await getNearingLimits('school-123')

      expect(nearingLimits).toHaveLength(1)
      expect(nearingLimits[0]).toEqual({
        resource: 'רישומים',
        current: 85,
        limit: 100,
        percentage: 85,
      })
    })

    it('should return SMS limit if > 80% for STARTER plan', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'STARTER',
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: null,
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'SMS_SENT', amount: 90 } as any, // 90%
      ])
      vi.mocked(prisma.admin.count).mockResolvedValue(1)

      const nearingLimits = await getNearingLimits('school-123')

      expect(nearingLimits).toHaveLength(1)
      expect(nearingLimits[0]).toEqual({
        resource: 'הודעות SMS',
        current: 90,
        limit: 100, // STARTER plan has 100 SMS
        percentage: 90,
      })
    })

    it('should not return limits for unlimited resources (-1)', async () => {
      vi.mocked(prisma.school.findUnique).mockResolvedValue({
        plan: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null,
        subscriptionEndsAt: null,
      } as any)
      vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
        { resourceType: 'EVENT_CREATED', amount: 99999 } as any,
        { resourceType: 'EMAIL_SENT', amount: 88888 } as any,
        { resourceType: 'SMS_SENT', amount: 77777 } as any,
      ])
      vi.mocked(prisma.admin.count).mockResolvedValue(100)

      const nearingLimits = await getNearingLimits('school-123')

      expect(nearingLimits).toEqual([])
    })
  })
})

import 'server-only'
import { prisma } from '@/lib/prisma'
import type { SubscriptionPlan, UsageResourceType } from '@prisma/client'

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, {
  eventsPerMonth: number
  registrationsPerMonth: number
  emailsPerMonth: number
  smsPerMonth: number
  apiCallsPerMonth: number
  storageGB: number
  teamMembers: number
  schools: number
  features: {
    customBranding: boolean
    customDomain: boolean
    analytics: boolean
    apiAccess: boolean
    whatsappIntegration: boolean
    prioritySupport: boolean
    whiteLabel: boolean
  }
}> = {
  FREE: {
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
  },
  STARTER: {
    eventsPerMonth: -1, // unlimited
    registrationsPerMonth: 1000,
    emailsPerMonth: 1000,
    smsPerMonth: 100,
    apiCallsPerMonth: 0,
    storageGB: 5,
    teamMembers: 5,
    schools: 5,
    features: {
      customBranding: true,
      customDomain: false,
      analytics: true,
      apiAccess: false,
      whatsappIntegration: false,
      prioritySupport: false,
      whiteLabel: false,
    },
  },
  PRO: {
    eventsPerMonth: -1, // unlimited
    registrationsPerMonth: 10000,
    emailsPerMonth: 10000,
    smsPerMonth: 500,
    apiCallsPerMonth: 10000,
    storageGB: 50,
    teamMembers: 20,
    schools: -1, // unlimited
    features: {
      customBranding: true,
      customDomain: true,
      analytics: true,
      apiAccess: true,
      whatsappIntegration: true,
      prioritySupport: false,
      whiteLabel: false,
    },
  },
  ENTERPRISE: {
    eventsPerMonth: -1, // unlimited
    registrationsPerMonth: -1, // unlimited
    emailsPerMonth: -1, // unlimited
    smsPerMonth: -1, // unlimited
    apiCallsPerMonth: -1, // unlimited
    storageGB: -1, // unlimited
    teamMembers: -1, // unlimited
    schools: -1, // unlimited
    features: {
      customBranding: true,
      customDomain: true,
      analytics: true,
      apiAccess: true,
      whatsappIntegration: true,
      prioritySupport: true,
      whiteLabel: true,
    },
  },
}

/**
 * Track usage for a school
 */
export async function trackUsage(
  schoolId: string,
  resourceType: UsageResourceType,
  amount: number = 1,
  metadata?: Record<string, unknown>
): Promise<void> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  try {
    await prisma.usageRecord.upsert({
      where: {
        schoolId_resourceType_year_month: {
          schoolId,
          resourceType,
          year,
          month,
        },
      },
      update: {
        amount: {
          increment: amount,
        },
        metadata: metadata || undefined,
      },
      create: {
        schoolId,
        resourceType,
        year,
        month,
        amount,
        metadata: metadata || undefined,
      },
    })
  } catch (error) {
    console.error('Failed to track usage:', error)
    // Don't throw - usage tracking should not break the main flow
  }
}

/**
 * Get current month usage for a school
 */
export async function getCurrentUsage(schoolId: string): Promise<Record<UsageResourceType, number>> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const records = await prisma.usageRecord.findMany({
    where: {
      schoolId,
      year,
      month,
    },
  })

  const usage: Record<UsageResourceType, number> = {
    EVENT_CREATED: 0,
    REGISTRATION_PROCESSED: 0,
    EMAIL_SENT: 0,
    SMS_SENT: 0,
    API_CALL: 0,
    STORAGE_MB: 0,
  }

  records.forEach((record) => {
    usage[record.resourceType] = record.amount
  })

  return usage
}

/**
 * Check if school can perform an action based on their plan limits
 */
export async function canUseResource(
  schoolId: string,
  resourceType: UsageResourceType,
  amount: number = 1
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
  try {
    // Get school with plan
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { plan: true, subscriptionStatus: true },
    })

    if (!school) {
      return { allowed: false, reason: 'School not found' }
    }

    // Check subscription status
    if (school.subscriptionStatus !== 'ACTIVE' && school.subscriptionStatus !== 'TRIAL') {
      return { allowed: false, reason: 'Subscription inactive' }
    }

    // Get plan limits
    const limits = PLAN_LIMITS[school.plan]

    // Get current usage
    const usage = await getCurrentUsage(schoolId)

    // Map resource types to limit keys
    const limitMap: Record<UsageResourceType, number> = {
      EVENT_CREATED: limits.eventsPerMonth,
      REGISTRATION_PROCESSED: limits.registrationsPerMonth,
      EMAIL_SENT: limits.emailsPerMonth,
      SMS_SENT: limits.smsPerMonth,
      API_CALL: limits.apiCallsPerMonth,
      STORAGE_MB: limits.storageGB * 1024, // Convert GB to MB
    }

    const limit = limitMap[resourceType]
    const current = usage[resourceType]

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, current, limit: -1 }
    }

    // Check if adding this amount would exceed the limit
    if (current + amount > limit) {
      return {
        allowed: false,
        reason: `Limit exceeded for ${resourceType}`,
        current,
        limit,
      }
    }

    return { allowed: true, current, limit }
  } catch (error) {
    console.error('Error checking resource usage:', error)
    // In case of error, allow the operation (fail open)
    return { allowed: true }
  }
}

/**
 * Check if school has access to a feature
 */
export async function hasFeature(schoolId: string, feature: keyof typeof PLAN_LIMITS.FREE.features): Promise<boolean> {
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { plan: true },
    })

    if (!school) {
      return false
    }

    return PLAN_LIMITS[school.plan].features[feature]
  } catch (error) {
    console.error('Error checking feature access:', error)
    return false
  }
}

/**
 * Get school plan details with current usage
 */
export async function getSchoolPlanDetails(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
    },
  })

  if (!school) {
    throw new Error('School not found')
  }

  const limits = PLAN_LIMITS[school.plan]
  const usage = await getCurrentUsage(schoolId)

  // Get team members count
  const teamMembersCount = await prisma.admin.count({
    where: { schoolId, isActive: true },
  })

  return {
    plan: school.plan,
    status: school.subscriptionStatus,
    trialEndsAt: school.trialEndsAt,
    subscriptionEndsAt: school.subscriptionEndsAt,
    limits,
    usage,
    teamMembersCount,
    percentages: {
      events: limits.eventsPerMonth === -1 ? 0 : (usage.EVENT_CREATED / limits.eventsPerMonth) * 100,
      registrations:
        limits.registrationsPerMonth === -1
          ? 0
          : (usage.REGISTRATION_PROCESSED / limits.registrationsPerMonth) * 100,
      emails: limits.emailsPerMonth === -1 ? 0 : (usage.EMAIL_SENT / limits.emailsPerMonth) * 100,
      sms: limits.smsPerMonth === -1 ? 0 : (usage.SMS_SENT / limits.smsPerMonth) * 100,
    },
  }
}

/**
 * Check if school is nearing any limits (>80%)
 */
export async function getNearingLimits(schoolId: string): Promise<
  Array<{
    resource: string
    current: number
    limit: number
    percentage: number
  }>
> {
  const details = await getSchoolPlanDetails(schoolId)
  const nearingLimits: Array<{ resource: string; current: number; limit: number; percentage: number }> = []

  // Check events
  if (details.limits.eventsPerMonth !== -1 && details.percentages.events > 80) {
    nearingLimits.push({
      resource: 'אירועים',
      current: details.usage.EVENT_CREATED,
      limit: details.limits.eventsPerMonth,
      percentage: details.percentages.events,
    })
  }

  // Check registrations
  if (details.limits.registrationsPerMonth !== -1 && details.percentages.registrations > 80) {
    nearingLimits.push({
      resource: 'רישומים',
      current: details.usage.REGISTRATION_PROCESSED,
      limit: details.limits.registrationsPerMonth,
      percentage: details.percentages.registrations,
    })
  }

  // Check emails
  if (details.limits.emailsPerMonth !== -1 && details.percentages.emails > 80) {
    nearingLimits.push({
      resource: 'מיילים',
      current: details.usage.EMAIL_SENT,
      limit: details.limits.emailsPerMonth,
      percentage: details.percentages.emails,
    })
  }

  // Check SMS
  if (details.limits.smsPerMonth !== -1 && details.percentages.sms > 80) {
    nearingLimits.push({
      resource: 'הודעות SMS',
      current: details.usage.SMS_SENT,
      limit: details.limits.smsPerMonth,
      percentage: details.percentages.sms,
    })
  }

  return nearingLimits
}

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/super/statistics/platform
 * Super Admin only - Get platform health statistics
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    if (!fromParam || !toParam) {
      return NextResponse.json({ error: 'Missing date range parameters' }, { status: 400 })
    }

    const from = new Date(fromParam)
    const to = new Date(toParam)

    // Validate date format
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Validate date range (max 1 year)
    const maxRange = 365 * 24 * 60 * 60 * 1000
    if (to.getTime() - from.getTime() > maxRange) {
      return NextResponse.json({ error: 'Date range too large (max 1 year)' }, { status: 400 })
    }

    // Calculate previous period for comparison
    const periodLength = to.getTime() - from.getTime()
    const previousFrom = new Date(from.getTime() - periodLength)
    const previousTo = new Date(from.getTime())

    // Get all schools
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
      },
    })

    const totalSchools = schools.length
    const activeSchools = schools.filter((s) => s.isActive).length
    const inactiveSchools = totalSchools - activeSchools

    // Schools by plan
    const planCounts: Record<string, number> = {}
    schools.forEach((s) => {
      const plan = s.plan
      planCounts[plan] = (planCounts[plan] || 0) + 1
    })
    const byPlan = Object.entries(planCounts).map(([plan, count]) => ({
      plan: translatePlan(plan),
      count,
    }))

    // Schools by subscription status
    const statusCounts: Record<string, number> = {}
    schools.forEach((s) => {
      const status = s.subscriptionStatus
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status: translateStatus(status),
      count,
    }))

    // Get admins stats
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        isActive: true,
        lastLoginAt: true,
      },
    })

    const totalAdmins = admins.length
    // Consider active if logged in within the date range
    // Fix: Use < instead of <= for upper bound (consistent with other queries)
    const activeAdmins = admins.filter(
      (a) => a.isActive && a.lastLoginAt && a.lastLoginAt >= from && a.lastLoginAt < to
    ).length

    // New schools trend (by day in date range)
    // Fix: Use < instead of <= for upper bound (consistent with Prisma queries)
    const newSchoolsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) as count
      FROM "School"
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date
    `

    const newSchoolsTrend = newSchoolsByDay.map((row) => ({
      date: row.date.toISOString(),
      count: Number(row.count),
    }))

    // Trial expiring soon (within 7 days)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const trialExpiringSoon = schools
      .filter(
        (s) =>
          s.subscriptionStatus === 'TRIAL' &&
          s.trialEndsAt &&
          s.trialEndsAt > now &&
          s.trialEndsAt <= sevenDaysFromNow
      )
      .map((s) => ({
        schoolName: s.name,
        expiresAt: s.trialEndsAt!.toISOString(),
      }))
      .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())

    // Usage metrics for the period
    const eventsCreated = await prisma.event.count({
      where: {
        createdAt: { gte: from, lt: to },
      },
    })

    const registrationsProcessed = await prisma.registration.count({
      where: {
        createdAt: { gte: from, lt: to },
      },
    })

    // Emails sent (from usage records)
    const emailsRecord = await prisma.usageRecord.aggregate({
      where: {
        resourceType: 'EMAIL_SENT',
        createdAt: { gte: from, lt: to },
      },
      _sum: { amount: true },
    })
    const emailsSent = emailsRecord._sum.amount || 0

    // Previous period stats - count schools created in the previous period (not cumulative)
    // This enables accurate period-over-period comparison
    const previousSchools = await prisma.school.count({
      where: {
        createdAt: { gte: previousFrom, lt: previousTo },
      },
    })

    // Fix: Use < instead of <= for upper bound (consistent with other queries)
    const previousActiveAdmins = admins.filter(
      (a) =>
        a.isActive && a.lastLoginAt && a.lastLoginAt >= previousFrom && a.lastLoginAt < previousTo
    ).length

    return NextResponse.json({
      totalSchools,
      activeSchools,
      inactiveSchools,
      byPlan,
      byStatus,
      totalAdmins,
      activeAdmins,
      newSchoolsTrend,
      trialExpiringSoon,
      usageMetrics: {
        eventsCreated,
        registrationsProcessed,
        emailsSent,
      },
      previousPeriod: {
        totalSchools: previousSchools,
        activeAdmins: previousActiveAdmins,
      },
    })
  } catch (error) {
    console.error('Platform statistics error:', error)
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch platform statistics' }, { status: 500 })
  }
}

function translatePlan(plan: string): string {
  const translations: Record<string, string> = {
    FREE: 'חינם',
    STARTER: 'התחלה',
    PRO: 'מקצועי',
    ENTERPRISE: 'ארגוני',
  }
  return translations[plan] || plan
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    ACTIVE: 'פעיל',
    TRIAL: 'ניסיון',
    PAST_DUE: 'חוב',
    CANCELED: 'בוטל',
    PAUSED: 'מושהה',
  }
  return translations[status] || status
}

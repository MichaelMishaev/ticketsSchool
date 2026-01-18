import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * GET /api/admin/super/statistics/revenue
 * Super Admin only - Get revenue statistics across all schools
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

    // Get all payments in the date range
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: from, lt: to },
      },
      include: {
        school: { select: { name: true } },
      },
    })

    // Aggregate metrics
    const completedPayments = payments.filter((p) => p.status === 'COMPLETED')
    const refundedPayments = payments.filter((p) => p.status === 'REFUNDED')
    const failedPayments = payments.filter((p) => p.status === 'FAILED')

    const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    // Fix: Use refundAmount only, not full amount as fallback (prevents overstating refunds)
    const totalRefunds = refundedPayments.reduce((sum, p) => sum + Number(p.refundAmount || 0), 0)
    const netRevenue = totalRevenue - totalRefunds
    const averagePayment =
      completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0

    // Get revenue by day using raw SQL for proper date grouping
    // Fix: Use < instead of <= for upper bound (consistent with Prisma query)
    // Fix: Use COALESCE("refundAmount", 0) not amount (prevents overstating refunds)
    const byDayRaw = await prisma.$queryRaw<
      Array<{ date: Date; revenue: Prisma.Decimal; refunds: Prisma.Decimal }>
    >`
      SELECT
        DATE_TRUNC('day', "createdAt") as date,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN COALESCE("refundAmount", 0) ELSE 0 END), 0) as refunds
      FROM "Payment"
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date
    `

    const byDay = byDayRaw.map((row) => ({
      date: row.date.toISOString(),
      revenue: Number(row.revenue),
      refunds: Number(row.refunds),
    }))

    // Get revenue by status
    const statusCounts: Record<string, { count: number; amount: number }> = {}
    payments.forEach((p) => {
      const status = p.status
      if (!statusCounts[status]) {
        statusCounts[status] = { count: 0, amount: 0 }
      }
      statusCounts[status].count++
      statusCounts[status].amount += Number(p.amount)
    })

    const byStatus = Object.entries(statusCounts).map(([status, data]) => ({
      status: translatePaymentStatus(status),
      count: data.count,
      amount: data.amount,
    }))

    // Get revenue by school
    const schoolRevenue: Record<string, { revenue: number; count: number }> = {}
    completedPayments.forEach((p) => {
      const schoolName = p.school?.name || 'בית ספר לא ידוע'
      if (!schoolRevenue[schoolName]) {
        schoolRevenue[schoolName] = { revenue: 0, count: 0 }
      }
      schoolRevenue[schoolName].revenue += Number(p.amount)
      schoolRevenue[schoolName].count++
    })

    const bySchool = Object.entries(schoolRevenue)
      .map(([schoolName, data]) => ({
        schoolName,
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Get previous period data for comparison
    const previousPayments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: previousFrom, lt: previousTo },
        status: 'COMPLETED',
      },
    })

    const previousTotalRevenue = previousPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const previousCompletedCount = previousPayments.length

    return NextResponse.json({
      totalRevenue,
      totalRefunds,
      netRevenue,
      failedPayments: failedPayments.length,
      averagePayment: Math.round(averagePayment),
      completedPayments: completedPayments.length,
      byDay,
      byStatus,
      bySchool,
      previousPeriod: {
        totalRevenue: previousTotalRevenue,
        completedPayments: previousCompletedCount,
      },
    })
  } catch (error) {
    console.error('Revenue statistics error:', error)
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch revenue statistics' }, { status: 500 })
  }
}

function translatePaymentStatus(status: string): string {
  const translations: Record<string, string> = {
    PENDING: 'ממתין',
    PROCESSING: 'בתהליך',
    COMPLETED: 'הושלם',
    FAILED: 'נכשל',
    REFUNDED: 'הוחזר',
    CANCELLED: 'בוטל',
  }
  return translations[status] || status
}

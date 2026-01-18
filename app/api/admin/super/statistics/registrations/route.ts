import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * GET /api/admin/super/statistics/registrations
 * Super Admin only - Get registration statistics across all schools
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

    // Get all registrations in the date range
    const registrations = await prisma.registration.findMany({
      where: {
        createdAt: { gte: from, lt: to },
      },
      include: {
        event: {
          select: {
            title: true,
            school: { select: { name: true } },
          },
        },
      },
    })

    // Aggregate by status
    const confirmed = registrations.filter((r) => r.status === 'CONFIRMED')
    const waitlist = registrations.filter((r) => r.status === 'WAITLIST')
    const cancelled = registrations.filter((r) => r.status === 'CANCELLED')

    const totalRegistrations = registrations.length
    const conversionRate =
      totalRegistrations > 0 ? Math.round((confirmed.length / totalRegistrations) * 100) : 0
    const cancellationRate =
      totalRegistrations > 0 ? Math.round((cancelled.length / totalRegistrations) * 100) : 0

    // Get registrations by day
    const byDayRaw = await prisma.$queryRaw<
      Array<{
        date: Date
        confirmed: bigint
        waitlist: bigint
        cancelled: bigint
      }>
    >`
      SELECT
        DATE_TRUNC('day', "createdAt") as date,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
        COUNT(*) FILTER (WHERE status = 'WAITLIST') as waitlist,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
      FROM "Registration"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date
    `

    const byDay = byDayRaw.map((row) => ({
      date: row.date.toISOString(),
      confirmed: Number(row.confirmed),
      waitlist: Number(row.waitlist),
      cancelled: Number(row.cancelled),
    }))

    // Get registrations by school
    const schoolStats: Record<string, { confirmed: number; waitlist: number }> = {}
    registrations.forEach((r) => {
      const schoolName = r.event?.school?.name || 'בית ספר לא ידוע'
      if (!schoolStats[schoolName]) {
        schoolStats[schoolName] = { confirmed: 0, waitlist: 0 }
      }
      if (r.status === 'CONFIRMED') {
        schoolStats[schoolName].confirmed++
      } else if (r.status === 'WAITLIST') {
        schoolStats[schoolName].waitlist++
      }
    })

    const bySchool = Object.entries(schoolStats)
      .map(([schoolName, data]) => ({
        schoolName,
        confirmed: data.confirmed,
        waitlist: data.waitlist,
      }))
      .sort((a, b) => b.confirmed + b.waitlist - (a.confirmed + a.waitlist))

    // Get top events by registrations
    const eventStats: Record<
      string,
      { eventTitle: string; schoolName: string; registrations: number }
    > = {}
    confirmed.forEach((r) => {
      const key = r.eventId
      if (!eventStats[key]) {
        eventStats[key] = {
          eventTitle: r.event?.title || 'אירוע לא ידוע',
          schoolName: r.event?.school?.name || 'בית ספר לא ידוע',
          registrations: 0,
        }
      }
      eventStats[key].registrations++
    })

    const topEvents = Object.values(eventStats)
      .sort((a, b) => b.registrations - a.registrations)
      .slice(0, 10)

    // Get previous period data for comparison
    const previousRegistrations = await prisma.registration.count({
      where: {
        createdAt: { gte: previousFrom, lt: previousTo },
      },
    })

    const previousConfirmed = await prisma.registration.count({
      where: {
        createdAt: { gte: previousFrom, lt: previousTo },
        status: 'CONFIRMED',
      },
    })

    const previousConversionRate =
      previousRegistrations > 0 ? Math.round((previousConfirmed / previousRegistrations) * 100) : 0

    return NextResponse.json({
      totalRegistrations,
      confirmedCount: confirmed.length,
      waitlistCount: waitlist.length,
      cancelledCount: cancelled.length,
      conversionRate,
      cancellationRate,
      byDay,
      bySchool,
      topEvents,
      previousPeriod: {
        totalRegistrations: previousRegistrations,
        conversionRate: previousConversionRate,
      },
    })
  } catch (error) {
    console.error('Registrations statistics error:', error)
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch registration statistics' }, { status: 500 })
  }
}

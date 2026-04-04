import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/super/statistics/capacity
 * Super Admin only - Get capacity statistics across all schools
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

    // Get all events in the date range (by startAt)
    const events = await prisma.event.findMany({
      where: {
        startAt: { gte: from, lt: to },
      },
      include: {
        school: { select: { name: true } },
        registrations: {
          where: { status: 'WAITLIST' },
          select: { spotsCount: true },
        },
      },
    })

    // Calculate totals
    const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0)
    const totalReserved = events.reduce((sum, e) => sum + e.spotsReserved, 0)
    const averageFillRate =
      totalCapacity > 0 ? Math.round((totalReserved / totalCapacity) * 100) : 0

    // Calculate waitlist pressure (total spots in waitlist)
    const waitlistPressure = events.reduce((sum, e) => {
      return sum + e.registrations.reduce((s, r) => s + r.spotsCount, 0)
    }, 0)

    // Count events at/over capacity
    const eventsAtCapacity = events.filter((e) => e.spotsReserved >= e.capacity).length
    const eventsOverCapacity = events.filter((e) => e.spotsReserved > e.capacity).length

    // Fill rate distribution
    // Note: max: Infinity ensures events with >100% fill rate (overbooking) are counted in "90%+"
    const fillRanges = [
      { range: 'מתחת ל-50%', min: 0, max: 50, count: 0 },
      { range: '50%-75%', min: 50, max: 75, count: 0 },
      { range: '75%-90%', min: 75, max: 90, count: 0 },
      { range: '90%+', min: 90, max: Infinity, count: 0 },
    ]

    events.forEach((e) => {
      // Division by zero protection: events with 0 capacity get 0% fill rate
      const fillRate = e.capacity > 0 ? (e.spotsReserved / e.capacity) * 100 : 0
      const range = fillRanges.find((r) => fillRate >= r.min && fillRate < r.max)
      if (range) range.count++
    })

    const fillDistribution = fillRanges.map((r) => ({ range: r.range, count: r.count }))

    // Get capacity by school
    const schoolStats: Record<string, { capacity: number; reserved: number }> = {}
    events.forEach((e) => {
      const schoolName = e.school?.name || 'בית ספר לא ידוע'
      if (!schoolStats[schoolName]) {
        schoolStats[schoolName] = { capacity: 0, reserved: 0 }
      }
      schoolStats[schoolName].capacity += e.capacity
      schoolStats[schoolName].reserved += e.spotsReserved
    })

    const bySchool = Object.entries(schoolStats)
      .map(([schoolName, data]) => ({
        schoolName,
        capacity: data.capacity,
        reserved: data.reserved,
        fillRate: data.capacity > 0 ? Math.round((data.reserved / data.capacity) * 100) : 0,
      }))
      .sort((a, b) => b.fillRate - a.fillRate)

    // Get previous period data for comparison
    const previousEvents = await prisma.event.findMany({
      where: {
        startAt: { gte: previousFrom, lt: previousTo },
      },
      select: { capacity: true, spotsReserved: true },
    })

    const previousTotalCapacity = previousEvents.reduce((sum, e) => sum + e.capacity, 0)
    const previousTotalReserved = previousEvents.reduce((sum, e) => sum + e.spotsReserved, 0)
    const previousAverageFillRate =
      previousTotalCapacity > 0
        ? Math.round((previousTotalReserved / previousTotalCapacity) * 100)
        : 0
    const previousEventsAtCapacity = previousEvents.filter(
      (e) => e.spotsReserved >= e.capacity
    ).length

    return NextResponse.json({
      totalCapacity,
      totalReserved,
      averageFillRate,
      waitlistPressure,
      eventsAtCapacity,
      eventsOverCapacity,
      fillDistribution,
      bySchool,
      previousPeriod: {
        averageFillRate: previousAverageFillRate,
        eventsAtCapacity: previousEventsAtCapacity,
      },
    })
  } catch (error) {
    console.error('Capacity statistics error:', error)
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch capacity statistics' }, { status: 500 })
  }
}

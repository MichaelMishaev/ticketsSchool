import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/super/statistics/checkins
 * Super Admin only - Get check-in/attendance statistics across all schools
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

    // Get all events in the date range with their registrations and check-ins
    const events = await prisma.event.findMany({
      where: {
        startAt: { gte: from, lt: to },
      },
      include: {
        school: { select: { name: true } },
        registrations: {
          where: { status: 'CONFIRMED' },
          include: {
            checkIn: true,
          },
        },
      },
    })

    // Calculate check-in stats
    let totalCheckedIn = 0
    let totalNotCheckedIn = 0
    let onTimeCount = 0
    let lateCount = 0
    let totalMinutesLate = 0
    let lateWithMinutes = 0

    const schoolStats: Record<string, { checkedIn: number; notCheckedIn: number }> = {}
    const eventStats: Array<{
      eventTitle: string
      schoolName: string
      checkedIn: number
      total: number
      rate: number
    }> = []

    events.forEach((event) => {
      const schoolName = event.school?.name || 'בית ספר לא ידוע'
      if (!schoolStats[schoolName]) {
        schoolStats[schoolName] = { checkedIn: 0, notCheckedIn: 0 }
      }

      let eventCheckedIn = 0
      let eventTotal = 0

      event.registrations.forEach((reg) => {
        eventTotal++
        if (reg.checkIn && !reg.checkIn.undoneAt) {
          totalCheckedIn++
          eventCheckedIn++
          schoolStats[schoolName].checkedIn++

          if (reg.checkIn.isLate) {
            lateCount++
            if (reg.checkIn.minutesLate) {
              totalMinutesLate += reg.checkIn.minutesLate
              lateWithMinutes++
            }
          } else {
            onTimeCount++
          }
        } else {
          totalNotCheckedIn++
          schoolStats[schoolName].notCheckedIn++
        }
      })

      if (eventTotal > 0) {
        eventStats.push({
          eventTitle: event.title,
          schoolName,
          checkedIn: eventCheckedIn,
          total: eventTotal,
          rate: Math.round((eventCheckedIn / eventTotal) * 100),
        })
      }
    })

    const totalRegistrations = totalCheckedIn + totalNotCheckedIn
    const attendanceRate =
      totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0

    const averageMinutesLate =
      lateWithMinutes > 0 ? Math.round(totalMinutesLate / lateWithMinutes) : 0

    const bySchool = Object.entries(schoolStats)
      .map(([schoolName, data]) => ({
        schoolName,
        checkedIn: data.checkedIn,
        notCheckedIn: data.notCheckedIn,
        rate:
          data.checkedIn + data.notCheckedIn > 0
            ? Math.round((data.checkedIn / (data.checkedIn + data.notCheckedIn)) * 100)
            : 0,
      }))
      .sort((a, b) => b.rate - a.rate)

    const byEvent = eventStats.sort((a, b) => b.rate - a.rate)

    // Get previous period data for comparison
    const previousEvents = await prisma.event.findMany({
      where: {
        startAt: { gte: previousFrom, lt: previousTo },
      },
      include: {
        registrations: {
          where: { status: 'CONFIRMED' },
          include: { checkIn: true },
        },
      },
    })

    let previousCheckedIn = 0
    let previousTotal = 0
    let previousLate = 0

    previousEvents.forEach((event) => {
      event.registrations.forEach((reg) => {
        previousTotal++
        if (reg.checkIn && !reg.checkIn.undoneAt) {
          previousCheckedIn++
          if (reg.checkIn.isLate) previousLate++
        }
      })
    })

    const previousAttendanceRate =
      previousTotal > 0 ? Math.round((previousCheckedIn / previousTotal) * 100) : 0

    return NextResponse.json({
      totalCheckedIn,
      totalNotCheckedIn,
      attendanceRate,
      onTimeCount,
      lateCount,
      averageMinutesLate,
      bySchool,
      byEvent,
      previousPeriod: {
        attendanceRate: previousAttendanceRate,
        lateCount: previousLate,
      },
    })
  } catch (error) {
    console.error('Check-ins statistics error:', error)
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch check-in statistics' }, { status: 500 })
  }
}

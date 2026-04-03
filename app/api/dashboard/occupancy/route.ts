import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventWhere: Record<string, unknown> = {}
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned. Please logout and login again.' },
          { status: 403 }
        )
      }
      eventWhere.schoolId = admin.schoolId
    } else {
      const schoolId = new URL(request.url).searchParams.get('schoolId')
      if (schoolId) eventWhere.schoolId = schoolId
    }

    // Two queries instead of N×M rows:
    // 1. Events (slim select — no registration rows)
    // 2. Registration aggregates grouped by eventId + status (one SQL GROUP BY)
    const [events, regGroups] = await Promise.all([
      prisma.event.findMany({
        where: eventWhere,
        select: { id: true, title: true, startAt: true, location: true, capacity: true, status: true },
        orderBy: { startAt: 'asc' },
      }),
      prisma.registration.groupBy({
        by: ['eventId', 'status'],
        where: { event: eventWhere },
        _sum: { spotsCount: true },
      }),
    ])

    // Build lookup map from groupBy result
    const regMap: Record<string, { confirmed: number; waitlist: number }> = {}
    for (const group of regGroups) {
      if (!regMap[group.eventId]) regMap[group.eventId] = { confirmed: 0, waitlist: 0 }
      const spots = group._sum.spotsCount ?? 0
      if (group.status === 'CONFIRMED') regMap[group.eventId].confirmed += spots
      if (group.status === 'WAITLIST')  regMap[group.eventId].waitlist  += spots
    }

    const eventOccupancy = events.map((event) => {
      const { confirmed: confirmedCount = 0, waitlist: waitlistCount = 0 } =
        regMap[event.id] ?? {}
      const occupancyRate =
        event.capacity > 0 ? Math.round((confirmedCount / event.capacity) * 100) : 0
      return {
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        location: event.location,
        capacity: event.capacity,
        confirmedCount,
        waitlistCount,
        occupancyRate,
        availableSpots: Math.max(0, event.capacity - confirmedCount),
        status: event.status,
      }
    })

    const totalCapacity  = events.reduce((s, e) => s + e.capacity, 0)
    const totalConfirmed = eventOccupancy.reduce((s, e) => s + e.confirmedCount, 0)
    const overallOccupancyRate =
      totalCapacity > 0 ? Math.round((totalConfirmed / totalCapacity) * 100) : 0
    const avgOccupancy =
      eventOccupancy.length > 0
        ? Math.round(eventOccupancy.reduce((s, e) => s + e.occupancyRate, 0) / eventOccupancy.length)
        : 0

    return NextResponse.json({
      overallOccupancyRate,
      totalCapacity,
      totalConfirmed,
      totalAvailable: totalCapacity - totalConfirmed,
      eventOccupancy,
      highOccupancyEvents: eventOccupancy.filter((e) => e.occupancyRate >= 80),
      lowOccupancyEvents:  eventOccupancy.filter((e) => e.occupancyRate < 50 && e.status === 'OPEN'),
      statistics: {
        averageOccupancy: avgOccupancy,
        fullEvents:  eventOccupancy.filter((e) => e.occupancyRate >= 100).length,
        emptyEvents: eventOccupancy.filter((e) => e.occupancyRate === 0).length,
      },
    })
  } catch (error) {
    logger.error('Error fetching occupancy data', { source: 'dashboard', error })
    return NextResponse.json({ error: 'Failed to fetch occupancy data' }, { status: 500 })
  }
}

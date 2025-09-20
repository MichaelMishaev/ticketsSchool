import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const activeEvents = await prisma.event.findMany({
      where: {
        status: 'OPEN'
      },
      include: {
        _count: {
          select: {
            registrations: true
          }
        },
        registrations: {
          select: {
            status: true,
            spotsCount: true
          }
        }
      },
      orderBy: {
        startAt: 'asc'
      }
    })

    const eventsWithDetails = activeEvents.map(event => {
      const confirmedCount = event.registrations
        .filter(reg => reg.status === 'CONFIRMED')
        .reduce((sum, reg) => sum + reg.spotsCount, 0)

      const waitlistCount = event.registrations
        .filter(reg => reg.status === 'WAITLIST')
        .reduce((sum, reg) => sum + reg.spotsCount, 0)

      const occupancyRate = event.capacity > 0
        ? Math.round((confirmedCount / event.capacity) * 100)
        : 0

      return {
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt,
        location: event.location,
        capacity: event.capacity,
        confirmedCount,
        waitlistCount,
        totalRegistrations: event._count.registrations,
        occupancyRate,
        availableSpots: Math.max(0, event.capacity - confirmedCount)
      }
    })

    return NextResponse.json({
      count: activeEvents.length,
      events: eventsWithDetails
    })
  } catch (error) {
    console.error('Error fetching active events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active events' },
      { status: 500 }
    )
  }
}
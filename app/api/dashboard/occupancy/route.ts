import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

export async function GET(request: NextRequest) {
  try {
    // Get current admin session
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build where clause based on admin role
    const where: any = {}

    // Regular admins can only see their school's events
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
      where.schoolId = admin.schoolId
    }

    // Super admins can filter by school via query param
    if (admin.role === 'SUPER_ADMIN') {
      const url = new URL(request.url)
      const schoolId = url.searchParams.get('schoolId')
      if (schoolId) {
        where.schoolId = schoolId
      }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
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

    const eventOccupancy = events.map(event => {
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
        location: event.location,
        capacity: event.capacity,
        confirmedCount,
        waitlistCount,
        occupancyRate,
        availableSpots: Math.max(0, event.capacity - confirmedCount),
        status: event.status
      }
    })

    const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0)
    const totalConfirmed = eventOccupancy.reduce((sum, event) => sum + event.confirmedCount, 0)
    const overallOccupancyRate = totalCapacity > 0
      ? Math.round((totalConfirmed / totalCapacity) * 100)
      : 0

    const highOccupancyEvents = eventOccupancy.filter(event => event.occupancyRate >= 80)
    const lowOccupancyEvents = eventOccupancy.filter(event => event.occupancyRate < 50 && event.status === 'OPEN')

    return NextResponse.json({
      overallOccupancyRate,
      totalCapacity,
      totalConfirmed,
      totalAvailable: totalCapacity - totalConfirmed,
      eventOccupancy,
      highOccupancyEvents,
      lowOccupancyEvents,
      statistics: {
        averageOccupancy: Math.round(eventOccupancy.reduce((sum, event) => sum + event.occupancyRate, 0) / events.length) || 0,
        fullEvents: eventOccupancy.filter(event => event.occupancyRate >= 100).length,
        emptyEvents: eventOccupancy.filter(event => event.occupancyRate === 0).length
      }
    })
  } catch (error) {
    console.error('Error fetching occupancy data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch occupancy data' },
      { status: 500 }
    )
  }
}
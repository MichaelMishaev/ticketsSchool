import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all events with registration counts
    const events = await prisma.event.findMany({
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
      }
    })

    // Calculate statistics
    const activeEvents = events.filter(e => e.status === 'OPEN').length

    // Calculate total confirmed registrations and waitlist
    let totalRegistrations = 0
    let waitlistCount = 0
    let totalCapacity = 0

    events.forEach(event => {
      totalCapacity += event.capacity

      event.registrations.forEach(reg => {
        if (reg.status === 'CONFIRMED') {
          totalRegistrations += reg.spotsCount
        } else if (reg.status === 'WAITLIST') {
          waitlistCount += reg.spotsCount
        }
      })
    })

    const occupancyRate = totalCapacity > 0
      ? Math.round((totalRegistrations / totalCapacity) * 100)
      : 0

    return NextResponse.json({
      activeEvents,
      totalRegistrations,
      waitlistCount,
      occupancyRate
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
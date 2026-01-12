import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        registrations: {
          select: {
            status: true,
            spotsCount: true,
            confirmationCode: true,
            createdAt: true,
            data: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate detailed stats
    const debugData = events.map(event => {
      const confirmedRegistrations = event.registrations.filter(r => r.status === 'CONFIRMED')
      const waitlistRegistrations = event.registrations.filter(r => r.status === 'WAITLIST')
      const cancelledRegistrations = event.registrations.filter(r => r.status === 'CANCELLED')

      const confirmedSpots = confirmedRegistrations.reduce((sum, r) => sum + r.spotsCount, 0)
      const waitlistSpots = waitlistRegistrations.reduce((sum, r) => sum + r.spotsCount, 0)
      const cancelledSpots = cancelledRegistrations.reduce((sum, r) => sum + r.spotsCount, 0)

      return {
        eventId: event.id,
        title: event.title,
        capacity: event.capacity,
        status: event.status,
        totalRegistrations: event.registrations.length,
        confirmedPeople: confirmedRegistrations.length,
        waitlistPeople: waitlistRegistrations.length,
        cancelledPeople: cancelledRegistrations.length,
        confirmedSpots,
        waitlistSpots,
        cancelledSpots,
        registrations: event.registrations.map(r => ({
          code: r.confirmationCode,
          status: r.status,
          spotsCount: r.spotsCount,
          createdAt: r.createdAt,
          name: (r.data as any)?.name || 'Unknown'
        }))
      }
    })

    // Calculate totals
    let totalConfirmedSpots = 0
    let totalWaitlistSpots = 0
    let totalConfirmedPeople = 0
    let totalWaitlistPeople = 0
    let activeEvents = 0

    debugData.forEach(event => {
      if (event.status === 'OPEN') activeEvents++
      totalConfirmedSpots += event.confirmedSpots
      totalWaitlistSpots += event.waitlistSpots
      totalConfirmedPeople += event.confirmedPeople
      totalWaitlistPeople += event.waitlistPeople
    })

    return NextResponse.json({
      summary: {
        activeEvents,
        totalConfirmedSpots,
        totalWaitlistSpots,
        totalConfirmedPeople,
        totalWaitlistPeople
      },
      events: debugData
    })
  } catch (error) {
    console.error('Error in debug stats:', error)
    return NextResponse.json(
      { error: 'Failed to get debug stats' },
      { status: 500 }
    )
  }
}
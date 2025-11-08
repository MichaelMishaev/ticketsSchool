import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/super/overview
 * Super Admin only - Get overview of all events across all schools with statistics
 */
export async function GET() {
  try {
    // Verify super admin access
    await requireSuperAdmin()

    // Fetch all events with school and registration data
    const events = await prisma.event.findMany({
      include: {
        school: {
          select: {
            name: true,
            slug: true,
          }
        },
        registrations: {
          select: {
            id: true,
            spotsCount: true,
            status: true,
          }
        },
        _count: {
          select: {
            registrations: true,
          }
        }
      },
      orderBy: {
        startAt: 'desc'
      }
    })

    // Calculate statistics
    const totalSchools = await prisma.school.count()
    const totalEvents = events.length
    const activeEvents = events.filter(e => e.status === 'OPEN').length

    // Calculate total registrations (confirmed only)
    const totalRegistrations = events.reduce((sum, event) => {
      const confirmedCount = event.registrations
        .filter(r => r.status === 'CONFIRMED')
        .reduce((total, r) => total + r.spotsCount, 0)
      return sum + confirmedCount
    }, 0)

    // Format events for response
    const formattedEvents = events.map(event => {
      const confirmedRegistrations = event.registrations.filter(r => r.status === 'CONFIRMED')
      const waitlistRegistrations = event.registrations.filter(r => r.status === 'WAITLIST')

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        schoolName: event.school.name,
        schoolSlug: event.school.slug,
        startAt: event.startAt.toISOString(),
        status: event.status,
        capacity: event.capacity,
        spotsReserved: event.spotsReserved,
        registrationCount: confirmedRegistrations.length,
        waitlistCount: waitlistRegistrations.length,
      }
    })

    return NextResponse.json({
      statistics: {
        totalSchools,
        totalEvents,
        totalRegistrations,
        activeEvents,
      },
      events: formattedEvents,
    })
  } catch (error) {
    console.error('Super admin overview error:', error)

    // Check if it's a forbidden error (not super admin)
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    )
  }
}

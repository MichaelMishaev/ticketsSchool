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

    // First, clean up any orphaned events (events without a valid school)
    const orphanedEvents = await prisma.event.findMany({
      where: {
        school: null
      },
      select: {
        id: true,
        title: true,
        schoolId: true
      }
    })

    if (orphanedEvents.length > 0) {
      console.warn(`Found ${orphanedEvents.length} orphaned events without valid schools:`, orphanedEvents)
      // Delete orphaned events
      await prisma.event.deleteMany({
        where: {
          school: null
        }
      })
      console.log(`Deleted ${orphanedEvents.length} orphaned events`)
    }

    // Fetch all events with school and registration data
    const events = await prisma.event.findMany({
      where: {
        school: {
          isNot: null
        }
      },
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      type: typeof error
    })

    // Check if it's a forbidden error (not super admin)
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'Failed to fetch overview data',
        details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

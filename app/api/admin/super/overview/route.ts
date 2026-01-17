import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { logger } from '@/lib/logger-v2'

/**
 * GET /api/admin/super/overview
 * Super Admin only - Get overview of all events across all schools with statistics
 */
export async function GET() {
  try {
    // Verify super admin access
    await requireSuperAdmin()

    // First, clean up any orphaned events (events without a valid school)
    // Get all valid school IDs
    const validSchools = await prisma.school.findMany({
      select: { id: true },
    })
    const validSchoolIds = new Set(validSchools.map((s) => s.id))

    // Find events with schoolIds that don't exist in schools table
    const allEvents = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        schoolId: true,
      },
    })

    const orphanedEventIds = allEvents
      .filter((event) => !validSchoolIds.has(event.schoolId))
      .map((event) => event.id)

    if (orphanedEventIds.length > 0) {
      logger.warn('Found orphaned events without valid schools', {
        source: 'super-admin',
        orphanedCount: orphanedEventIds.length,
      })
      // Delete orphaned events
      const deleted = await prisma.event.deleteMany({
        where: {
          id: {
            in: orphanedEventIds,
          },
        },
      })
      logger.info('Deleted orphaned events', { source: 'super-admin', deletedCount: deleted.count })
    }

    // Fetch all events with school and registration data
    const events = await prisma.event.findMany({
      where: {
        schoolId: {
          in: Array.from(validSchoolIds),
        },
      },
      include: {
        school: {
          select: {
            name: true,
            slug: true,
          },
        },
        registrations: {
          select: {
            id: true,
            spotsCount: true,
            status: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        startAt: 'desc',
      },
    })

    // Calculate statistics
    const totalSchools = await prisma.school.count()
    const totalEvents = events.length
    const activeEvents = events.filter((e) => e.status === 'OPEN').length

    // Calculate total registrations (confirmed only)
    const totalRegistrations = events.reduce((sum, event) => {
      const confirmedCount = event.registrations
        .filter((r) => r.status === 'CONFIRMED')
        .reduce((total, r) => total + r.spotsCount, 0)
      return sum + confirmedCount
    }, 0)

    // Format events for response
    const formattedEvents = events.map((event) => {
      const confirmedRegistrations = event.registrations.filter((r) => r.status === 'CONFIRMED')
      const waitlistRegistrations = event.registrations.filter((r) => r.status === 'WAITLIST')

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
    // Log full error details server-side only
    const requestId = randomUUID()
    logger.error('Super admin overview error', {
      source: 'super-admin',
      requestId,
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : undefined,
    })

    // Check if it's a forbidden error (not super admin)
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }

    // Return generic error to client (no internal details exposed)
    return NextResponse.json(
      {
        error: 'Failed to fetch overview data',
        requestId, // For support tracking only
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

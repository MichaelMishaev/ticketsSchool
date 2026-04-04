import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

/**
 * GET /api/events/[id]/attendance
 * Get attendance data (no-shows) for post-event review
 * Shows who didn't check in and their attendance history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id: eventId } = await params

    // Fetch event with school access check
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        startAt: true,
        schoolId: true,
        registrations: {
          where: {
            status: { in: ['CONFIRMED', 'WAITLIST'] }
          },
          select: {
            id: true,
            data: true,
            spotsCount: true,
            guestsCount: true,
            confirmationCode: true,
            phoneNumber: true,
            email: true,
            status: true,
            checkIn: {
              select: {
                id: true,
                checkedInAt: true,
                undoneAt: true
              }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify school access
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Separate checked-in and no-shows
    const checkedIn = event.registrations.filter(
      r => r.checkIn && !r.checkIn.undoneAt
    )
    const noShows = event.registrations.filter(
      r => !r.checkIn || r.checkIn.undoneAt
    )

    // Calculate stats
    const stats = {
      total: event.registrations.length,
      checkedIn: checkedIn.length,
      noShows: noShows.length,
      attendanceRate: event.registrations.length > 0
        ? Math.round((checkedIn.length / event.registrations.length) * 100)
        : 0
    }

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        startAt: event.startAt
      },
      stats,
      noShows: noShows.map(reg => {
        // Safely extract name from JsonValue data
        const data = reg.data as Record<string, unknown> | null
        const name = data && typeof data === 'object'
          ? (data.name as string) || (data.childName as string) || 'אורח'
          : 'אורח'

        return {
          id: reg.id,
          name,
          phone: reg.phoneNumber,
          email: reg.email,
          spotsCount: reg.spotsCount || reg.guestsCount || 1,
          confirmationCode: reg.confirmationCode,
          status: reg.status
        }
      })
    })
  } catch (error) {
    logger.error('Error fetching attendance data', { source: 'events', error })
    return NextResponse.json(
      { error: 'Failed to load attendance data' },
      { status: 500 }
    )
  }
}

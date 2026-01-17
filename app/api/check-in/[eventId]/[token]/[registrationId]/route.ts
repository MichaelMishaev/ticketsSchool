import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateCheckInTokenFormat } from '@/lib/check-in-token'
import { logger } from '@/lib/logger-v2'

/**
 * DELETE /api/check-in/[eventId]/[token]/[registrationId]
 * Undo a check-in (mark as undone, don't delete)
 * Only allowed on the day of the event
 */
export async function DELETE(
  request: NextRequest,
  {
    params
  }: { params: Promise<{ eventId: string; token: string; registrationId: string }> }
) {
  try {
    const { eventId, token, registrationId } = await params
    const body = await request.json().catch(() => ({}))
    const { undoneBy, undoneReason } = body

    // Validate token format
    if (!validateCheckInTokenFormat(token)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
    }

    // Verify event exists and token matches
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, checkInToken: true, startAt: true }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.checkInToken !== token) {
      return NextResponse.json({ error: 'Invalid check-in token' }, { status: 401 })
    }

    // Verify undo is only allowed on event day
    const now = new Date()
    const eventDate = new Date(event.startAt)

    // Compare dates (ignore time)
    const isSameDay =
      now.getFullYear() === eventDate.getFullYear() &&
      now.getMonth() === eventDate.getMonth() &&
      now.getDate() === eventDate.getDate()

    if (!isSameDay) {
      const isBeforeEvent = now < eventDate
      return NextResponse.json(
        {
          error: isBeforeEvent
            ? 'ניתן לבטל נוכחות רק ביום האירוע'
            : 'האירוע הסתיים, לא ניתן לבטל נוכחות'
        },
        { status: 403 }
      )
    }

    // Find check-in record
    const checkIn = await prisma.checkIn.findUnique({
      where: { registrationId },
      include: {
        registration: {
          select: { eventId: true }
        }
      }
    })

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in record not found' },
        { status: 404 }
      )
    }

    // Verify registration belongs to this event
    if (checkIn.registration.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Registration is for a different event' },
        { status: 400 }
      )
    }

    // Check if already undone
    if (checkIn.undoneAt) {
      return NextResponse.json(
        { error: 'Check-in already undone' },
        { status: 400 }
      )
    }

    // Mark as undone (keep record for audit trail)
    const updatedCheckIn = await prisma.checkIn.update({
      where: { id: checkIn.id },
      data: {
        undoneAt: new Date(),
        undoneBy: undoneBy || null,
        undoneReason: undoneReason || null
      }
    })

    return NextResponse.json({
      success: true,
      checkIn: {
        id: updatedCheckIn.id,
        undoneAt: updatedCheckIn.undoneAt,
        undoneBy: updatedCheckIn.undoneBy
      }
    })
  } catch (error) {
    logger.error('Error undoing check-in', { source: 'check-in', error })
    return NextResponse.json(
      { error: 'Failed to undo check-in' },
      { status: 500 }
    )
  }
}

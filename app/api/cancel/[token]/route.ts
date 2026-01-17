import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

/**
 * GET /api/cancel/[token]
 * Verify cancellation token and return registration details
 * Public endpoint (no auth required - token-based)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Verify JWT token
    let decoded: { eventId: string; phone: string }

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired cancellation link' },
        { status: 400 }
      )
    }

    // Find registration
    const registration = await prisma.registration.findFirst({
      where: {
        eventId: decoded.eventId,
        phoneNumber: decoded.phone,
        status: { in: ['CONFIRMED', 'WAITLIST'] }
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            location: true,
            allowCancellation: true,
            cancellationDeadlineHours: true,
            requireCancellationReason: true,
            eventType: true
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        {
          canCancel: false,
          error: 'Registration not found or already cancelled'
        },
        { status: 404 }
      )
    }

    // Check if cancellation is allowed
    if (!registration.event.allowCancellation) {
      return NextResponse.json(
        {
          canCancel: false,
          error: 'Cancellation is not allowed for this event'
        },
        { status: 403 }
      )
    }

    // Check deadline
    const hoursUntilEvent =
      (new Date(registration.event.startAt).getTime() - Date.now()) / (1000 * 60 * 60)

    if (hoursUntilEvent < registration.event.cancellationDeadlineHours) {
      return NextResponse.json(
        {
          canCancel: false,
          error: `Cannot cancel less than ${registration.event.cancellationDeadlineHours} hours before event`,
          hoursUntilEvent: Math.round(hoursUntilEvent * 10) / 10
        },
        { status: 403 }
      )
    }

    // Return cancellation preview
    return NextResponse.json({
      canCancel: true,
      registration: {
        id: registration.id,
        confirmationCode: registration.confirmationCode,
        status: registration.status,
        guestsCount: registration.guestsCount,
        spotsCount: registration.spotsCount,
        phoneNumber: registration.phoneNumber,
        data: registration.data
      },
      event: {
        title: registration.event.title,
        startAt: registration.event.startAt,
        location: registration.event.location,
        eventType: registration.event.eventType,
        requireCancellationReason: registration.event.requireCancellationReason
      },
      hoursUntilEvent: Math.round(hoursUntilEvent * 10) / 10
    })
  } catch (error) {
    logger.error('Cancellation preview error', { source: 'registration', error })
    return NextResponse.json(
      { error: 'Failed to load cancellation details' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cancel/[token]
 * Execute cancellation
 * Public endpoint (no auth required - token-based)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { reason } = body

    // Import cancellation logic
    const { cancelReservation } = await import('@/lib/cancellation')

    // Execute cancellation
    const result = await cancelReservation(token, reason)

    return NextResponse.json({
      success: true,
      message: 'Reservation cancelled successfully'
    })
  } catch (error: any) {
    logger.error('Cancellation error', { source: 'registration', error })

    // Return user-friendly error message
    return NextResponse.json(
      { error: error.message || 'Failed to cancel reservation' },
      { status: 400 }
    )
  }
}

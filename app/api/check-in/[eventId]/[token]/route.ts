import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateCheckInTokenFormat } from '@/lib/check-in-token'
import { validateQRCodeData } from '@/lib/qr-code'

/**
 * GET /api/check-in/[eventId]/[token]
 * Get registration list for check-in page (public, but token-protected)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; token: string }> }
) {
  try {
    const { eventId, token } = await params

    // Validate token format
    if (!validateCheckInTokenFormat(token)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
    }

    // Verify event exists and token matches
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        location: true,
        startAt: true,
        endAt: true,
        checkInToken: true,
        schoolId: true,
        registrations: {
          where: {
            status: { in: ['CONFIRMED', 'WAITLIST'] }, // Only show non-cancelled
          },
          select: {
            id: true,
            data: true,
            spotsCount: true,
            guestsCount: true,
            status: true,
            confirmationCode: true,
            phoneNumber: true,
            qrCode: true,
            checkIn: {
              select: {
                id: true,
                checkedInAt: true,
                checkedInBy: true,
                undoneAt: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify token matches
    if (event.checkInToken !== token) {
      return NextResponse.json({ error: 'Invalid check-in token' }, { status: 401 })
    }

    // Get active bans for this school (to show in UI)
    const activeBans = await prisma.userBan.findMany({
      where: {
        schoolId: event.schoolId,
        active: true,
        OR: [
          { expiresAt: { gte: new Date() } }, // Date-based not expired
          { expiresAt: null }, // Game-based
        ],
      },
      select: {
        phoneNumber: true,
        reason: true,
        bannedGamesCount: true,
        eventsBlocked: true,
        expiresAt: true,
      },
    })

    // Create a map for quick lookup
    const banMap = new Map(
      activeBans.map((ban) => [
        ban.phoneNumber,
        {
          reason: ban.reason,
          remainingGames: ban.expiresAt ? null : ban.bannedGamesCount - ban.eventsBlocked,
          expiresAt: ban.expiresAt,
        },
      ])
    )

    // Enhance registrations with ban info
    const enhancedRegistrations = event.registrations.map((reg) => ({
      ...reg,
      banned: reg.phoneNumber ? banMap.get(reg.phoneNumber) : null,
    }))

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        location: event.location,
        startAt: event.startAt,
        endAt: event.endAt,
      },
      registrations: enhancedRegistrations,
    })
  } catch (error) {
    console.error('Error fetching check-in data:', error)
    return NextResponse.json({ error: 'Failed to load check-in data' }, { status: 500 })
  }
}

/**
 * POST /api/check-in/[eventId]/[token]
 * Check in a registration (by ID or QR code)
 * Only allowed on the day of the event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; token: string }> }
) {
  try {
    const { eventId, token } = await params
    const body = await request.json()
    const { registrationId, qrCode, checkedInBy } = body

    // Validate token format
    if (!validateCheckInTokenFormat(token)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
    }

    // Verify event exists and token matches
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, checkInToken: true, startAt: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.checkInToken !== token) {
      return NextResponse.json({ error: 'Invalid check-in token' }, { status: 401 })
    }

    // Verify check-in is only allowed on event day
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
            ? 'ניתן לרשום נוכחות רק ביום האירוע'
            : 'האירוע הסתיים, לא ניתן לרשום נוכחות',
        },
        { status: 403 }
      )
    }

    // Calculate lateness (30-minute grace period)
    const GRACE_PERIOD_MINUTES = 30
    const checkedInAt = now // Use the current time
    const eventStartAt = new Date(event.startAt)

    let isLate = false
    let minutesLate: number | null = null

    // Only calculate lateness if checking in after event start
    if (isSameDay && checkedInAt > eventStartAt) {
      const diffMs = checkedInAt.getTime() - eventStartAt.getTime()
      const diffMinutes = Math.floor(diffMs / 60000)

      if (diffMinutes > GRACE_PERIOD_MINUTES) {
        isLate = true
        minutesLate = diffMinutes
      }
    }

    // Find registration by ID or QR code
    let regId = registrationId

    if (qrCode && !regId) {
      // Validate QR code
      const qrValidation = validateQRCodeData(qrCode)

      if (!qrValidation.valid) {
        return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 })
      }

      // Verify event ID matches
      if (qrValidation.eventId !== eventId) {
        return NextResponse.json({ error: 'QR code is for a different event' }, { status: 400 })
      }

      regId = qrValidation.registrationId
    }

    if (!regId) {
      return NextResponse.json({ error: 'Registration ID or QR code required' }, { status: 400 })
    }

    // Check if registration exists and belongs to this event
    const registration = await prisma.registration.findUnique({
      where: { id: regId },
      select: {
        id: true,
        eventId: true,
        status: true,
        checkIn: true,
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (registration.eventId !== eventId) {
      return NextResponse.json({ error: 'Registration is for a different event' }, { status: 400 })
    }

    if (registration.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Registration is cancelled' }, { status: 400 })
    }

    // Prevent checking in waitlist registrations
    if (registration.status === 'WAITLIST') {
      return NextResponse.json(
        { error: 'לא ניתן לרשום נוכחות לרשימת המתנה. יש לשבץ לשולחן תחילה.' },
        { status: 400 }
      )
    }

    // Check if already checked in (and not undone)
    if (registration.checkIn && !registration.checkIn.undoneAt) {
      return NextResponse.json(
        { error: 'כבר נכח' }, // Already checked in
        { status: 400 }
      )
    }

    // Create or update check-in record
    let checkIn
    if (registration.checkIn && registration.checkIn.undoneAt) {
      // If check-in was undone, re-check-in by updating the existing record
      checkIn = await prisma.checkIn.update({
        where: { id: registration.checkIn.id },
        data: {
          checkedInAt: new Date(),
          checkedInBy: checkedInBy || null,
          undoneAt: null,
          undoneBy: null,
          undoneReason: null,
        },
      })
    } else {
      // Create new check-in record
      checkIn = await prisma.checkIn.create({
        data: {
          registrationId: regId,
          checkedInBy: checkedInBy || null,
          isLate,
          minutesLate,
        },
      })
    }

    return NextResponse.json({
      success: true,
      checkIn: {
        id: checkIn.id,
        checkedInAt: checkIn.checkedInAt,
        checkedInBy: checkIn.checkedInBy,
        isLate: checkIn.isLate,
        minutesLate: checkIn.minutesLate,
      },
    })
  } catch (error: unknown) {
    console.error('Error checking in:', error)

    // Handle unique constraint violation (already checked in)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'כבר נכח' }, // Already checked in
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
  }
}

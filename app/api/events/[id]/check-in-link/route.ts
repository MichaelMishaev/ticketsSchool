import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth.server'
import { generateCheckInToken, validateCheckInTokenFormat } from '@/lib/check-in-token'
import { logger } from '@/lib/logger-v2'

/**
 * GET /api/events/[id]/check-in-link
 * Get or generate check-in link for an event (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id: eventId } = await params

    // Get event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        schoolId: true,
        checkInToken: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check access (multi-tenant isolation)
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If no token exists or token is invalid (e.g., placeholder "CHECKIN_TOKEN"), generate a new one
    let token = event.checkInToken
    if (!token || !validateCheckInTokenFormat(token)) {
      token = generateCheckInToken()
      await prisma.event.update({
        where: { id: eventId },
        data: { checkInToken: token }
      })
    }

    // Build check-in URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'
    const checkInUrl = `${baseUrl}/check-in/${eventId}/${token}`

    return NextResponse.json({
      token,
      url: checkInUrl,
      eventTitle: event.title
    })
  } catch (error) {
    logger.error('Error getting check-in link', { source: 'events', error })
    return NextResponse.json(
      { error: 'Failed to get check-in link' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/events/[id]/check-in-link/regenerate
 * Regenerate check-in token (invalidates old link)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id: eventId } = await params

    // Get event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        schoolId: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check access
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Generate new token (invalidates old one)
    const newToken = generateCheckInToken()
    await prisma.event.update({
      where: { id: eventId },
      data: { checkInToken: newToken }
    })

    // Build new URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'
    const checkInUrl = `${baseUrl}/check-in/${eventId}/${newToken}`

    return NextResponse.json({
      token: newToken,
      url: checkInUrl,
      eventTitle: event.title,
      message: 'Check-in link regenerated successfully. Old link is now invalid.'
    })
  } catch (error) {
    logger.error('Error regenerating check-in link', { source: 'events', error })
    return NextResponse.json(
      { error: 'Failed to regenerate check-in link' },
      { status: 500 }
    )
  }
}

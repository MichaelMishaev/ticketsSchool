import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

// Disable caching for this route to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/p/[schoolSlug]/[eventSlug]
 * Fetch event by school slug + event slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolSlug: string; eventSlug: string }> }
) {
  try {
    const { schoolSlug, eventSlug } = await params

    // First, verify the school exists
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true
      }
    })

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    // Find the event by slug AND schoolId (for security/isolation)
    const event = await prisma.event.findFirst({
      where: {
        slug: eventSlug,
        schoolId: school.id
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true
          }
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: 'CONFIRMED'
              }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Calculate total spots taken
    const confirmedRegistrations = await prisma.registration.findMany({
      where: {
        eventId: event.id,
        status: 'CONFIRMED'
      },
      select: {
        spotsCount: true
      }
    })

    const totalSpotsTaken = confirmedRegistrations.reduce(
      (sum, reg) => sum + reg.spotsCount,
      0
    )

    // For TABLE_BASED events, get max table capacity
    let maxTableCapacity = null
    if (event.eventType === 'TABLE_BASED') {
      const tables = await prisma.table.findMany({
        where: { eventId: event.id },
        select: { capacity: true }
      })
      maxTableCapacity = tables.length > 0
        ? Math.max(...tables.map(t => t.capacity))
        : 12 // fallback
    }

    const response = NextResponse.json({
      type: 'event',
      id: event.id,
      title: event.title,
      description: event.description,
      gameType: event.gameType,
      location: event.location,
      startAt: event.startAt,
      endAt: event.endAt,
      capacity: event.capacity,
      status: event.status,
      eventType: event.eventType,
      allowCancellation: event.allowCancellation,
      maxTableCapacity: maxTableCapacity,
      maxSpotsPerPerson: event.maxSpotsPerPerson,
      fieldsSchema: event.fieldsSchema,
      conditions: event.conditions,
      requireAcceptance: event.requireAcceptance,
      completionMessage: event.completionMessage,
      // CRITICAL: Payment fields must be included for frontend payment flow
      paymentRequired: event.paymentRequired,
      paymentTiming: event.paymentTiming,
      pricingModel: event.pricingModel,
      priceAmount: event.priceAmount ? Number(event.priceAmount) : null,
      currency: event.currency,
      school: event.school,
      _count: event._count,
      totalSpotsTaken
    })

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    logger.error('Error fetching event', { source: 'public-api', error })
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolSlug: string }> }
) {
  try {
    const { schoolSlug } = await params;
    const slug = schoolSlug; // Keep slug variable for backwards compatibility below

    // First, check if this is a school slug
    const school = await prisma.school.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true
      }
    })

    // If it's a school, return school landing page data
    if (school) {
      // Get all OPEN events for this school, ordered by start date
      const events = await prisma.event.findMany({
        where: {
          schoolId: school.id,
          status: 'OPEN'
        },
        orderBy: {
          startAt: 'asc'
        },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          gameType: true,
          location: true,
          startAt: true,
          endAt: true,
          capacity: true,
          status: true
        }
      })

      // Calculate spots for each event
      const eventsWithSpots = await Promise.all(
        events.map(async (event) => {
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

          return {
            ...event,
            totalSpotsTaken,
            spotsLeft: event.capacity - totalSpotsTaken
          }
        })
      )

      return NextResponse.json({
        type: 'school',
        school,
        events: eventsWithSpots
      })
    }

    // If not a school, return 404
    // Events now use /p/[schoolSlug]/[eventSlug] format
    return NextResponse.json(
      { error: 'School not found. Events should use /p/{school-slug}/{event-slug} format.' },
      { status: 404 }
    )
  } catch (error) {
    logger.error('Error fetching school/events', { source: 'public-api', error })
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}
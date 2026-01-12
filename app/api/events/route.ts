import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EventFormData } from '@/types'
import { getCurrentAdmin } from '@/lib/auth.server'

/**
 * Hebrew to English transliteration map
 * Maps each Hebrew letter to its English equivalent
 */
const hebrewToEnglish: Record<string, string> = {
  'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'ch',
  'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n',
  'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'p', 'צ': 'tz', 'ץ': 'tz', 'ק': 'k',
  'ר': 'r', 'ש': 'sh', 'ת': 't'
}

/**
 * Transliterate Hebrew text to English
 * Example: "כדורסל" -> "kdvrsl"
 */
function transliterateHebrew(text: string): string {
  return text.split('').map(char => hebrewToEnglish[char] || char).join('')
}

/**
 * Generate a URL-friendly slug from text
 * Example: "Basketball Game 2024" -> "basketball-game-2024"
 * Example: "כדורסל 2024" -> "kdvrsl-2024" (transliterated)
 * Example: "משחק השנה" -> "mschk-hshnh"
 */
function createSlugFromText(text: string): string {
  // First, transliterate Hebrew to English
  const transliterated = transliterateHebrew(text)

  const slug = transliterated
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces, hyphens, and numbers
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 60) // Limit length

  // If slug is empty or just numbers, use "event" prefix
  if (!slug || /^\d+$/.test(slug)) {
    return slug ? `event-${slug}` : 'event'
  }

  return slug
}

/**
 * Generate a unique slug for an event
 * If slug exists, append a number (e.g., "basketball-game-2")
 */
async function generateUniqueSlug(title: string, schoolId: string): Promise<string> {
  const baseSlug = createSlugFromText(title)

  // Check if slug already exists for this school
  const existingEvent = await prisma.event.findUnique({
    where: { slug: baseSlug }
  })

  if (!existingEvent) {
    return baseSlug
  }

  // If exists, find a unique variant by appending numbers
  let counter = 2
  let uniqueSlug = `${baseSlug}-${counter}`

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    counter++
    uniqueSlug = `${baseSlug}-${counter}`

    // Safety limit
    if (counter > 100) {
      // Fallback to random if too many duplicates
      return `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`
    }
  }

  return uniqueSlug
}

export async function GET(request: NextRequest) {
  try {
    // Get current admin session
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build where clause based on admin role
    const where: any = {}

    // Regular admins can only see their school's events (all roles except SUPER_ADMIN)
    if (admin.role !== 'SUPER_ADMIN') {
      // CRITICAL: Non-super admins MUST have a schoolId to prevent seeing all events
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned. Please logout and login again.' },
          { status: 403 }
        )
      }
      where.schoolId = admin.schoolId
    }

    // Super admins can filter by school via query param or see all schools
    if (admin.role === 'SUPER_ADMIN') {
      const url = new URL(request.url)
      const schoolId = url.searchParams.get('schoolId')
      if (schoolId) {
        where.schoolId = schoolId
      }
      // If no schoolId param, SUPER_ADMIN sees all schools
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: { registrations: true }
        },
        registrations: {
          where: {
            status: 'CONFIRMED'
          },
          select: {
            spotsCount: true
          }
        },
        tables: {
          select: {
            capacity: true,
            status: true,
            reservation: {
              select: {
                guestsCount: true,
                spotsCount: true
              }
            }
          }
        }
      }
    })

    // Calculate total spots taken and table capacity for each event
    const eventsWithSpots = events.map(event => {
      let totalSpotsTaken = 0
      let totalCapacity = event.capacity

      // For TABLE_BASED events, count guests from reserved tables
      if (event.eventType === 'TABLE_BASED') {
        totalCapacity = event.tables.reduce((sum, table) => sum + table.capacity, 0)
        totalSpotsTaken = event.tables.reduce((sum, table) => {
          if (table.reservation) {
            return sum + (table.reservation.guestsCount || table.reservation.spotsCount || 0)
          }
          return sum
        }, 0)
      } else {
        // For CAPACITY_BASED events, count confirmed registrations
        totalSpotsTaken = event.registrations.reduce(
          (sum, reg) => sum + reg.spotsCount,
          0
        )
      }

      // Remove registrations and tables arrays from response and add calculated values
      const { registrations, tables, ...eventData } = event
      return {
        ...eventData,
        totalSpotsTaken,
        totalCapacity
      }
    })

    return NextResponse.json(eventsWithSpots)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current admin session
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data: EventFormData = await request.json()

    // Determine schoolId
    let schoolId: string | undefined

    // Regular admins can ONLY create events for their school (all roles except SUPER_ADMIN)
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 400 }
        )
      }
      schoolId = admin.schoolId
    }

    // Super admins can specify schoolId or use their assigned school
    if (admin.role === 'SUPER_ADMIN') {
      schoolId = (data as any).schoolId || admin.schoolId
    }

    // Validate schoolId exists
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!data.title || !data.startAt) {
      return NextResponse.json(
        { error: 'Title and start date are required' },
        { status: 400 }
      )
    }

    // Validate dates
    const startAt = new Date(data.startAt)
    if (isNaN(startAt.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start date' },
        { status: 400 }
      )
    }

    let endAt = null
    if (data.endAt) {
      endAt = new Date(data.endAt)
      if (isNaN(endAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date' },
          { status: 400 }
        )
      }
    }

    // Validate numbers
    const capacity = Number(data.capacity)
    const maxSpotsPerPerson = Number(data.maxSpotsPerPerson)

    // For CAPACITY_BASED events, validate capacity
    // For TABLE_BASED events, capacity is not used (set to 0)
    const eventType = (data as any).eventType || 'CAPACITY_BASED'
    if (eventType === 'CAPACITY_BASED') {
      if (isNaN(capacity) || capacity < 1) {
        return NextResponse.json(
          { error: 'Capacity must be a positive number' },
          { status: 400 }
        )
      }

      if (isNaN(maxSpotsPerPerson) || maxSpotsPerPerson < 1) {
        return NextResponse.json(
          { error: 'Max spots per person must be a positive number' },
          { status: 400 }
        )
      }
    }

    // Generate unique slug from event title
    const slug = await generateUniqueSlug(data.title, schoolId)

    const event = await prisma.event.create({
      data: {
        slug,
        schoolId,  // NEW: Set school context
        title: data.title,
        description: data.description,
        gameType: data.gameType,
        location: data.location,
        startAt: startAt,
        endAt: endAt,
        capacity: capacity,
        maxSpotsPerPerson: maxSpotsPerPerson,
        fieldsSchema: data.fieldsSchema as any,
        conditions: data.conditions,
        requireAcceptance: data.requireAcceptance,
        completionMessage: data.completionMessage,
        // Table-based event fields
        eventType: (data as any).eventType || 'CAPACITY_BASED',
        allowCancellation: (data as any).allowCancellation ?? true,
        cancellationDeadlineHours: (data as any).cancellationDeadlineHours ?? 2,
        requireCancellationReason: (data as any).requireCancellationReason ?? false,
        // Payment fields (Tier 2: Event Ticketing - YaadPay)
        paymentRequired: (data as any).paymentRequired ?? false,
        paymentTiming: (data as any).paymentTiming ?? 'OPTIONAL',
        pricingModel: (data as any).pricingModel ?? 'FREE',
        priceAmount: (data as any).priceAmount ? Number((data as any).priceAmount) : null,
        currency: (data as any).currency || 'ILS',
      },
      include: {
        school: true
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
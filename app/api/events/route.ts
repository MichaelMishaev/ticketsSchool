import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EventFormData } from '@/types'
import { getCurrentAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

/**
 * Hebrew to English transliteration map
 * Maps each Hebrew letter to its English equivalent
 */
const hebrewToEnglish: Record<string, string> = {
  א: 'a',
  ב: 'b',
  ג: 'g',
  ד: 'd',
  ה: 'h',
  ו: 'v',
  ז: 'z',
  ח: 'ch',
  ט: 't',
  י: 'y',
  כ: 'k',
  ך: 'k',
  ל: 'l',
  מ: 'm',
  ם: 'm',
  נ: 'n',
  ן: 'n',
  ס: 's',
  ע: 'a',
  פ: 'p',
  ף: 'p',
  צ: 'tz',
  ץ: 'tz',
  ק: 'k',
  ר: 'r',
  ש: 'sh',
  ת: 't',
}

/**
 * Transliterate Hebrew text to English
 * Example: "כדורסל" -> "kdvrsl"
 */
function transliterateHebrew(text: string): string {
  return text
    .split('')
    .map((char) => hebrewToEnglish[char] || char)
    .join('')
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
    where: { slug: baseSlug },
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

const ALLOWED_FIELD_TYPES = [
  'text',
  'select',
  'number',
  'phone',
  'email',
  'checkbox',
  'textarea',
  'date',
] as const

/**
 * Validate fieldsSchema before storing in the database.
 * Returns true if valid, false otherwise.
 */
function validateFieldsSchema(schema: unknown): boolean {
  if (schema === null || schema === undefined) return true
  if (!Array.isArray(schema)) return false

  for (const field of schema) {
    if (typeof field !== 'object' || field === null) return false

    const f = field as Record<string, unknown>

    // id: non-empty string, alphanumeric + underscores only
    if (typeof f.id !== 'string' || !/^[a-zA-Z0-9_]+$/.test(f.id)) return false

    // type: must be one of the allowed values
    if (typeof f.type !== 'string' || !(ALLOWED_FIELD_TYPES as readonly string[]).includes(f.type))
      return false

    // label: non-empty string
    if (typeof f.label !== 'string' || f.label.trim() === '') return false

    // required: must be boolean
    if (typeof f.required !== 'boolean') return false

    // options: required for select fields, must be non-empty array of strings
    if (f.type === 'select') {
      if (!Array.isArray(f.options) || f.options.length === 0) return false
      if (!f.options.every((o: unknown) => typeof o === 'string')) return false
    }
  }

  return true
}

export async function GET(request: NextRequest) {
  try {
    // Get current admin session
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build where clause based on admin role
    // Always exclude soft-deleted events
    const where: any = {
      deletedAt: null, // Only show active (non-deleted) events
    }

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

    // Step 1: Slim event select (no registration/table includes)
    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
        maxSpotsPerPerson: true,
        status: true,
        deletedAt: true,
        eventType: true,
        spotsReserved: true,
        fieldsSchema: true,
        paymentRequired: true,
        paymentTiming: true,
        pricingModel: true,
        priceAmount: true,
        currency: true,
        allowCancellation: true,
        cancellationDeadlineHours: true,
        requireCancellationReason: true,
        schoolId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { registrations: true } },
        school: { select: { id: true, name: true, slug: true } },
      },
    })

    const eventIds = events.map((e) => e.id)

    // Step 2: Parallel aggregations (only if there are events)
    const [regGroups, tableRows] =
      eventIds.length > 0
        ? await Promise.all([
            prisma.registration.groupBy({
              by: ['eventId'],
              where: { eventId: { in: eventIds }, status: 'CONFIRMED' },
              _sum: { spotsCount: true },
            }),
            prisma.table.findMany({
              where: { eventId: { in: eventIds } },
              select: {
                eventId: true,
                capacity: true,
                status: true,
                reservation: { select: { guestsCount: true, spotsCount: true } },
              },
            }),
          ])
        : [[], []]

    // Build lookups
    const confirmedSpotsByEvent: Record<string, number> = {}
    for (const g of regGroups) confirmedSpotsByEvent[g.eventId] = g._sum.spotsCount ?? 0

    const tableDataByEvent: Record<string, { totalCapacity: number; totalSpotsTaken: number }> = {}
    for (const table of tableRows) {
      if (!tableDataByEvent[table.eventId])
        tableDataByEvent[table.eventId] = { totalCapacity: 0, totalSpotsTaken: 0 }
      tableDataByEvent[table.eventId].totalCapacity += table.capacity
      if (table.reservation) {
        tableDataByEvent[table.eventId].totalSpotsTaken +=
          table.reservation.guestsCount ?? table.reservation.spotsCount ?? 0
      }
    }

    // Step 3: Map response — same shape as before
    const eventsWithSpots = events.map((event) => {
      let totalSpotsTaken: number
      let totalCapacity: number

      if (event.eventType === 'TABLE_BASED') {
        const td = tableDataByEvent[event.id] ?? { totalCapacity: 0, totalSpotsTaken: 0 }
        totalCapacity = td.totalCapacity
        totalSpotsTaken = td.totalSpotsTaken
      } else {
        totalCapacity = event.capacity
        totalSpotsTaken = confirmedSpotsByEvent[event.id] ?? 0
      }

      return { ...event, totalSpotsTaken, totalCapacity }
    })

    return NextResponse.json(eventsWithSpots)
  } catch (error) {
    logger.error('Error fetching events', { source: 'events', error })
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current admin session
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: EventFormData = await request.json()

    // Determine schoolId
    let schoolId: string | undefined

    // Regular admins can ONLY create events for their school (all roles except SUPER_ADMIN)
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 400 })
      }
      schoolId = admin.schoolId
    }

    // Super admins can specify schoolId or use their assigned school
    if (admin.role === 'SUPER_ADMIN') {
      schoolId = (data as any).schoolId || admin.schoolId
    }

    // Validate schoolId exists
    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 })
    }

    // Validate required fields
    if (!data.title || !data.startAt) {
      return NextResponse.json({ error: 'Title and start date are required' }, { status: 400 })
    }

    // Validate dates
    const startAt = new Date(data.startAt)
    if (isNaN(startAt.getTime())) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 })
    }

    // Prevent creating events with past dates
    const now = new Date()
    if (startAt < now) {
      return NextResponse.json(
        { error: 'לא ניתן ליצור אירוע עם תאריך ושעה שעברו' },
        { status: 400 }
      )
    }

    let endAt: Date | null = null
    if (data.endAt) {
      endAt = new Date(data.endAt)
      if (isNaN(endAt.getTime())) {
        return NextResponse.json({ error: 'Invalid end date' }, { status: 400 })
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
        return NextResponse.json({ error: 'Capacity must be a positive number' }, { status: 400 })
      }

      if (isNaN(maxSpotsPerPerson) || maxSpotsPerPerson < 1) {
        return NextResponse.json(
          { error: 'Max spots per person must be a positive number' },
          { status: 400 }
        )
      }
    }

    // Validate fieldsSchema structure before storing
    if (!validateFieldsSchema(data.fieldsSchema)) {
      return NextResponse.json({ error: 'Invalid fields schema structure' }, { status: 400 })
    }

    // Generate unique slug from event title
    const slug = await generateUniqueSlug(data.title, schoolId)

    const event = await prisma.event.create({
      data: {
        slug,
        schoolId, // NEW: Set school context
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
        school: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    logger.error('Error creating event', { source: 'events', error })
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

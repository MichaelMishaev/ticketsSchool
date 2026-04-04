import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin, requireSchoolAccess } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        school: true,
        registrations: {
          orderBy: { createdAt: 'desc' },
        },
        tables: {
          select: {
            capacity: true,
            status: true,
            reservation: {
              select: {
                guestsCount: true,
                spotsCount: true,
              },
            },
          },
        },
      },
    })

    // Check if event exists and is not soft-deleted
    if (!event || event.deletedAt !== null) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check school access (all roles except SUPER_ADMIN must match schoolId)
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json(
        { error: "Forbidden: No access to this school's events" },
        { status: 403 }
      )
    }

    // Calculate total capacity and spots taken for TABLE_BASED events
    let totalCapacity = event.capacity
    let totalSpotsTaken = 0

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
      totalSpotsTaken = event.registrations
        .filter((r) => r.status === 'CONFIRMED')
        .reduce((sum, reg) => sum + (reg.spotsCount || 0), 0)
    }

    // Add totalCapacity and totalSpotsTaken to response
    const { tables, ...eventData } = event
    return NextResponse.json({
      ...eventData,
      totalCapacity,
      totalSpotsTaken,
    })
  } catch (error) {
    logger.error('Error fetching event', { source: 'events', error })
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Check event exists and get school
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { schoolId: true },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check school access (all roles except SUPER_ADMIN must match schoolId)
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== existingEvent.schoolId) {
      return NextResponse.json(
        { error: "Forbidden: No access to this school's events" },
        { status: 403 }
      )
    }

    const updateData: any = {}

    // Update all provided fields
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.gameType !== undefined) updateData.gameType = data.gameType
    if (data.location !== undefined) updateData.location = data.location

    // Handle datetime fields
    if (data.startAt !== undefined) {
      updateData.startAt = new Date(data.startAt)
    }
    if (data.endAt !== undefined) {
      updateData.endAt = data.endAt ? new Date(data.endAt) : null
    }
    if (data.capacity !== undefined) updateData.capacity = parseInt(data.capacity)
    if (data.maxSpotsPerPerson !== undefined)
      updateData.maxSpotsPerPerson = parseInt(data.maxSpotsPerPerson)
    if (data.fieldsSchema !== undefined) {
      if (!validateFieldsSchema(data.fieldsSchema)) {
        return NextResponse.json({ error: 'Invalid fields schema structure' }, { status: 400 })
      }
      updateData.fieldsSchema = data.fieldsSchema
    }
    if (data.conditions !== undefined) updateData.conditions = data.conditions
    if (data.requireAcceptance !== undefined) updateData.requireAcceptance = data.requireAcceptance
    if (data.completionMessage !== undefined) updateData.completionMessage = data.completionMessage
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage
    if (data.status !== undefined) updateData.status = data.status

    // Payment settings (Tier 2: Event Ticketing - YaadPay)
    if (data.paymentRequired !== undefined) updateData.paymentRequired = data.paymentRequired
    if (data.paymentTiming !== undefined) updateData.paymentTiming = data.paymentTiming
    if (data.pricingModel !== undefined) updateData.pricingModel = data.pricingModel
    if (data.priceAmount !== undefined) updateData.priceAmount = data.priceAmount
    if (data.currency !== undefined) updateData.currency = data.currency

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        school: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    logger.error('Error updating event', { source: 'events', error })
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if event exists and get registration count + school
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        schoolId: true,
        _count: {
          select: { registrations: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check school access (all roles except SUPER_ADMIN must match schoolId)
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json(
        { error: "Forbidden: No access to this school's events" },
        { status: 403 }
      )
    }

    // Only allow deletion of events with no registrations (temp events)
    if (event._count.registrations > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete event with existing registrations. Please remove all registrations first.',
        },
        { status: 400 }
      )
    }

    // Soft delete - set deletedAt timestamp instead of hard delete
    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true, message: 'Event archived successfully' })
  } catch (error) {
    logger.error('Error deleting event', { source: 'events', error })
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}

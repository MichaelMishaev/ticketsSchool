/**
 * @LOCKED
 * Reason: Business-critical event details API with multi-tenant isolation
 * Scope:
 *   - Event fetching with registrations
 *   - Multi-tenant access control (CRITICAL)
 *   - School ownership validation
 * See: /docs/infrastructure/GOLDEN_PATHS.md#REGISTRATION_ADMIN_VIEW_V1
 *
 * Multi-Tenant Enforcement Pattern (NON-NEGOTIABLE):
 *   const event = await prisma.event.findUnique({ where: { id }, include: { school: true } })
 *
 *   if (admin.role !== 'SUPER_ADMIN' && event.schoolId !== admin.schoolId) {
 *     return NextResponse.json({ error: 'Access denied' }, { status: 403 })
 *   }
 *
 * Invariants Protected:
 *   - INVARIANT_MT_001: Multi-tenant isolation (no cross-school access)
 *   - INVARIANT_MT_002: No cross-school data leakage
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // CRITICAL: Check if event exists and is not soft-deleted
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
    console.error('Error fetching event:', error)
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
    if (data.fieldsSchema !== undefined) updateData.fieldsSchema = data.fieldsSchema
    if (data.conditions !== undefined) updateData.conditions = data.conditions
    if (data.requireAcceptance !== undefined) updateData.requireAcceptance = data.requireAcceptance
    if (data.completionMessage !== undefined) updateData.completionMessage = data.completionMessage
    if (data.status !== undefined) updateData.status = data.status

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        school: true,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if event exists and is not already soft-deleted
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        schoolId: true,
        deletedAt: true,
        title: true,
      },
    })

    if (!event || event.deletedAt !== null) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // CRITICAL: Multi-tenant isolation check
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json(
        { error: "Forbidden: No access to this school's events" },
        { status: 403 }
      )
    }

    // Use atomic transaction for cancellation + soft delete
    const result = await prisma.$transaction(
      async (tx) => {
        // Step 1: Get all non-CANCELLED registrations
        const registrations = await tx.registration.findMany({
          where: {
            eventId: id,
            status: { not: 'CANCELLED' },
          },
          select: {
            id: true,
            status: true,
            spotsCount: true,
          },
        })

        // Step 2: Calculate CONFIRMED spots to decrement
        const confirmedSpots = registrations
          .filter((r) => r.status === 'CONFIRMED')
          .reduce((sum, r) => sum + r.spotsCount, 0)

        const confirmedCount = registrations.filter((r) => r.status === 'CONFIRMED').length
        const waitlistCount = registrations.filter((r) => r.status === 'WAITLIST').length

        // Step 3: Cancel all non-CANCELLED registrations
        if (registrations.length > 0) {
          await tx.registration.updateMany({
            where: {
              eventId: id,
              status: { not: 'CANCELLED' },
            },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancellationReason: 'אירוע בוטל על ידי המארגן',
              cancelledBy: 'ADMIN',
            },
          })
        }

        // Step 4: Decrement spotsReserved counter
        if (confirmedSpots > 0) {
          await tx.$executeRaw`
            UPDATE "Event"
            SET "spotsReserved" = GREATEST(0, "spotsReserved" - ${confirmedSpots})
            WHERE id = ${id}
          `
        }

        // Step 5: SOFT DELETE - Set deletedAt timestamp (NEVER actually delete!)
        await tx.event.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            status: 'CLOSED',
          },
        })

        return {
          softDeletedEvent: id,
          eventTitle: event.title,
          cancelledRegistrations: registrations.length,
          confirmedCount,
          waitlistCount,
        }
      },
      {
        isolationLevel: 'Serializable',
        timeout: 10000,
      }
    )

    return NextResponse.json({
      success: true,
      summary: result,
    })
  } catch (error) {
    console.error('Error soft-deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}

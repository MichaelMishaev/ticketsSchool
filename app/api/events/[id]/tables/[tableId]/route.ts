import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

// PUT /api/events/[id]/tables/[tableId] - Update table
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  try {
    const { id, tableId } = await params
    const admin = await requireAdmin()

    // Verify event exists and admin has access
    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Multi-tenant security: MUST verify schoolId
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 403 })
      }
      if (event.schoolId !== admin.schoolId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Verify table belongs to event
    const existingTable = await prisma.table.findUnique({
      where: { id: tableId },
    })

    if (!existingTable || existingTable.eventId !== id) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const body = await request.json()
    const { tableNumber, capacity, minOrder, status } = body

    // Validation
    if (capacity !== undefined && capacity < 1) {
      return NextResponse.json({ error: 'Capacity must be at least 1' }, { status: 400 })
    }

    if (minOrder !== undefined && minOrder < 1) {
      return NextResponse.json({ error: 'minOrder must be at least 1' }, { status: 400 })
    }

    const finalCapacity = capacity ?? existingTable.capacity
    const finalMinOrder = minOrder ?? existingTable.minOrder

    if (finalMinOrder > finalCapacity) {
      return NextResponse.json({ error: 'minOrder cannot exceed capacity' }, { status: 400 })
    }

    // Guard: can't flip a populated table to INACTIVE (hold).
    // Unlike the old 1:1 FK, the new many-to-one model doesn't block this at DB level,
    // so we enforce it explicitly.
    if (status === 'INACTIVE') {
      const occupants = await prisma.registration.count({
        where: { tableId, status: 'CONFIRMED' },
      })
      if (occupants > 0) {
        return NextResponse.json(
          { error: `Cannot hold a table with ${occupants} active registration(s)` },
          { status: 400 }
        )
      }
    }

    const table = await prisma.table.update({
      where: { id: tableId },
      data: {
        ...(tableNumber && { tableNumber }),
        ...(capacity && { capacity }),
        ...(minOrder !== undefined && { minOrder }),
        ...(status && { status }),
      },
      include: {
        // Sharing-aware: return the updated table with its current CONFIRMED
        // registrations so clients can spread it into state without losing
        // the sharing-aware shape.
        registrations: {
          where: { status: 'CONFIRMED' },
          select: {
            id: true,
            confirmationCode: true,
            guestsCount: true,
            phoneNumber: true,
            data: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ table })
  } catch (error) {
    logger.error('Failed to update table', { source: 'tables', error })
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

// DELETE /api/events/[id]/tables/[tableId] - Delete table
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  try {
    const { id, tableId } = await params
    const admin = await requireAdmin()

    // Verify event exists and admin has access
    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Multi-tenant security: MUST verify schoolId
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 403 })
      }
      if (event.schoolId !== admin.schoolId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Verify table belongs to event
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    })

    if (!table || table.eventId !== id) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    // Defense-in-depth: count actual CONFIRMED occupants.
    // The status flag can drift; the count cannot.
    const occupants = await prisma.registration.count({
      where: { tableId, status: 'CONFIRMED' },
    })
    if (occupants > 0) {
      return NextResponse.json(
        { error: `Cannot delete table with ${occupants} active registration(s)` },
        { status: 400 }
      )
    }

    await prisma.table.delete({
      where: { id: tableId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete table', { source: 'tables', error })
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}

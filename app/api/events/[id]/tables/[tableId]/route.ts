import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

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
      where: { id }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Multi-tenant security: MUST verify schoolId
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 403 }
        )
      }
      if (event.schoolId !== admin.schoolId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Verify table belongs to event
    const existingTable = await prisma.table.findUnique({
      where: { id: tableId }
    })

    if (!existingTable || existingTable.eventId !== id) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { tableNumber, capacity, minOrder, status } = body

    // Validation
    if (capacity !== undefined && capacity < 1) {
      return NextResponse.json(
        { error: 'Capacity must be at least 1' },
        { status: 400 }
      )
    }

    if (minOrder !== undefined && minOrder < 1) {
      return NextResponse.json(
        { error: 'minOrder must be at least 1' },
        { status: 400 }
      )
    }

    const finalCapacity = capacity ?? existingTable.capacity
    const finalMinOrder = minOrder ?? existingTable.minOrder

    if (finalMinOrder > finalCapacity) {
      return NextResponse.json(
        { error: 'minOrder cannot exceed capacity' },
        { status: 400 }
      )
    }

    const table = await prisma.table.update({
      where: { id: tableId },
      data: {
        ...(tableNumber && { tableNumber }),
        ...(capacity && { capacity }),
        ...(minOrder !== undefined && { minOrder }),
        ...(status && { status })
      }
    })

    return NextResponse.json({ table })
  } catch (error) {
    console.error('Failed to update table:', error)
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    )
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
      where: { id }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Multi-tenant security: MUST verify schoolId
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 403 }
        )
      }
      if (event.schoolId !== admin.schoolId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Verify table belongs to event
    const table = await prisma.table.findUnique({
      where: { id: tableId }
    })

    if (!table || table.eventId !== id) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    // Check if table is reserved
    if (table.status === 'RESERVED') {
      return NextResponse.json(
        { error: 'Cannot delete reserved table' },
        { status: 400 }
      )
    }

    await prisma.table.delete({
      where: { id: tableId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete table:', error)
    return NextResponse.json(
      { error: 'Failed to delete table' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { TableStatus } from '@prisma/client'

// PUT /api/events/[id]/tables/[tableId] — Toggle table status (AVAILABLE ↔ INACTIVE)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId, tableId } = await params

  try {
    const body = (await request.json()) as { status: TableStatus }
    const { status } = body

    // Only allow toggling to AVAILABLE or INACTIVE — RESERVED is system-managed
    if (status !== 'AVAILABLE' && status !== 'INACTIVE') {
      return NextResponse.json(
        { error: 'Invalid status. Only AVAILABLE or INACTIVE can be set manually.' },
        { status: 400 }
      )
    }

    // Fetch the event for school access check
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { schoolId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch the table and count of CONFIRMED registrations
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: 'CONFIRMED' },
            },
          },
        },
      },
    })

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    if (table.eventId !== eventId) {
      return NextResponse.json({ error: 'Table does not belong to this event' }, { status: 404 })
    }

    // Guard: cannot set INACTIVE while confirmed registrations exist
    if (status === 'INACTIVE' && table._count.registrations > 0) {
      return NextResponse.json(
        { error: 'Cannot hold a table with active registrations' },
        { status: 422 }
      )
    }

    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { status },
    })

    return NextResponse.json({ table: updatedTable })
  } catch (error) {
    console.error('PUT /api/events/[id]/tables/[tableId] error:', error)
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

// DELETE /api/events/[id]/tables/[tableId] — Delete a table
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId, tableId } = await params

  try {
    // Fetch the event for school access check
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { schoolId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch the table to verify it belongs to this event
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { eventId: true },
    })

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    if (table.eventId !== eventId) {
      return NextResponse.json({ error: 'Table does not belong to this event' }, { status: 404 })
    }

    // Guard: count CONFIRMED registrations on this table (authoritative check, not status flag)
    const confirmedCount = await prisma.registration.count({
      where: { tableId, status: 'CONFIRMED' },
    })

    if (confirmedCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a table with active registrations' },
        { status: 422 }
      )
    }

    await prisma.table.delete({ where: { id: tableId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/events/[id]/tables/[tableId] error:', error)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}

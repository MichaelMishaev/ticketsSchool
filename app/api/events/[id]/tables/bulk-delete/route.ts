import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

// DELETE /api/events/[id]/tables/bulk-delete - Delete multiple tables at once
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Multi-tenant security
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

    const body = await request.json()
    const { tableIds } = body

    // Validation
    if (!Array.isArray(tableIds) || tableIds.length === 0) {
      return NextResponse.json(
        { error: 'tableIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Verify all tables belong to this event and are not reserved
    const tablesToDelete = await prisma.table.findMany({
      where: {
        id: { in: tableIds },
        eventId: id
      }
    })

    if (tablesToDelete.length !== tableIds.length) {
      return NextResponse.json(
        { error: 'Some tables not found or do not belong to this event' },
        { status: 404 }
      )
    }

    // Check if any tables are reserved
    const reservedTables = tablesToDelete.filter(t => t.status === 'RESERVED')
    if (reservedTables.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete reserved tables: ${reservedTables.map(t => t.tableNumber).join(', ')}` },
        { status: 400 }
      )
    }

    // Perform bulk delete
    const result = await prisma.table.deleteMany({
      where: {
        id: { in: tableIds }
      }
    })

    return NextResponse.json({
      success: true,
      count: result.count
    })
  } catch (error) {
    console.error('Failed to bulk delete tables:', error)
    return NextResponse.json(
      { error: 'Failed to bulk delete tables' },
      { status: 500 }
    )
  }
}

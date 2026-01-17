import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

// POST /api/events/[id]/tables/reorder - Reorder tables
export async function POST(
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

    const body = await request.json()
    const { tableIds } = body

    if (!Array.isArray(tableIds)) {
      return NextResponse.json(
        { error: 'tableIds must be an array' },
        { status: 400 }
      )
    }

    // Verify all tables belong to this event
    const tables = await prisma.table.findMany({
      where: {
        id: { in: tableIds },
        eventId: id
      }
    })

    if (tables.length !== tableIds.length) {
      return NextResponse.json(
        { error: 'Some tables not found or do not belong to this event' },
        { status: 400 }
      )
    }

    // Update table order in transaction
    await prisma.$transaction(
      tableIds.map((tableId, index) =>
        prisma.table.update({
          where: { id: tableId },
          data: { tableOrder: index + 1 }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to reorder tables', { source: 'tables', error })
    return NextResponse.json(
      { error: 'Failed to reorder tables' },
      { status: 500 }
    )
  }
}

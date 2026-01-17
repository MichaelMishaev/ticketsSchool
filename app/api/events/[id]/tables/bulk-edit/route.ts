import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

// PATCH /api/events/[id]/tables/bulk-edit - Edit multiple tables at once
export async function PATCH(
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
    const { tableIds, updates } = body

    // Validation
    if (!Array.isArray(tableIds) || tableIds.length === 0) {
      return NextResponse.json(
        { error: 'tableIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'updates must be an object' },
        { status: 400 }
      )
    }

    // Validate updates
    const allowedFields = ['capacity', 'minOrder', 'status']
    const updateData: any = {}

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedFields.includes(key)) {
        return NextResponse.json(
          { error: `Invalid update field: ${key}` },
          { status: 400 }
        )
      }

      if (key === 'capacity' && (typeof value !== 'number' || value < 1)) {
        return NextResponse.json(
          { error: 'capacity must be a number >= 1' },
          { status: 400 }
        )
      }

      if (key === 'minOrder' && (typeof value !== 'number' || value < 1)) {
        return NextResponse.json(
          { error: 'minOrder must be a number >= 1' },
          { status: 400 }
        )
      }

      if (key === 'status' && !['AVAILABLE', 'RESERVED', 'INACTIVE'].includes(value as string)) {
        return NextResponse.json(
          { error: 'status must be AVAILABLE, RESERVED, or INACTIVE' },
          { status: 400 }
        )
      }

      updateData[key] = value
    }

    // Verify all tables belong to this event
    const tablesToUpdate = await prisma.table.findMany({
      where: {
        id: { in: tableIds },
        eventId: id
      }
    })

    if (tablesToUpdate.length !== tableIds.length) {
      return NextResponse.json(
        { error: 'Some tables not found or do not belong to this event' },
        { status: 404 }
      )
    }

    // Prevent invalid capacity/minOrder combinations
    if (updateData.capacity !== undefined || updateData.minOrder !== undefined) {
      for (const table of tablesToUpdate) {
        const finalCapacity = updateData.capacity ?? table.capacity
        const finalMinOrder = updateData.minOrder ?? table.minOrder

        if (finalMinOrder > finalCapacity) {
          return NextResponse.json(
            { error: `minOrder cannot exceed capacity for table ${table.tableNumber}` },
            { status: 400 }
          )
        }
      }
    }

    // Perform bulk update
    const result = await prisma.table.updateMany({
      where: {
        id: { in: tableIds }
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      count: result.count
    })
  } catch (error) {
    logger.error('Failed to bulk edit tables', { source: 'tables', error })
    return NextResponse.json(
      { error: 'Failed to bulk edit tables' },
      { status: 500 }
    )
  }
}

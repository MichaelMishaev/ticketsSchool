import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

// POST /api/events/[id]/tables/[tableId]/duplicate - Duplicate single table
export async function POST(
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

    // Verify table exists and belongs to event
    const sourceTable = await prisma.table.findUnique({
      where: { id: tableId }
    })

    if (!sourceTable || sourceTable.eventId !== id) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { count = 1 } = body

    // Validation
    if (count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Get all existing tables to determine next table number
    const existingTables = await prisma.table.findMany({
      where: { eventId: id },
      orderBy: { tableOrder: 'desc' },
      select: { tableNumber: true, tableOrder: true }
    })

    const maxOrder = existingTables[0]?.tableOrder ?? 0

    // Extract numeric part from tableNumber for auto-increment
    const tableNumberMatch = sourceTable.tableNumber.match(/\d+/)
    const baseNumber = tableNumberMatch ? parseInt(tableNumberMatch[0], 10) : 1

    // Find the highest existing table number for smart incrementing
    const existingNumbers = existingTables
      .map(t => {
        const match = t.tableNumber.match(/\d+/)
        return match ? parseInt(match[0], 10) : 0
      })
      .filter(n => n > 0)

    const maxExistingNumber = existingNumbers.length > 0
      ? Math.max(...existingNumbers)
      : baseNumber

    // Create duplicates with auto-incremented names
    const tablesToCreate = []
    for (let i = 0; i < count; i++) {
      const newNumber = maxExistingNumber + i + 1
      const newTableNumber = sourceTable.tableNumber.replace(
        /\d+/,
        String(newNumber)
      ) || `שולחן ${newNumber}`

      tablesToCreate.push({
        eventId: id,
        tableNumber: newTableNumber,
        capacity: sourceTable.capacity,
        minOrder: sourceTable.minOrder,
        tableOrder: maxOrder + i + 1,
        status: 'AVAILABLE' as const
      })
    }

    // Bulk create tables
    const result = await prisma.table.createMany({
      data: tablesToCreate
    })

    // Fetch created tables to return
    const createdTables = await prisma.table.findMany({
      where: {
        eventId: id,
        tableOrder: { gt: maxOrder }
      },
      orderBy: { tableOrder: 'asc' }
    })

    return NextResponse.json({
      success: true,
      count: result.count,
      tables: createdTables
    }, { status: 201 })
  } catch (error) {
    logger.error('Failed to duplicate table', { source: 'tables', error })
    return NextResponse.json(
      { error: 'Failed to duplicate table' },
      { status: 500 }
    )
  }
}

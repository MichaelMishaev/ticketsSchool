import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tableId: string }> }
) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId, tableId } = await params

  let body: { count?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const count = body.count
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > 50) {
    return NextResponse.json(
      { error: 'count must be an integer between 1 and 50' },
      { status: 400 }
    )
  }

  try {
    // Fetch source table and verify it belongs to this event
    const sourceTable = await prisma.table.findUnique({
      where: { id: tableId },
    })

    if (!sourceTable || sourceTable.eventId !== eventId) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    // Verify school access
    if (admin.role !== 'SUPER_ADMIN') {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { schoolId: true },
      })

      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      if (admin.schoolId !== event.schoolId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get current max tableOrder to append after
    const maxOrderResult = await prisma.table.aggregate({
      where: { eventId },
      _max: { tableOrder: true },
    })
    const baseOrder = maxOrderResult._max.tableOrder ?? 0

    // Determine tableNumber strategy
    const sourceNumber = parseInt(sourceTable.tableNumber, 10)
    const isNumeric = !isNaN(sourceNumber) && String(sourceNumber) === sourceTable.tableNumber

    // If numeric, find the highest existing numeric table number in this event to avoid collisions
    let nextNumericValue = sourceNumber + 1
    if (isNumeric) {
      const numericTables = await prisma.table.findMany({
        where: { eventId },
        select: { tableNumber: true },
      })
      const existingNumbers = numericTables
        .map((t) => parseInt(t.tableNumber, 10))
        .filter((n) => !isNaN(n))
      const maxExisting = existingNumbers.length > 0 ? Math.max(...existingNumbers) : sourceNumber
      nextNumericValue = maxExisting + 1
    }

    // Build new table data
    const newTables = Array.from({ length: count }, (_, i) => ({
      eventId,
      tableNumber: isNumeric
        ? String(nextNumericValue + i)
        : `${sourceTable.tableNumber}-copy-${i + 1}`,
      tableOrder: baseOrder + i + 1,
      capacity: sourceTable.capacity,
      minOrder: sourceTable.minOrder,
      status: 'AVAILABLE' as const,
    }))

    await prisma.table.createMany({ data: newTables })

    // Fetch the created tables to return them
    const created = await prisma.table.findMany({
      where: {
        eventId,
        tableOrder: { gt: baseOrder },
      },
      orderBy: { tableOrder: 'asc' },
    })

    return NextResponse.json({ count: created.length, tables: created })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to duplicate table' }, { status: 500 })
  }
}

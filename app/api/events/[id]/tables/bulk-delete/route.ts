import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params

  let body: { tableIds?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tableIds } = body

  if (
    !Array.isArray(tableIds) ||
    tableIds.length === 0 ||
    !tableIds.every((id) => typeof id === 'string')
  ) {
    return NextResponse.json(
      { error: 'tableIds must be a non-empty array of strings' },
      { status: 400 }
    )
  }

  try {
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

    // Fetch all tables in the IDs set that belong to this event, including their CONFIRMED registration counts
    const tables = await prisma.table.findMany({
      where: { id: { in: tableIds as string[] }, eventId },
      select: {
        id: true,
        tableNumber: true,
        registrations: {
          where: { status: 'CONFIRMED' },
          select: { id: true },
        },
      },
    })

    // Check for tables with active (CONFIRMED) registrations
    const blockedTables = tables.filter((t) => t.registrations.length > 0)
    if (blockedTables.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete tables with active registrations',
          tableNumbers: blockedTables.map((t) => t.tableNumber),
        },
        { status: 422 }
      )
    }

    // Delete all tables that passed the check and belong to this event
    const eligibleIds = tables.map((t) => t.id)
    const result = await prisma.table.deleteMany({
      where: { id: { in: eligibleIds }, eventId },
    })

    return NextResponse.json({ count: result.count })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete tables' }, { status: 500 })
  }
}

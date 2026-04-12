import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params

  let body: { tableIds?: unknown; updates?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tableIds, updates } = body

  // Validate tableIds
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

  // Validate updates
  if (
    typeof updates !== 'object' ||
    updates === null ||
    Array.isArray(updates)
  ) {
    return NextResponse.json(
      { error: 'updates must be an object' },
      { status: 400 }
    )
  }

  const updateData = updates as Record<string, unknown>
  const hasCapacity = 'capacity' in updateData && updateData.capacity !== undefined
  const hasMinOrder = 'minOrder' in updateData && updateData.minOrder !== undefined

  if (!hasCapacity && !hasMinOrder) {
    return NextResponse.json(
      { error: 'updates must contain at least one of: capacity, minOrder' },
      { status: 400 }
    )
  }

  if (hasCapacity && (typeof updateData.capacity !== 'number' || updateData.capacity < 1)) {
    return NextResponse.json(
      { error: 'capacity must be a positive number' },
      { status: 400 }
    )
  }

  if (hasMinOrder && (typeof updateData.minOrder !== 'number' || updateData.minOrder < 1)) {
    return NextResponse.json(
      { error: 'minOrder must be a positive number' },
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

    // Verify all tableIds belong to this event
    const existingTables = await prisma.table.findMany({
      where: { id: { in: tableIds as string[] }, eventId },
      select: { id: true },
    })

    if (existingTables.length !== tableIds.length) {
      return NextResponse.json(
        { error: 'One or more tables not found or do not belong to this event' },
        { status: 404 }
      )
    }

    // Build the update payload
    const updatePayload: { capacity?: number; minOrder?: number } = {}
    if (hasCapacity) updatePayload.capacity = updateData.capacity as number
    if (hasMinOrder) updatePayload.minOrder = updateData.minOrder as number

    const result = await prisma.table.updateMany({
      where: { id: { in: tableIds as string[] }, eventId },
      data: updatePayload,
    })

    return NextResponse.json({ count: result.count })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tables' }, { status: 500 })
  }
}

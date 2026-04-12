import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params

  try {
    // Verify event + school access
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, schoolId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all tables for this event
    const tables = await prisma.table.findMany({
      where: { eventId },
      orderBy: { tableOrder: 'asc' },
      select: {
        tableNumber: true,
        capacity: true,
        minOrder: true,
      },
    })

    if (tables.length === 0) {
      return NextResponse.json(
        { error: 'No tables to save as template' },
        { status: 422 }
      )
    }

    // Validate request body
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Build config: group tables by (capacity, minOrder) pairs
    const groupMap = new Map<
      string,
      { tableNumber: string; capacity: number; minOrder: number; count: number }
    >()

    for (const table of tables) {
      const key = `${table.capacity}:${table.minOrder}`
      if (groupMap.has(key)) {
        groupMap.get(key)!.count += 1
      } else {
        groupMap.set(key, {
          tableNumber: table.tableNumber,
          capacity: table.capacity,
          minOrder: table.minOrder,
          count: 1,
        })
      }
    }

    const config = Array.from(groupMap.values())

    // SUPER_ADMIN uses event's schoolId, regular admin uses their own schoolId
    const ownerSchoolId = admin.role === 'SUPER_ADMIN' ? event.schoolId : (admin.schoolId as string)

    const template = await prisma.tableTemplate.create({
      data: {
        schoolId: ownerSchoolId,
        name: name.trim(),
        description: description ?? null,
        config,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error saving tables as template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

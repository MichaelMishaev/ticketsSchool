import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

// GET /api/events/[id]/tables - List tables
export async function GET(
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

    const tables = await prisma.table.findMany({
      where: { eventId: id },
      orderBy: { tableOrder: 'asc' },
      include: {
        reservation: {
          select: {
            id: true,
            confirmationCode: true,
            guestsCount: true,
            phoneNumber: true,
            data: true
          }
        }
      }
    })

    return NextResponse.json({ tables })
  } catch (error) {
    console.error('Failed to fetch tables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    )
  }
}

// POST /api/events/[id]/tables - Create table
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
    const { tableNumber, capacity, minOrder } = body

    // Validation
    if (!tableNumber || !capacity || minOrder === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: tableNumber, capacity, minOrder' },
        { status: 400 }
      )
    }

    if (capacity < 1 || minOrder < 1) {
      return NextResponse.json(
        { error: 'Capacity and minOrder must be at least 1' },
        { status: 400 }
      )
    }

    if (minOrder > capacity) {
      return NextResponse.json(
        { error: 'minOrder cannot exceed capacity' },
        { status: 400 }
      )
    }

    // Get next table order
    const maxOrder = await prisma.table.findFirst({
      where: { eventId: id },
      orderBy: { tableOrder: 'desc' },
      select: { tableOrder: true }
    })

    const table = await prisma.table.create({
      data: {
        eventId: id,
        tableNumber,
        capacity,
        minOrder,
        tableOrder: (maxOrder?.tableOrder ?? 0) + 1
      }
    })

    return NextResponse.json({ table }, { status: 201 })
  } catch (error) {
    console.error('Failed to create table:', error)
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    )
  }
}

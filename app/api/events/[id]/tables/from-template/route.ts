import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

// POST /api/events/[id]/tables/from-template - Create tables from template
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
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing required field: templateId' },
        { status: 400 }
      )
    }

    // Fetch template
    const template = await prisma.tableTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Verify access to template (own school or public)
    if (!template.isPublic && template.schoolId !== admin.schoolId) {
      return NextResponse.json(
        { error: 'Access denied to template' },
        { status: 403 }
      )
    }

    // Get max table order
    const maxOrderTable = await prisma.table.findFirst({
      where: { eventId: id },
      orderBy: { tableOrder: 'desc' },
      select: { tableOrder: true, tableNumber: true }
    })

    const maxOrder = maxOrderTable?.tableOrder ?? 0

    // Extract highest number from existing tables for smart naming
    const existingTables = await prisma.table.findMany({
      where: { eventId: id },
      select: { tableNumber: true }
    })

    const existingNumbers = existingTables
      .map(t => {
        const match = t.tableNumber.match(/\d+/)
        return match ? parseInt(match[0], 10) : 0
      })
      .filter(n => n > 0)

    let nextNumber = existingNumbers.length > 0
      ? Math.max(...existingNumbers) + 1
      : 1

    // Build tables from template config
    const config = template.config as any[]
    const tablesToCreate = []
    let orderCounter = maxOrder

    for (const item of config) {
      const { capacity, minOrder, count, namePattern } = item

      for (let i = 0; i < count; i++) {
        orderCounter++
        const tableNumber = namePattern
          ? namePattern.replace('{n}', String(nextNumber))
          : `${nextNumber}`

        tablesToCreate.push({
          eventId: id,
          tableNumber,
          capacity,
          minOrder,
          tableOrder: orderCounter,
          status: 'AVAILABLE' as const
        })

        nextNumber++
      }
    }

    // Create all tables
    const result = await prisma.table.createMany({
      data: tablesToCreate
    })

    // Increment template usage counter
    await prisma.tableTemplate.update({
      where: { id: templateId },
      data: { timesUsed: { increment: 1 } }
    })

    return NextResponse.json({
      success: true,
      count: result.count,
      template: {
        id: template.id,
        name: template.name
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create tables from template:', error)
    return NextResponse.json(
      { error: 'Failed to create tables from template' },
      { status: 500 }
    )
  }
}

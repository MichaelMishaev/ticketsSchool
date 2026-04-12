import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

interface TemplateConfigItem {
  tableNumber: string
  capacity: number
  minOrder: number
  count?: number
}

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
    const body = await request.json()
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
    }

    // Fetch template — must exist AND be public or belong to admin's school
    const template = await prisma.tableTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (!template.isPublic && template.schoolId !== admin.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify event exists + school access
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

    // Parse config
    const config = template.config as TemplateConfigItem[]
    if (!Array.isArray(config) || config.length === 0) {
      return NextResponse.json({ error: 'Template has no valid config' }, { status: 422 })
    }

    // Get current max tableOrder for this event
    const maxOrderResult = await prisma.table.aggregate({
      where: { eventId },
      _max: { tableOrder: true },
    })
    let currentOrder = maxOrderResult._max.tableOrder ?? 0

    // Build all tables to create
    const tablesToCreate: Array<{
      eventId: string
      tableNumber: string
      tableOrder: number
      capacity: number
      minOrder: number
      status: 'AVAILABLE'
    }> = []

    for (const item of config) {
      const count = item.count && item.count > 1 ? item.count : 1

      for (let i = 0; i < count; i++) {
        currentOrder += 1
        const tableNumber = count === 1 ? item.tableNumber : `${item.tableNumber}-${i + 1}`

        tablesToCreate.push({
          eventId,
          tableNumber,
          tableOrder: currentOrder,
          capacity: item.capacity,
          minOrder: item.minOrder,
          status: 'AVAILABLE',
        })
      }
    }

    // Create all tables + increment timesUsed atomically
    await prisma.$transaction([
      prisma.table.createMany({ data: tablesToCreate }),
      prisma.tableTemplate.update({
        where: { id: templateId },
        data: { timesUsed: { increment: 1 } },
      }),
    ])

    return NextResponse.json({
      count: tablesToCreate.length,
      template: { name: template.name },
    })
  } catch (error) {
    console.error('Error creating tables from template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

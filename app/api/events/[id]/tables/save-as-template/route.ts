import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

// POST /api/events/[id]/tables/save-as-template - Save current tables as template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = await requireAdmin()

    if (!admin.schoolId) {
      return NextResponse.json(
        { error: 'Admin must have a school assigned' },
        { status: 403 }
      )
    }

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
    if (admin.role !== 'SUPER_ADMIN' && event.schoolId !== admin.schoolId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    // Fetch all tables for this event
    const tables = await prisma.table.findMany({
      where: { eventId: id, status: { not: 'RESERVED' } }, // Exclude reserved tables
      orderBy: { tableOrder: 'asc' },
      select: {
        tableNumber: true,
        capacity: true,
        minOrder: true
      }
    })

    if (tables.length === 0) {
      return NextResponse.json(
        { error: 'No tables to save as template' },
        { status: 400 }
      )
    }

    // Group by configuration (capacity + minOrder)
    const configMap = new Map<string, { capacity: number; minOrder: number; count: number; namePattern: string }>()

    tables.forEach(table => {
      const key = `${table.capacity}-${table.minOrder}`
      const existing = configMap.get(key)

      if (existing) {
        existing.count++
      } else {
        // Extract pattern from table number (e.g., "שולחן 5" → "שולחן {n}")
        const numberMatch = table.tableNumber.match(/\d+/)
        const namePattern = numberMatch
          ? table.tableNumber.replace(/\d+/, '{n}')
          : '{n}'

        configMap.set(key, {
          capacity: table.capacity,
          minOrder: table.minOrder,
          count: 1,
          namePattern
        })
      }
    })

    const config = Array.from(configMap.values())

    // Create template
    const template = await prisma.tableTemplate.create({
      data: {
        schoolId: admin.schoolId,
        name,
        description: description || null,
        config,
        isPublic: false
      }
    })

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        tableCount: tables.length
      }
    }, { status: 201 })
  } catch (error) {
    logger.error('Failed to save template', { source: 'tables', error })
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    )
  }
}

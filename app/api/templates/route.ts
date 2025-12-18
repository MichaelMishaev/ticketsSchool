import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

// GET /api/templates - List all templates (school-specific + public)
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()

    // Build where clause
    const where: any = {
      OR: [
        { isPublic: true }, // Public templates available to all
      ]
    }

    // Add school-specific templates if admin has a school
    if (admin.schoolId) {
      where.OR.push({ schoolId: admin.schoolId })
    }

    const templates = await prisma.tableTemplate.findMany({
      where,
      orderBy: [
        { isPublic: 'desc' }, // Public templates first
        { timesUsed: 'desc' }, // Then by popularity
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        config: true,
        timesUsed: true,
        createdAt: true
      }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create template from configuration
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()

    if (!admin.schoolId) {
      return NextResponse.json(
        { error: 'Admin must have a school assigned' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, config } = body

    // Validation
    if (!name || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, config' },
        { status: 400 }
      )
    }

    if (!Array.isArray(config) || config.length === 0) {
      return NextResponse.json(
        { error: 'Config must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate config structure
    for (const item of config) {
      if (!item.capacity || !item.minOrder || item.count === undefined) {
        return NextResponse.json(
          { error: 'Invalid config: each item must have capacity, minOrder, and count' },
          { status: 400 }
        )
      }
    }

    const template = await prisma.tableTemplate.create({
      data: {
        schoolId: admin.schoolId,
        name,
        description: description || null,
        config,
        isPublic: false // Only admins can make templates public
      }
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Failed to create template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

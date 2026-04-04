import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const searchParams = request.nextUrl.searchParams
    const tableName = searchParams.get('table')

    if (!tableName) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 })
    }

    let data: any[] = []

    switch (tableName) {
      case 'Event':
        data = await prisma.event.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit to 100 records for performance
        })
        break
      case 'Registration':
        data = await prisma.registration.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            event: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        })
        // Flatten the event data for display
        data = data.map((reg) => ({
          ...reg,
          eventTitle: reg.event.title,
          eventSlug: reg.event.slug,
          event: undefined, // Remove nested object
        }))
        break
      case 'Log':
        data = await prisma.log.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
        break
      default:
        return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching table data:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch table data' }, { status: 500 })
  }
}

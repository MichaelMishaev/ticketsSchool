import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Simple auth check via header
    const authHeader = request.headers.get('x-admin-prod-auth')
    if (authHeader !== 'authenticated-6262') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
          take: 100 // Limit to 100 records for performance
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
                slug: true
              }
            }
          }
        })
        // Flatten the event data for display
        data = data.map(reg => ({
          ...reg,
          eventTitle: reg.event.title,
          eventSlug: reg.event.slug,
          event: undefined // Remove nested object
        }))
        break
      default:
        return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching table data:', error)
    return NextResponse.json({ error: 'Failed to fetch table data' }, { status: 500 })
  }
}
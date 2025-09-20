import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Simple auth check via header
    const authHeader = request.headers.get('cookie')
    if (!authHeader?.includes('adminProdAuth')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get table counts
    const eventCount = await prisma.event.count()
    const registrationCount = await prisma.registration.count()

    const tables = [
      { name: 'Event', count: eventCount },
      { name: 'Registration', count: registrationCount }
    ]

    return NextResponse.json(tables)
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}
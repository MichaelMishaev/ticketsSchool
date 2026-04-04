import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    // Get table counts
    const eventCount = await prisma.event.count()
    const registrationCount = await prisma.registration.count()
    const logCount = await prisma.log.count()

    const tables = [
      { name: 'Event', count: eventCount },
      { name: 'Registration', count: registrationCount },
      { name: 'Log', count: logCount },
    ]

    return NextResponse.json(tables)
  } catch (error) {
    console.error('Error fetching tables:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}

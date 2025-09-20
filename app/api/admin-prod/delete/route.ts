import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    // Simple auth check via header
    const authHeader = request.headers.get('cookie')
    if (!authHeader?.includes('adminProdAuth')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { table, id } = await request.json()

    if (!table || !id) {
      return NextResponse.json({ error: 'Table and ID are required' }, { status: 400 })
    }

    switch (table) {
      case 'Event':
        await prisma.event.delete({
          where: { id }
        })
        break
      case 'Registration':
        await prisma.registration.delete({
          where: { id }
        })
        break
      default:
        return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting record:', error)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}
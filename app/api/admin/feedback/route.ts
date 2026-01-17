import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

export async function GET(request: NextRequest) {
  try {
    // Only super admins can access feedback
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const feedbacks = await prisma.feedback.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(feedbacks)
  } catch (error) {
    logger.error('Error fetching feedbacks', { source: 'admin', error })
    return NextResponse.json(
      { error: 'שגיאה בטעינת המשובים' },
      { status: 500 }
    )
  }
}

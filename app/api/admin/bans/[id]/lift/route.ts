import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

/**
 * PATCH /api/admin/bans/[id]/lift
 * Lift (remove) a ban early
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id: banId } = await params
    const body = await request.json()
    const { reason } = body

    // Find the ban
    const ban = await prisma.userBan.findUnique({
      where: { id: banId },
      select: {
        id: true,
        schoolId: true,
        active: true
      }
    })

    if (!ban) {
      return NextResponse.json({ error: 'Ban not found' }, { status: 404 })
    }

    // Verify school access
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== ban.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update ban
    const updatedBan = await prisma.userBan.update({
      where: { id: banId },
      data: {
        active: false,
        liftedAt: new Date(),
        liftedBy: admin.adminId,
        liftedReason: reason || null
      }
    })

    return NextResponse.json({
      success: true,
      ban: updatedBan
    })
  } catch (error) {
    logger.error('Error lifting ban', { source: 'admin', error })
    return NextResponse.json(
      { error: 'Failed to lift ban' },
      { status: 500 }
    )
  }
}

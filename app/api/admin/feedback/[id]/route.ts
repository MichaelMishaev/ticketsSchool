import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'
import { logger } from '@/lib/logger-v2'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only super admins can update feedback
    await requireSuperAdmin()

    const { id } = await params
    const { status, adminNotes } = await request.json()

    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    logger.error('Error updating feedback', { source: 'admin', error })
    return NextResponse.json(
      { error: 'שגיאה בעדכון המשוב' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only super admins can delete feedback
    await requireSuperAdmin()

    const { id } = await params

    await prisma.feedback.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting feedback', { source: 'admin', error })
    return NextResponse.json(
      { error: 'שגיאה במחיקת המשוב' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

/**
 * DELETE /api/admin/team/invitations/[id]
 * Revoke/cancel a team invitation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only OWNER and ADMIN can revoke invitations
    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only OWNER or ADMIN can revoke invitations' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Find the invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Verify the invitation belongs to admin's school (unless SUPER_ADMIN)
    if (admin.role !== 'SUPER_ADMIN' && invitation.schoolId !== admin.schoolId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot revoke invitations from other schools' },
        { status: 403 }
      )
    }

    // Update invitation status to REVOKED
    await prisma.teamInvitation.update({
      where: { id },
      data: {
        status: 'REVOKED'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation revoked successfully'
    })
  } catch (error) {
    console.error('Error revoking invitation:', error)
    return NextResponse.json(
      { error: 'Failed to revoke invitation' },
      { status: 500 }
    )
  }
}

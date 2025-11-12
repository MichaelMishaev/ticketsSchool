import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { sendTeamInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

/**
 * POST /api/admin/team/invitations/[id]/resend
 * Resend a pending invitation
 */
export async function POST(
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

    // Only OWNER and ADMIN can resend invitations
    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only OWNER or ADMIN can resend invitations' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Find the invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id },
      include: {
        school: { select: { name: true } },
        invitedBy: { select: { name: true } }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if admin has access to this invitation's school
    if (admin.role !== 'SUPER_ADMIN' && invitation.schoolId !== admin.schoolId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot resend invitation from another school' },
        { status: 403 }
      )
    }

    // Only allow resending PENDING invitations
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot resend ${invitation.status.toLowerCase()} invitation` },
        { status: 400 }
      )
    }

    // Generate new token and extend expiration
    const newToken = crypto.randomBytes(32).toString('hex')
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7)

    // Update invitation with new token and expiration
    await prisma.teamInvitation.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      }
    })

    // Resend invitation email
    try {
      await sendTeamInvitationEmail(
        invitation.email,
        invitation.school.name,
        invitation.invitedBy.name,
        invitation.role,
        newToken
      )
    } catch (emailError) {
      console.error('Failed to resend invitation email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email, but invitation was updated' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully'
    })
  } catch (error) {
    console.error('Error resending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to resend invitation' },
      { status: 500 }
    )
  }
}

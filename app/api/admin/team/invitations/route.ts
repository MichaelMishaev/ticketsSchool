import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { sendTeamInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

/**
 * POST /api/admin/team/invitations
 * Create a new team invitation (OWNER/ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only OWNER and ADMIN can invite team members
    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only OWNER or ADMIN can invite team members' },
        { status: 403 }
      )
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Validate role (can't invite SUPER_ADMIN or OWNER unless you are SUPER_ADMIN)
    const validRoles = admin.role === 'SUPER_ADMIN'
      ? ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'VIEWER', 'SCHOOL_ADMIN']
      : ['ADMIN', 'MANAGER', 'VIEWER', 'SCHOOL_ADMIN']

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role for invitation' },
        { status: 400 }
      )
    }

    // Check if admin already exists with this email
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingAdmin) {
      // Check if admin is already in this school
      if (existingAdmin.schoolId === admin.schoolId) {
        return NextResponse.json(
          { error: 'This person is already a team member in your school' },
          { status: 400 }
        )
      } else if (existingAdmin.schoolId) {
        return NextResponse.json(
          { error: 'This email is already registered with another school' },
          { status: 400 }
        )
      } else {
        // Admin exists but has no school (shouldn't happen in normal flow)
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 400 }
        )
      }
    }

    // Check if there's already an invitation for this email and school
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: {
        email_schoolId: {
          email: email.toLowerCase(),
          schoolId: admin.schoolId!
        }
      }
    })

    if (existingInvitation) {
      if (existingInvitation.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Pending invitation already exists for this email. Use the resend button to send it again.' },
          { status: 400 }
        )
      } else if (existingInvitation.status === 'REVOKED' || existingInvitation.status === 'EXPIRED') {
        // Delete old revoked/expired invitation so we can create a new one
        await prisma.teamInvitation.delete({
          where: { id: existingInvitation.id }
        })
      }
      // If status is ACCEPTED, we continue (shouldn't happen because admin would exist)
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.teamInvitation.create({
      data: {
        email: email.toLowerCase(),
        schoolId: admin.schoolId!,
        role,
        invitedById: admin.adminId,
        token,
        expiresAt
      },
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true
          }
        },
        school: {
          select: {
            name: true
          }
        }
      }
    })

    // Send invitation email
    try {
      await sendTeamInvitationEmail(
        email,
        invitation.school.name,
        invitation.invitedBy.name,
        role,
        token
      )
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the request if email sending fails - invitation is still created
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.invitedBy.name
      }
    })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/team/invitations
 * List all invitations for current school
 */
export async function GET() {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build where clause
    const where: any = {}

    // Regular admins see only their school's invitations
    if (admin.role !== 'SUPER_ADMIN') {
      // CRITICAL: Non-super admins MUST have a schoolId to prevent seeing all invitations
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned. Please logout and login again.' },
          { status: 403 }
        )
      }
      where.schoolId = admin.schoolId
    }

    const invitations = await prisma.teamInvitation.findMany({
      where,
      include: {
        invitedBy: {
          select: {
            name: true,
            email: true
          }
        },
        school: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        invitedBy: inv.invitedBy?.name || 'Unknown',
        schoolName: inv.school?.name || 'Unknown'
      }))
    })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    // Log more details about the error for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Failed to fetch invitations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

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
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: {
        email_schoolId: {
          email: email.toLowerCase(),
          schoolId: admin.schoolId!
        }
      }
    })

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Pending invitation already exists for this email' },
        { status: 400 }
      )
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
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
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
        invitedBy: inv.invitedBy.name,
        schoolName: inv.school.name
      }))
    })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

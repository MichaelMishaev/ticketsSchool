import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger-v2'

/**
 * POST /api/team/accept-invitation
 * Accept a team invitation and create admin account
 */
export async function POST(request: NextRequest) {
  try {
    const { token, name, password } = await request.json()

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: 'Token, name, and password are required' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        school: true
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check invitation status
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Invitation is ${invitation.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if admin with this email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: invitation.email }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create admin and update invitation in a transaction
    const [newAdmin] = await prisma.$transaction([
      prisma.admin.create({
        data: {
          email: invitation.email,
          name,
          passwordHash,
          role: invitation.role,
          schoolId: invitation.schoolId,
          emailVerified: true // Auto-verify since they accepted invitation
        }
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      })
    ])

    // Create JWT token
    const jwtToken = sign(
      {
        adminId: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role,
        schoolId: newAdmin.schoolId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        schoolName: invitation.school.name
      }
    })
  } catch (error) {
    logger.error('Error accepting invitation', { source: 'team', error })
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/team/accept-invitation?token=xxx
 * Verify an invitation token and get details
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        school: {
          select: {
            name: true
          }
        },
        invitedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if expired
    const isExpired = new Date() > invitation.expiresAt

    if (isExpired && invitation.status === 'PENDING') {
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        status: isExpired ? 'EXPIRED' : invitation.status,
        expiresAt: invitation.expiresAt,
        schoolName: invitation.school.name,
        invitedBy: invitation.invitedBy.name
      }
    })
  } catch (error) {
    logger.error('Error verifying invitation', { source: 'team', error })
    return NextResponse.json(
      { error: 'Failed to verify invitation' },
      { status: 500 }
    )
  }
}

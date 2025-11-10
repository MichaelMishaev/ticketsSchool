import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/me
 * Returns current admin session info
 * Used by client to check if authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin()

    if (!admin) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch fresh data from database to get onboardingCompleted status
    const adminData = await prisma.admin.findUnique({
      where: { id: admin.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolId: true,
        onboardingCompleted: true,
        school: {
          select: {
            name: true,
          }
        }
      }
    })

    if (!adminData) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      admin: {
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        schoolId: adminData.schoolId,
        schoolName: adminData.school?.name,
        onboardingCompleted: adminData.onboardingCompleted,
      }
    })
  } catch (error) {
    console.error('Get current admin error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

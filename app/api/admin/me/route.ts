import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

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
            id: true,
            name: true,
            slug: true,
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

    const response = NextResponse.json({
      authenticated: true,
      admin: {
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        schoolId: adminData.schoolId,
        schoolName: adminData.school?.name,
        onboardingCompleted: adminData.onboardingCompleted,
      },
      school: adminData.school ? {
        id: adminData.school.id,
        name: adminData.school.name,
        slug: adminData.school.slug,
      } : null
    })

    // Cache for 60 seconds to reduce database load
    // Admin info rarely changes, safe to cache briefly
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')

    return response
  } catch (error) {
    logger.error('Get current admin error', { source: 'auth', error })
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

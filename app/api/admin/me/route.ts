import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth.server'

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

    return NextResponse.json({
      authenticated: true,
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        schoolId: admin.schoolId,
        schoolName: admin.schoolName,
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

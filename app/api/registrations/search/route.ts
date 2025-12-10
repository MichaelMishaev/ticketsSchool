import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

/**
 * Search for a registration by confirmation code
 * GET /api/registrations/search?code=XXXXXX
 */
export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'קוד אישור חובה' },
        { status: 400 }
      )
    }

    // Search for registration with this confirmation code
    const registration = await prisma.registration.findFirst({
      where: {
        confirmationCode: code.toUpperCase().trim()
      },
      include: {
        event: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'לא נמצאה הרשמה עם קוד זה' },
        { status: 404 }
      )
    }

    // Enforce multi-tenant isolation
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 403 }
        )
      }

      if (registration.event.schoolId !== admin.schoolId) {
        return NextResponse.json(
          { error: 'אין לך הרשאה לצפות בהרשמה זו' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: registration
    })
  } catch (error) {
    console.error('Error searching registration:', error)
    return NextResponse.json(
      { error: 'שגיאה בחיפוש הרשמה' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'נדרש אימייל וסיסמה' },
        { status: 400 }
      )
    }

    const session = await login(email, password)

    if (!session) {
      return NextResponse.json(
        { error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      )
    }

    // Fetch admin data to get onboardingCompleted status
    const adminData = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        onboardingCompleted: true,
        schoolId: true,
      }
    })

    return NextResponse.json(
      {
        success: true,
        admin: {
          email: session.email,
          name: session.name,
          role: session.role,
          schoolName: session.schoolName,
          schoolId: session.schoolId,
          onboardingCompleted: adminData?.onboardingCompleted ?? false,
        },
        message: 'התחברת בהצלחה'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'שגיאת שרת' },
      { status: 500 }
    )
  }
}

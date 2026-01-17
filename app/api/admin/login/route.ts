import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limiter'
import { authLogger } from '@/lib/logger-v2'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  blockDurationMs: 60 * 60 * 1000, // 1 hour lockout
})

export async function POST(request: NextRequest) {
  // Apply rate limiting FIRST
  const rateLimitResponse = await loginLimiter(request)
  if (rateLimitResponse) return rateLimitResponse
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'נדרש אימייל וסיסמה' }, { status: 400 })
    }

    let session
    try {
      session = await login(email, password)
    } catch (error) {
      // Handle email not verified error
      if (error instanceof Error && error.message === 'EMAIL_NOT_VERIFIED') {
        return NextResponse.json(
          {
            error: 'המייל טרם אומת. אנא בדוק את תיבת הדואר שלך ולחץ על הקישור לאימות.',
            errorCode: 'EMAIL_NOT_VERIFIED',
          },
          { status: 403 }
        )
      }
      throw error // Re-throw other errors
    }

    if (!session) {
      return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 })
    }

    // Fetch admin data to get onboardingCompleted status
    const adminData = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        onboardingCompleted: true,
        schoolId: true,
      },
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
        message: 'התחברת בהצלחה',
      },
      { status: 200 }
    )
  } catch (error) {
    authLogger.error('Login API error', { error })
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth.server'

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

    return NextResponse.json(
      {
        success: true,
        admin: {
          email: session.email,
          name: session.name,
          role: session.role,
          schoolName: session.schoolName,
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

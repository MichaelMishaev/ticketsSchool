import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/lib/auth.server'

export async function POST(request: NextRequest) {
  try {
    await logout()

    return NextResponse.json(
      { success: true, message: 'התנתקת בהצלחה' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { error: 'שגיאת שרת' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { logout } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

export async function POST(request: NextRequest) {
  try {
    await logout()

    return NextResponse.json(
      { success: true, message: 'התנתקת בהצלחה' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Logout API error', { source: 'auth', error })
    return NextResponse.json(
      { error: 'שגיאת שרת' },
      { status: 500 }
    )
  }
}

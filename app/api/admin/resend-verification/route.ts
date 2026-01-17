import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { logger } from '@/lib/logger-v2'

/**
 * Resend verification email for unverified accounts
 * POST /api/admin/resend-verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'נא להזין כתובת מייל' },
        { status: 400 }
      )
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!admin) {
      // Don't reveal if account exists for security
      return NextResponse.json({
        success: true,
        message: 'אם החשבון קיים, נשלח מייל לאימות.',
      })
    }

    // Check if already verified
    if (admin.emailVerified) {
      return NextResponse.json(
        { error: 'המייל כבר מאומת. אפשר להתחבר.' },
        { status: 400 }
      )
    }

    // Check if verification token exists
    if (!admin.verificationToken) {
      return NextResponse.json(
        { error: 'לא נמצא טוקן אימות. צור קשר עם התמיכה.' },
        { status: 400 }
      )
    }

    // Resend verification email
    logger.info('Sending verification email', { source: 'auth', email })
    const emailSent = await sendVerificationEmail(
      email.toLowerCase(),
      admin.verificationToken,
      admin.name
    )

    if (!emailSent) {
      logger.error('Failed to send verification email', { source: 'auth', email })
      return NextResponse.json(
        { error: 'שגיאה בשליחת המייל. נסה שוב מאוחר יותר.' },
        { status: 500 }
      )
    }

    logger.info('Verification email sent successfully', { source: 'auth', email })
    return NextResponse.json({
      success: true,
      message: 'מייל האימות נשלח מחדש! בדוק את תיבת הדואר שלך.',
    })
  } catch (error) {
    logger.error('Resend verification error', { source: 'auth', error })
    return NextResponse.json(
      { error: 'שגיאה בשליחת מייל האימות.' },
      { status: 500 }
    )
  }
}

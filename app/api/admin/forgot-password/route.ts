import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as jwt from 'jsonwebtoken'
import { sendPasswordResetEmail } from '@/lib/email'

// Lazy getter for JWT_SECRET - only validates when actually used (not at import time)
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return secret
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'כתובת מייל חסרה' },
        { status: 400 }
      )
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Don't reveal if email exists (security best practice)
    // Always return success even if email doesn't exist
    if (!admin) {
      return NextResponse.json({
        success: true,
        message: 'אם המייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה.',
      })
    }

    // Don't allow password reset for OAuth-only users
    if (!admin.passwordHash) {
      return NextResponse.json({
        success: true,
        message: 'אם המייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה.',
      })
    }

    // Generate reset token (1 hour expiry)
    const resetToken = jwt.sign(
      { email: email.toLowerCase(), adminId: admin.id },
      getJWTSecret(),
      { expiresIn: '1h' }
    )

    // Set token expiry
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token to database
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(
      admin.email,
      resetToken,
      admin.name
    )

    if (!emailSent) {
      console.warn('Password reset email failed to send')
    }

    return NextResponse.json({
      success: true,
      message: 'אם המייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה.',
      emailSent,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'שגיאה בשליחת המייל. נסה שוב.' },
      { status: 500 }
    )
  }
}

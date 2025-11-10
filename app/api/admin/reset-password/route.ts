import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'חסרים פרטים' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'הסיסמה חייבת להיות לפחות 8 תווים' },
        { status: 400 }
      )
    }

    // Verify JWT token
    let decoded: { email: string; adminId: string }
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { email: string; adminId: string }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: 'קוד האיפוס פג תוקף. בקש איפוס חדש.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'קוד האיפוס לא תקין' },
        { status: 400 }
      )
    }

    // Find admin by email and reset token
    const admin = await prisma.admin.findFirst({
      where: {
        email: decoded.email.toLowerCase(),
        resetToken: token,
      },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'קוד איפוס לא תקין או כבר נעשה בו שימוש' },
        { status: 404 }
      )
    }

    // Check if token is expired (additional check beyond JWT expiry)
    if (admin.resetTokenExpiry && admin.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'קוד האיפוס פג תוקף. בקש איפוס חדש.' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update password and clear reset token
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'הסיסמה שונתה בהצלחה! אפשר להתחבר עכשיו.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'שגיאה באיפוס הסיסמה. נסה שוב.' },
      { status: 500 }
    )
  }
}

// GET endpoint for reset password page (verify token is valid)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'קוד איפוס חסר' },
      { status: 400 }
    )
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; adminId: string }

    // Find admin
    const admin = await prisma.admin.findFirst({
      where: {
        email: decoded.email.toLowerCase(),
        resetToken: token,
      },
    })

    if (!admin) {
      return NextResponse.json(
        { valid: false, error: 'קוד איפוס לא תקין' },
        { status: 404 }
      )
    }

    // Check expiry
    if (admin.resetTokenExpiry && admin.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'קוד האיפוס פג תוקף' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: admin.email,
      name: admin.name,
    })
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { valid: false, error: 'קוד האיפוס פג תוקף' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { valid: false, error: 'קוד איפוס לא תקין' },
      { status: 400 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as jwt from 'jsonwebtoken'
import { sendWelcomeEmail } from '@/lib/email'
import { login } from '@/lib/auth.server'

const JWT_SECRET = process.env.JWT_SECRET!

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'קוד האימות חסר' },
        { status: 400 }
      )
    }

    // Verify JWT token
    let decoded: { email: string }
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: 'קוד האימות פג תוקף. בקש קוד חדש.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'קוד האימות לא תקין' },
        { status: 400 }
      )
    }

    // Find admin by email and verification token
    const admin = await prisma.admin.findFirst({
      where: {
        email: decoded.email.toLowerCase(),
        verificationToken: token,
      },
      include: {
        school: true,
      },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'קוד אימות לא תקין או כבר נעשה בו שימוש' },
        { status: 404 }
      )
    }

    if (admin.emailVerified) {
      return NextResponse.json(
        { error: 'המייל כבר אומת. אפשר להתחבר.' },
        { status: 400 }
      )
    }

    // Mark email as verified and clear token
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        lastLoginAt: new Date(),
      },
    })

    // Send welcome email
    if (admin.school) {
      await sendWelcomeEmail(
        admin.email,
        admin.name,
        admin.school.name
      )
    }

    // Auto-login the user by creating a session
    // Note: We can't use the login() function directly here because
    // it sets cookies and we're in an API route
    // Instead, we'll return success and let the frontend handle login

    return NextResponse.json({
      success: true,
      message: 'המייל אומת בהצלחה! ברוך הבא!',
      admin: {
        email: admin.email,
        name: admin.name,
        schoolName: admin.school?.name,
      },
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'שגיאה באימות המייל. נסה שוב.' },
      { status: 500 }
    )
  }
}

// GET endpoint for email verification via URL click
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(
      new URL('/admin/login?error=missing_token', request.url)
    )
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }

    // Find and verify admin
    const admin = await prisma.admin.findFirst({
      where: {
        email: decoded.email.toLowerCase(),
        verificationToken: token,
      },
      include: {
        school: true,
      },
    })

    if (!admin) {
      return NextResponse.redirect(
        new URL('/admin/login?error=invalid_token', request.url)
      )
    }

    if (admin.emailVerified) {
      return NextResponse.redirect(
        new URL('/admin/login?message=already_verified', request.url)
      )
    }

    // Mark as verified
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        lastLoginAt: new Date(),
      },
    })

    // Send welcome email
    if (admin.school) {
      await sendWelcomeEmail(
        admin.email,
        admin.name,
        admin.school.name
      )
    }

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL('/admin/login?message=verified', request.url)
    )
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.redirect(
        new URL('/admin/login?error=token_expired', request.url)
      )
    }
    return NextResponse.redirect(
      new URL('/admin/login?error=verification_failed', request.url)
    )
  }
}

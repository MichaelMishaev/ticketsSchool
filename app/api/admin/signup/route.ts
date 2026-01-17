import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { sendVerificationEmail } from '@/lib/email'
import { encodeSession, SESSION_COOKIE_NAME, type AuthSession } from '@/lib/auth.server'
import { randomUUID } from 'crypto'
import { validatePassword } from '@/lib/password-validator'
import { authLogger } from '@/lib/logger-v2'

// Lazy getter for JWT_SECRET - only validates when actually used (not at import time)
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return secret
}

interface SignupRequest {
  email: string
  password: string
  name: string
}

export async function POST(request: NextRequest) {
  try {
    authLogger.debug('Starting signup process')
    const body: SignupRequest = await request.json()
    const { email, password, name } = body
    authLogger.debug('Received signup data', { email, name })

    // Validation
    if (!email || !password || !name) {
      authLogger.warn('Signup validation failed: missing required fields')
      return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'כתובת מייל לא תקינה' }, { status: 400 })
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      return NextResponse.json({ error: 'הסיסמה חייבת להיות לפחות 8 תווים' }, { status: 400 })
    }

    // Validate password strength (AFTER length check, BEFORE hash)
    const passwordValidation = validatePassword(password, email)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'הסיסמה אינה עומדת בדרישות האבטחה',
          details: passwordValidation.errors,
        },
        { status: 400 }
      )
    }

    // Check if email already exists
    authLogger.debug('Checking if email exists', { email })
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingAdmin) {
      authLogger.info('Signup attempt with existing email', { email })
      return NextResponse.json({ error: 'כתובת המייל הזאת כבר קיימת במערכת' }, { status: 409 })
    }

    // Hash password
    authLogger.debug('Hashing password')
    const passwordHash = await bcrypt.hash(password, 10)

    // Generate email verification token (24 hour expiry)
    authLogger.debug('Generating verification token')
    const verificationToken = jwt.sign({ email: email.toLowerCase() }, getJWTSecret(), {
      expiresIn: '24h',
    })

    // Create admin without school (onboarding will be completed after email verification)
    authLogger.debug('Creating admin account')
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: 'OWNER',
        schoolId: null, // Will be set during onboarding
        emailVerified: false,
        verificationToken,
        onboardingCompleted: false, // Will be completed after onboarding
      },
    })
    authLogger.info('Admin account created successfully', { adminId: admin.id, email })

    // Send verification email
    authLogger.debug('Sending verification email')
    const emailSent = await sendVerificationEmail(email.toLowerCase(), verificationToken, name)

    if (!emailSent) {
      authLogger.warn('Verification email failed to send, but account was created', { email })
    } else {
      authLogger.info('Verification email sent successfully', { email })
    }

    authLogger.info('Signup completed successfully', { adminId: admin.id })
    return NextResponse.json({
      success: true,
      message: 'החשבון נוצר בהצלחה! שלחנו לך מייל לאימות.',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    })
  } catch (error) {
    // Log full error details server-side only
    const requestId = randomUUID()
    authLogger.error('Signup failed', {
      error,
      requestId,
    })

    // Return generic error to client (no internal details exposed)
    return NextResponse.json(
      {
        error: 'שגיאה ביצירת החשבון. נסה שוב מאוחר יותר.',
        requestId, // For support tracking only
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

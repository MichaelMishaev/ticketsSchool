import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { sendVerificationEmail } from '@/lib/email'

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
  schoolName?: string
  schoolSlug?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Signup] Starting signup process')
    const body: SignupRequest = await request.json()
    const { email, password, name, schoolName, schoolSlug } = body
    console.log('[Signup] Received data:', { email, name, schoolName, schoolSlug })

    // Validation
    if (!email || !password || !name) {
      console.log('[Signup] Validation failed: missing required fields')
      return NextResponse.json(
        { error: 'חסרים שדות חובה' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'כתובת מייל לא תקינה' },
        { status: 400 }
      )
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'הסיסמה חייבת להיות לפחות 8 תווים' },
        { status: 400 }
      )
    }

    // Check if email already exists
    console.log('[Signup] Checking if email exists:', email)
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingAdmin) {
      console.log('[Signup] Email already exists')
      return NextResponse.json(
        { error: 'כתובת המייל הזאת כבר קיימת במערכת' },
        { status: 409 }
      )
    }

    // Hash password
    console.log('[Signup] Hashing password')
    const passwordHash = await bcrypt.hash(password, 10)

    // Generate email verification token (24 hour expiry)
    console.log('[Signup] Generating verification token')
    const verificationToken = jwt.sign(
      { email: email.toLowerCase() },
      getJWTSecret(),
      { expiresIn: '24h' }
    )

    // Create school if schoolName and schoolSlug are provided
    let createdSchoolId: string | null = null
    let requiresOnboarding = true

    if (schoolName && schoolSlug) {
      console.log('[Signup] Creating school:', { schoolName, schoolSlug })

      // Check if slug already exists
      const existingSchool = await prisma.school.findUnique({
        where: { slug: schoolSlug }
      })

      if (existingSchool) {
        console.log('[Signup] School slug already exists')
        return NextResponse.json(
          { error: 'הקישור הזה כבר תפוס. אנא בחר קישור אחר.' },
          { status: 409 }
        )
      }

      const school = await prisma.school.create({
        data: {
          name: schoolName,
          slug: schoolSlug,
        }
      })
      createdSchoolId = school.id
      requiresOnboarding = false
      console.log('[Signup] School created successfully:', school.id)
    }

    // Create admin
    console.log('[Signup] Creating admin account')
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: 'OWNER',
        schoolId: createdSchoolId, // Will be null if onboarding required
        emailVerified: false,
        verificationToken,
        onboardingCompleted: !requiresOnboarding, // True if school was created
      },
    })
    console.log('[Signup] Admin account created successfully')

    // Send verification email
    console.log('[Signup] Sending verification email')
    const emailSent = await sendVerificationEmail(
      email.toLowerCase(),
      verificationToken,
      name
    )

    if (!emailSent) {
      console.warn('[Signup] Verification email failed to send, but account was created')
    } else {
      console.log('[Signup] Verification email sent successfully')
    }

    console.log('[Signup] Signup completed successfully')
    return NextResponse.json({
      success: true,
      message: 'החשבון נוצר בהצלחה! שלחנו לך מייל לאימות.',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      emailSent,
      requiresOnboarding,
    })
  } catch (error) {
    console.error('Signup error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    })
    return NextResponse.json(
      {
        error: 'שגיאה ביצירת החשבון. נסה שוב.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

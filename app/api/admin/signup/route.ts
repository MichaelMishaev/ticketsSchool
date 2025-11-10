import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { sendVerificationEmail } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev'

interface SignupRequest {
  email: string
  password: string
  name: string
  schoolName: string
  schoolSlug: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Signup] Starting signup process')
    const body: SignupRequest = await request.json()
    const { email, password, name, schoolName, schoolSlug } = body
    console.log('[Signup] Received data:', { email, name, schoolName, schoolSlug })

    // Validation
    if (!email || !password || !name || !schoolName || !schoolSlug) {
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

    // Validate school slug (alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(schoolSlug)) {
      return NextResponse.json(
        { error: 'קישור הארגון יכול להכיל רק אותיות באנגלית, מספרים ומקפים' },
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

    // Check if school slug already exists
    console.log('[Signup] Checking if school slug exists:', schoolSlug)
    const existingSchool = await prisma.school.findUnique({
      where: { slug: schoolSlug.toLowerCase() },
    })

    if (existingSchool) {
      console.log('[Signup] School slug already exists')
      return NextResponse.json(
        { error: 'הקישור הזה כבר תפוס, בחר קישור אחר' },
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
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Create school and admin in a transaction
    console.log('[Signup] Starting database transaction')
    const result = await prisma.$transaction(async (tx) => {
      // Create school with FREE plan
      const school = await tx.school.create({
        data: {
          name: schoolName,
          slug: schoolSlug.toLowerCase(),
          plan: 'FREE',
          subscriptionStatus: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },
      })

      // Create admin with OWNER role
      const admin = await tx.admin.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name,
          role: 'OWNER',
          schoolId: school.id,
          emailVerified: false,
          verificationToken,
        },
      })

      return { school, admin }
    })
    console.log('[Signup] Transaction completed successfully')

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
      school: {
        id: result.school.id,
        name: result.school.name,
        slug: result.school.slug,
      },
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
      },
      emailSent,
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

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin, encodeSession, SESSION_COOKIE_NAME, AuthSession } from '@/lib/auth.server'
import { randomUUID } from 'crypto'

interface OnboardingRequest {
  schoolName: string
  schoolSlug: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const currentAdmin = await getCurrentAdmin()
    if (!currentAdmin) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
    }

    console.log('[Onboarding] Starting onboarding for admin:', currentAdmin.adminId)

    const body: OnboardingRequest = await request.json()
    const { schoolName, schoolSlug } = body

    // Validation
    if (!schoolName || !schoolSlug) {
      return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 })
    }

    // Validate school slug (alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(schoolSlug)) {
      return NextResponse.json(
        { error: 'קישור הארגון יכול להכיל רק אותיות באנגלית, מספרים ומקפים' },
        { status: 400 }
      )
    }

    // Check if school name already exists
    const existingSchoolByName = await prisma.school.findFirst({
      where: {
        name: {
          equals: schoolName,
          mode: 'insensitive',
        },
      },
    })

    if (existingSchoolByName) {
      return NextResponse.json(
        { error: 'שם הארגון הזה כבר קיים במערכת, בחר שם אחר' },
        { status: 409 }
      )
    }

    // Check if school slug already exists
    const existingSchool = await prisma.school.findUnique({
      where: { slug: schoolSlug.toLowerCase() },
    })

    if (existingSchool) {
      return NextResponse.json({ error: 'הקישור הזה כבר תפוס, בחר קישור אחר' }, { status: 409 })
    }

    // Create school and update admin in a transaction
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

      // Update admin with school and mark onboarding as completed
      const admin = await tx.admin.update({
        where: { id: currentAdmin.adminId },
        data: {
          schoolId: school.id,
          onboardingCompleted: true,
        },
        include: { school: true },
      })

      return { school, admin }
    })

    console.log('[Onboarding] Onboarding completed successfully')

    // Create updated session with new school information
    const updatedSession: AuthSession = {
      adminId: result.admin.id,
      email: result.admin.email,
      name: result.admin.name,
      role: result.admin.role,
      schoolId: result.school.id,
      schoolName: result.school.name,
    }

    // Create response and update session cookie
    const response = NextResponse.json({
      success: true,
      message: 'הארגון נוצר בהצלחה!',
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
    })

    // Update session cookie with new school information
    response.cookies.set(SESSION_COOKIE_NAME, encodeSession(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    // Log full error details server-side only
    const requestId = randomUUID()
    console.error('[Onboarding] ERROR - Request ID:', requestId)
    console.error('[Onboarding] Error:', error)
    console.error('[Onboarding] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Return generic error to client (no internal details exposed)
    return NextResponse.json(
      {
        error: 'שגיאה ביצירת הארגון. נסה שוב מאוחר יותר.',
        requestId, // For support tracking only
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

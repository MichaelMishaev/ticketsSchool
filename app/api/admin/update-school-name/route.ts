import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { randomUUID } from 'crypto'
import { logger } from '@/lib/logger-v2'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })
    }

    // Admin must have a school
    if (!admin.schoolId) {
      return NextResponse.json({ error: 'לא נמצא ארגון משויך למשתמש' }, { status: 400 })
    }

    const body = await request.json()
    const { newName } = body

    if (!newName || !newName.trim()) {
      return NextResponse.json({ error: 'שם הארגון לא יכול להיות ריק' }, { status: 400 })
    }

    logger.info('Admin updating school name', { source: 'admin', adminEmail: admin.email, newName })

    // Check if another school already has this name
    const existingSchool = await prisma.school.findFirst({
      where: {
        name: {
          equals: newName,
          mode: 'insensitive',
        },
        id: {
          not: admin.schoolId,
        },
      },
    })

    if (existingSchool) {
      return NextResponse.json(
        { error: 'שם הארגון הזה כבר קיים במערכת, בחר שם אחר' },
        { status: 409 }
      )
    }

    // Update the school name
    const updatedSchool = await prisma.school.update({
      where: { id: admin.schoolId },
      data: { name: newName.trim() },
    })

    logger.info('Successfully updated school name', { source: 'admin', schoolId: updatedSchool.id, newName: updatedSchool.name, slug: updatedSchool.slug, updatedBy: admin.email })

    return NextResponse.json({
      success: true,
      message: 'שם הארגון עודכן בהצלחה!',
      school: {
        id: updatedSchool.id,
        name: updatedSchool.name,
        slug: updatedSchool.slug,
      },
    })
  } catch (error) {
    // Log full error details server-side only
    const requestId = randomUUID()
    logger.error('Error updating school name', { source: 'admin', requestId, error })

    // Return generic error to client (no internal details exposed)
    return NextResponse.json(
      {
        error: 'שגיאה בעדכון שם הארגון. נסה שוב מאוחר יותר.',
        requestId, // For support tracking only
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'לא מחובר' },
        { status: 401 }
      )
    }

    // Admin must have a school
    if (!admin.schoolId) {
      return NextResponse.json(
        { error: 'לא נמצא ארגון משויך למשתמש' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { newName } = body

    if (!newName || !newName.trim()) {
      return NextResponse.json(
        { error: 'שם הארגון לא יכול להיות ריק' },
        { status: 400 }
      )
    }

    console.log(`[Update School Name] Admin ${admin.email} updating school name to "${newName}"`)

    // Check if another school already has this name
    const existingSchool = await prisma.school.findFirst({
      where: {
        name: {
          equals: newName,
          mode: 'insensitive'
        },
        id: {
          not: admin.schoolId
        }
      }
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
      data: { name: newName.trim() }
    })

    console.log(`[Update School Name] ✅ Successfully updated school:`)
    console.log(`  School ID: ${updatedSchool.id}`)
    console.log(`  New Name: ${updatedSchool.name}`)
    console.log(`  Slug: ${updatedSchool.slug}`)
    console.log(`  Updated by: ${admin.email}`)

    return NextResponse.json({
      success: true,
      message: 'שם הארגון עודכן בהצלחה!',
      school: {
        id: updatedSchool.id,
        name: updatedSchool.name,
        slug: updatedSchool.slug
      }
    })
  } catch (error) {
    console.error('[Update School Name] Error:', error)
    return NextResponse.json(
      {
        error: 'שגיאה בעדכון שם הארגון. נסה שוב.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

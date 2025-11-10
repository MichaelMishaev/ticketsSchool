import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only SUPER_ADMIN can rename schools
    const admin = await getCurrentAdmin()
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - SUPER_ADMIN only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { oldName, newName } = body

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: 'oldName and newName are required' },
        { status: 400 }
      )
    }

    console.log(`[Rename School] Attempting to rename "${oldName}" to "${newName}"`)

    // Find the school by old name
    const school = await prisma.school.findFirst({
      where: {
        name: {
          equals: oldName,
          mode: 'insensitive'
        }
      }
    })

    if (!school) {
      return NextResponse.json(
        { error: `School "${oldName}" not found` },
        { status: 404 }
      )
    }

    // Update the school name
    const updatedSchool = await prisma.school.update({
      where: { id: school.id },
      data: { name: newName }
    })

    console.log(`[Rename School] ✅ Successfully renamed school:`)
    console.log(`  ID: ${updatedSchool.id}`)
    console.log(`  Old Name: ${oldName}`)
    console.log(`  New Name: ${updatedSchool.name}`)
    console.log(`  Slug: ${updatedSchool.slug}`)

    return NextResponse.json({
      success: true,
      message: `School renamed from "${oldName}" to "${newName}"`,
      school: {
        id: updatedSchool.id,
        name: updatedSchool.name,
        slug: updatedSchool.slug
      }
    })
  } catch (error) {
    console.error('[Rename School] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to rename school',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

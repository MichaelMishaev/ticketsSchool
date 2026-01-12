import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only SUPER_ADMIN can rename schools
    const admin = await getCurrentAdmin()
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - SUPER_ADMIN only' }, { status: 403 })
    }

    const body = await request.json()
    const { oldName, newName } = body

    if (!oldName || !newName) {
      return NextResponse.json({ error: 'oldName and newName are required' }, { status: 400 })
    }

    console.log(`[Rename School] Attempting to rename "${oldName}" to "${newName}"`)

    // Find the school by old name
    const school = await prisma.school.findFirst({
      where: {
        name: {
          equals: oldName,
          mode: 'insensitive',
        },
      },
    })

    if (!school) {
      return NextResponse.json({ error: `School "${oldName}" not found` }, { status: 404 })
    }

    // Update the school name
    const updatedSchool = await prisma.school.update({
      where: { id: school.id },
      data: { name: newName },
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
        slug: updatedSchool.slug,
      },
    })
  } catch (error) {
    // Log full error details server-side only
    const requestId = randomUUID()
    console.error('[Rename School] ERROR - Request ID:', requestId)
    console.error('[Rename School] Error:', error)
    console.error('[Rename School] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Return generic error to client (no internal details exposed)
    return NextResponse.json(
      {
        error: 'Failed to rename school',
        requestId, // For support tracking only
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

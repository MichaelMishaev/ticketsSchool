import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

/**
 * GET /api/admin/super/admins
 * Super Admin only - Get all admins across all schools
 */
export async function GET() {
  try {
    await requireSuperAdmin()

    const admins = await prisma.admin.findMany({
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedAdmins = admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      schoolId: admin.schoolId,
      schoolName: admin.school?.name || null,
      emailVerified: admin.emailVerified,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt?.toISOString() || null,
      createdAt: admin.createdAt.toISOString(),
    }))

    return NextResponse.json({ admins: formattedAdmins })
  } catch (error) {
    console.error('Get admins error:', error)

    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/super/admins
 * Super Admin only - Delete an admin by ID or email
 * WARNING: This will CASCADE delete the admin's school and all associated events, registrations, etc.
 */
export async function DELETE(request: NextRequest) {
  try {
    const currentAdmin = await requireSuperAdmin()

    // Safely parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 })
    }

    const { adminId, email } = body

    if (!adminId && !email) {
      return NextResponse.json({ error: 'Either adminId or email is required' }, { status: 400 })
    }

    // Find the admin first to return info
    const adminToDelete = await prisma.admin.findFirst({
      where: adminId ? { id: adminId } : { email },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                events: true,
                admins: true,
              },
            },
          },
        },
      },
    })

    if (!adminToDelete) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // Prevent deleting yourself
    if (adminToDelete.id === currentAdmin.adminId) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 })
    }

    // Prevent deleting other SUPER_ADMIN users
    if (adminToDelete.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot delete SUPER_ADMIN users' }, { status: 400 })
    }

    const deletionResult = {
      adminDeleted: {
        id: adminToDelete.id,
        email: adminToDelete.email,
        name: adminToDelete.name,
      },
      schoolDeleted: null as {
        id: string
        name: string
        slug: string
        eventsDeleted: number
        adminsDeleted: number
      } | null,
    }

    // CASCADE DELETE: If admin has a school, delete the entire school (and all events, registrations, etc.)
    if (adminToDelete.schoolId && adminToDelete.school) {
      // Store school info before deletion (needed for response)
      const schoolInfo = {
        id: adminToDelete.school.id,
        name: adminToDelete.school.name,
        slug: adminToDelete.school.slug,
        eventsDeleted: adminToDelete.school._count.events,
        adminsDeleted: adminToDelete.school._count.admins,
      }

      // Delete the school (Prisma cascade deletes will handle events, registrations, admins, etc.)
      // Note: This will also cascade delete the admin, so we don't need to delete it separately
      await prisma.school.delete({
        where: { id: adminToDelete.schoolId },
      })

      deletionResult.schoolDeleted = schoolInfo
    } else {
      // If no school, just delete the admin
      await prisma.admin.delete({
        where: { id: adminToDelete.id },
      })
    }

    return NextResponse.json({
      success: true,
      ...deletionResult,
    })
  } catch (error) {
    // Log full error details server-side only
    const requestId = randomUUID()
    console.error('[Super Admin DELETE] ERROR - Request ID:', requestId)
    console.error('Delete admin error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }

    // Handle Prisma errors (return generic messages, log details server-side)
    if (error instanceof Error) {
      // Check for foreign key constraint errors
      if (
        error.message.includes('Foreign key constraint') ||
        error.message.includes('violates foreign key constraint')
      ) {
        return NextResponse.json(
          {
            error: 'Cannot delete admin: There are still references to this admin in the database',
            requestId,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        )
      }

      // Check for record not found errors
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          {
            error: 'Admin not found',
            requestId,
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        )
      }
    }

    // Return generic error to client (no internal details exposed)
    return NextResponse.json(
      {
        error: 'Failed to delete admin',
        requestId, // For support tracking only
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

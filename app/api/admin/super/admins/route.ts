import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

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
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedAdmins = admins.map(admin => ({
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
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    )
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

    const body = await request.json()
    const { adminId, email } = body

    if (!adminId && !email) {
      return NextResponse.json(
        { error: 'Either adminId or email is required' },
        { status: 400 }
      )
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
              }
            }
          }
        }
      }
    })

    if (!adminToDelete) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Prevent deleting yourself
    if (adminToDelete.id === currentAdmin.adminId) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 }
      )
    }

    // Prevent deleting other SUPER_ADMIN users
    if (adminToDelete.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete SUPER_ADMIN users' },
        { status: 400 }
      )
    }

    let deletionResult = {
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
      } | null
    }

    // CASCADE DELETE: If admin has a school, delete the entire school (and all events, registrations, etc.)
    if (adminToDelete.schoolId && adminToDelete.school) {
      // Delete the school (Prisma cascade deletes will handle events, registrations, admins, etc.)
      await prisma.school.delete({
        where: { id: adminToDelete.schoolId }
      })

      deletionResult.schoolDeleted = {
        id: adminToDelete.school.id,
        name: adminToDelete.school.name,
        slug: adminToDelete.school.slug,
        eventsDeleted: adminToDelete.school._count.events,
        adminsDeleted: adminToDelete.school._count.admins,
      }
    } else {
      // If no school, just delete the admin
      await prisma.admin.delete({
        where: { id: adminToDelete.id }
      })
    }

    return NextResponse.json({
      success: true,
      ...deletionResult
    })
  } catch (error) {
    console.error('Delete admin error:', error)

    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    )
  }
}

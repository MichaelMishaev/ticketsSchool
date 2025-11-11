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
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireSuperAdmin()

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
            name: true,
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
    // Note: You might want to add a check here to prevent deleting the current admin

    // Delete the admin
    await prisma.admin.delete({
      where: { id: adminToDelete.id }
    })

    return NextResponse.json({
      success: true,
      deletedAdmin: {
        id: adminToDelete.id,
        email: adminToDelete.email,
        name: adminToDelete.name,
        schoolName: adminToDelete.school?.name || null,
      }
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

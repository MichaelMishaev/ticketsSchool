import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

/**
 * GET /api/admin/super/schools
 * Super Admin only - Get all schools with statistics
 */
export async function GET() {
  try {
    await requireSuperAdmin()

    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            events: true,
            admins: true,
          }
        },
        admins: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedSchools = schools.map(school => ({
      id: school.id,
      name: school.name,
      slug: school.slug,
      logo: school.logo,
      primaryColor: school.primaryColor,
      isActive: school.isActive,
      plan: school.plan,
      subscriptionStatus: school.subscriptionStatus,
      eventCount: school._count.events,
      adminCount: school._count.admins,
      admins: school.admins.map(admin => ({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      })),
      createdAt: school.createdAt.toISOString(),
    }))

    return NextResponse.json({ schools: formattedSchools })
  } catch (error) {
    logger.error('Get schools error', { source: 'super-admin', error })

    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/super/schools
 * Super Admin only - Delete a school by ID
 * WARNING: This will cascade delete all events, registrations, and admins associated with the school
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { schoolId } = body

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      )
    }

    // Find the school first to return info
    const schoolToDelete = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            events: true,
            admins: true,
          }
        }
      }
    })

    if (!schoolToDelete) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    // Delete the school (will cascade delete events, registrations, admins, etc.)
    await prisma.school.delete({
      where: { id: schoolId }
    })

    return NextResponse.json({
      success: true,
      deletedSchool: {
        id: schoolToDelete.id,
        name: schoolToDelete.name,
        slug: schoolToDelete.slug,
        eventsDeleted: schoolToDelete._count.events,
        adminsDeleted: schoolToDelete._count.admins,
      }
    })
  } catch (error) {
    logger.error('Delete school error', { source: 'super-admin', error })

    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    )
  }
}

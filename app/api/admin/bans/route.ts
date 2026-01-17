import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

/**
 * GET /api/admin/bans
 * List all bans for the admin's school
 * Supports filtering by status (active/expired)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active' | 'expired' | 'all'
    const search = searchParams.get('search') || ''

    // Build school filter
    const schoolFilter = admin.role === 'SUPER_ADMIN' ? {} : { schoolId: admin.schoolId }

    // Build status filter
    let statusFilter = {}
    if (status === 'active') {
      statusFilter = {
        active: true,
        OR: [
          { expiresAt: { gte: new Date() } }, // Date-based not expired
          { expiresAt: null } // Game-based
        ]
      }
    } else if (status === 'expired') {
      statusFilter = {
        OR: [
          { active: false },
          { expiresAt: { lt: new Date() } }
        ]
      }
    }

    // Build search filter
    const searchFilter = search
      ? {
          OR: [
            { phoneNumber: { contains: search } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {}

    // Fetch bans
    const bans = await prisma.userBan.findMany({
      where: {
        ...schoolFilter,
        ...statusFilter,
        ...searchFilter
      },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        name: true,
        reason: true,
        bannedGamesCount: true,
        eventsBlocked: true,
        bannedAt: true,
        expiresAt: true,
        active: true,
        liftedAt: true,
        liftedBy: true,
        liftedReason: true,
        createdBy: true,
        admin: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { active: 'desc' },
        { bannedAt: 'desc' }
      ]
    })

    // Calculate remaining games for active game-based bans
    const enhancedBans = bans.map(ban => {
      const isDateBased = !!ban.expiresAt
      const isExpired = ban.expiresAt && ban.expiresAt < new Date()
      const remainingGames = !isDateBased
        ? Math.max(0, ban.bannedGamesCount - ban.eventsBlocked)
        : null

      return {
        ...ban,
        isActive: ban.active && !isExpired,
        isDateBased,
        remainingGames,
        createdByName: ban.admin.name
      }
    })

    // Count by status
    const activeCount = enhancedBans.filter(b => b.isActive).length
    const expiredCount = enhancedBans.filter(b => !b.isActive).length

    return NextResponse.json({
      bans: enhancedBans,
      counts: {
        active: activeCount,
        expired: expiredCount,
        total: enhancedBans.length
      }
    })
  } catch (error) {
    logger.error('Error fetching bans', { source: 'admin', error })
    return NextResponse.json(
      { error: 'Failed to load bans' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/bans
 * Create a new ban for one or more users
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()

    const {
      users, // Array of { phoneNumber, email?, name? }
      reason,
      bannedGamesCount,
      expiresAt
    } = body

    // Validation
    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Users array required' },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason required' },
        { status: 400 }
      )
    }

    // Must have either bannedGamesCount or expiresAt
    if (!bannedGamesCount && !expiresAt) {
      return NextResponse.json(
        { error: 'Either bannedGamesCount or expiresAt required' },
        { status: 400 }
      )
    }

    // Validate schoolId
    if (admin.role !== 'SUPER_ADMIN' && !admin.schoolId) {
      return NextResponse.json(
        { error: 'Admin must have a school assigned' },
        { status: 403 }
      )
    }

    const schoolId = admin.role === 'SUPER_ADMIN' && body.schoolId
      ? body.schoolId
      : admin.schoolId

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID required' },
        { status: 400 }
      )
    }

    // Create bans for all users
    const createdBans = await Promise.all(
      users.map(async (user) => {
        // Check if user already has an active ban
        const existingBan = await prisma.userBan.findFirst({
          where: {
            phoneNumber: user.phoneNumber,
            schoolId,
            active: true
          }
        })

        if (existingBan) {
          // Update existing ban instead of creating duplicate
          return prisma.userBan.update({
            where: { id: existingBan.id },
            data: {
              reason,
              bannedGamesCount: bannedGamesCount || existingBan.bannedGamesCount,
              expiresAt: expiresAt ? new Date(expiresAt) : existingBan.expiresAt,
              eventsBlocked: 0, // Reset counter
              bannedAt: new Date() // Update ban date
            }
          })
        }

        // Create new ban
        return prisma.userBan.create({
          data: {
            phoneNumber: user.phoneNumber,
            email: user.email || null,
            name: user.name || null,
            schoolId,
            reason,
            bannedGamesCount: bannedGamesCount || 3,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: admin.adminId
          }
        })
      })
    )

    return NextResponse.json({
      success: true,
      bansCreated: createdBans.length,
      bans: createdBans
    })
  } catch (error) {
    logger.error('Error creating ban', { source: 'admin', error })
    return NextResponse.json(
      { error: 'Failed to create ban' },
      { status: 500 }
    )
  }
}

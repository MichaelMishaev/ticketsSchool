/**
 * SUPER_ADMIN only - Backup QA database
 * This runs inside Railway's environment so it can access internal database
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { logger } from '@/lib/logger-v2'
import 'server-only'

export async function GET(request: NextRequest) {
  try {
    // Only SUPER_ADMIN can backup database
    await requireSuperAdmin()

    logger.info('Starting QA database backup', { source: 'super-admin' })

    // Fetch all data
    const [schools, admins, events, registrations, teamInvitations, usageRecords, feedback] =
      await Promise.all([
        prisma.school.findMany(),
        prisma.admin.findMany(),
        prisma.event.findMany(),
        prisma.registration.findMany(),
        prisma.teamInvitation.findMany(),
        prisma.usageRecord.findMany(),
        prisma.feedback.findMany(),
      ])

    const backup = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: process.env.DATABASE_URL?.includes('postgres-copy') ? 'QA' : 'Production',
      stats: {
        schools: schools.length,
        admins: admins.length,
        events: events.length,
        registrations: registrations.length,
        teamInvitations: teamInvitations.length,
        usageRecords: usageRecords.length,
        feedback: feedback.length,
      },
      data: {
        schools,
        admins,
        events,
        registrations,
        teamInvitations,
        usageRecords,
        feedback,
      },
    }

    logger.info('Backup completed', { source: 'super-admin', stats: backup.stats })

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="qa-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    // Log full error details server-side only
    const requestId = randomUUID()
    logger.error('Backup failed', {
      source: 'super-admin',
      requestId,
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    })

    // Return generic error to client (no internal details exposed)
    return NextResponse.json(
      {
        error: 'Backup failed',
        requestId, // For support tracking only
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

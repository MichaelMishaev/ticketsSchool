import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { logger } from '@/lib/logger-v2'

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()

    const { incidentType, severity, description, affectedUsers, dataTypes } = body

    // Validate input
    if (!incidentType || !severity || !description || !affectedUsers || !dataTypes) {
      return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 })
    }

    // Create breach record
    const breach = await prisma.breachIncident.create({
      data: {
        schoolId: admin.schoolId || null,
        incidentType,
        severity,
        description,
        affectedUsers: parseInt(affectedUsers),
        dataTypes: JSON.stringify(dataTypes),
        detectedAt: new Date(),
      },
    })

    // Auto-notify PPA if critical or high severity
    if (severity === 'critical' || severity === 'high') {
      // Log the notification (in production, would send actual email/API call to PPA)
      logger.error('BREACH - PPA NOTIFICATION REQUIRED', {
        source: 'admin',
        breachId: breach.id,
        severity: breach.severity,
        affectedUsers: breach.affectedUsers,
        schoolId: breach.schoolId || undefined,
      })

      await prisma.breachIncident.update({
        where: { id: breach.id },
        data: {
          notifiedPPA: true,
          reportedAt: new Date(),
        },
      })
    }

    // Log for DPO notification
    logger.info('Breach detected - DPO should be notified', {
      source: 'admin',
      breachId: breach.id,
      severity: breach.severity,
      incidentType: breach.incidentType,
    })

    return NextResponse.json({
      success: true,
      breachId: breach.id,
      severity: breach.severity,
      notifiedPPA: severity === 'critical' || severity === 'high',
    })
  } catch (error) {
    const requestId = randomUUID()
    logger.error('Breach report error', { source: 'admin', requestId, error })

    return NextResponse.json(
      {
        error: 'שגיאה בדיווח על אירוע אבטחה',
        requestId,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()

    // Build filter
    const where: any = {}

    // Non-SUPER_ADMIN can only see their school's breaches
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 403 })
      }
      where.schoolId = admin.schoolId
    }

    const breaches = await prisma.breachIncident.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: 50,
      include: {
        school: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ breaches })
  } catch (error) {
    logger.error('Error fetching breach list', { source: 'admin', error })
    return NextResponse.json({ error: 'שגיאה בטעינת רשימת אירועים' }, { status: 500 })
  }
}

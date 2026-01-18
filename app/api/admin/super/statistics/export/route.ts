import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/super/statistics/export
 * Super Admin only - Export statistics as CSV
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'revenue'
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    if (!fromParam || !toParam) {
      return NextResponse.json({ error: 'Missing date range parameters' }, { status: 400 })
    }

    const from = new Date(fromParam)
    const to = new Date(toParam)

    // Validate date format
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Validate date range (max 1 year)
    const maxRange = 365 * 24 * 60 * 60 * 1000
    if (to.getTime() - from.getTime() > maxRange) {
      return NextResponse.json({ error: 'Date range too large (max 1 year)' }, { status: 400 })
    }

    let csv = ''
    let filename = ''

    switch (type) {
      case 'revenue':
        csv = await exportRevenue(from, to)
        filename = `revenue_${formatDateForFilename(from)}_${formatDateForFilename(to)}.csv`
        break
      case 'registrations':
        csv = await exportRegistrations(from, to)
        filename = `registrations_${formatDateForFilename(from)}_${formatDateForFilename(to)}.csv`
        break
      case 'capacity':
        csv = await exportCapacity(from, to)
        filename = `capacity_${formatDateForFilename(from)}_${formatDateForFilename(to)}.csv`
        break
      case 'checkins':
        csv = await exportCheckins(from, to)
        filename = `checkins_${formatDateForFilename(from)}_${formatDateForFilename(to)}.csv`
        break
      case 'platform':
        csv = await exportPlatform(from, to)
        filename = `platform_${formatDateForFilename(from)}_${formatDateForFilename(to)}.csv`
        break
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    // Add BOM for Hebrew support in Excel
    const bom = '\uFEFF'
    const csvWithBom = bom + csv

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    if (error instanceof Error && error.message.includes('Super admin required')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0]
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

async function exportRevenue(from: Date, to: Date): Promise<string> {
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: from, lt: to },
    },
    include: {
      school: { select: { name: true } },
      event: { select: { title: true } },
      registration: { select: { confirmationCode: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = ['תאריך', 'בית ספר', 'אירוע', 'קוד אישור', 'סכום', 'סטטוס', 'שיטת תשלום']
  const rows = payments.map((p) => [
    new Date(p.createdAt).toLocaleString('he-IL'),
    p.school?.name || 'בית ספר לא ידוע',
    p.event?.title || 'אירוע לא ידוע',
    p.registration?.confirmationCode || '',
    Number(p.amount),
    translatePaymentStatus(p.status),
    p.paymentMethod || 'yaadpay',
  ])

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

async function exportRegistrations(from: Date, to: Date): Promise<string> {
  const registrations = await prisma.registration.findMany({
    where: {
      createdAt: { gte: from, lt: to },
    },
    include: {
      event: {
        select: {
          title: true,
          school: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = ['תאריך', 'בית ספר', 'אירוע', 'קוד אישור', 'מקומות', 'סטטוס', 'אימייל', 'טלפון']
  const rows = registrations.map((r) => [
    new Date(r.createdAt).toLocaleString('he-IL'),
    r.event?.school?.name || 'בית ספר לא ידוע',
    r.event?.title || 'אירוע לא ידוע',
    r.confirmationCode,
    r.spotsCount,
    translateRegistrationStatus(r.status),
    r.email || '',
    r.phoneNumber || '',
  ])

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

async function exportCapacity(from: Date, to: Date): Promise<string> {
  const events = await prisma.event.findMany({
    where: {
      startAt: { gte: from, lt: to },
    },
    include: {
      school: { select: { name: true } },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
    orderBy: { startAt: 'desc' },
  })

  const headers = [
    'תאריך אירוע',
    'בית ספר',
    'שם אירוע',
    'קיבולת',
    'מקומות תפוסים',
    'אחוז תפוסה',
    'סטטוס',
  ]
  const rows = events.map((e) => {
    const fillRate = e.capacity > 0 ? Math.round((e.spotsReserved / e.capacity) * 100) : 0
    return [
      new Date(e.startAt).toLocaleString('he-IL'),
      e.school?.name || 'בית ספר לא ידוע',
      e.title,
      e.capacity,
      e.spotsReserved,
      `${fillRate}%`,
      translateEventStatus(e.status),
    ]
  })

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

async function exportCheckins(from: Date, to: Date): Promise<string> {
  const checkIns = await prisma.checkIn.findMany({
    where: {
      checkedInAt: { gte: from, lt: to },
      undoneAt: null,
    },
    include: {
      registration: {
        select: {
          confirmationCode: true,
          email: true,
          phoneNumber: true,
          event: {
            select: {
              title: true,
              school: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { checkedInAt: 'desc' },
  })

  const headers = [
    "תאריך צ'ק-אין",
    'בית ספר',
    'אירוע',
    'קוד אישור',
    'באיחור',
    'דקות איחור',
    'נבדק ע"י',
  ]
  const rows = checkIns.map((c) => [
    new Date(c.checkedInAt).toLocaleString('he-IL'),
    c.registration?.event?.school?.name || 'בית ספר לא ידוע',
    c.registration?.event?.title || 'אירוע לא ידוע',
    c.registration?.confirmationCode || '',
    c.isLate ? 'כן' : 'לא',
    c.minutesLate || 0,
    c.checkedInBy || '',
  ])

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

async function exportPlatform(from: Date, to: Date): Promise<string> {
  const schools = await prisma.school.findMany({
    where: {
      createdAt: { gte: from, lt: to },
    },
    include: {
      _count: {
        select: {
          events: true,
          admins: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'שם בית ספר',
    'Slug',
    'תוכנית',
    'סטטוס מנוי',
    'פעיל',
    'מספר אירועים',
    'מספר משתמשים',
    'תאריך יצירה',
  ]
  const rows = schools.map((s) => [
    s.name,
    s.slug,
    s.plan,
    s.subscriptionStatus,
    s.isActive ? 'כן' : 'לא',
    s._count.events,
    s._count.admins,
    new Date(s.createdAt).toLocaleString('he-IL'),
  ])

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
}

function translatePaymentStatus(status: string): string {
  const translations: Record<string, string> = {
    PENDING: 'ממתין',
    PROCESSING: 'בתהליך',
    COMPLETED: 'הושלם',
    FAILED: 'נכשל',
    REFUNDED: 'הוחזר',
    CANCELLED: 'בוטל',
  }
  return translations[status] || status
}

function translateRegistrationStatus(status: string): string {
  const translations: Record<string, string> = {
    CONFIRMED: 'מאושר',
    WAITLIST: 'המתנה',
    CANCELLED: 'בוטל',
  }
  return translations[status] || status
}

function translateEventStatus(status: string): string {
  const translations: Record<string, string> = {
    OPEN: 'פתוח',
    PAUSED: 'מושהה',
    CLOSED: 'סגור',
  }
  return translations[status] || status
}

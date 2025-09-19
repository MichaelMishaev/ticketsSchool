import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateCSV(event: any): string {
  const headers = ['#', 'קוד אישור', 'סטטוס', 'מקומות', 'תאריך הרשמה']

  // Add dynamic field headers from schema
  const fieldNames = event.fieldsSchema.map((field: any) => field.label)
  headers.push(...fieldNames)

  // Add phone and email if they exist
  headers.push('טלפון', 'אימייל')

  // Create CSV rows
  const rows = event.registrations.map((reg: any, index: number) => {
    const row = [
      index + 1,
      reg.confirmationCode,
      reg.status === 'CONFIRMED' ? 'אושר' : reg.status === 'WAITLIST' ? 'רשימת המתנה' : 'בוטל',
      reg.spotsCount,
      new Date(reg.createdAt).toLocaleString('he-IL')
    ]

    // Add field values
    event.fieldsSchema.forEach((field: any) => {
      row.push(reg.data[field.name] || '')
    })

    // Add phone and email
    row.push(reg.phoneNumber || reg.data.phone || '')
    row.push(reg.email || reg.data.email || '')

    return row
  })

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  // Add BOM for Hebrew support in Excel
  return '\ufeff' + csvContent
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const csv = generateCSV(event)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="event_${event.slug}_registrations.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    )
  }
}
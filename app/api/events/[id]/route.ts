import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin, requireSchoolAccess } from '@/lib/auth.server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        school: true,
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

    // Check school access
    if (admin.role === 'SCHOOL_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this school\'s events' },
        { status: 403 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params;
    const data = await request.json()

    // Check event exists and get school
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { schoolId: true }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check school access
    if (admin.role === 'SCHOOL_ADMIN' && admin.schoolId !== existingEvent.schoolId) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this school\'s events' },
        { status: 403 }
      )
    }

    const updateData: any = {}

    // Update all provided fields
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.gameType !== undefined) updateData.gameType = data.gameType
    if (data.location !== undefined) updateData.location = data.location
    if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt)
    if (data.endAt !== undefined) updateData.endAt = data.endAt ? new Date(data.endAt) : null
    if (data.capacity !== undefined) updateData.capacity = parseInt(data.capacity)
    if (data.maxSpotsPerPerson !== undefined) updateData.maxSpotsPerPerson = parseInt(data.maxSpotsPerPerson)
    if (data.fieldsSchema !== undefined) updateData.fieldsSchema = data.fieldsSchema
    if (data.conditions !== undefined) updateData.conditions = data.conditions
    if (data.requireAcceptance !== undefined) updateData.requireAcceptance = data.requireAcceptance
    if (data.completionMessage !== undefined) updateData.completionMessage = data.completionMessage
    if (data.status !== undefined) updateData.status = data.status

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        school: true
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params;

    // Check if event exists and get registration count + school
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true }
        }
      },
      select: {
        schoolId: true,
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check school access
    if (admin.role === 'SCHOOL_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this school\'s events' },
        { status: 403 }
      )
    }

    // Only allow deletion of events with no registrations (temp events)
    if (event._count.registrations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with existing registrations. Please remove all registrations first.' },
        { status: 400 }
      )
    }

    await prisma.event.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}

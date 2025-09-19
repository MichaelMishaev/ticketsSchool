import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; registrationId: string } }
) {
  try {
    const data = await request.json()

    // Update registration status
    const registration = await prisma.registration.update({
      where: {
        id: params.registrationId,
        eventId: params.id
      },
      data: {
        status: data.status,
        ...(data.spotsCount && { spotsCount: data.spotsCount }),
        ...(data.data && { data: data.data })
      }
    })

    return NextResponse.json(registration)
  } catch (error) {
    console.error('Error updating registration:', error)
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; registrationId: string } }
) {
  try {
    await prisma.registration.delete({
      where: {
        id: params.registrationId,
        eventId: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting registration:', error)
    return NextResponse.json(
      { error: 'Failed to delete registration' },
      { status: 500 }
    )
  }
}
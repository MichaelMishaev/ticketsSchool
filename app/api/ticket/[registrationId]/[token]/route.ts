import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/ticket/[registrationId]/[token]
 *
 * Secure user ticket API endpoint.
 * Returns registration details for a specific user, validated by their cancellationToken.
 *
 * This endpoint is PUBLIC (no admin auth required) but protected by the unique token.
 * The token acts as a bearer token - anyone with the token can view this registration.
 *
 * SECURITY: Only returns the specific registration that matches the token.
 * Does NOT expose other registrations, staff controls, or phone numbers of others.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string; token: string }> }
) {
  try {
    const { registrationId, token } = await params

    // Validate required parameters
    if (!registrationId || !token) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Find registration by ID AND validate token matches
    // CRITICAL: We validate the token to prevent unauthorized access
    const registration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        cancellationToken: token, // SECURITY: Token must match
      },
      include: {
        event: {
          include: {
            school: true,
          },
        },
        checkIn: true,
      },
    })

    if (!registration) {
      // Don't reveal whether registration exists or token is wrong
      return NextResponse.json({ error: 'Ticket not found or invalid token' }, { status: 404 })
    }

    // Extract safe data from registration
    // We return the "data" field which contains user-submitted form data
    const registrationData = registration.data as Record<string, unknown>

    // Return ticket information
    return NextResponse.json({
      success: true,
      ticket: {
        id: registration.id,
        confirmationCode: registration.confirmationCode,
        status: registration.status,
        spotsCount: registration.spotsCount,
        createdAt: registration.createdAt,
        // User data (from form submission)
        name: registrationData.name || registrationData.childName || 'Unknown',
        data: registrationData, // Full form data (their own data)
        // Payment info (if applicable)
        paymentStatus: registration.paymentStatus,
        amountDue: registration.amountDue ? Number(registration.amountDue) : null,
        amountPaid: registration.amountPaid ? Number(registration.amountPaid) : null,
        // Check-in status
        checkIn: registration.checkIn
          ? {
              checkedInAt: registration.checkIn.checkedInAt,
              isLate: registration.checkIn.isLate,
            }
          : null,
        // Cancellation info
        isCancelled: registration.status === 'CANCELLED',
        cancelledAt: registration.cancelledAt,
        cancellationToken: registration.cancellationToken, // For cancel button
      },
      event: {
        id: registration.event.id,
        title: registration.event.title,
        startAt: registration.event.startAt,
        endAt: registration.event.endAt,
        location: registration.event.location,
        description: registration.event.description,
        // For generating QR data for staff scanning
        checkInToken: registration.event.checkInToken,
      },
      school: {
        name: registration.event.school.name,
        slug: registration.event.school.slug,
        logoUrl: registration.event.school.logo, // Field is 'logo' in schema
      },
    })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
  }
}

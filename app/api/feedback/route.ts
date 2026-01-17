import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

export async function POST(request: NextRequest) {
  try {
    const { message, email } = await request.json()

    // Validate message
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'הודעה היא שדה חובה' },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'ההודעה ארוכה מדי (מקסימום 5000 תווים)' },
        { status: 400 }
      )
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        message: message.trim(),
        email: email && email.trim().length > 0 ? email.trim() : null,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'המשוב נשלח בהצלחה! תודה רבה 🙏',
        id: feedback.id,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error creating feedback', { source: 'feedback', error })
    return NextResponse.json(
      { error: 'שגיאה בשליחת המשוב. אנא נסה שוב.' },
      { status: 500 }
    )
  }
}

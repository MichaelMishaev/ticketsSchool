import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    // Check database connection with timeout
    const dbCheckPromise = prisma.$queryRaw`SELECT 1`
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database timeout')), 3000)
    )

    await Promise.race([dbCheckPromise, timeoutPromise])

    return NextResponse.json({
      status: 'healthy',
      timestamp,
      database: 'connected',
      service: 'ticketsSchool'
    })
  } catch (error) {
    // Return 200 with degraded status instead of 503
    // This allows Railway healthcheck to pass while database is connecting
    console.error('Health check - database issue:', error)

    return NextResponse.json({
      status: 'degraded',
      timestamp,
      database: 'disconnected',
      service: 'ticketsSchool',
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Service is starting, database connection may still be initializing'
    })
  }
}
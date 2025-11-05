import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const timestamp = new Date().toISOString()

  // Simple health check - just verify the service is running
  // Database check moved to /api/health/db to avoid blocking during startup
  return NextResponse.json({
    status: 'healthy',
    timestamp,
    service: 'ticketsSchool',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  })
}
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Edge Runtime compatible structured logging
// Logs are captured by the platform (Railway, Vercel, etc.)
function logAuth(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: Record<string, unknown> = {}
) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    source: 'middleware',
    message,
    ...context,
  }
  // Output as JSON for easy parsing in log aggregation
  console[level](JSON.stringify(logEntry))
}

// Lazy getter for JWT secret - only validates when actually used (not at import time)
function getJWTSecret(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  // Convert secret to Uint8Array for jose (Edge Runtime compatible)
  return new TextEncoder().encode(jwtSecret)
}

// Protected routes that require authentication
const PROTECTED_PATHS = [
  '/admin',
  '/api/admin/me',
  '/api/admin/onboarding',
  '/api/admin/logout',
  '/api/events',
  '/api/dashboard',
]

// Public routes that don't require authentication
const PUBLIC_PATHS = [
  '/admin/login',
  '/admin/signup',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/admin/verify-email',
  '/api/admin/login',
  '/api/admin/signup',
  '/api/admin/verify-email',
  '/api/admin/forgot-password',
  '/api/admin/reset-password',
  '/api/auth/google',
  '/api/auth/google/callback',
]

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl
  const requestId = crypto.randomUUID().slice(0, 8)

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check if path needs protection
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))

  if (!isProtectedPath) {
    return NextResponse.next()
  }

  // Get session cookie
  const sessionCookie = request.cookies.get('admin_session')

  if (!sessionCookie) {
    logAuth('warn', 'Missing session cookie', {
      requestId,
      pathname,
      method: request.method,
      durationMs: Date.now() - startTime,
    })

    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      )
    }

    // UI routes redirect to login
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Verify JWT session
  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJWTSecret(), {
      algorithms: ['HS256']
    })

    // Add request ID to response headers for tracing
    const response = NextResponse.next()
    response.headers.set('X-Request-ID', requestId)
    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logAuth('error', 'Invalid session token', {
      requestId,
      pathname,
      method: request.method,
      error: errorMessage,
      durationMs: Date.now() - startTime,
    })

    // Clear invalid session
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'X-Request-ID': requestId } })
      : NextResponse.redirect(new URL('/admin/login', request.url))

    response.cookies.delete('admin_session')
    response.cookies.delete('admin_logged_in')

    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - p/ (public event pages)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|p/).*)',
  ],
}

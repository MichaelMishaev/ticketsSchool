import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET!

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}

// Convert secret to Uint8Array for jose (Edge Runtime compatible)
const secret = new TextEncoder().encode(JWT_SECRET)

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
  const { pathname} = request.nextUrl

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

    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // UI routes redirect to login
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Verify JWT session
  try {
    await jwtVerify(sessionCookie.value, secret, {
      algorithms: ['HS256']
    })

    // Session is valid, allow request
    return NextResponse.next()
  } catch (error) {
    console.error('[Middleware] Invalid session token:', error)

    // Clear invalid session
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { AuthSession, SESSION_COOKIE_NAME } from '@/lib/auth.server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

function encodeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64')
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Check for OAuth errors
    if (error) {
      console.error('[Google OAuth Callback] OAuth error:', error)
      return NextResponse.redirect(new URL('/admin/login?error=oauth_cancelled', BASE_URL))
    }

    if (!code || !state) {
      console.error('[Google OAuth Callback] Missing code or state')
      return NextResponse.redirect(new URL('/admin/login?error=oauth_invalid', BASE_URL))
    }

    // Verify state parameter
    const cookieStore = await cookies()
    const storedState = cookieStore.get('oauth_state')?.value

    if (!storedState || storedState !== state) {
      console.error('[Google OAuth Callback] State mismatch')
      return NextResponse.redirect(new URL('/admin/login?error=oauth_state_mismatch', BASE_URL))
    }

    // Clear the state cookie
    cookieStore.delete('oauth_state')

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('[Google OAuth Callback] Missing Google OAuth credentials')
      return NextResponse.redirect(new URL('/admin/login?error=oauth_not_configured', BASE_URL))
    }

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    )

    // Exchange authorization code for tokens
    console.log('[Google OAuth Callback] Exchanging code for tokens')
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user info from Google
    console.log('[Google OAuth Callback] Fetching user info')
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()

    if (!payload || !payload.email) {
      console.error('[Google OAuth Callback] No email in payload')
      return NextResponse.redirect(new URL('/admin/login?error=oauth_no_email', BASE_URL))
    }

    const googleId = payload.sub
    const email = payload.email.toLowerCase()
    const name = payload.name || email.split('@')[0]
    const emailVerified = payload.email_verified || false

    console.log('[Google OAuth Callback] User info:', { googleId, email, name, emailVerified })

    // Check if user exists by googleId or email
    let admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
      include: { school: true },
    })

    if (admin) {
      // User exists - update googleId if not set
      if (!admin.googleId) {
        console.log('[Google OAuth Callback] Linking Google account to existing user')
        admin = await prisma.admin.update({
          where: { id: admin.id },
          data: {
            googleId,
            emailVerified: true, // Google verified it
            lastLoginAt: new Date(),
          },
          include: { school: true },
        })
      } else {
        // Just update last login
        admin = await prisma.admin.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
          include: { school: true },
        })
      }
      console.log('[Google OAuth Callback] Existing user logged in')
    } else {
      // Create new user
      console.log('[Google OAuth Callback] Creating new user')
      admin = await prisma.admin.create({
        data: {
          email,
          name,
          googleId,
          emailVerified: true, // Google verified it
          passwordHash: null, // OAuth-only user
          role: 'OWNER',
          schoolId: null, // Will be set during onboarding
          onboardingCompleted: false,
          lastLoginAt: new Date(),
        },
      })
      console.log('[Google OAuth Callback] New user created')
    }

    // Create session
    const session: AuthSession = {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      schoolId: admin.schoolId || undefined,
      schoolName: admin.school?.name || undefined,
    }

    cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    })

    // Also set a client-side hint cookie (for client-side auth checks)
    cookieStore.set('admin_logged_in', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    })

    // Redirect based on onboarding status
    if (!admin.onboardingCompleted || !admin.schoolId) {
      console.log('[Google OAuth Callback] Redirecting to onboarding')
      return NextResponse.redirect(new URL('/admin/onboarding', BASE_URL))
    } else {
      console.log('[Google OAuth Callback] Redirecting to dashboard')
      return NextResponse.redirect(new URL('/admin', BASE_URL))
    }
  } catch (error) {
    console.error('[Google OAuth Callback] Error:', error)
    return NextResponse.redirect(new URL('/admin/login?error=oauth_failed', BASE_URL))
  }
}

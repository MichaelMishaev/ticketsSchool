import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { AuthSession, SESSION_COOKIE_NAME, encodeSession } from '@/lib/auth.server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

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

    // Verify state parameter - READ FROM REQUEST COOKIES (not cookies() API)
    // This avoids mixing cookies() API with response.cookies (Next.js 15 issue)
    const storedState = request.cookies.get('oauth_state')?.value

    if (!storedState || storedState !== state) {
      console.error('[Google OAuth Callback] State mismatch')
      return NextResponse.redirect(new URL('/admin/login?error=oauth_state_mismatch', BASE_URL))
    }

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

    // Check if user exists by googleId
    let admin = await prisma.admin.findUnique({
      where: { googleId },
      include: { school: true },
    })

    if (admin) {
      // User with this Google ID exists - just update last login
      admin = await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
        include: { school: true },
      })
      console.log('[Google OAuth Callback] Existing Google user logged in')
    } else {
      // Check if email already exists with password account
      const existingEmailUser = await prisma.admin.findUnique({
        where: { email },
      })

      if (existingEmailUser && existingEmailUser.passwordHash) {
        // Security: Email exists with password - don't auto-link
        console.error('[Google OAuth Callback] Email exists with password account - blocking auto-link')
        return NextResponse.redirect(
          new URL('/admin/login?error=email_exists_with_password', BASE_URL)
        )
      }

      // Safe to create new user or link to OAuth-only account
      if (existingEmailUser && !existingEmailUser.passwordHash) {
        // OAuth-only account with same email - link Google ID
        console.log('[Google OAuth Callback] Linking Google to OAuth-only account')
        admin = await prisma.admin.update({
          where: { id: existingEmailUser.id },
          data: {
            googleId,
            emailVerified: true,
            lastLoginAt: new Date(),
          },
          include: { school: true },
        })
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
          include: { school: true },
        })
        console.log('[Google OAuth Callback] New user created')
      }
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

    // Determine redirect URL based on onboarding status
    const redirectUrl = (!admin.onboardingCompleted || !admin.schoolId)
      ? new URL('/admin/onboarding', BASE_URL)
      : new URL('/admin', BASE_URL)

    console.log('[Google OAuth Callback] Redirecting to:', redirectUrl.pathname)

    // Create redirect response with cookies
    const response = NextResponse.redirect(redirectUrl)

    // Set session cookie
    response.cookies.set(SESSION_COOKIE_NAME, encodeSession(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    })

    // Set client-side auth hint cookie
    response.cookies.set('admin_logged_in', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    })

    // Delete OAuth state cookie
    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('[Google OAuth Callback] Error:', error)
    return NextResponse.redirect(new URL('/admin/login?error=oauth_failed', BASE_URL))
  }
}

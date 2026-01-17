import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { AuthSession, SESSION_COOKIE_NAME, encodeSession } from '@/lib/auth.server'
import { randomUUID } from 'crypto'
import { authLogger } from '@/lib/logger-v2'

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
      authLogger.error('Google OAuth error', { error })
      return NextResponse.redirect(new URL('/admin/login?error=oauth_cancelled', BASE_URL))
    }

    if (!code || !state) {
      authLogger.error('Google OAuth missing code or state')
      return NextResponse.redirect(new URL('/admin/login?error=oauth_invalid', BASE_URL))
    }

    // Verify state parameter - READ FROM DATABASE
    const storedOAuthState = await prisma.oAuthState.findUnique({
      where: { state },
    })

    if (!storedOAuthState) {
      authLogger.error('Google OAuth state not found in database', { state })
      return NextResponse.redirect(new URL('/admin/login?error=oauth_state_mismatch', BASE_URL))
    }

    if (!storedOAuthState.codeVerifier) {
      authLogger.error('Google OAuth code verifier not found in state', { stateId: storedOAuthState.id })
      await prisma.oAuthState.delete({ where: { id: storedOAuthState.id } })
      return NextResponse.redirect(new URL('/admin/login?error=oauth_invalid_state', BASE_URL))
    }

    // Check if state has expired
    if (storedOAuthState.expiresAt < new Date()) {
      authLogger.error('Google OAuth state expired', { stateId: storedOAuthState.id })
      await prisma.oAuthState.delete({ where: { id: storedOAuthState.id } })
      return NextResponse.redirect(new URL('/admin/login?error=oauth_state_expired', BASE_URL))
    }

    // Store code_verifier before deleting state
    const codeVerifier = storedOAuthState.codeVerifier

    // Delete the state now that we've verified it (one-time use)
    await prisma.oAuthState.delete({ where: { id: storedOAuthState.id } })

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      authLogger.error('Missing Google OAuth credentials')
      return NextResponse.redirect(new URL('/admin/login?error=oauth_not_configured', BASE_URL))
    }

    const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI)

    // Exchange authorization code for tokens WITH code_verifier (PKCE)
    authLogger.debug('Exchanging code for tokens with PKCE verification')
    const { tokens } = await oauth2Client.getToken({
      code,
      codeVerifier, // PKCE verification
    })
    oauth2Client.setCredentials(tokens)

    // Get user info from Google
    authLogger.debug('Fetching user info from Google')
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()

    if (!payload || !payload.email) {
      authLogger.error('No email in Google OAuth payload')
      return NextResponse.redirect(new URL('/admin/login?error=oauth_no_email', BASE_URL))
    }

    const googleId = payload.sub
    const email = payload.email.toLowerCase()
    const name = payload.name || email.split('@')[0]
    const emailVerified = payload.email_verified || false

    authLogger.debug('Google OAuth user info received', { googleId, email, name, emailVerified })

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
      authLogger.info('Existing Google user logged in', { adminId: admin.id, email })
    } else {
      // Check if email already exists with password account
      const existingEmailUser = await prisma.admin.findUnique({
        where: { email },
      })

      if (existingEmailUser && existingEmailUser.passwordHash) {
        // Security: Email exists with password - don't auto-link
        authLogger.warn('Email exists with password account - blocking auto-link', {
          email,
          existingAdminId: existingEmailUser.id,
        })
        return NextResponse.redirect(
          new URL('/admin/login?error=email_exists_with_password', BASE_URL)
        )
      }

      // Safe to create new user or link to OAuth-only account
      if (existingEmailUser && !existingEmailUser.passwordHash) {
        // OAuth-only account with same email - link Google ID
        authLogger.info('Linking Google to OAuth-only account', { email, adminId: existingEmailUser.id })
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
        authLogger.info('Creating new user via Google OAuth', { email, googleId })
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
        authLogger.info('New user created via Google OAuth', { adminId: admin.id, email })
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
    const redirectUrl =
      !admin.onboardingCompleted || !admin.schoolId
        ? new URL('/admin/onboarding', BASE_URL)
        : new URL('/admin', BASE_URL)

    authLogger.debug('Google OAuth redirecting', { path: redirectUrl.pathname, adminId: admin.id })

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

    return response
  } catch (error) {
    // Log full error details server-side only
    const requestId = randomUUID()
    authLogger.error('Google OAuth callback failed', {
      error,
      requestId,
    })

    // Return generic error to client (no internal details exposed)
    return NextResponse.redirect(new URL(`/admin/login?error=oauth_failed`, BASE_URL))
  }
}

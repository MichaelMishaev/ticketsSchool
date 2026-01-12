import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import pkceChallenge from 'pkce-challenge'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'
const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`

export async function GET(request: NextRequest) {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('[Google OAuth] Missing Google OAuth credentials')
      return NextResponse.redirect(new URL('/admin/login?error=oauth_not_configured', BASE_URL))
    }

    const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI)

    // Generate a secure random state parameter
    const state = crypto.randomUUID()

    // Generate PKCE challenge
    const { code_verifier, code_challenge } = await pkceChallenge()

    // Store state with code_verifier in database (more reliable than cookies for OAuth)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await prisma.oAuthState.create({
      data: {
        state,
        codeVerifier: code_verifier, // Store verifier for callback
        expiresAt,
      },
    })

    // Clean up expired states (older than 10 minutes)
    await prisma.oAuthState.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    // Generate the authorization URL with PKCE
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'openid email profile')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('prompt', 'select_account')
    authUrl.searchParams.set('code_challenge', code_challenge) // PKCE
    authUrl.searchParams.set('code_challenge_method', 'S256') // PKCE

    console.log('[Google OAuth] State stored in DB with PKCE, redirecting to Google')

    // Simply redirect - no cookies needed
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    // Log full error details server-side only
    const requestId = randomUUID()
    console.error('[Google OAuth] ERROR - Request ID:', requestId)
    console.error('[Google OAuth] Error initiating OAuth flow:', error)
    console.error(
      '[Google OAuth] Error type:',
      error instanceof Error ? error.constructor.name : typeof error
    )
    console.error(
      '[Google OAuth] Error message:',
      error instanceof Error ? error.message : String(error)
    )
    console.error(
      '[Google OAuth] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    )

    // Return generic error to client (no internal details exposed)
    return NextResponse.redirect(new URL(`/admin/login?error=oauth_init_failed`, BASE_URL))
  }
}

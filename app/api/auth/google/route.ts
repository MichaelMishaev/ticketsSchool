import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'

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

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    )

    // Generate a secure random state parameter
    const state = crypto.randomUUID()

    // Generate the authorization URL
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      state,
      // Use PKCE for additional security
      prompt: 'select_account',
    })

    console.log('[Google OAuth] Redirecting to Google authorization')

    // Store state in cookie for verification in callback
    const response = NextResponse.redirect(authorizationUrl)
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Google OAuth] Error initiating OAuth flow:', error)
    return NextResponse.redirect(new URL('/admin/login?error=oauth_failed', BASE_URL))
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'

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

    // Store state in database (more reliable than cookies for OAuth)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await prisma.oAuthState.create({
      data: {
        state,
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

    console.log('[Google OAuth] State stored in DB, redirecting to Google')

    // Simply redirect - no cookies needed
    return NextResponse.redirect(authorizationUrl)
  } catch (error) {
    console.error('[Google OAuth] Error initiating OAuth flow:', error)
    return NextResponse.redirect(new URL('/admin/login?error=oauth_failed', BASE_URL))
  }
}

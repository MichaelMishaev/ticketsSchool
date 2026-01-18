import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side proxy for Nominatim (OpenStreetMap) geocoding API
 *
 * Why a proxy?
 * 1. Nominatim blocks direct browser requests (CORS policy)
 * 2. Custom User-Agent headers can't be set reliably from browsers
 * 3. Server-side requests bypass CORS entirely
 * 4. We can implement rate limiting on our end
 *
 * Nominatim Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
 * - Max 1 request per second
 * - Valid User-Agent required
 * - No heavy automated queries
 */

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search'

// Simple in-memory rate limiter (1 request per second per IP)
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MS = 1000 // 1 second between requests

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type?: string
  importance?: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Rate limiting (per IP)
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const now = Date.now()
    const lastRequest = rateLimitMap.get(clientIp)

    if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
      // Return empty results instead of error (better UX)
      return NextResponse.json({ results: [], rateLimited: true })
    }
    rateLimitMap.set(clientIp, now)

    // Clean up old entries every 100 requests
    if (rateLimitMap.size > 1000) {
      const cutoff = now - 60000 // Remove entries older than 1 minute
      for (const [ip, time] of rateLimitMap.entries()) {
        if (time < cutoff) rateLimitMap.delete(ip)
      }
    }

    // Build Nominatim request
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '8',
      countrycodes: 'il', // Focus on Israel
      'accept-language': 'he,en', // Prefer Hebrew results
    })

    const response = await fetch(`${NOMINATIM_API}?${params}`, {
      headers: {
        // User-Agent is REQUIRED by Nominatim policy
        'User-Agent': 'KartisInfo/1.0 (https://kartis.info; contact@kartis.info)',
        Accept: 'application/json',
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`)
      return NextResponse.json({ results: [], error: 'Geocoding service unavailable' })
    }

    const data: NominatimResult[] = await response.json()

    // Return simplified results
    return NextResponse.json({
      results: data.map((item) => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
      })),
    })
  } catch (error) {
    // Handle timeout errors gracefully
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error('Nominatim request timed out')
      return NextResponse.json({ results: [], error: 'Request timed out' })
    }

    console.error('Geocode API error:', error)
    return NextResponse.json({ results: [], error: 'Internal server error' })
  }
}

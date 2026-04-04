import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth.server'

type ImageCategory = 'school' | 'sports' | 'music' | 'community' | 'restaurant' | 'outdoor'

const CATEGORY_PROMPTS: Record<ImageCategory, string> = {
  school:
    'A vibrant school event in a bright auditorium, students and teachers celebrating together, colorful banners, joyful atmosphere, professional event photography, wide angle',
  sports:
    'An energetic soccer match at night under stadium floodlights, players in dynamic action, motion blur on the ball, crowd in background, photorealistic sports photography',
  music:
    'A live music concert stage with dramatic colored lighting beams, silhouettes of musicians performing, enthusiastic crowd below, professional concert photography',
  community:
    'A warm community gathering outdoors in an urban plaza, diverse group of people celebrating together, golden hour sunlight, festive decorations, candid photography',
  restaurant:
    'An elegant gala dinner event in a grand ballroom, beautifully set tables with candles and floral centerpieces, well-dressed guests, soft warm lighting, luxury event photography',
  outdoor:
    'A scenic outdoor event venue surrounded by lush nature, pavilion tents with string lights at twilight, guests mingling, beautiful landscape backdrop, warm atmospheric photography',
}

/**
 * POST /api/admin/generate-cover-image
 * Generates an AI cover image using the Ideogram API for a given category.
 * Admin-only endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const category: ImageCategory = body.category ?? 'community'
    const customPrompt: string | undefined = body.prompt

    const prompt = customPrompt ?? CATEGORY_PROMPTS[category] ?? CATEGORY_PROMPTS.community

    const apiKey = process.env.IDEOGRAM_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Image generation not configured' }, { status: 503 })
    }

    // Ideogram v3 uses multipart FormData even for text-only generation
    const formData = new FormData()
    formData.append('prompt', prompt)
    formData.append('rendering_speed', 'TURBO')
    formData.append('style_type', 'REALISTIC')
    formData.append('aspect_ratio', '16x9')

    const ideogramRes = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: { 'Api-Key': apiKey },
      body: formData,
    })

    if (!ideogramRes.ok) {
      const errorText = await ideogramRes.text()
      console.error('Ideogram API error:', ideogramRes.status, errorText)
      return NextResponse.json(
        { error: 'Image generation failed. Please try again.' },
        { status: 502 }
      )
    }

    const data = await ideogramRes.json()
    const url: string | undefined = data?.data?.[0]?.url

    if (!url) {
      console.error('Ideogram response missing URL:', JSON.stringify(data))
      return NextResponse.json({ error: 'No image returned. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('generate-cover-image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

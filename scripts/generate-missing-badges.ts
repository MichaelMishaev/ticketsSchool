/**
 * Generate the 2 missing badges that failed due to invalid style preset
 */

import fs from 'fs'
import path from 'path'

const IDEOGRAM_API_KEY = 'j3lsvXpCQqhgu6m5sSU_KGk0kdmlLpAf0bcN3_CM_9K08WCd7ZhdEtnjP9ig_Mhry1ESAXc4A9HoRlC9q-3ZBw'
const API_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate'
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'badges')

interface BadgePrompt {
  filename: string
  prompt: string
  aspectRatio: string
  stylePreset?: string
  description: string
}

const badgePrompts: BadgePrompt[] = [
  {
    filename: 'hero-pattern.png',
    prompt: 'Abstract geometric pattern with flowing lines and dots, subtle gradient from blue to purple, modern tech background, professional SaaS style, suitable for hero section background',
    aspectRatio: '16x9',
    stylePreset: 'GEO_MINIMALIST',
    description: 'Hero section background pattern'
  },
  {
    filename: 'feature-divider.png',
    prompt: 'Elegant decorative divider element with flowing curves and dots, minimal modern design, subtle colors, professional web design separator, horizontal layout',
    aspectRatio: '3x1',
    stylePreset: 'MINIMAL_ILLUSTRATION',
    description: 'Section divider element'
  }
]

async function generateBadge(badgePrompt: BadgePrompt): Promise<void> {
  console.log(`\n🎨 Generating: ${badgePrompt.filename}`)
  console.log(`   Prompt: ${badgePrompt.prompt.substring(0, 80)}...`)

  try {
    const formData = new FormData()
    formData.append('prompt', badgePrompt.prompt)
    formData.append('aspect_ratio', badgePrompt.aspectRatio)
    formData.append('rendering_speed', 'QUALITY')

    if (badgePrompt.stylePreset) {
      formData.append('style_type', 'AUTO')
      formData.append('style_preset', badgePrompt.stylePreset)
    } else {
      formData.append('style_type', 'DESIGN')
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Api-Key': IDEOGRAM_API_KEY
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json() as { data: Array<{ url: string }> }

    if (!data.data || data.data.length === 0) {
      throw new Error('No image data in response')
    }

    const imageUrl = data.data[0].url
    console.log(`   ✓ Image generated, downloading...`)

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const outputPath = path.join(OUTPUT_DIR, badgePrompt.filename)

    fs.writeFileSync(outputPath, Buffer.from(imageBuffer))
    console.log(`   ✓ Saved to: ${outputPath}`)
    console.log(`   📝 ${badgePrompt.description}`)

  } catch (error) {
    console.error(`   ✗ Error generating ${badgePrompt.filename}:`, error)
    throw error
  }
}

async function generateMissingBadges() {
  console.log('🎨 Generating missing badges...\n')

  for (const badgePrompt of badgePrompts) {
    try {
      await generateBadge(badgePrompt)
      if (badgePrompts.indexOf(badgePrompt) < badgePrompts.length - 1) {
        console.log('   ⏳ Waiting 2 seconds...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch (error) {
      console.error(`Failed to generate ${badgePrompt.filename}`)
    }
  }

  console.log('\n✨ Done!')
}

generateMissingBadges().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

/**
 * Generate badges, icons, and visual elements for the landing page using Ideogram API
 *
 * This script generates:
 * - Trust badges (secure, verified, etc.)
 * - Feature icons
 * - Achievement badges
 * - Decorative elements
 *
 * All images are optimized for web and stored in public/images/badges/
 */

import fs from 'fs'
import path from 'path'

const IDEOGRAM_API_KEY = 'j3lsvXpCQqhgu6m5sSU_KGk0kdmlLpAf0bcN3_CM_9K08WCd7ZhdEtnjP9ig_Mhry1ESAXc4A9HoRlC9q-3ZBw'
const API_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate'
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'badges')

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

interface BadgePrompt {
  filename: string
  prompt: string
  aspectRatio: string
  stylePreset?: string
  description: string
}

const badgePrompts: BadgePrompt[] = [
  // Trust Badges
  {
    filename: 'verified-badge.png',
    prompt: 'A modern, professional verified checkmark badge icon, circular shape with a bold blue checkmark, clean gradient background, 3D subtle shadow, premium quality badge design, isolated on transparent or white background',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Verified/Trusted badge'
  },
  {
    filename: 'secure-badge.png',
    prompt: 'A modern security shield badge icon with a padlock symbol, green and blue gradient colors, professional cybersecurity design, 3D metallic effect, isolated clean background',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Security badge'
  },
  {
    filename: 'fast-badge.png',
    prompt: 'A modern speed badge icon with lightning bolt or rocket symbol, orange and yellow gradient colors, dynamic motion lines, energetic design, 3D style, isolated clean background',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Fast/Quick setup badge'
  },
  {
    filename: 'hebrew-support-badge.png',
    prompt: 'A modern language support badge with Hebrew letter א (aleph) symbol, blue and white colors inspired by Israeli flag, professional design, circular or shield shape, 3D style, clean background',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Hebrew language support badge'
  },

  // Feature Icons
  {
    filename: 'event-management-icon.png',
    prompt: 'A colorful modern icon representing event management, calendar with multiple event markers, vibrant colors, minimalist flat design style, rounded corners, professional SaaS product icon',
    aspectRatio: '1x1',
    stylePreset: 'FLAT_ART',
    description: 'Event management feature icon'
  },
  {
    filename: 'waitlist-icon.png',
    prompt: 'A modern icon representing automated waitlist management, people in organized queue with automatic sorting arrows, blue and purple gradient, minimalist design, professional tech icon',
    aspectRatio: '1x1',
    stylePreset: 'FLAT_ART',
    description: 'Waitlist automation icon'
  },
  {
    filename: 'team-icon.png',
    prompt: 'A colorful icon representing team collaboration, multiple user silhouettes working together in a circle, warm colors, friendly and professional design, modern tech style',
    aspectRatio: '1x1',
    stylePreset: 'FLAT_ART',
    description: 'Team collaboration icon'
  },
  {
    filename: 'analytics-icon.png',
    prompt: 'A modern analytics icon with charts and graphs, data visualization elements, blue and green gradient, professional dashboard style, clean minimalist design',
    aspectRatio: '1x1',
    stylePreset: 'FLAT_ART',
    description: 'Analytics feature icon'
  },

  // Achievement Badges
  {
    filename: 'top-rated-badge.png',
    prompt: 'A premium gold star award badge with 5 stars, luxury metallic gold color, shiny effect, professional achievement badge design, 3D style with sparkles, clean background',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Top rated achievement badge'
  },
  {
    filename: 'satisfaction-badge.png',
    prompt: 'A modern satisfaction guarantee badge with smiling face or thumbs up, green color scheme, positive and friendly design, circular badge with ribbon, professional quality',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Customer satisfaction badge'
  },

  // Decorative Elements
  {
    filename: 'gradient-blob-1.png',
    prompt: 'Abstract organic gradient blob shape, smooth flowing form, vibrant colors blue to purple gradient, modern web design element, soft edges, suitable for background decoration',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Decorative gradient blob 1'
  },
  {
    filename: 'gradient-blob-2.png',
    prompt: 'Abstract organic gradient blob shape, smooth flowing form, warm colors red to orange gradient, modern web design element, soft edges, suitable for background decoration',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Decorative gradient blob 2'
  },

  // Technology/Platform Badges
  {
    filename: 'mobile-friendly-badge.png',
    prompt: 'A modern mobile-friendly badge icon with smartphone symbol and checkmark, blue gradient colors, responsive design concept, professional tech badge, 3D style',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Mobile-friendly badge'
  },
  {
    filename: 'cloud-badge.png',
    prompt: 'A modern cloud computing badge icon, fluffy cloud with digital elements, blue and white colors, professional cloud technology design, 3D style with subtle glow',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Cloud-based platform badge'
  },

  // Banner/Header Elements
  {
    filename: 'hero-pattern.png',
    prompt: 'Abstract geometric pattern with flowing lines and dots, subtle gradient from blue to purple, modern tech background, professional SaaS style, suitable for hero section background',
    aspectRatio: '16x9',
    stylePreset: 'GEOMETRIC_ART',
    description: 'Hero section background pattern'
  },
  {
    filename: 'feature-divider.png',
    prompt: 'Elegant decorative divider element with flowing curves and dots, minimal modern design, subtle colors, professional web design separator, horizontal layout',
    aspectRatio: '3x1',
    stylePreset: 'GEOMETRIC_ART',
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

    // When using style_preset, must use AUTO or GENERAL style_type
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

    // Download the image
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

async function generateAllBadges() {
  console.log('🚀 Starting badge and icon generation for landing page...')
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`)

  const startTime = Date.now()
  let successCount = 0
  let errorCount = 0

  for (const badgePrompt of badgePrompts) {
    try {
      await generateBadge(badgePrompt)
      successCount++

      // Wait 2 seconds between requests to avoid rate limiting
      if (badgePrompts.indexOf(badgePrompt) < badgePrompts.length - 1) {
        console.log('   ⏳ Waiting 2 seconds before next request...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch (error) {
      errorCount++
      console.error(`Failed to generate ${badgePrompt.filename}`)
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n' + '='.repeat(60))
  console.log(`✨ Badge generation complete!`)
  console.log(`   ✓ Successful: ${successCount}`)
  console.log(`   ✗ Failed: ${errorCount}`)
  console.log(`   ⏱  Duration: ${duration}s`)
  console.log('='.repeat(60))

  if (successCount > 0) {
    console.log('\n🎨 Generated badges are ready in:', OUTPUT_DIR)
    console.log('\n💡 Badge types generated:')
    console.log('   • Trust badges (verified, secure, fast, Hebrew support)')
    console.log('   • Feature icons (event management, waitlist, team, analytics)')
    console.log('   • Achievement badges (top rated, satisfaction)')
    console.log('   • Decorative elements (gradient blobs, patterns)')
    console.log('   • Technology badges (mobile-friendly, cloud-based)')
    console.log('   • Design elements (hero pattern, dividers)')
    console.log('\n📝 Next steps:')
    console.log('   1. Review the badges in public/images/badges/')
    console.log('   2. Update LandingPage.tsx to use these badges')
    console.log('   3. Replace Lucide icons with custom badges where appropriate')
  }
}

// Run the script
generateAllBadges().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

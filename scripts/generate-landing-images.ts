/**
 * Generate contextual images for the landing page using Ideogram API
 *
 * This script generates high-quality images for:
 * - Hero section
 * - Features showcase
 * - How it works section
 *
 * All images are optimized for web and stored in public/images/landing/
 */

import fs from 'fs'
import path from 'path'

const IDEOGRAM_API_KEY = 'j3lsvXpCQqhgu6m5sSU_KGk0kdmlLpAf0bcN3_CM_9K08WCd7ZhdEtnjP9ig_Mhry1ESAXc4A9HoRlC9q-3ZBw'
const API_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate'
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'landing')

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

interface ImagePrompt {
  filename: string
  prompt: string
  aspectRatio: string
  stylePreset?: string
  description: string
}

const imagePrompts: ImagePrompt[] = [
  {
    filename: 'hero-school-event.png',
    prompt: 'A vibrant, modern illustration of a school auditorium filled with excited students and parents during a school event, with digital ticketing kiosks visible, warm lighting, colorful banners, professional photography style',
    aspectRatio: '16x9',
    stylePreset: 'BRIGHT_ART',
    description: 'Hero section - School event atmosphere'
  },
  {
    filename: 'dashboard-mockup.png',
    prompt: 'A clean, modern web dashboard interface showing event management statistics, charts with event registrations, colorful UI elements, professional SaaS design, minimalist style, light theme',
    aspectRatio: '16x10',
    stylePreset: 'FLAT_ART',
    description: 'Dashboard feature showcase'
  },
  {
    filename: 'mobile-registration.png',
    prompt: 'A smartphone mockup showing a simple, beautiful event registration form in Hebrew, clean UI design, modern mobile app interface, user-friendly layout, professional product photography',
    aspectRatio: '9x16',
    stylePreset: 'EDITORIAL',
    description: 'Mobile registration feature'
  },
  {
    filename: 'team-collaboration.png',
    prompt: 'A diverse team of educators and school staff collaborating around a laptop, modern school office environment, warm and friendly atmosphere, professional corporate photography',
    aspectRatio: '4x3',
    stylePreset: 'MAGAZINE_EDITORIAL',
    description: 'Team management feature'
  },
  {
    filename: 'waitlist-automation.png',
    prompt: 'An abstract, modern illustration representing automated systems and smart technology, digital flow charts, organized data streams, tech-forward design, vibrant colors',
    aspectRatio: '1x1',
    stylePreset: 'MIXED_MEDIA',
    description: 'Waitlist automation feature'
  },
  {
    filename: 'data-security.png',
    prompt: 'A secure digital vault with glowing protective shields and encrypted data symbols, cybersecurity theme, modern tech illustration, trustworthy and professional style',
    aspectRatio: '1x1',
    stylePreset: 'GLASS_PRISM',
    description: 'Data security feature'
  }
]

async function generateImage(imagePrompt: ImagePrompt): Promise<void> {
  console.log(`\n🎨 Generating: ${imagePrompt.filename}`)
  console.log(`   Prompt: ${imagePrompt.prompt.substring(0, 80)}...`)

  try {
    const formData = new FormData()
    formData.append('prompt', imagePrompt.prompt)
    formData.append('aspect_ratio', imagePrompt.aspectRatio)
    formData.append('rendering_speed', 'QUALITY')

    // When using style_preset, must use AUTO or GENERAL style_type
    if (imagePrompt.stylePreset) {
      formData.append('style_type', 'AUTO')
      formData.append('style_preset', imagePrompt.stylePreset)
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
    const outputPath = path.join(OUTPUT_DIR, imagePrompt.filename)

    fs.writeFileSync(outputPath, Buffer.from(imageBuffer))
    console.log(`   ✓ Saved to: ${outputPath}`)
    console.log(`   📝 ${imagePrompt.description}`)

  } catch (error) {
    console.error(`   ✗ Error generating ${imagePrompt.filename}:`, error)
    throw error
  }
}

async function generateAllImages() {
  console.log('🚀 Starting image generation for landing page...')
  console.log(`📁 Output directory: ${OUTPUT_DIR}\n`)

  const startTime = Date.now()
  let successCount = 0
  let errorCount = 0

  for (const imagePrompt of imagePrompts) {
    try {
      await generateImage(imagePrompt)
      successCount++

      // Wait 2 seconds between requests to avoid rate limiting
      if (imagePrompts.indexOf(imagePrompt) < imagePrompts.length - 1) {
        console.log('   ⏳ Waiting 2 seconds before next request...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch (error) {
      errorCount++
      console.error(`Failed to generate ${imagePrompt.filename}`)
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n' + '='.repeat(60))
  console.log(`✨ Image generation complete!`)
  console.log(`   ✓ Successful: ${successCount}`)
  console.log(`   ✗ Failed: ${errorCount}`)
  console.log(`   ⏱  Duration: ${duration}s`)
  console.log('='.repeat(60))

  if (successCount > 0) {
    console.log('\n📸 Generated images are ready in:', OUTPUT_DIR)
    console.log('\n💡 Next steps:')
    console.log('   1. Review the images in public/images/landing/')
    console.log('   2. Update LandingPage.tsx to use these images')
    console.log('   3. Make images clickable with <Link> components')
  }
}

// Run the script
generateAllImages().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

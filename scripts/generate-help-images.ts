/**
 * generate-help-images.ts
 *
 * One-time script to generate illustrative images for help articles
 * using the Ideogram v2 API. Downloads images to public/help/images/
 * and prints imageUrl mappings to paste into wiki-data.ts.
 *
 * Usage: npx tsx scripts/generate-help-images.ts
 *
 * Requires: IDEOGRAM_API_KEY in .env
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

// Load .env manually (avoid needing dotenv dependency)
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed
      .slice(eqIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

const API_KEY = process.env.IDEOGRAM_API_KEY
if (!API_KEY) {
  console.error('❌ IDEOGRAM_API_KEY not found in .env')
  process.exit(1)
}

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'help', 'images')
fs.mkdirSync(OUTPUT_DIR, { recursive: true })

// Prompts for each feature id
const FEATURE_PROMPTS: Record<string, string> = {
  // Getting Started
  'quick-start':
    'A friendly school administrator smiling at a laptop showing a colorful event dashboard, flat illustration style, soft warm colors, clean minimal background',

  // Event Management
  'create-event':
    'A school event coordinator creating a new event on a tablet, calendar and form visible, flat illustration style, soft blue and purple tones',
  'edit-event':
    'A person editing event details on a computer screen, pencil icon, notification bell, flat illustration style, soft colors',
  waitlist:
    'A group of cartoon people in a friendly queue waiting for a spot, one person receiving a notification on phone, flat illustration style, teal and mint colors',

  // Leads & Registrations
  'view-leads':
    'A school admin viewing a clean table of registered attendees on a laptop, search bar visible, flat illustration style, soft teal and white tones',
  'export-registrations':
    'A download icon with a spreadsheet and a printed list of names, school event context, flat illustration style, soft green and teal colors',
  'cancel-registration':
    'A calendar with an X mark and a friendly admin clicking cancel on a registration form, flat illustration style, soft orange and white tones',

  // Payments
  'paid-events':
    'A school fundraiser dinner with digital ticket and credit card payment on a phone, flat illustration style, soft green and gold colors',
  'payment-flow':
    'A step-by-step journey: phone → fill form → pay → receive ticket, connected by arrows, flat illustration style, soft purple and green tones',
  'failed-payments':
    'A friendly error page on a phone with a retry button, credit card with X mark, no scary imagery, flat illustration style, soft orange and gray tones',

  // Team Management
  'invite-team':
    'Two colleagues at a school, one sending an invitation on a laptop to another who receives it on their phone, flat illustration style, soft indigo and blue tones',
  'user-roles':
    'Four people with different role badges (Principal, Vice, Coordinator, Observer) arranged in a friendly hierarchy, flat illustration style, soft indigo and lavender tones',

  // Check-in
  'qr-scanner':
    'A school staff member scanning a QR code on a phone at an event entrance, checkmark appears, flat illustration style, soft blue tones',

  // Ban Management
  'create-ban':
    'A shield icon protecting an event, a ban list on a clipboard, friendly illustration not scary, flat illustration style, soft red and white tones',
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath)
    const protocol = url.startsWith('https') ? https : http
    protocol
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          downloadFile(response.headers.location!, destPath).then(resolve).catch(reject)
          return
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`))
          return
        }
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      })
      .on('error', (err) => {
        fs.unlink(destPath, () => {})
        reject(err)
      })
  })
}

async function generateImage(featureId: string, prompt: string): Promise<string | null> {
  const destPath = path.join(OUTPUT_DIR, `${featureId}.png`)

  // Skip if already exists
  if (fs.existsSync(destPath)) {
    console.log(`  ⏭️  Skipping ${featureId} (already exists)`)
    return `/help/images/${featureId}.png`
  }

  console.log(`  🎨 Generating: ${featureId}`)

  const body = JSON.stringify({
    image_request: {
      prompt,
      style_type: 'ILLUSTRATION',
      aspect_ratio: 'ASPECT_16_9',
      model: 'V_2',
      magic_prompt_option: 'ON',
    },
  })

  // Call Ideogram API
  const response = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Api-Key': API_KEY!,
      'Content-Type': 'application/json',
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`  ❌ API error for ${featureId}: ${response.status} — ${errorText}`)
    return null
  }

  const data = (await response.json()) as {
    data: Array<{ url: string }>
  }

  if (!data.data || data.data.length === 0) {
    console.error(`  ❌ No image returned for ${featureId}`)
    return null
  }

  const imageUrl = data.data[0].url
  console.log(`  ⬇️  Downloading ${featureId}...`)

  await downloadFile(imageUrl, destPath)
  console.log(`  ✅ Saved: public/help/images/${featureId}.png`)

  return `/help/images/${featureId}.png`
}

async function main() {
  console.log('\n🚀 TicketCap Help Image Generator')
  console.log('===================================')
  console.log(`📁 Output: ${OUTPUT_DIR}`)
  console.log(`🔑 API Key: ${API_KEY!.slice(0, 8)}...`)
  console.log(`📝 Features to process: ${Object.keys(FEATURE_PROMPTS).length}\n`)

  const results: Record<string, string> = {}
  const failed: string[] = []

  for (const [featureId, prompt] of Object.entries(FEATURE_PROMPTS)) {
    try {
      const result = await generateImage(featureId, prompt)
      if (result) {
        results[featureId] = result
      } else {
        failed.push(featureId)
      }
      // Rate limit: 1 request per second to be safe
      await new Promise((resolve) => setTimeout(resolve, 1200))
    } catch (err) {
      console.error(`  ❌ Error for ${featureId}:`, err)
      failed.push(featureId)
    }
  }

  console.log('\n\n===================================')
  console.log('📋 PASTE THESE imageUrls into wiki-data.ts:')
  console.log('===================================\n')

  for (const [featureId, imagePath] of Object.entries(results)) {
    console.log(`// ${featureId}`)
    console.log(`imageUrl: '${imagePath}',\n`)
  }

  if (failed.length > 0) {
    console.log('\n⚠️  Failed features:')
    failed.forEach((id) => console.log(`  - ${id}`))
  }

  console.log('\n✅ Done!')
}

main().catch(console.error)

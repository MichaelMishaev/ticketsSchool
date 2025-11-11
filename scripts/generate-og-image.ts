import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { join } from 'path'

async function generateOGImage() {
  const width = 1200
  const height = 630
  const publicDir = join(process.cwd(), 'public', 'images')

  await mkdir(publicDir, { recursive: true })

  // Create SVG for the OG image with kartis.info branding
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

      <!-- Ticket Icon Container -->
      <rect x="450" y="200" width="120" height="120" rx="24" fill="white" opacity="1"/>

      <!-- Ticket Icon (simplified ticket shape) -->
      <g transform="translate(510, 260)">
        <!-- Main ticket body -->
        <rect x="-30" y="-30" width="60" height="60" rx="4" fill="#EF4444" opacity="0"/>
        <!-- Ticket outline -->
        <path d="M -25 -25 L 25 -25 L 25 -5 Q 20 -5 20 0 Q 20 5 25 5 L 25 25 L -25 25 L -25 5 Q -20 5 -20 0 Q -20 -5 -25 -5 Z"
              fill="#EF4444" stroke="#EF4444" stroke-width="2"/>
      </g>

      <!-- kartis.info text -->
      <text x="600" y="400" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">
        kartis.info
      </text>

      <!-- Subtitle -->
      <text x="600" y="460" font-family="Arial, sans-serif" font-size="32" fill="white" opacity="0.9" text-anchor="middle">
        מערכת ניהול כרטיסים לאירועים ומשחקים
      </text>
    </svg>
  `

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(publicDir, 'og-image.png'))

  console.log('✅ Generated og-image.png (1200x630)')
}

generateOGImage()
  .then(() => console.log('Done!'))
  .catch(console.error)

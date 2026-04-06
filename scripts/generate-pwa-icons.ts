import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const SRC = path.join(process.cwd(), 'public/images/ticketcap-logo.png')
const OUT_DIR = path.join(process.cwd(), 'public/icons')

fs.mkdirSync(OUT_DIR, { recursive: true })

async function main() {
  await sharp(SRC)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, 'icon-192.png'))
  console.log('✓ icon-192.png')

  await sharp(SRC)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, 'icon-512.png'))
  console.log('✓ icon-512.png')

  const CANVAS = 512
  const CONTENT_SIZE = Math.round(CANVAS * 0.8)
  const PADDING = Math.round((CANVAS - CONTENT_SIZE) / 2)

  const resized = await sharp(SRC)
    .resize(CONTENT_SIZE, CONTENT_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 29, g: 78, b: 216, alpha: 1 },
    },
  })
    .composite([{ input: resized, top: PADDING, left: PADDING }])
    .png()
    .toFile(path.join(OUT_DIR, 'icon-512-maskable.png'))
  console.log('✓ icon-512-maskable.png')

  console.log('\nAll icons generated in public/icons/')
}

main().catch(console.error)

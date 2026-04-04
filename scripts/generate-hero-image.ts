import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'

config() // load .env

const API_KEY = process.env.IDEOGRAM_API_KEY
if (!API_KEY) throw new Error('Set IDEOGRAM_API_KEY in .env')

const PROMPT = `Israeli school community soccer match, parents and children in bleachers cheering, warm afternoon golden hour light, joyful crowd, photorealistic, wide shot, vibrant community atmosphere, outdoor stadium seating, green pitch visible`

async function main() {
  console.log('Generating hero image via Ideogram API...')

  const res = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
    method: 'POST',
    headers: { 'Api-Key': API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: PROMPT,
      rendering_speed: 'DEFAULT',
      style_type: 'REALISTIC',
      aspect_ratio: '4x3',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ideogram API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const imageUrl = data.data[0].url
  console.log('Image URL:', imageUrl)

  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`)

  const buf = await imgRes.arrayBuffer()
  const outDir = path.join(process.cwd(), 'public/images/hero')
  fs.mkdirSync(outDir, { recursive: true })

  const out = path.join(outDir, 'hero-event.jpg')
  fs.writeFileSync(out, Buffer.from(buf))
  console.log('Saved:', out)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

import fs from 'fs'
import path from 'path'

const IDEOGRAM_API_KEY = 'fGDoK4f_gOWFjcDaS4vLxaavoVaWtzD8EgQXJiqWP72Fz3PBSg-bRzdtup_ajnP_vBBUZXZhBnPF3Y-CLxv4MA'
const API_URL = 'https://api.ideogram.ai/generate'

interface ImagePrompt {
  filename: string
  prompt: string
  aspectRatio?: 'ASPECT_16_9' | 'ASPECT_1_1' | 'ASPECT_3_4' | 'ASPECT_4_3'
}

const imagePrompts: ImagePrompt[] = [
  // Hero carousel images
  {
    filename: 'hero-1.jpg',
    prompt: 'Luxurious upscale restaurant interior with warm ambient lighting, elegant dining tables with white tablecloths, modern chandeliers, floor-to-ceiling windows, professional architectural photography, cinematic composition, high-end fine dining atmosphere',
    aspectRatio: 'ASPECT_16_9'
  },
  {
    filename: 'hero-2.jpg',
    prompt: 'Beautiful gourmet food plating, fine dining presentation, artistic arrangement on white ceramic plate, shallow depth of field, professional food photography, warm restaurant lighting, overhead shot',
    aspectRatio: 'ASPECT_16_9'
  },
  {
    filename: 'hero-3.jpg',
    prompt: 'Modern trendy restaurant bar area with marble counter, brass fixtures, hanging pendant lights, shelves with premium bottles, sophisticated interior design, professional photography',
    aspectRatio: 'ASPECT_16_9'
  },
  {
    filename: 'hero-4.jpg',
    prompt: 'Cozy outdoor restaurant terrace at sunset, wooden tables with candles, string lights overhead, urban rooftop setting, romantic atmosphere, golden hour photography',
    aspectRatio: 'ASPECT_16_9'
  },

  // Featured restaurants
  {
    filename: 'italian-restaurant.jpg',
    prompt: 'Authentic Italian trattoria interior, rustic wooden tables, exposed brick walls, wine bottles on shelves, warm Edison bulb lighting, cozy Mediterranean atmosphere, professional interior photography',
    aspectRatio: 'ASPECT_1_1'
  },
  {
    filename: 'japanese-restaurant.jpg',
    prompt: 'Modern Japanese sushi restaurant interior, minimalist zen design, wooden sushi bar counter, clean lines, ambient lighting, contemporary Asian aesthetic, professional photography',
    aspectRatio: 'ASPECT_1_1'
  },
  {
    filename: 'french-bistro.jpg',
    prompt: 'Elegant French bistro interior, classic Parisian style, leather banquettes, brass fixtures, mirrors on walls, checkered floor tiles, sophisticated European atmosphere',
    aspectRatio: 'ASPECT_1_1'
  },
  {
    filename: 'steakhouse.jpg',
    prompt: 'Upscale modern steakhouse interior, dark wood paneling, leather chairs, dim atmospheric lighting, contemporary masculine design, premium dining atmosphere',
    aspectRatio: 'ASPECT_1_1'
  },
  {
    filename: 'mediterranean-cafe.jpg',
    prompt: 'Bright Mediterranean cafe with white walls, natural light, potted plants, wooden furniture, coastal aesthetic, airy and fresh atmosphere, professional photography',
    aspectRatio: 'ASPECT_1_1'
  },
  {
    filename: 'asian-fusion.jpg',
    prompt: 'Contemporary Asian fusion restaurant, modern industrial design, open kitchen, dramatic lighting, trendy urban atmosphere, sleek and stylish interior',
    aspectRatio: 'ASPECT_1_1'
  },

  // Cuisine category images
  {
    filename: 'cuisine-italian.jpg',
    prompt: 'Beautiful handmade fresh pasta dish with tomato sauce and basil, professional Italian food photography, rustic wooden table, natural lighting, overhead shot, restaurant presentation',
    aspectRatio: 'ASPECT_3_4'
  },
  {
    filename: 'cuisine-japanese.jpg',
    prompt: 'Premium sushi and sashimi platter, elegant Japanese presentation, black rectangular plate, fresh raw fish, artistic arrangement, professional food photography',
    aspectRatio: 'ASPECT_3_4'
  },
  {
    filename: 'cuisine-mediterranean.jpg',
    prompt: 'Mediterranean mezze platter with hummus, falafel, fresh vegetables, pita bread, olive oil, colorful healthy presentation, overhead food photography',
    aspectRatio: 'ASPECT_3_4'
  },
  {
    filename: 'cuisine-french.jpg',
    prompt: 'Elegant French fine dining dish, gourmet plating, sauce artistry, microgreens garnish, white porcelain plate, professional culinary photography',
    aspectRatio: 'ASPECT_3_4'
  },
  {
    filename: 'cuisine-steakhouse.jpg',
    prompt: 'Perfectly grilled ribeye steak with herb butter, roasted vegetables, professional steakhouse presentation, rustic wooden board, dramatic lighting',
    aspectRatio: 'ASPECT_3_4'
  },
  {
    filename: 'cuisine-asian.jpg',
    prompt: 'Vibrant Asian fusion bowl with colorful ingredients, modern plating, chopsticks, professional food photography, contemporary restaurant presentation',
    aspectRatio: 'ASPECT_3_4'
  }
]

async function generateImage(prompt: ImagePrompt): Promise<void> {
  console.log(`Generating: ${prompt.filename}...`)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Api-Key': IDEOGRAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_request: {
          prompt: prompt.prompt,
          aspect_ratio: prompt.aspectRatio || 'ASPECT_16_9',
          model: 'V_2',
          magic_prompt_option: 'AUTO'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('Invalid response format')
    }

    const imageUrl = data.data[0].url

    // Download the image
    const imageResponse = await fetch(imageUrl)
    const arrayBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save to public/restaurants/
    const outputPath = path.join(process.cwd(), 'public', 'restaurants', prompt.filename)
    fs.writeFileSync(outputPath, buffer)

    console.log(`✓ Saved: ${prompt.filename}`)

    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))

  } catch (error) {
    console.error(`✗ Failed to generate ${prompt.filename}:`, error)
  }
}

async function main() {
  console.log('Starting restaurant image generation...\n')

  for (const prompt of imagePrompts) {
    await generateImage(prompt)
  }

  console.log('\n✓ All images generated successfully!')
}

main().catch(console.error)

#!/usr/bin/env node

/**
 * Ideogram AI Image Generation Script for kartis.info
 *
 * Generates all custom images needed for A+ landing page:
 * - Hero illustration
 * - Feature icons (3)
 * - Testimonial headshots (3)
 * - School logos (12)
 *
 * Total cost: ~$3.52 (one-time)
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

const API_KEY = 'Z0wL_h7nGxuGAwxk4Bl-59OpiMwvFpC3EvAXXcg0qjpJgXcSS1g1m84hqSaInDEQxU-ZHa8u9YUmKYaPJJnpDg';
const API_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate';

// Image generation configs
const IMAGES = {
  hero: {
    name: 'main-illustration',
    prompt: 'A modern, minimalist 3D illustration of Israeli school event management. Show a friendly school building with digital tickets floating around it, happy parents and students using smartphones to register for events, warm Mediterranean colors (soft reds, blues), clean geometric shapes, professional SaaS style, Figma aesthetic, soft shadows, no text',
    style_type: 'DESIGN',
    aspect_ratio: '16x9',
    rendering_speed: 'QUALITY',
    output_dir: 'public/images/hero'
  },
  featureIcons: [
    {
      name: 'whatsapp-icon',
      prompt: '3D icon of WhatsApp logo with notification checkmarks, green and white color scheme, modern SaaS design, soft shadows, transparent background, minimalist',
      style_type: 'DESIGN',
      aspect_ratio: '1x1',
      rendering_speed: 'QUALITY',
      output_dir: 'public/images/hero'
    },
    {
      name: 'analytics-icon',
      prompt: '3D illustration of analytics charts and graphs for school events, blue and purple gradient, modern data visualization, soft shadows, clean geometric shapes',
      style_type: 'DESIGN',
      aspect_ratio: '1x1',
      rendering_speed: 'QUALITY',
      output_dir: 'public/images/hero'
    },
    {
      name: 'security-icon',
      prompt: '3D shield icon with lock symbol, purple gradient, modern cybersecurity aesthetic, soft glow effect, professional SaaS style',
      style_type: 'DESIGN',
      aspect_ratio: '1x1',
      rendering_speed: 'QUALITY',
      output_dir: 'public/images/hero'
    }
  ],
  testimonials: [
    {
      name: 'ronit-cohen',
      prompt: 'Professional headshot of a friendly Israeli female school principal, age 45-50, warm smile, business casual attire, office background, natural lighting, professional photography, high quality, realistic',
      style_type: 'REALISTIC',
      aspect_ratio: '1x1',
      rendering_speed: 'QUALITY',
      output_dir: 'public/images/testimonials'
    },
    {
      name: 'david-levi',
      prompt: 'Professional headshot of an Israeli male event coordinator, age 35-40, confident smile, casual professional attire, modern office background, natural lighting, realistic photography',
      style_type: 'REALISTIC',
      aspect_ratio: '1x1',
      rendering_speed: 'QUALITY',
      output_dir: 'public/images/testimonials'
    },
    {
      name: 'michal-avraham',
      prompt: 'Professional headshot of an Israeli female teacher and event organizer, age 30-35, friendly expression, smart casual clothing, school setting background, natural lighting, photorealistic',
      style_type: 'REALISTIC',
      aspect_ratio: '1x1',
      rendering_speed: 'QUALITY',
      output_dir: 'public/images/testimonials'
    }
  ],
  logos: [
    'Modern minimalist logo for Israeli elementary school, blue and green colors, geometric shapes, clean design, vector style',
    'Professional logo for Israeli high school, academic shield emblem, navy blue and gold, traditional yet modern',
    'Friendly logo for Israeli middle school, colorful book and pencil icon, playful yet professional',
    'Contemporary logo for Tel Aviv school, abstract geometric pattern, teal and orange',
    'Classic logo for Jerusalem school, traditional menorah design, elegant typography',
    'Modern logo for Haifa school, wave and mountain motif, blue gradient',
    'Innovative logo for tech-focused Israeli school, circuit board pattern, purple and cyan',
    'Warm logo for community school, hands forming heart shape, orange and yellow',
    'Academic logo for Jerusalem high school, ancient scroll design, burgundy and gold',
    'Progressive logo for Tel Aviv elementary, rainbow colors, inclusive design',
    'Nature-themed logo for eco school, tree and sun, green and yellow',
    'STEM-focused school logo, atom and gears, blue and silver'
  ].map((prompt, i) => ({
    name: `school-${String(i + 1).padStart(2, '0')}`,
    prompt,
    style_type: 'DESIGN',
    aspect_ratio: '1x1',
    rendering_speed: 'QUALITY',
    output_dir: 'public/images/logos',
    negative_prompt: 'background, gradient texture, shadows'
  }))
};

/**
 * Generate image using Ideogram API
 */
async function generateImage(config) {
  console.log(`🎨 Generating: ${config.name}...`);

  const FormData = require('form-data');
  const form = new FormData();

  form.append('prompt', config.prompt);
  form.append('style_type', config.style_type);
  form.append('rendering_speed', config.rendering_speed);

  if (config.resolution) {
    form.append('resolution', config.resolution);
  }
  if (config.aspect_ratio) {
    form.append('aspect_ratio', config.aspect_ratio);
  }
  if (config.negative_prompt) {
    form.append('negative_prompt', config.negative_prompt);
  }
  form.append('magic_prompt', 'OFF'); // Disable to keep prompts exact

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Api-Key': API_KEY,
        ...form.getHeaders()
      }
    };

    const req = https.request(API_URL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    form.pipe(req);
  });
}

/**
 * Download image from URL
 */
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

/**
 * Process single image generation
 */
async function processImage(config) {
  try {
    const response = await generateImage(config);

    if (response.data && response.data.length > 0) {
      const imageUrl = response.data[0].url;
      const filepath = `${config.output_dir}/${config.name}.png`;

      await downloadImage(imageUrl, filepath);
      console.log(`✅ Saved: ${filepath}`);

      return {
        success: true,
        name: config.name,
        filepath
      };
    } else {
      throw new Error('No image data in response');
    }
  } catch (error) {
    console.error(`❌ Failed: ${config.name} - ${error.message}`);
    return {
      success: false,
      name: config.name,
      error: error.message
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 Starting kartis.info Image Generation\n');
  console.log('═'.repeat(50));

  const results = {
    success: [],
    failed: []
  };

  // Generate hero illustration
  console.log('\n📸 Phase 1: Hero Illustration');
  console.log('─'.repeat(50));
  const heroResult = await processImage(IMAGES.hero);
  if (heroResult.success) results.success.push(heroResult);
  else results.failed.push(heroResult);

  // Wait to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generate feature icons
  console.log('\n🎯 Phase 2: Feature Icons (3)');
  console.log('─'.repeat(50));
  for (const config of IMAGES.featureIcons) {
    const result = await processImage(config);
    if (result.success) results.success.push(result);
    else results.failed.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generate testimonial headshots
  console.log('\n👥 Phase 3: Testimonial Headshots (3)');
  console.log('─'.repeat(50));
  for (const config of IMAGES.testimonials) {
    const result = await processImage(config);
    if (result.success) results.success.push(result);
    else results.failed.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generate school logos
  console.log('\n🏫 Phase 4: School Logos (12)');
  console.log('─'.repeat(50));
  for (const config of IMAGES.logos) {
    const result = await processImage(config);
    if (result.success) results.success.push(result);
    else results.failed.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 Generation Summary:');
  console.log(`  ✅ Success: ${results.success.length}`);
  console.log(`  ❌ Failed: ${results.failed.length}`);
  console.log(`  💰 Estimated Cost: $${(results.success.length * 0.16).toFixed(2)}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Images:');
    results.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  }

  console.log('\n✨ Image generation complete!\n');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateImage, downloadImage };

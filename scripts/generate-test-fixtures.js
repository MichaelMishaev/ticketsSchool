/**
 * Generate test fixtures for logo upload tests
 * Run with: node scripts/generate-test-fixtures.js
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const fixturesDir = path.join(__dirname, '../tests/fixtures')

async function generateFixtures() {
  console.log('🎨 Generating test fixtures...')

  // 1. Valid 512x512 PNG (~50KB)
  console.log('Creating test-logo-512.png (512x512, ~50KB)...')
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 59, g: 130, b: 246, alpha: 1 }, // Blue color (#3b82f6)
    },
  })
    .png({ compressionLevel: 6 })
    .toFile(path.join(fixturesDir, 'test-logo-512.png'))

  const size1 = fs.statSync(path.join(fixturesDir, 'test-logo-512.png')).size
  console.log(`✅ test-logo-512.png created (${Math.round(size1 / 1024)}KB)`)

  // 2. Oversized PNG (>5MB) - create a large 4096x4096 image
  console.log('Creating test-logo-large-6mb.png (>5MB)...')
  await sharp({
    create: {
      width: 4096,
      height: 4096,
      channels: 4,
      background: { r: 239, g: 68, b: 68, alpha: 1 }, // Red color (#ef4444)
    },
  })
    .png({ compressionLevel: 0 }) // No compression to make it larger
    .toFile(path.join(fixturesDir, 'test-logo-large-6mb.png'))

  const size2 = fs.statSync(path.join(fixturesDir, 'test-logo-large-6mb.png')).size
  console.log(`✅ test-logo-large-6mb.png created (${Math.round(size2 / 1024 / 1024)}MB)`)

  // 3. Invalid format (PDF) - create a minimal PDF file
  console.log('Creating test-document.pdf (invalid format)...')
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
307
%%EOF`

  fs.writeFileSync(path.join(fixturesDir, 'test-document.pdf'), pdfContent)
  console.log('✅ test-document.pdf created')

  console.log('\n🎉 All test fixtures generated successfully!')
  console.log('\nFixtures:')
  console.log('  - test-logo-512.png (valid 512x512 PNG)')
  console.log('  - test-logo-large-6mb.png (oversized PNG >5MB)')
  console.log('  - test-document.pdf (invalid format)')
}

generateFixtures().catch(console.error)

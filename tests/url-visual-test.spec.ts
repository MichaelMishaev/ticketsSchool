import { test, expect } from '@playwright/test'

test.describe('URL Display Visual Analysis', () => {
  test('Detailed visual analysis of URL breaking at 346px', async ({ page }) => {
    await page.setViewportSize({ width: 346, height: 878 })
    await page.goto('http://localhost:9000')
    await page.waitForLoadState('networkidle')

    console.log('\n🔍 DETAILED URL DISPLAY ANALYSIS (346px viewport)\n')

    const urlButton = page.locator('.bg-purple-600.text-white.font-mono')

    // Get computed styles
    const styles = await urlButton.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        width: computed.width,
        height: computed.height,
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        wordBreak: computed.wordBreak,
        overflowWrap: computed.overflowWrap,
        whiteSpace: computed.whiteSpace,
        padding: computed.padding,
        display: computed.display,
        textAlign: computed.textAlign
      }
    })

    console.log('📊 Computed Styles:')
    console.log(JSON.stringify(styles, null, 2))

    // Get actual rendered dimensions
    const box = await urlButton.boundingBox()
    console.log(`\n📐 Bounding Box: ${box?.width}px × ${box?.height}px`)

    // Get text content
    const text = await urlButton.textContent()
    console.log(`\n📝 Text Content: "${text}"`)

    // Get inner HTML to see how it's actually rendered
    const innerHTML = await urlButton.innerHTML()
    console.log(`\n🔤 Inner HTML: ${innerHTML}`)

    // Check if text is overflowing
    const isOverflowing = await urlButton.evaluate((el) => {
      return el.scrollWidth > el.clientWidth
    })
    console.log(`\n⚠️  Text Overflowing: ${isOverflowing}`)

    // Get parent container info
    const parentBox = await urlButton.locator('..').boundingBox()
    console.log(`\n👨‍👦 Parent Container: ${parentBox?.width}px × ${parentBox?.height}px`)

    // Take screenshot with highlighted element
    await urlButton.evaluate((el) => {
      el.style.border = '3px solid red'
    })

    await page.screenshot({
      path: 'test-results/url-visual-analysis.png',
      fullPage: false,
      clip: {
        x: 0,
        y: (box?.y || 0) - 200,
        width: 346,
        height: 600
      }
    })

    console.log('\n✓ Screenshot saved: test-results/url-visual-analysis.png\n')

    // Test different solutions
    console.log('🧪 TESTING POTENTIAL SOLUTIONS:\n')

    // Solution 1: Reduce font size
    await urlButton.evaluate((el) => {
      el.style.fontSize = '10px'
    })
    let newBox = await urlButton.boundingBox()
    console.log(`1. Font size 10px: ${newBox?.width}px × ${newBox?.height}px`)

    // Solution 2: Make container wider
    await urlButton.evaluate((el) => {
      el.style.fontSize = '11px'
      el.style.width = '95%'
    })
    newBox = await urlButton.boundingBox()
    console.log(`2. Width 95%: ${newBox?.width}px × ${newBox?.height}px`)

    // Solution 3: Use min-width
    await urlButton.evaluate((el) => {
      el.style.width = '100%'
      el.style.minWidth = 'max-content'
    })
    newBox = await urlButton.boundingBox()
    console.log(`3. Min-width max-content: ${newBox?.width}px × ${newBox?.height}px`)

    const isStillOverflowing = await urlButton.evaluate((el) => {
      return el.scrollWidth > el.clientWidth
    })
    console.log(`   Still overflowing: ${isStillOverflowing}`)
  })
})

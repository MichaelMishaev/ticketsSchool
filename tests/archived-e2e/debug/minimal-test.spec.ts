import { test, expect } from '@playwright/test'

test('MINIMAL: Can we even load the login page?', async ({ page }) => {
  console.log('Attempting to navigate to login page...')

  try {
    await page.goto('http://localhost:9000/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    console.log('✓ Page loaded successfully')

    const url = page.url()
    console.log('Current URL:', url)

    const title = await page.title()
    console.log('Page title:', title)

    const html = await page.content()
    console.log('Page has email input:', html.includes('type="email"'))
    console.log('Page has password input:', html.includes('type="password"'))

    await page.screenshot({ path: 'test-results/minimal-login-page.png' })
    console.log('Screenshot saved')

    expect(url).toContain('/admin/login')
  } catch (error) {
    console.error('FAILED TO LOAD LOGIN PAGE:', error)
    throw error
  }
})

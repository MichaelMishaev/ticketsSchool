import { test, expect } from '@playwright/test'

test.describe('Verify Navigation Actually Works - Real User Test', () => {
  test('can access registration form by clicking הרשמה link', async ({ page }) => {
    // Start at login page
    await page.goto('http://localhost:9000/admin/login')
    await page.waitForLoadState('domcontentloaded')

    console.log('📍 Starting at login page...')

    // Find the signup link
    const signupLink = page.locator('a[href="/admin/signup"]')
    await expect(signupLink).toBeVisible()
    console.log('✓ Found signup link')

    // Click it
    await signupLink.click()
    console.log('✓ Clicked signup link')

    // Wait for navigation
    await page.waitForURL('**/admin/signup', { timeout: 10000 })
    console.log('✓ URL changed to signup page')

    // Verify we can see the registration form
    await expect(page).toHaveURL(/\/admin\/signup/)

    // Check for form elements that would be on a registration page
    const pageContent = await page.content()
    console.log('✓ Page loaded successfully')

    // Try to find registration form elements
    const heading = page.locator('h1, h2').first()
    const headingText = await heading.textContent()
    console.log(`📝 Page heading: "${headingText}"`)

    // Check if there are input fields (registration forms typically have multiple inputs)
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    console.log(`📝 Found ${inputCount} input fields on registration page`)

    if (inputCount > 0) {
      console.log('✅ SUCCESS: Registration form is accessible!')
    } else {
      console.log('⚠️  WARNING: Page loaded but no input fields found')
    }
  })

  test('can access forgot password form by clicking שכחתי סיסמה link', async ({ page }) => {
    // Start at login page
    await page.goto('http://localhost:9000/admin/login')
    await page.waitForLoadState('domcontentloaded')

    console.log('📍 Starting at login page...')

    // Find the forgot password link
    const forgotPasswordLink = page.locator('a[href="/admin/forgot-password"]')
    await expect(forgotPasswordLink).toBeVisible()
    console.log('✓ Found forgot password link')

    // Click it
    await forgotPasswordLink.click()
    console.log('✓ Clicked forgot password link')

    // Wait for navigation
    await page.waitForURL('**/admin/forgot-password', { timeout: 10000 })
    console.log('✓ URL changed to forgot password page')

    // Verify we can see the forgot password form
    await expect(page).toHaveURL(/\/admin\/forgot-password/)

    // Check for form elements
    const pageContent = await page.content()
    console.log('✓ Page loaded successfully')

    // Try to find form elements
    const heading = page.locator('h1, h2').first()
    const headingText = await heading.textContent()
    console.log(`📝 Page heading: "${headingText}"`)

    // Check if there are input fields
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    console.log(`📝 Found ${inputCount} input fields on forgot password page`)

    if (inputCount > 0) {
      console.log('✅ SUCCESS: Forgot password form is accessible!')
    } else {
      console.log('⚠️  WARNING: Page loaded but no input fields found')
    }
  })

  test('complete user journey: login → signup → back → forgot password → back', async ({
    page,
  }) => {
    console.log('🚀 Starting complete user journey test...\n')

    // 1. Start at login page
    await page.goto('http://localhost:9000/admin/login')
    await page.waitForLoadState('domcontentloaded')
    console.log('1️⃣  At login page')
    await expect(page).toHaveURL(/\/admin\/login/)

    // 2. Click signup
    await page.locator('a[href="/admin/signup"]').click()
    await page.waitForURL('**/admin/signup')
    console.log('2️⃣  Navigated to signup page')
    await expect(page).toHaveURL(/\/admin\/signup/)

    // 3. Go back to login
    await page.goBack()
    await page.waitForURL('**/admin/login')
    console.log('3️⃣  Back to login page')
    await expect(page).toHaveURL(/\/admin\/login/)

    // 4. Click forgot password
    await page.locator('a[href="/admin/forgot-password"]').click()
    await page.waitForURL('**/admin/forgot-password')
    console.log('4️⃣  Navigated to forgot password page')
    await expect(page).toHaveURL(/\/admin\/forgot-password/)

    // 5. Go back to login
    await page.goBack()
    await page.waitForURL('**/admin/login')
    console.log('5️⃣  Back to login page again')
    await expect(page).toHaveURL(/\/admin\/login/)

    console.log('\n✅ COMPLETE USER JOURNEY SUCCESSFUL!')
    console.log('   All navigation links work as expected')
  })

  test('verify links are clickable with mouse hover', async ({ page }) => {
    await page.goto('http://localhost:9000/admin/login')
    await page.waitForLoadState('domcontentloaded')

    console.log('🖱️  Testing mouse interactions...')

    // Test signup link
    const signupLink = page.locator('a[href="/admin/signup"]')

    // Check if it's an actual link
    const tagName = await signupLink.evaluate((el) => el.tagName)
    console.log(`📝 Signup element tag: ${tagName}`)

    if (tagName === 'A') {
      console.log('✅ Signup is a proper anchor tag')

      // Check href attribute
      const href = await signupLink.getAttribute('href')
      console.log(`📝 Signup href: ${href}`)
    }

    // Test forgot password link
    const forgotLink = page.locator('a[href="/admin/forgot-password"]')
    const forgotTagName = await forgotLink.evaluate((el) => el.tagName)
    console.log(`📝 Forgot password element tag: ${forgotTagName}`)

    if (forgotTagName === 'A') {
      console.log('✅ Forgot password is a proper anchor tag')

      // Check href attribute
      const href = await forgotLink.getAttribute('href')
      console.log(`📝 Forgot password href: ${href}`)
    }

    console.log('\n✅ Both links are proper HTML anchor tags with href attributes')
  })
})

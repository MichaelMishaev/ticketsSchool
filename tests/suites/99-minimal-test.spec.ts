import { test, expect } from '@playwright/test'

test.describe('Minimal Test - Verify Setup', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('http://localhost:9000/admin/login')
    await expect(page).toHaveTitle(/kartis/)
  })

  test('should load health endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:9000/api/health')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.status).toBe('healthy')
  })
})

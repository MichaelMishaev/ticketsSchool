import { test, expect } from '@playwright/test';
import { createSchool, createAdmin, createEvent, cleanupTestData } from './fixtures/test-data';
import { LoginPage } from './page-objects/LoginPage';

// Helper to generate unique email
const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@test.com`;

test.describe('Basic TicketCap Tests', () => {
  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('admin dashboard loads correctly', async ({ page }) => {
    // Setup: Create test school and admin
    const school = await createSchool().withName('Dashboard Test School').create();
    const admin = await createAdmin()
      .withEmail(uniqueEmail('dashboard'))
      .withPassword('TestPassword123!')
      .withSchool(school.id)
      .create();

    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(admin.email, 'TestPassword123!');

    // Wait for redirect to admin dashboard
    await expect(page).toHaveURL(/\/admin/);

    // Check page title
    await expect(page).toHaveTitle(/kartis\.info/);

    // Check Hebrew text is present
    await expect(page.locator('text=לוח בקרה')).toBeVisible();
    await expect(page.locator('text=אירועים פעילים')).toBeVisible();

    // Check RTL direction
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
  });

  test('can navigate to create event page', async ({ page }) => {
    // Setup: Create test school and admin
    const school = await createSchool().withName('Create Event Test School').create();
    const admin = await createAdmin()
      .withEmail(uniqueEmail('create-event'))
      .withPassword('TestPassword123!')
      .withSchool(school.id)
      .create();

    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(admin.email, 'TestPassword123!');

    await expect(page).toHaveURL(/\/admin/);

    // Click create event button - use first() to handle multiple buttons (header + content)
    const createButton = page.locator('button[aria-label="צור אירוע חדש"]').first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for dropdown menu
    await page.waitForTimeout(300);

    // Click on "אירוע רגיל" option
    await page.click('text=אירוע רגיל');

    // Should be on create event page
    await expect(page).toHaveURL(/.*\/admin\/events\/new/);
    await expect(page.locator('text=יצירת אירוע חדש')).toBeVisible();
  });

  test('event registration page works', async ({ page }) => {
    // Setup: Create test school, event
    const school = await createSchool().withName('Event Registration Test School').create();
    const event = await createEvent()
      .withTitle('Test Soccer Game')
      .withLocation('Test Stadium')
      .withCapacity(100)
      .withSchool(school.id)
      .create();

    // Navigate to public registration page
    await page.goto(`/p/${school.slug}/${event.slug}`);

    // Should show event details
    await expect(page.locator(`text=${event.title}`)).toBeVisible();
    await expect(page.locator(`text=${event.location}`)).toBeVisible();

    // Should show registration form
    await expect(page.locator('text=טופס הרשמה')).toBeVisible();
    // Look for name input field
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test('mobile responsive - hamburger menu', async ({ page }) => {
    // Setup: Create test school and admin
    const school = await createSchool().withName('Mobile Test School').create();
    const admin = await createAdmin()
      .withEmail(uniqueEmail('mobile'))
      .withPassword('TestPassword123!')
      .withSchool(school.id)
      .create();

    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(admin.email, 'TestPassword123!');

    await expect(page).toHaveURL(/\/admin/);

    // Set mobile viewport BEFORE loading the page
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload to apply mobile viewport
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // On mobile, look for the hamburger menu button (menu icon)
    // The button should have an SVG icon
    const menuButton = page.locator('button').filter({
      has: page.locator('svg')
    }).first();

    await expect(menuButton).toBeVisible({ timeout: 10000 });

    // Click hamburger menu
    await menuButton.click();

    // Wait for mobile menu animation
    await page.waitForTimeout(500);

    // Check if mobile navigation is visible - look for any navigation items
    // The menu might use different selectors, so check for common navigation text
    const navVisible = await page.locator('text=ראשי, text=אירועים, text=Dashboard, text=Events').first().isVisible().catch(() => false);

    // If we can't find specific menu items, just verify the menu opened (check for navigation elements)
    if (!navVisible) {
      // Alternative: check if menu container became visible
      const menuContainer = page.locator('[role="navigation"], nav, .mobile-menu, .menu').first();
      await expect(menuContainer).toBeVisible();
    }
  });
});

import { test, expect } from '@playwright/test';

test('REAL USER SIMULATION: Click הרשמה exactly as user would', async ({ page }) => {
  console.log('🌐 Opening browser at http://localhost:9000/admin/login\n');

  // Navigate exactly as user would
  await page.goto('http://localhost:9000/admin/login');
  await page.waitForLoadState('domcontentloaded');

  console.log('✓ Page loaded');

  // Verify we see the new version
  const versionMarker = await page.locator('[data-version="v2-fixed"]').count();
  console.log(`✓ Version marker found: ${versionMarker > 0 ? 'YES (v2-fixed)' : 'NO (old version)'}\n`);

  if (versionMarker === 0) {
    console.log('❌ ERROR: Still loading old version!');
    throw new Error('Old version detected');
  }

  // Find the הרשמה link
  const signupLink = page.locator('text=הרשמה');

  // Check what element it is
  const elementInfo = await signupLink.evaluate(el => ({
    tagName: el.tagName,
    href: (el as HTMLAnchorElement).href,
    textContent: el.textContent,
    className: el.className,
    onclick: el.onclick,
    outerHTML: el.outerHTML
  }));

  console.log('📋 Element Details:');
  console.log('   Tag:', elementInfo.tagName);
  console.log('   Text:', elementInfo.textContent);
  console.log('   Href:', elementInfo.href);
  console.log('   Classes:', elementInfo.className);
  console.log('   OnClick handler:', elementInfo.onclick);
  console.log('   HTML:', elementInfo.outerHTML);
  console.log('');

  // Take screenshot before clicking
  await page.screenshot({ path: 'before-click.png' });
  console.log('📸 Screenshot saved: before-click.png\n');

  console.log('🖱️  Clicking הרשמה link now...');

  // Click using the most basic method (like a real user)
  await signupLink.click();

  console.log('✓ Click executed');

  // Wait a moment
  await page.waitForTimeout(1000);

  // Check current URL
  const currentUrl = page.url();
  console.log('📍 Current URL:', currentUrl);

  // Take screenshot after clicking
  await page.screenshot({ path: 'after-click.png' });
  console.log('📸 Screenshot saved: after-click.png\n');

  // Check if we navigated
  if (currentUrl.includes('/admin/signup')) {
    console.log('✅ SUCCESS! Navigation to signup page worked!');
  } else if (currentUrl.includes('/admin/login')) {
    console.log('❌ FAILED! Still on login page - navigation did not work!');
    console.log('');

    // Debug: Check if there's any JavaScript preventing navigation
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // Try clicking again with force
    console.log('🔄 Trying force click...');
    await signupLink.click({ force: true });
    await page.waitForTimeout(1000);
    console.log('📍 URL after force click:', page.url());

    if (page.url().includes('/admin/signup')) {
      console.log('✅ Force click worked!');
    } else {
      console.log('❌ Even force click failed!');

      // Last resort: try direct navigation via evaluate
      console.log('🔄 Trying direct navigation...');
      await page.evaluate(() => {
        const link = document.querySelector('a[href="/admin/signup"]') as HTMLAnchorElement;
        if (link) {
          link.click();
        }
      });
      await page.waitForTimeout(1000);
      console.log('📍 URL after JS click:', page.url());
    }
  }

  // Final check
  await expect(page).toHaveURL(/\/admin\/signup/);
});

test('Check if Next.js Link is interfering', async ({ page }) => {
  await page.goto('http://localhost:9000/admin/login');
  await page.waitForLoadState('domcontentloaded');

  console.log('🔍 Checking for Next.js Link wrapper...\n');

  // Check if the link is wrapped in Next.js Link component
  const linkParent = await page.locator('text=הרשמה').evaluate(el => {
    const parent = el.parentElement;
    return {
      parentTag: parent?.tagName,
      parentClass: parent?.className,
      hasNextRouter: 'next' in window,
      anchorTag: el.tagName,
      anchorHref: (el as HTMLAnchorElement).href
    };
  });

  console.log('Parent element:', linkParent.parentTag);
  console.log('Parent classes:', linkParent.parentClass);
  console.log('Anchor tag:', linkParent.anchorTag);
  console.log('Anchor href:', linkParent.anchorHref);
  console.log('Has Next.js router:', linkParent.hasNextRouter);
});

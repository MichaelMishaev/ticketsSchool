import { test, expect } from '@playwright/test';

test('FINAL TEST: Click הרשמה with cache busting', async ({ page }) => {
  console.log('🔄 Loading page with cache bust...\n');

  // Add timestamp to bust cache
  await page.goto(`http://localhost:9000/admin/login?t=${Date.now()}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('✓ Page loaded with cache bust');

  // Check version
  const versionCheck = await page.evaluate(() => {
    const v2 = document.querySelector('[data-version="v2-fixed"]');
    const v3 = document.querySelector('[data-version="v3-nextjs-link"]');
    return {
      hasV2: !!v2,
      hasV3: !!v3,
      version: v3 ? 'v3' : v2 ? 'v2' : 'old'
    };
  });

  console.log(`Version detected: ${versionCheck.version}`);
  console.log(`  v2-fixed marker: ${versionCheck.hasV2 ? 'YES' : 'NO'}`);
  console.log(`  v3-nextjs-link marker: ${versionCheck.hasV3 ? 'YES' : 'NO'}\n`);

  // Find the signup link
  const signupLink = page.locator('text=הרשמה');
  await expect(signupLink).toBeVisible();

  // Get element details
  const elementDetails = await signupLink.evaluate(el => ({
    tag: el.tagName,
    parent: el.parentElement?.tagName,
    href: (el as HTMLAnchorElement).href,
    outerHTML: el.outerHTML.substring(0, 150)
  }));

  console.log('📋 Signup Link Details:');
  console.log(`   Tag: ${elementDetails.tag}`);
  console.log(`   Parent Tag: ${elementDetails.parent}`);
  console.log(`   Href: ${elementDetails.href}`);
  console.log(`   HTML: ${elementDetails.outerHTML}...\n`);

  console.log('🖱️  Clicking הרשמה...');

  // Click the link
  await signupLink.click();

  // Wait for navigation
  await page.waitForTimeout(2000);

  const finalUrl = page.url();
  console.log(`📍 URL after click: ${finalUrl}\n`);

  if (finalUrl.includes('/admin/signup')) {
    console.log('✅ SUCCESS! Navigation worked!');
    console.log('   The link is now functional.\n');
  } else {
    console.log('❌ FAILED! Still on login page');
    console.log('   Diagnosing issue...\n');

    // Check what's preventing navigation
    const diagnostics = await page.evaluate(() => {
      const errors: string[] = [];
      const link = document.querySelector('text=הרשמה');

      return {
        hasNextRouter: 'next' in window,
        linkExists: !!link,
        documentTitle: document.title
      };
    });

    console.log('Diagnostics:', diagnostics);
  }

  // Assert navigation happened
  await expect(page).toHaveURL(/\/admin\/signup/, { timeout: 1000 });
});

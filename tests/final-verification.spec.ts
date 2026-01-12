import { test, expect } from '@playwright/test';

test('ABSOLUTE FINAL TEST: Does הרשמה actually navigate?', async ({ page }) => {
  console.log('🧪 FINAL VERIFICATION TEST\n');
  console.log('=' .repeat(60));

  // Navigate with cache bust
  const url = `http://localhost:9000/admin/login?bust=${Date.now()}`;
  console.log(`📍 Navigating to: ${url}\n`);

  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Check version marker
  const version = await page.evaluate(() => {
    const v4 = document.querySelector('[data-version="v4-onclick"]');
    return v4 ? 'v4-onclick' : 'OLD VERSION';
  });

  console.log(`✓ Page loaded`);
  console.log(`✓ Version: ${version}\n`);

  if (version !== 'v4-onclick') {
    console.log('❌ ERROR: Still loading old version!');
    console.log('   Please hard refresh your browser.\n');
    throw new Error('Old version detected');
  }

  // Find the signup link by test ID
  const signupLink = page.locator('[data-testid="signup-link"]');
  await expect(signupLink).toBeVisible();
  console.log('✓ Found signup link by data-testid');

  // Get link details
  const linkInfo = await signupLink.evaluate((el) => {
    const anchor = el as HTMLAnchorElement;
    return {
      tag: el.tagName,
      text: el.textContent,
      href: anchor.href,
      hasOnClick: !!anchor.onclick || el.getAttribute('onclick'),
      clickHandlerExists: el.addEventListener !== undefined
    };
  });

  console.log('\n📋 Link Details:');
  console.log(`   Tag: ${linkInfo.tag}`);
  console.log(`   Text: ${linkInfo.text}`);
  console.log(`   Href: ${linkInfo.href}`);
  console.log(`   Has onClick: ${linkInfo.hasOnClick}`);
  console.log(`   Can add listeners: ${linkInfo.clickHandlerExists}\n`);

  // Take before screenshot
  await page.screenshot({ path: 'final-before-click.png' });
  console.log('📸 Screenshot saved: final-before-click.png');

  console.log('\n🖱️  CLICKING הרשמה NOW...\n');

  // Click the link
  await signupLink.click();

  // Wait for navigation or timeout
  try {
    await page.waitForURL('**/admin/signup', { timeout: 5000 });
    console.log('✅ Navigation detected!\n');
  } catch (e) {
    console.log('⏱️  No URL change detected yet, waiting more...\n');
    await page.waitForTimeout(2000);
  }

  // Check current URL
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}\n`);

  // Take after screenshot
  await page.screenshot({ path: 'final-after-click.png' });
  console.log('📸 Screenshot saved: final-after-click.png\n');

  // Final verdict
  if (currentUrl.includes('/admin/signup')) {
    console.log('=' .repeat(60));
    console.log('✅✅✅ SUCCESS! NAVIGATION WORKS! ✅✅✅');
    console.log('=' .repeat(60));
    console.log('\nThe link is FUNCTIONAL and navigates correctly!\n');
  } else {
    console.log('=' .repeat(60));
    console.log('❌❌❌ FAILED! NAVIGATION DOES NOT WORK! ❌❌❌');
    console.log('=' .repeat(60));
    console.log('\nDiagnosing the issue...\n');

    // Deep diagnosis
    const diagnosis = await page.evaluate(() => {
      const link = document.querySelector('[data-testid="signup-link"]') as HTMLAnchorElement;

      // Try to get all event listeners (won't work in all browsers)
      let listeners = 'Cannot detect (browser limitation)';

      return {
        linkExists: !!link,
        linkVisible: link ? window.getComputedStyle(link).display !== 'none' : false,
        linkHref: link?.href,
        linkOnClick: link?.onclick?.toString(),
        parentElement: link?.parentElement?.tagName,
        hasReactProps: !!(link as any)._reactProps,
        windowHasRouter: 'next' in window
      };
    });

    console.log('🔍 Deep Diagnosis:');
    console.log(JSON.stringify(diagnosis, null, 2));
    console.log('');

    throw new Error('Navigation failed - link does not navigate');
  }

  // Final assertion
  await expect(page).toHaveURL(/\/admin\/signup/);
});

test('Also test forgot password link', async ({ page }) => {
  console.log('🧪 Testing forgot password link\n');

  const url = `http://localhost:9000/admin/login?bust=${Date.now()}`;
  await page.goto(url);
  await page.waitForLoadState('networkidle');

  const forgotLink = page.locator('[data-testid="forgot-password-link"]');
  await expect(forgotLink).toBeVisible();

  console.log('✓ Found forgot password link');
  console.log('🖱️  Clicking...\n');

  await forgotLink.click();

  await page.waitForTimeout(2000);
  const currentUrl = page.url();

  console.log(`📍 Current URL: ${currentUrl}\n`);

  if (currentUrl.includes('/admin/forgot-password')) {
    console.log('✅ Forgot password link works!\n');
  } else {
    console.log('❌ Forgot password link does NOT work!\n');
    throw new Error('Forgot password navigation failed');
  }

  await expect(page).toHaveURL(/\/admin\/forgot-password/);
});

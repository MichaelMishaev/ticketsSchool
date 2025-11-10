import { test, expect } from '@playwright/test';

test('ULTRA DEBUG: Complete diagnosis of navigation issue', async ({ page }) => {
  console.log('\n' + '='.repeat(80));
  console.log('🔬 ULTRA DEBUG MODE - COMPLETE DIAGNOSIS');
  console.log('='.repeat(80) + '\n');

  // Capture all console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture all errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // Step 1: Navigate with fresh cache
  const timestamp = Date.now();
  const url = `http://localhost:9000/admin/login?_=${timestamp}`;
  console.log(`Step 1: Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('✓ Page loaded\n');

  // Step 2: Check which version is loaded
  console.log('Step 2: Checking version...');
  const versionCheck = await page.evaluate(() => {
    return {
      v2: !!document.querySelector('[data-version="v2-fixed"]'),
      v3: !!document.querySelector('[data-version="v3-nextjs-link"]'),
      v4: !!document.querySelector('[data-version="v4-onclick"]'),
      body: document.body.innerHTML.substring(0, 500)
    };
  });

  console.log(`  v2-fixed: ${versionCheck.v2}`);
  console.log(`  v3-nextjs-link: ${versionCheck.v3}`);
  console.log(`  v4-onclick: ${versionCheck.v4}`);

  if (!versionCheck.v4) {
    console.log('\n❌ CRITICAL: v4 version NOT loaded!');
    console.log('This means your browser is serving OLD cached code.\n');
    console.log('Body preview:', versionCheck.body);
    throw new Error('Old version detected - v4 not found');
  }
  console.log('✓ Correct version loaded (v4-onclick)\n');

  // Step 3: Find the signup link
  console.log('Step 3: Finding הרשמה link...');
  const signupLink = page.locator('[data-testid="signup-link"]');
  const isVisible = await signupLink.isVisible();
  console.log(`  Link visible: ${isVisible}`);

  if (!isVisible) {
    console.log('❌ Link not visible!');
    throw new Error('Signup link not found');
  }

  // Step 4: Inspect the link in EXTREME detail
  console.log('\nStep 4: Inspecting link properties...');
  const linkDetails = await page.evaluate(() => {
    const link = document.querySelector('[data-testid="signup-link"]') as HTMLAnchorElement;
    if (!link) return null;

    // Get all event listeners (doesn't work in all browsers, but try)
    const hasClickHandler = link.onclick !== null;

    // Try to detect React event listeners
    const reactProps = Object.keys(link).filter(k => k.startsWith('__react'));

    return {
      exists: true,
      tagName: link.tagName,
      href: link.href,
      textContent: link.textContent,
      className: link.className,
      onclick: link.onclick?.toString() || 'null',
      hasClickHandler,
      reactPropsKeys: reactProps,
      outerHTML: link.outerHTML,
      parentTag: link.parentElement?.tagName,
      // Try to get the actual onclick attribute
      onclickAttr: link.getAttribute('onclick'),
      // Check computed styles
      display: window.getComputedStyle(link).display,
      pointerEvents: window.getComputedStyle(link).pointerEvents,
      cursor: window.getComputedStyle(link).cursor
    };
  });

  console.log('  Link details:');
  console.log('    Tag:', linkDetails?.tagName);
  console.log('    Href:', linkDetails?.href);
  console.log('    Text:', linkDetails?.textContent);
  console.log('    Has onclick:', linkDetails?.hasClickHandler);
  console.log('    React props keys:', linkDetails?.reactPropsKeys);
  console.log('    Display:', linkDetails?.display);
  console.log('    Pointer events:', linkDetails?.pointerEvents);
  console.log('    Cursor:', linkDetails?.cursor);
  console.log('    HTML:', linkDetails?.outerHTML);
  console.log('');

  if (!linkDetails?.hasClickHandler) {
    console.log('❌ CRITICAL: No onClick handler attached!');
    console.log('The link exists but has no click handler.\n');
  } else {
    console.log('✓ onClick handler IS attached\n');
  }

  // Step 5: Try clicking with detailed monitoring
  console.log('Step 5: Attempting to click הרשמה...');

  // Monitor navigation
  let navigationStarted = false;
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      navigationStarted = true;
      console.log(`  → Navigation detected to: ${frame.url()}`);
    }
  });

  // Take screenshot before
  await page.screenshot({ path: 'ultra-debug-before.png' });
  console.log('  📸 Screenshot before: ultra-debug-before.png');

  // Click the link
  console.log('  🖱️  Clicking now...');
  await signupLink.click();
  console.log('  ✓ Click event fired');

  // Wait and see what happens
  await page.waitForTimeout(3000);

  // Take screenshot after
  await page.screenshot({ path: 'ultra-debug-after.png' });
  console.log('  📸 Screenshot after: ultra-debug-after.png');

  // Check final URL
  const finalUrl = page.url();
  console.log(`  📍 Final URL: ${finalUrl}\n`);

  // Step 6: Analyze results
  console.log('Step 6: Analysis...');
  console.log(`  Navigation occurred: ${navigationStarted}`);
  console.log(`  Console messages (${consoleMessages.length}):`);
  consoleMessages.forEach(msg => console.log(`    ${msg}`));

  if (pageErrors.length > 0) {
    console.log(`  ❌ Page errors (${pageErrors.length}):`);
    pageErrors.forEach(err => console.log(`    ${err}`));
  }

  // Step 7: Manual click test
  console.log('\nStep 7: Trying JavaScript click...');
  const jsClickResult = await page.evaluate(() => {
    const link = document.querySelector('[data-testid="signup-link"]') as HTMLAnchorElement;
    if (!link) return { success: false, error: 'Link not found' };

    try {
      // Try direct click
      link.click();
      return { success: true, error: null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  console.log(`  JS click result:`, jsClickResult);
  await page.waitForTimeout(2000);
  console.log(`  URL after JS click: ${page.url()}\n`);

  // Step 8: Try dispatching click event
  console.log('Step 8: Trying manual event dispatch...');
  const eventResult = await page.evaluate(() => {
    const link = document.querySelector('[data-testid="signup-link"]') as HTMLAnchorElement;
    if (!link) return { success: false, error: 'Link not found' };

    try {
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      link.dispatchEvent(event);
      return { success: true, error: null };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  console.log(`  Event dispatch result:`, eventResult);
  await page.waitForTimeout(2000);
  console.log(`  URL after event: ${page.url()}\n`);

  // Final verdict
  console.log('='.repeat(80));
  if (finalUrl.includes('/admin/signup') || page.url().includes('/admin/signup')) {
    console.log('✅ SUCCESS - Navigation works!');
  } else {
    console.log('❌ FAILURE - Navigation does NOT work!');
    console.log('\nDIAGNOSTICS:');
    console.log('  - Version loaded:', versionCheck.v4 ? 'v4 ✓' : 'old ✗');
    console.log('  - Link found:', linkDetails?.exists ? 'yes ✓' : 'no ✗');
    console.log('  - onClick attached:', linkDetails?.hasClickHandler ? 'yes ✓' : 'NO ✗');
    console.log('  - Click fired:', 'yes ✓');
    console.log('  - Navigation occurred:', navigationStarted ? 'yes ✓' : 'NO ✗');
    console.log('\nPOSSIBLE CAUSES:');
    if (!linkDetails?.hasClickHandler) {
      console.log('  → React onClick handler not properly attached');
      console.log('  → May need to check React hydration issues');
    }
    if (!navigationStarted) {
      console.log('  → router.push() might not be executing');
      console.log('  → Check console for router errors');
    }
  }
  console.log('='.repeat(80) + '\n');

  // Don't fail the test, just report
  // await expect(page).toHaveURL(/\/admin\/signup/);
});

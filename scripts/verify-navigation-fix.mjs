import { chromium } from 'playwright';

async function verifyNavigationFix() {
  console.log('🔍 Verifying navigation performance fix...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  let apiCalls = [];
  let navigationTimes = [];

  // Monitor network requests
  page.on('request', (request) => {
    if (request.url().includes('/api/admin/me')) {
      const timestamp = new Date().toISOString();
      apiCalls.push({ url: request.url(), timestamp });
      console.log(`📡 API Call #${apiCalls.length}: ${request.url()} at ${timestamp}`);
    }
  });

  try {
    // Step 1: Go to login page
    console.log('Step 1: Loading login page...');
    await page.goto('http://localhost:9000/admin/login');
    await page.waitForLoadState('networkidle');

    // Check if we have a test user or need to create one
    console.log('\nStep 2: Checking for test user...');

    // Try to login with a known test user (we'll create one if needed)
    const testEmail = 'nav-test@test.com';
    const testPassword = 'TestPassword123!';

    console.log(`Step 3: Attempting login with ${testEmail}...`);

    try {
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');

      // Wait for navigation or error
      await Promise.race([
        page.waitForURL('**/admin/**', { timeout: 5000 }),
        page.waitForSelector('text=שגיאה', { timeout: 5000 }).catch(() => null)
      ]);

      const currentUrl = page.url();
      if (!currentUrl.includes('/admin/login')) {
        console.log('✅ Login successful!\n');
      } else {
        console.log('❌ Login failed - user may not exist\n');
        console.log('Please create a test user first or use an existing account\n');
        await browser.close();
        return;
      }
    } catch (error) {
      console.log('❌ Login failed:', error.message);
      await browser.close();
      return;
    }

    // Clear API call counter after login (login itself calls /api/admin/me once)
    const initialCallCount = apiCalls.length;
    console.log(`Initial API calls during login: ${initialCallCount}`);
    console.log('Expected: 1 call when layout mounts\n');

    apiCalls = []; // Reset counter

    // Step 4: Test navigation between pages
    console.log('Step 4: Testing navigation between menu items...\n');

    const routes = [
      { path: '/admin/events', name: 'Events' },
      { path: '/admin/team', name: 'Team' },
      { path: '/admin', name: 'Dashboard' },
      { path: '/admin/events', name: 'Events (again)' },
      { path: '/admin', name: 'Dashboard (again)' }
    ];

    for (const route of routes) {
      console.log(`📍 Navigating to: ${route.name} (${route.path})`);

      const startTime = Date.now();

      // Find and click the navigation link
      try {
        if (route.path === '/admin') {
          await page.click('a[href="/admin"], a[href="/admin/dashboard"]');
        } else {
          await page.click(`a[href="${route.path}"]`);
        }

        await page.waitForURL(`**${route.path}`, { timeout: 3000 });
        await page.waitForLoadState('domcontentloaded');

        const navTime = Date.now() - startTime;
        navigationTimes.push({ route: route.name, time: navTime });

        console.log(`   ⏱️  Navigation time: ${navTime}ms`);
        console.log(`   📡 API calls so far: ${apiCalls.length}\n`);

        // Small delay between navigations
        await page.waitForTimeout(500);
      } catch (error) {
        console.log(`   ⚠️  Navigation failed: ${error.message}\n`);
      }
    }

    // Step 5: Results
    console.log('\n' + '='.repeat(60));
    console.log('📊 NAVIGATION FIX VERIFICATION RESULTS');
    console.log('='.repeat(60) + '\n');

    console.log('Navigation Times:');
    navigationTimes.forEach(({ route, time }) => {
      const status = time < 1000 ? '✅' : time < 2000 ? '⚠️' : '❌';
      console.log(`  ${status} ${route}: ${time}ms`);
    });

    const avgTime = navigationTimes.reduce((sum, { time }) => sum + time, 0) / navigationTimes.length;
    console.log(`\n  Average: ${avgTime.toFixed(0)}ms`);

    console.log(`\n${'='.repeat(60)}\n`);

    console.log(`Total navigations performed: ${routes.length}`);
    console.log(`Total API calls to /api/admin/me: ${apiCalls.length}`);

    console.log('\n' + '='.repeat(60));

    if (apiCalls.length === 0) {
      console.log('✅ SUCCESS! No redundant API calls during navigation!');
      console.log('✅ Layout fetched admin info ONCE on mount (during login)');
      console.log('✅ Navigation fix is working correctly!');
    } else {
      console.log('❌ PROBLEM DETECTED!');
      console.log(`❌ Found ${apiCalls.length} API calls during ${routes.length} navigations`);
      console.log('❌ Layout is still refetching on pathname changes');
      console.log('❌ The dependency array fix may not be working');
    }

    if (avgTime < 1000) {
      console.log('✅ Navigation performance is EXCELLENT! (< 1 second)');
    } else if (avgTime < 2000) {
      console.log('⚠️  Navigation performance is ACCEPTABLE (1-2 seconds)');
    } else {
      console.log('❌ Navigation performance is POOR! (> 2 seconds)');
    }

    console.log('='.repeat(60) + '\n');

    console.log('\nBrowser will close in 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

verifyNavigationFix().catch(console.error);

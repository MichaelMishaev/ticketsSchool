# Visual Regression Testing Setup Guide

## Executive Summary

**Recommended Solution:** Playwright Built-in + Percy.io Hybrid Approach

**Why:** Leverages existing Playwright infrastructure (already configured in `playwright.config.ts`) while adding cloud-based visual review through Percy for critical pages. This maximizes cost-efficiency and minimizes setup complexity.

**Quick Start:**

```bash
# For local development (free, no setup)
npx playwright test tests/visual/

# For PR reviews (5,000 free snapshots/month)
npx percy exec -- npx playwright test tests/visual/
```

---

## Tool Comparison Matrix

| Tool                    | Cost                                        | Integration Effort               | CI/CD Support            | Maintenance                          | Browser Support                 | Best For                      | Recommendation                               |
| ----------------------- | ------------------------------------------- | -------------------------------- | ------------------------ | ------------------------------------ | ------------------------------- | ----------------------------- | -------------------------------------------- |
| **Playwright Built-in** | ✅ Free                                     | ⭐⭐⭐⭐⭐ Already configured    | ✅ GitHub Actions ready  | ⭐⭐⭐⭐⭐ Very low                  | Chromium, Firefox, WebKit       | Local testing, quick feedback | ⭐⭐⭐⭐⭐ **Primary choice**                |
| **Percy.io**            | ✅ Free tier: 5K/mo<br>💰 Pro: $99/mo (25K) | ⭐⭐⭐⭐ Easy (npm install)      | ✅ GitHub Actions native | ⭐⭐⭐⭐ Low (cloud-managed)         | Cross-browser + responsive      | Team reviews, PR checks       | ⭐⭐⭐⭐⭐ **Complement for critical pages** |
| **Chromatic**           | ✅ Free tier: 5K/mo<br>💰 Paid tiers vary   | ⭐⭐ Medium (requires Storybook) | ✅ GitHub Actions        | ⭐⭐⭐ Medium (Storybook dependency) | Chromium, Firefox, Safari, Edge | Storybook users only          | ⭐⭐ Not recommended (no Storybook)          |
| **jest-image-snapshot** | ✅ Free                                     | ⭐⭐⭐ Moderate (Jest setup)     | ⭐⭐⭐ Manual config     | ⭐⭐⭐ Medium (local snapshots)      | Depends on test runner          | Jest users, privacy-focused   | ⭐⭐ Not recommended (Jest >=20 <=29 only)   |

**Key Insights:**

- **Playwright Built-in** is already configured in `playwright.config.ts` (lines 14-18)
- **Percy.io** offers the best cloud-based review experience with minimal overhead
- **Chromatic** requires Storybook (not in current stack)
- **jest-image-snapshot** has Jest version restrictions (incompatible with Jest 30.2.0 in project)

---

## Architecture: Hybrid Approach

### Strategy Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Visual Testing Strategy                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  LOCAL DEVELOPMENT (Playwright Built-in)                 │
│  ├─ Fast feedback loop (5-10 seconds per test)           │
│  ├─ No external dependencies                             │
│  └─ Baseline stored in git (tests/__screenshots__/)      │
│                                                           │
│  PULL REQUEST REVIEWS (Percy.io)                         │
│  ├─ Cloud-based visual diffs                             │
│  ├─ Side-by-side comparison UI                           │
│  └─ Team collaboration (approve/reject changes)          │
│                                                           │
│  CRITICAL PAGES ONLY (10-15 snapshots)                   │
│  ├─ Homepage (desktop + mobile)                          │
│  ├─ Public registration page (desktop + mobile)          │
│  ├─ Payment flow                                         │
│  ├─ Admin dashboard                                      │
│  └─ Hebrew RTL layouts                                   │
│                                                           │
└─────────────────────────────────────────────────────────┘

Total Percy usage: ~30 snapshots/PR × 100 PRs/month = 3,000/5,000 free tier
```

**Why Hybrid?**

- **Playwright Built-in**: Fast local iteration (no network calls)
- **Percy.io**: Cloud review for critical pages (team collaboration)
- **Cost-Effective**: Stays within 5,000 free snapshots/month
- **Zero Lock-in**: Can remove Percy anytime, Playwright baseline remains

---

## Setup Guide

### Phase 1: Playwright Built-in (Already Configured ✅)

The project already has visual regression testing capabilities configured in `playwright.config.ts`.

**Existing Configuration:**

```typescript
// playwright.config.ts (lines 14-18)
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,        // Allow 100px difference (rendering variations)
    threshold: 0.2,            // 20% threshold (dynamic content like dates)
    animations: 'disabled',    // Consistent screenshots
  },
}
```

**Create Visual Test Suite:**

```bash
# Create visual tests directory
mkdir -p tests/visual
```

**Example Test (`tests/visual/critical-pages.visual.spec.ts`):**

```typescript
import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'
import { createSchool, createAdmin, cleanupTestData } from '../fixtures/test-data'

test.describe('Critical Pages - Visual Regression', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('Public Pages', () => {
    let school: any
    let event: any

    test.beforeAll(async () => {
      school = await createSchool().withName('Visual Test School').withSlug('visual-test').create()
      // Create test event
      event = await createEvent(school.id, {
        name: 'Visual Test Event',
        slug: 'visual-test-event',
        capacity: 100,
        paymentRequired: true,
        pricePerSpot: 50,
      })
    })

    test('Homepage - Desktop', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveScreenshot('homepage-desktop.png')
    })

    test('Homepage - Mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await expect(page).toHaveScreenshot('homepage-mobile.png')
    })

    test('Public Event Registration - Desktop', async ({ page }) => {
      await page.goto(`/p/${school.slug}/${event.slug}`)
      // Wait for form to load
      await page.waitForSelector('form')
      await expect(page).toHaveScreenshot('event-registration-desktop.png')
    })

    test('Public Event Registration - Mobile (Hebrew RTL)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(`/p/${school.slug}/${event.slug}`)
      await page.waitForSelector('form')
      await expect(page).toHaveScreenshot('event-registration-mobile-rtl.png')
    })
  })

  test.describe('Admin Pages', () => {
    let admin: any
    let school: any

    test.beforeAll(async () => {
      school = await createSchool().withName('Admin Visual School').create()
      admin = await createAdmin().withEmail('admin@visual.com').withSchoolId(school.id).create()
    })

    test('Admin Login Page', async ({ page }) => {
      await page.goto('/admin/login')
      await expect(page).toHaveScreenshot('admin-login.png')
    })

    test('Admin Dashboard - Desktop', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'Password123!')

      await page.goto('/admin/dashboard')
      await page.waitForSelector('text=אירועים קרובים') // Wait for Hebrew header
      await expect(page).toHaveScreenshot('admin-dashboard-desktop.png')
    })

    test('Event List - Empty State', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'Password123!')

      await page.goto('/admin/events')
      await expect(page).toHaveScreenshot('event-list-empty.png')
    })
  })

  test.describe('Error States', () => {
    test('404 Page Not Found', async ({ page }) => {
      await page.goto('/this-page-does-not-exist')
      await expect(page).toHaveScreenshot('error-404.png')
    })
  })

  test.describe('Payment Flow', () => {
    test('Payment Form - Desktop', async ({ page }) => {
      // Set mock mode to test payment UI
      process.env.YAADPAY_MOCK_MODE = 'true'

      const school = await createSchool().withSlug('payment-test').create()
      const event = await createEvent(school.id, {
        paymentRequired: true,
        pricePerSpot: 100,
      })

      await page.goto(`/p/${school.slug}/${event.slug}`)
      await page.fill('[name="name"]', 'Test User')
      await page.fill('[name="phone"]', '0501234567')
      await page.fill('[name="email"]', 'test@example.com')
      await page.click('button[type="submit"]')

      // Should see mock payment screen
      await page.waitForSelector('text=MOCK MODE')
      await expect(page).toHaveScreenshot('payment-mock-screen.png')
    })
  })
})
```

**Run Visual Tests:**

```bash
# First run - generates baseline screenshots
npx playwright test tests/visual/

# Subsequent runs - compares against baseline
npx playwright test tests/visual/

# Update baselines after intentional changes
npx playwright test tests/visual/ --update-snapshots
```

**Screenshot Storage:**

```
tests/
├── visual/
│   └── critical-pages.visual.spec.ts
└── critical-pages.visual.spec.ts-snapshots/
    ├── homepage-desktop-chromium.png
    ├── homepage-mobile-chromium.png
    ├── admin-login-chromium.png
    └── ...
```

---

### Phase 2: Add Percy.io for Team Reviews (Optional)

**When to Use Percy:**

- Pull requests with UI changes
- Critical page redesigns
- Multi-browser validation
- Team collaboration on visual changes

**Setup Steps:**

#### 1. Install Percy

```bash
npm install --save-dev @percy/cli @percy/playwright
```

#### 2. Create Percy Project

1. Sign up at [percy.io](https://percy.io) (free account)
2. Create new project: "TicketsSchool"
3. Copy `PERCY_TOKEN` from project settings

#### 3. Add Percy to GitHub Secrets

```bash
# In GitHub repo settings → Secrets and variables → Actions
# Add secret: PERCY_TOKEN = <your-token-here>
```

#### 4. Create Percy-Specific Tests

**File: `tests/visual/percy-critical.spec.ts`**

```typescript
import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'
import { createSchool, createAdmin, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'

test.describe('Percy - Critical Pages', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('Homepage', async ({ page }) => {
    await page.goto('/')
    await percySnapshot(page, 'Homepage')
  })

  test('Public Event Registration', async ({ page }) => {
    const school = await createSchool().withSlug('percy-school').create()
    const event = await createEvent(school.id, { slug: 'percy-event' })

    await page.goto(`/p/${school.slug}/${event.slug}`)
    await page.waitForSelector('form')
    await percySnapshot(page, 'Public Event Registration')
  })

  test('Admin Dashboard', async ({ page }) => {
    const school = await createSchool().create()
    const admin = await createAdmin().withSchoolId(school.id).create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(admin.email, 'Password123!')

    await page.goto('/admin/dashboard')
    await page.waitForSelector('text=אירועים קרובים')
    await percySnapshot(page, 'Admin Dashboard')
  })

  test('Payment Mock Screen', async ({ page }) => {
    process.env.YAADPAY_MOCK_MODE = 'true'
    const school = await createSchool().withSlug('payment').create()
    const event = await createEvent(school.id, { paymentRequired: true })

    await page.goto(`/p/${school.slug}/${event.slug}`)
    await page.fill('[name="name"]', 'Percy Test')
    await page.fill('[name="phone"]', '0501234567')
    await page.fill('[name="email"]', 'percy@test.com')
    await page.click('button[type="submit"]')

    await page.waitForSelector('text=MOCK MODE')
    await percySnapshot(page, 'Payment Mock Screen')
  })
})
```

#### 5. Update GitHub Actions

**Create: `.github/workflows/visual-regression.yml`**

```yaml
name: Visual Regression Tests

on:
  pull_request:
    branches:
      - main
      - development
    paths:
      - 'app/**'
      - 'components/**'
      - 'lib/**'
      - 'styles/**'
      - 'tailwind.config.ts'

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Setup test database
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
        run: |
          sudo systemctl start postgresql.service
          sudo -u postgres psql -c "CREATE USER test_user WITH PASSWORD 'test_password';"
          sudo -u postgres psql -c "CREATE DATABASE test_db OWNER test_user;"
          npx prisma migrate deploy

      - name: Start dev server
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          JWT_SECRET: test-jwt-secret-for-ci-only-min-32-characters-long
          RESEND_API_KEY: re_test_key
          EMAIL_FROM: test@example.com
          YAADPAY_MOCK_MODE: 'true'
        run: |
          npm run dev &
          npx wait-on http://localhost:9000/api/health --timeout 60000

      - name: Run Percy visual tests
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          JWT_SECRET: test-jwt-secret-for-ci-only-min-32-characters-long
        run: npx percy exec -- npx playwright test tests/visual/percy-critical.spec.ts

      - name: Upload test artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-test-failures
          path: |
            playwright-report/
            test-results/
          retention-days: 7
```

#### 6. Configure Percy

**Create: `.percy.yml`**

```yaml
version: 2
static:
  include: '**/*.png'
  exclude: 'node_modules/**'
snapshot:
  widths:
    - 375 # Mobile
    - 1280 # Desktop
  min-height: 1024
  percy-css: |
    /* Hide dynamic content that changes between snapshots */
    [data-testid="current-time"],
    [data-testid="timestamp"],
    .date-display {
      visibility: hidden;
    }
```

**Update `.gitignore`:**

```bash
# Percy
.percy/
```

---

## Critical Pages to Test

### Priority 1: Public-Facing (Always Test)

| Page                      | Desktop | Mobile | Hebrew RTL | Importance                       |
| ------------------------- | ------- | ------ | ---------- | -------------------------------- |
| Homepage                  | ✅      | ✅     | ✅         | **Critical** - First impression  |
| Public Event Registration | ✅      | ✅     | ✅         | **Critical** - Revenue generator |
| Payment Mock Screen       | ✅      | ✅     | N/A        | **Critical** - Payment flow      |
| Payment Success           | ✅      | ✅     | ✅         | **High** - Confirmation UX       |
| 404 Error Page            | ✅      | ✅     | ✅         | **Medium** - Error handling      |

### Priority 2: Admin Dashboard (Test on Major Changes)

| Page                   | Desktop | Mobile | Hebrew RTL | Importance                      |
| ---------------------- | ------- | ------ | ---------- | ------------------------------- |
| Admin Login            | ✅      | ✅     | ✅         | **High** - Security UX          |
| Admin Dashboard        | ✅      | ✅     | ✅         | **High** - Main admin interface |
| Event List (Empty)     | ✅      | ✅     | ✅         | **Medium** - Empty state        |
| Event List (With Data) | ✅      | ✅     | ✅         | **Medium** - Data display       |
| Event Creation Form    | ✅      | ❌     | ✅         | **Medium** - Desktop-focused    |

### Priority 3: Edge Cases (Test on Request)

| Page                  | Desktop | Mobile | Hebrew RTL | Importance                 |
| --------------------- | ------- | ------ | ---------- | -------------------------- |
| 500 Error Page        | ✅      | ✅     | ✅         | **Low** - Rarely seen      |
| Waitlist Confirmation | ✅      | ✅     | ✅         | **Low** - Edge case        |
| Table Selection UI    | ✅      | ❌     | ✅         | **Low** - Feature-specific |

**Total Snapshots:**

- Priority 1: 10 pages × 2 viewports = **20 snapshots**
- Priority 2: 5 pages × 2 viewports = **10 snapshots**
- **Total: ~30 snapshots per PR**

**Monthly Estimate:**

- 100 PRs/month × 30 snapshots = **3,000 snapshots/month**
- **Well within 5,000 free tier** ✅

---

## CI/CD Integration

### Local Development Workflow

```bash
# 1. Make UI changes
# Edit components/HomePage.tsx

# 2. Run visual tests locally (Playwright built-in)
npx playwright test tests/visual/critical-pages.visual.spec.ts

# 3. Review differences
# Open playwright-report/index.html in browser

# 4. If changes are intentional, update baselines
npx playwright test tests/visual/ --update-snapshots

# 5. Commit updated screenshots
git add tests/**-snapshots/
git commit -m "fix(ui): update homepage layout"
```

### Pull Request Workflow

```bash
# 1. Push branch with UI changes
git push origin feature/new-homepage-design

# 2. GitHub Actions automatically runs:
#    - Playwright built-in tests (always)
#    - Percy visual tests (if PERCY_TOKEN exists)

# 3. Review Percy build in PR
#    - Click "Percy build" in PR checks
#    - Review visual diffs in Percy dashboard
#    - Approve or request changes

# 4. Merge when all checks pass
```

### Handling Test Failures

**Scenario 1: Unintentional Visual Change**

```bash
# Playwright detects diff
❌ homepage-desktop.png has 523 pixels different (threshold: 100)

# Action: Fix the CSS regression
# Edit components/HomePage.tsx
# Re-run test: npx playwright test tests/visual/
```

**Scenario 2: Intentional Design Change**

```bash
# Update baselines
npx playwright test tests/visual/ --update-snapshots

# Commit new baselines
git add tests/**-snapshots/
git commit -m "design: update homepage layout per design v2"
```

**Scenario 3: Flaky Test (Dynamic Content)**

```typescript
// Mask dynamic elements
await expect(page).toHaveScreenshot('homepage.png', {
  mask: [page.locator('[data-testid="current-time"]')],
})
```

---

## Advanced Configuration

### Masking Dynamic Content

```typescript
// Mask timestamp that changes every second
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [page.locator('[data-testid="current-time"]'), page.locator('.date-display')],
})
```

### Testing Different Themes

```typescript
test('Homepage - Dark Mode', async ({ page }) => {
  await page.goto('/')
  await page.click('[data-testid="theme-toggle"]')
  await expect(page).toHaveScreenshot('homepage-dark.png')
})
```

### Cross-Browser Testing (Percy Only)

```yaml
# .percy.yml
version: 2
snapshot:
  widths: [375, 1280]
  browsers:
    - chrome
    - firefox
    - edge
    - safari
```

**Note:** Cross-browser requires Percy paid plan or manual Playwright config:

```typescript
// playwright.config.ts (existing projects)
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

---

## Cost Analysis

### Percy.io Free Tier

| Plan         | Snapshots/Month | Users     | Build History | Price         |
| ------------ | --------------- | --------- | ------------- | ------------- |
| **Free**     | 5,000           | Unlimited | 30 days       | **$0**        |
| Professional | 25,000          | Unlimited | 1 year        | $99/mo        |
| Enterprise   | Custom          | Unlimited | Custom        | Contact sales |

**Project Estimation:**

- **Current usage**: ~30 snapshots/PR × 100 PRs/month = 3,000/month
- **Buffer**: 2,000 snapshots remaining for growth
- **Recommendation**: Start with free tier, upgrade if needed

### Playwright Built-in

| Feature            | Cost                        |
| ------------------ | --------------------------- |
| Screenshot storage | **$0** (git-based)          |
| Comparison engine  | **$0** (pixelmatch library) |
| Browser automation | **$0** (Playwright)         |
| CI/CD minutes      | **Depends on GitHub plan**  |

**GitHub Actions Free Tier:**

- 2,000 minutes/month (private repos)
- Unlimited for public repos

**Visual test runtime**: ~5 minutes/run

- **Monthly usage**: 100 runs × 5 min = 500 minutes
- **Well within free tier** ✅

---

## Migration Path

### Current State (No Visual Testing)

```
PR → Manual QA → Merge
```

### Phase 1: Playwright Built-in (Week 1)

```
PR → Automated visual tests (local) → Manual QA → Merge
```

**Action Items:**

- [ ] Create `tests/visual/` directory
- [ ] Add 5 critical page tests (homepage, registration, login, dashboard, 404)
- [ ] Run initial baseline generation: `npx playwright test tests/visual/ --update-snapshots`
- [ ] Commit baselines to git
- [ ] Update developer documentation

### Phase 2: Percy.io Integration (Week 2-3, Optional)

```
PR → Automated visual tests (local + Percy) → Team review in Percy → Merge
```

**Action Items:**

- [ ] Sign up for Percy.io free account
- [ ] Add `PERCY_TOKEN` to GitHub secrets
- [ ] Create `.github/workflows/visual-regression.yml`
- [ ] Add Percy-specific tests (`tests/visual/percy-critical.spec.ts`)
- [ ] Test Percy integration on sample PR
- [ ] Train team on Percy review workflow

### Phase 3: Optimization (Month 2)

```
PR → Smart visual testing (only affected pages) → Auto-approve non-critical → Merge
```

**Action Items:**

- [ ] Implement path-based test filtering (only run visual tests if UI files changed)
- [ ] Add automatic approval for non-critical pages
- [ ] Configure Percy baseline branching (develop vs. main)
- [ ] Set up Slack notifications for visual changes

---

## Best Practices

### 1. Screenshot Stability

**Problem:** Timestamps, random data, animations cause flaky tests.

**Solution:**

```typescript
// Freeze time
await page.addInitScript(() => {
  Date.now = () => 1640000000000 // Fixed timestamp
})

// Disable animations
await page.addStyleTag({
  content:
    '*, *::before, *::after { animation-duration: 0s !important; transition: none !important; }',
})

// Mask dynamic elements
await expect(page).toHaveScreenshot({
  mask: [page.locator('[data-testid="timestamp"]')],
})
```

### 2. Viewport Consistency

**Always test same viewports:**

```typescript
const VIEWPORTS = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  desktop: { width: 1280, height: 720 }, // Default Playwright
}

test('Page - Mobile', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.mobile)
  await expect(page).toHaveScreenshot()
})
```

### 3. Wait for Full Load

**Problem:** Fonts, images, spinners not loaded.

**Solution:**

```typescript
// Wait for network idle
await page.goto('/', { waitUntil: 'networkidle' })

// Wait for specific element
await page.waitForSelector('[data-testid="content-loaded"]')

// Wait for fonts
await page.evaluate(() => document.fonts.ready)
```

### 4. Hebrew RTL Testing

**Ensure RTL layout is tested:**

```typescript
test('Event Registration - Hebrew RTL', async ({ page }) => {
  await page.goto('/p/school/event')

  // Verify RTL direction
  const html = page.locator('html')
  await expect(html).toHaveAttribute('dir', 'rtl')

  await expect(page).toHaveScreenshot('event-rtl.png')
})
```

### 5. Git Storage Optimization

**Screenshots can grow git repo size.**

**Best practices:**

- Store only critical page baselines (10-15 pages max)
- Use `.gitattributes` for LFS if repo grows >100MB:
  ```
  tests/**-snapshots/*.png filter=lfs diff=lfs merge=lfs -text
  ```
- Periodically clean old baselines: `git gc --aggressive`

---

## Troubleshooting

### Issue 1: Baseline Mismatch Across Environments

**Symptom:**

```
❌ homepage.png differs in CI but passes locally
```

**Cause:** Different OS renders fonts differently (macOS vs. Linux).

**Solution:**

```typescript
// playwright.config.ts
use: {
  screenshot: 'only-on-failure',
  // Force consistent rendering
  deviceScaleFactor: 1,
  hasTouch: false,
  viewport: { width: 1280, height: 720 },
}
```

**OR:** Generate baselines in CI:

```bash
# Generate baselines in Linux (same as CI)
docker run --rm -v $(pwd):/work -w /work mcr.microsoft.com/playwright:v1.55.0 \
  npx playwright test tests/visual/ --update-snapshots
```

### Issue 2: Percy Snapshot Limit Exceeded

**Symptom:**

```
❌ Percy build failed: Snapshot limit exceeded (5,000/month)
```

**Solution:**

1. **Reduce snapshot count**: Test only critical pages
2. **Filter by paths**: Only run Percy on UI-related PRs
   ```yaml
   on:
     pull_request:
       paths:
         - 'components/**'
         - 'app/**/*.tsx'
   ```
3. **Upgrade plan**: $99/mo for 25,000 snapshots

### Issue 3: Flaky Screenshot Tests

**Symptom:**

```
❌ Test passes locally, fails in CI randomly
```

**Debugging:**

```typescript
// Add debug logging
test('Flaky page', async ({ page }) => {
  await page.goto('/')

  // Wait for specific element
  await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 })

  // Log page state
  console.log('Page URL:', page.url())
  console.log('Page title:', await page.title())

  // Increase threshold temporarily
  await expect(page).toHaveScreenshot({
    threshold: 0.3, // Increase from 0.2 to 0.3
    maxDiffPixels: 200, // Increase from 100 to 200
  })
})
```

---

## Additional Resources

### Documentation

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots) - Official Playwright docs
- [Percy.io Documentation](https://www.browserstack.com/percy) - Percy by BrowserStack
- [Visual Regression Testing Guide](https://www.lambdatest.com/learning-hub/playwright-visual-regression-testing) - LambdaTest tutorial

### Tools & Libraries

- [Percy Playwright SDK](https://github.com/percy/percy-playwright) - Percy integration
- [Chromatic](https://www.chromatic.com/) - Alternative (requires Storybook)
- [jest-image-snapshot](https://github.com/americanexpress/jest-image-snapshot) - Jest-based alternative

### Comparisons

- [Visual Regression Testing Tools Comparison](https://sparkbox.com/foundry/visual_regression_testing_with_backstopjs_applitools_webdriverio_wraith_percy_chromatic) - Sparkbox guide
- [Percy vs. Chromatic](https://www.chromatic.com/compare/percy) - Feature comparison

---

## Summary & Next Steps

### Recommended Implementation

**Week 1: Playwright Built-in (Free, Low Effort)**

1. Create `tests/visual/critical-pages.visual.spec.ts`
2. Add 10-15 critical page tests
3. Generate baselines: `npx playwright test tests/visual/ --update-snapshots`
4. Commit to git and run in local development

**Week 2-3: Percy.io (Optional, for Team Collaboration)**

1. Sign up for Percy free account
2. Add `PERCY_TOKEN` to GitHub secrets
3. Create `.github/workflows/visual-regression.yml`
4. Run Percy on PRs with UI changes

**Month 2: Optimize & Scale**

1. Fine-tune thresholds based on false positives
2. Add path-based filtering (only run on UI changes)
3. Implement automatic baseline updates for approved changes
4. Monitor Percy usage (target: <4,000/5,000 snapshots/month)

### Expected Outcomes

- **Reduced UI regressions**: Catch visual bugs before production
- **Faster reviews**: Automated visual diffs reduce manual QA time
- **Better collaboration**: Team reviews visual changes in Percy UI
- **Cost-effective**: $0/month for Playwright, free tier for Percy
- **Scalable**: Can add more pages or upgrade Percy plan as needed

### Decision Matrix

| Your Situation                              | Recommendation                                |
| ------------------------------------------- | --------------------------------------------- |
| **Solo developer, tight budget**            | ✅ Playwright Built-in only                   |
| **Small team (2-5), occasional UI changes** | ✅ Playwright + Percy free tier               |
| **Team (5+), frequent UI changes**          | ⚠️ Playwright + Percy Pro ($99/mo)            |
| **Using Storybook already**                 | ✅ Consider Chromatic instead                 |
| **Privacy-focused, no cloud**               | ✅ Playwright Built-in or jest-image-snapshot |

**For TicketsSchool:** Start with Playwright Built-in (already configured), add Percy.io only if team reviews become bottleneck.

---

## Appendix: Quick Reference

### Playwright Commands

```bash
# Run visual tests
npx playwright test tests/visual/

# Update baselines
npx playwright test tests/visual/ --update-snapshots

# Run specific test
npx playwright test tests/visual/critical-pages.visual.spec.ts -g "Homepage"

# Debug mode
npx playwright test tests/visual/ --debug

# Show report
npx playwright show-report
```

### Percy Commands

```bash
# Run with Percy
npx percy exec -- npx playwright test tests/visual/percy-critical.spec.ts

# Percy CLI help
npx percy --help

# Percy build info
npx percy build:info
```

### Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:visual": "playwright test tests/visual/",
    "test:visual:update": "playwright test tests/visual/ --update-snapshots",
    "test:percy": "percy exec -- playwright test tests/visual/percy-critical.spec.ts"
  }
}
```

---

**Last Updated:** 2026-01-12
**Author:** AI Development Team
**Project:** TicketsSchool Visual Regression Testing
**Version:** 1.0

# CI/CD Pipeline Documentation

## Overview

TicketCap uses GitHub Actions for continuous integration and continuous deployment. This document describes the automated workflows, quality gates, and deployment processes.

## Table of Contents

- [Automated Workflows](#automated-workflows)
- [Branch Protection Rules](#branch-protection-rules)
- [Quality Gates](#quality-gates)
- [Viewing Test Results](#viewing-test-results)
- [Fixing Failed CI Runs](#fixing-failed-ci-runs)
- [Notification Setup](#notification-setup)
- [Best Practices](#best-practices)

---

## Automated Workflows

### 1. PR Quality Checks (`.github/workflows/pr-checks.yml`)

**Triggers:**
- Pull requests to `main` branch
- Pull requests to `development` branch

**What it does:**
1. **Type Checking** - Ensures TypeScript types are valid (`npx tsc --noEmit`)
2. **Linting** - Checks code style with ESLint (`npm run lint`)
3. **P0 Critical Tests** - Runs all priority-0 test suites:
   - Authentication tests
   - School management tests
   - Event management tests
   - Public registration tests
   - Admin registration tests
   - Multi-tenant isolation tests
   - Edge cases tests
   - UI/UX tests
   - Performance tests
   - Table management tests

**Runtime:** ~8-10 minutes

**Artifacts uploaded on failure:**
- `playwright-report/` - HTML test report
- `test-results/` - Raw test results
- `screenshots/` - Failure screenshots

**Status checks required for merge:**
- ✅ Type check must pass
- ✅ Lint check must pass
- ✅ All P0 tests must pass

### 2. Nightly Full Test Suite (`.github/workflows/nightly-tests.yml`)

**Triggers:**
- Scheduled: Daily at 2:00 AM UTC
- Manual: Can be triggered via GitHub Actions UI

**What it does:**
1. Runs **ALL** tests (not just P0) across all browsers:
   - Desktop Chrome
   - Mobile Chrome (Pixel 5)
   - Mobile Safari (iPhone 12)
2. Generates comprehensive test reports
3. Creates aggregated summary of all test runs
4. Sends notifications on failure (placeholder - see [Notification Setup](#notification-setup))

**Runtime:** ~20-30 minutes

**Artifacts uploaded:**
- Test results for each browser (retained for 30 days)
- Combined test summary
- HTML reports for each browser

**Why nightly?**
- Catches regressions not covered by P0 tests
- Verifies mobile browser compatibility
- Tests performance under different conditions
- Maintains high quality bar without slowing down PR velocity

---

## Branch Protection Rules

### Configuration Steps (Requires Repository Admin Access)

1. **Navigate to GitHub repository**
   - Go to: `Settings → Branches → Branch protection rules`

2. **Add rule for `main` branch:**

   **Branch name pattern:** `main`

   ✅ **Required settings:**
   - [x] Require a pull request before merging
     - [x] Require approvals: 1
     - [x] Dismiss stale pull request approvals when new commits are pushed
   - [x] Require status checks to pass before merging
     - [x] Require branches to be up to date before merging
     - **Required status checks:**
       - `quality-gates / Type check`
       - `quality-gates / Lint check`
       - `quality-gates / Run P0 Critical Tests`
   - [x] Require conversation resolution before merging
   - [x] Require linear history (optional but recommended)
   - [x] Do not allow bypassing the above settings

   ❌ **Do NOT enable:**
   - [ ] ~~Require deployments to succeed~~ (not needed for `main`)
   - [ ] ~~Lock branch~~ (prevents all pushes)

3. **Add rule for `development` branch:**

   **Branch name pattern:** `development`

   Same settings as `main` but:
   - Require approvals: 0 (optional - allows self-merge for rapid development)
   - All other required status checks: same as `main`

### What This Protects Against

- **Code without tests** - Can't merge if tests fail
- **Type errors** - TypeScript compilation must succeed
- **Linting violations** - Code must follow style guide
- **Multi-tenant data leaks** - Isolation tests must pass
- **Race conditions** - Atomic capacity tests must pass
- **Breaking changes** - All existing tests must continue passing

---

## Quality Gates

### Pre-Merge Quality Gates (Enforced by CI)

| Gate | Tool | Command | Blocks Merge? |
|------|------|---------|---------------|
| **Type Safety** | TypeScript | `npx tsc --noEmit` | ✅ Yes |
| **Code Style** | ESLint | `npm run lint` | ✅ Yes |
| **P0 Tests** | Playwright | `npx playwright test tests/suites/*-p0.spec.ts` | ✅ Yes |

### Post-Merge Quality Monitoring (Nightly)

| Gate | Tool | Command | Alerts On Failure? |
|------|------|---------|-------------------|
| **Full Test Suite** | Playwright | `npm test` | ✅ Yes |
| **Cross-Browser** | Playwright | All browser projects | ✅ Yes |
| **Mobile Compat** | Playwright | Mobile Chrome + Safari | ✅ Yes |

### Developer Quality Checklist (Not Enforced by CI)

Before creating a PR, developers should run:

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Full test suite
npm test

# 4. Mobile tests (if UI changes)
npm run test:mobile

# 5. Build check (optional but recommended)
npm run build
```

**Expected runtime:** ~5-7 minutes for full suite

---

## Viewing Test Results

### Option 1: GitHub Actions UI

1. Go to your PR
2. Scroll to "Checks" section at bottom
3. Click "Details" next to failed check
4. View logs and error messages

### Option 2: Download Artifacts

1. Go to: `Actions → [Workflow Run]`
2. Scroll to "Artifacts" section
3. Download:
   - `playwright-report-18.x` - Full HTML report
   - `test-artifacts-18.x` - Screenshots and traces (if tests failed)

### Option 3: Local HTML Report

After running tests locally:

```bash
npm test

# Open report in browser
npx playwright show-report
```

### Understanding Test Failures

**Example failure log:**

```
Error: expect(locator).toBeVisible()

Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for locator('text=Dashboard')
  - locator resolved to hidden
  - unexpected value "hidden"
```

**What this means:**
- Test expected "Dashboard" text to be visible
- Element exists but is hidden (CSS `display: none` or `visibility: hidden`)
- Timeout: waited 10 seconds before failing

**Common fixes:**
1. Check if element renders conditionally (loading state?)
2. Verify authentication/authorization is working
3. Check if CSS is hiding the element
4. Look at screenshot in artifacts to see actual page state

---

## Fixing Failed CI Runs

### Type Check Failures

**Error example:**
```
src/app/api/events/route.ts:42:15 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

**Fix:**
1. Add type guard: `if (!value) throw new Error('Value required')`
2. Use optional chaining: `value?.method()`
3. Add type assertion (only if you're certain): `value as string`

**Verify fix:**
```bash
npx tsc --noEmit
```

### Lint Failures

**Error example:**
```
/app/api/events/route.ts
  42:15  error  'admin' is assigned a value but never used  @typescript-eslint/no-unused-vars
```

**Fix:**
1. Remove unused variable
2. Prefix with underscore if intentionally unused: `_admin`
3. Use the variable (if it should be used)

**Verify fix:**
```bash
npm run lint
npm run lint:fix  # Auto-fix many issues
```

### Test Failures

**Common scenarios:**

#### 1. Test works locally but fails in CI

**Possible causes:**
- Timing issues (CI is slower)
- Environment differences (ports, URLs)
- Database state not cleaned up

**Fixes:**
- Increase timeouts in `playwright.config.ts`
- Use `await page.waitForLoadState('networkidle')`
- Ensure `test.afterAll()` cleanup is working

#### 2. Intermittent failures (flaky tests)

**Signs:**
- Test passes on retry
- Fails ~20-30% of the time
- Different failures each time

**Fixes:**
```typescript
// BAD: Race condition
await page.click('button')
expect(page.locator('.result')).toBeVisible()

// GOOD: Wait for state change
await page.click('button')
await page.waitForSelector('.result', { state: 'visible' })
expect(page.locator('.result')).toBeVisible()
```

#### 3. Multi-tenant isolation test failures

**This is CRITICAL - never bypass these failures!**

**Error example:**
```
Error: Expected school1 admin to see 1 event, but saw 2 events
```

**What this means:**
- Data from another school is leaking
- This is a SECURITY VULNERABILITY

**Fix process:**
1. Review the query in the API endpoint
2. Ensure `where: { schoolId: admin.schoolId }` is present
3. Check for SUPER_ADMIN bypass logic
4. Verify test cleanup isn't interfering

**Example fix:**
```typescript
// WRONG - Missing schoolId filter
const events = await prisma.event.findMany()

// CORRECT - Enforces isolation
const events = await prisma.event.findMany({
  where: { schoolId: admin.schoolId }
})
```

### Re-running Failed Checks

**Option 1: Push new commit**
```bash
git add .
git commit -m "fix: resolve type errors"
git push
```
CI will automatically re-run.

**Option 2: Re-run from GitHub UI**
1. Go to "Checks" tab in PR
2. Click "Re-run jobs" button
3. Select "Re-run failed jobs" or "Re-run all jobs"

---

## Notification Setup

### Slack Notifications (Coming Soon)

**To implement:**

1. **Create Slack App:**
   - Go to: https://api.slack.com/apps
   - Create new app
   - Add "Incoming Webhooks" feature
   - Copy webhook URL

2. **Add GitHub Secret:**
   - Go to: `Repository Settings → Secrets → Actions`
   - Add secret: `SLACK_WEBHOOK_URL`

3. **Update workflow file:**

Replace the placeholder step in `nightly-tests.yml`:

```yaml
- name: Notify on failure (placeholder)
  if: failure()
  run: |
    echo "🚨 Nightly tests failed"
```

With actual notification:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "🚨 Nightly Test Failure",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Nightly Test Suite Failed*\n\n*Browser:* ${{ matrix.browser }}\n*Node:* ${{ matrix.node-version }}\n\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Details>"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

### Email Notifications

**Option 1: GitHub built-in**
- Go to: `Watch → Custom → Actions`
- Enable: "Notify me when a workflow run fails"

**Option 2: Custom email action**

Add to workflow:

```yaml
- name: Send email on failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: Nightly Tests Failed - ${{ matrix.browser }}
    to: dev-team@yourdomain.com
    from: CI/CD <noreply@yourdomain.com>
    body: |
      Nightly test suite failed for ${{ matrix.browser }}.

      View details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

---

## Best Practices

### For Developers

1. **Run tests locally before pushing**
   ```bash
   npm test  # Must pass before creating PR
   ```

2. **Keep PRs small**
   - Easier to review
   - Faster CI runs
   - Easier to debug failures

3. **Write tests as you code**
   - Don't wait until the end
   - TDD approach recommended
   - Update tests when changing behavior

4. **Don't bypass CI checks**
   - Never ask admin to force-merge
   - Fix the underlying issue
   - CI exists to protect production

5. **Monitor nightly test results**
   - Check Slack/email notifications
   - Fix failures within 24 hours
   - Don't let test debt accumulate

### For Reviewers

1. **Check CI status before reviewing code**
   - Don't waste time reviewing if tests fail
   - Ask author to fix CI first

2. **Verify test coverage**
   - New features must have tests
   - Bug fixes must have regression tests
   - Check test quality, not just quantity

3. **Review test artifacts on failures**
   - Download screenshots
   - Look at actual error messages
   - Verify the fix addresses root cause

4. **Don't approve PRs with failing tests**
   - Even if "it works on my machine"
   - CI failures indicate real issues
   - Flaky tests must be fixed, not ignored

### For Repository Admins

1. **Never disable branch protection**
   - Not even "temporarily"
   - If you need to force-merge, there's a deeper problem

2. **Monitor CI performance**
   - Keep runs under 10 minutes for PR checks
   - Optimize slow tests
   - Consider parallelization if needed

3. **Review and update workflows quarterly**
   - Update dependencies (actions/checkout@v4, etc.)
   - Add new test categories as app grows
   - Remove obsolete checks

4. **Maintain artifact retention policy**
   - PR checks: 7 days retention
   - Nightly tests: 30 days retention
   - Adjust based on storage costs

---

## Troubleshooting

### "CI is stuck/hanging"

**Symptoms:**
- Workflow shows "In progress" for >30 minutes
- No logs being generated

**Fixes:**
1. Cancel the run (Actions UI → "Cancel workflow")
2. Check if dev server is starting (look at logs)
3. Verify `wait-on` is waiting for correct URL
4. Re-run the workflow

### "Can't reproduce CI failure locally"

**Differences between local and CI:**

| Aspect | Local | CI |
|--------|-------|-----|
| Database | Docker PostgreSQL | GitHub hosted PostgreSQL |
| Port | 9000 | 9000 |
| Node version | Varies | 18.x (fixed) |
| Test parallelism | Unlimited workers | 1 worker |
| Retries | 0 | 2 |

**To replicate CI environment:**
```bash
# Use CI-like settings
CI=true npm test
```

### "Tests pass individually but fail in suite"

**Cause:** Test pollution (tests affecting each other)

**Diagnosis:**
```bash
# Run specific test
npx playwright test -g "specific test name"

# Run tests in order
npx playwright test --workers=1
```

**Fix:**
- Improve test cleanup in `test.afterAll()`
- Use unique test data (timestamps, UUIDs)
- Check for global state mutations

---

## Metrics and Monitoring

### Key Metrics to Track

1. **CI Success Rate**
   - Target: >95% first-time pass rate
   - If below 90%: investigate flaky tests

2. **Average CI Runtime**
   - Target: <10 minutes for PR checks
   - If >15 minutes: optimize tests or infrastructure

3. **Test Coverage**
   - Current: 65/780 tests (8%)
   - P0 Coverage: 65/275 (24%)
   - Target: 100% P0 coverage, 80% overall

4. **Mean Time to Fix (MTTF)**
   - Target: <2 hours for CI failures
   - If >24 hours: improve debugging docs

### Viewing Metrics

**GitHub Insights:**
- Go to: `Insights → Actions`
- View: Workflow runs, success rate, duration

**Manual tracking:**
```bash
# Count recent CI runs
gh run list --workflow=pr-checks.yml --limit 100

# Check success rate
gh run list --workflow=pr-checks.yml --limit 100 --json conclusion | jq '[.[] | select(.conclusion=="success")] | length'
```

---

## Migration Guide (For New Projects)

To implement this CI/CD setup in a new project:

1. **Copy workflow files:**
   ```bash
   cp -r .github /path/to/new-project/
   ```

2. **Update environment variables in workflows:**
   - Change database credentials
   - Update app URLs
   - Adjust test paths if different structure

3. **Configure branch protection** (see [Branch Protection Rules](#branch-protection-rules))

4. **Set up notifications** (see [Notification Setup](#notification-setup))

5. **Run initial test:**
   ```bash
   # Create a test PR to verify CI works
   git checkout -b test-ci-setup
   git commit --allow-empty -m "test: verify CI pipeline"
   git push
   ```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [TicketCap Testing Guide](/tests/README.md)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

## Support

**Questions about CI/CD?**
- Check this documentation first
- Review existing workflow runs for examples
- Ask in team Slack channel
- Create issue with `ci/cd` label

**Found a bug in CI/CD setup?**
- Document in `/docs/bugs/bugs.md`
- Create PR with fix
- Update this documentation if needed

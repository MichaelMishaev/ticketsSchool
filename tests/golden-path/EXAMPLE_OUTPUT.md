# Golden Path Canary - Example Outputs

This file shows what successful and failed canary runs look like.

---

## Successful Canary Run (Production Healthy)

### Console Output

```bash
$ npm run test:canary

> ticketcap@0.1.0 test:canary
> playwright test tests/golden-path/


Running 8 tests using 1 worker

  ✓  1 [chromium] › registration-canary.spec.ts:21:7 › public registration page loads with form visible (234ms)
✅ PUBLIC REGISTRATION: Page loaded successfully with all required fields

  ✓  2 [chromium] › registration-canary.spec.ts:49:7 › event page responds within acceptable time (156ms)
✅ PUBLIC REGISTRATION: Page loaded in 156ms

  ✓  3 [chromium] › registration-canary.spec.ts:69:7 › page contains event registration elements (89ms)
✅ PUBLIC REGISTRATION: Page structure is valid

  ✓  4 [chromium] › admin-canary.spec.ts:34:7 › admin login page loads successfully (123ms)
✅ ADMIN LOGIN PAGE: Loaded in 123ms

  ✓  5 [chromium] › admin-canary.spec.ts:55:7 › canary admin can authenticate successfully (456ms)
✅ ADMIN LOGIN: Authenticated in 456ms

  ✓  6 [chromium] › admin-canary.spec.ts:83:7 › admin dashboard loads after login (678ms)
✅ ADMIN DASHBOARD: Loaded successfully with authenticated session

  ✓  7 [chromium] › admin-canary.spec.ts:105:7 › complete admin golden path completes in <5 seconds (1234ms)
✅ ADMIN GOLDEN PATH: Complete flow took 1234ms

  ✓  8 [chromium] › admin-canary.spec.ts:140:7 › admin session persists across page navigation (345ms)
✅ ADMIN SESSION: Persists across navigation


  8 passed (3.8s)
```

### GitHub Actions Output

```
Run npm ci
✓ Dependencies installed

Run npx playwright install --with-deps chromium
✓ Playwright browsers installed

Run canary tests
🚀 Starting Golden Path Canary Tests against: https://ticketcap.railway.app

Running 8 tests using 1 worker
  ✓ 8 passed (3.8s)

✅ Golden Path Canary: All tests passed
```

**Result:** ✅ Green checkmark in GitHub Actions

---

## Failed Canary Run (Production Down)

### Scenario 1: Database Connection Lost

```bash
$ npm run test:canary

> ticketcap@0.1.0 test:canary
> playwright test tests/golden-path/


Running 8 tests using 1 worker

  ✓  1 [chromium] › registration-canary.spec.ts:21:7 › public registration page loads with form visible (234ms)
✅ PUBLIC REGISTRATION: Page loaded successfully with all required fields

  ✓  2 [chromium] › registration-canary.spec.ts:49:7 › event page responds within acceptable time (156ms)
✅ PUBLIC REGISTRATION: Page loaded in 156ms

  ✓  3 [chromium] › registration-canary.spec.ts:69:7 › page contains event registration elements (89ms)
✅ PUBLIC REGISTRATION: Page structure is valid

  ✓  4 [chromium] › admin-canary.spec.ts:34:7 › admin login page loads successfully (123ms)
✅ ADMIN LOGIN PAGE: Loaded in 123ms

  ✘  5 [chromium] › admin-canary.spec.ts:55:7 › canary admin can authenticate successfully (3456ms)

    Error: page.waitForURL: Timeout 3000ms exceeded.
    =========================== logs ===========================
    waiting for navigation to "/admin" to be finished
    ============================================================

      62 |     // Wait for redirect to admin dashboard
      63 |     await page.waitForURL(/\/admin/, { timeout: 3000 })
         |                    ^
      64 |
      65 |     const loginTime = Date.now() - loginStartTime

    at /Users/.../tests/golden-path/admin-canary.spec.ts:63:20


  5 failed
  3 passed (12.3s)
```

### Scenario 2: Complete Production Outage

```bash
$ npm run test:canary

> ticketcap@0.1.0 test:canary
> playwright test tests/golden-path/


Running 8 tests using 1 worker

  ✘  1 [chromium] › registration-canary.spec.ts:21:7 › public registration page loads with form visible (4012ms)

    Error: page.goto: net::ERR_CONNECTION_REFUSED at https://ticketcap.railway.app/p/test-school/test-event
    Call log:
      - navigating to "https://ticketcap.railway.app/p/test-school/test-event", waiting until "domcontentloaded"

      24 |     const response = await page.goto('/p/test-school/test-event', {
         |                                 ^
      25 |       waitUntil: 'domcontentloaded',
      26 |       timeout: 4000

    at /Users/.../tests/golden-path/registration-canary.spec.ts:24:33


  ✘  2 [chromium] › registration-canary.spec.ts:49:7 › event page responds within acceptable time (4023ms)

    Error: ❌ PRODUCTION DOWN - Page took 4023ms (>4000ms timeout)


  ✘  3 [chromium] › registration-canary.spec.ts:69:7 › page contains event registration elements (4015ms)

    Error: page.goto: net::ERR_CONNECTION_REFUSED


  ✘  4 [chromium] › admin-canary.spec.ts:34:7 › admin login page loads successfully (3012ms)

    Error: page.goto: net::ERR_CONNECTION_REFUSED at https://ticketcap.railway.app/admin/login


  ✘  5 [chromium] › admin-canary.spec.ts:55:7 › canary admin can authenticate successfully (SKIPPED)
  ✘  6 [chromium] › admin-canary.spec.ts:83:7 › admin dashboard loads after login (SKIPPED)
  ✘  7 [chromium] › admin-canary.spec.ts:105:7 › complete admin golden path completes in <5 seconds (SKIPPED)
  ✘  8 [chromium] › admin-canary.spec.ts:140:7 › admin session persists across page navigation (SKIPPED)


  8 failed
    4 [chromium] › registration-canary.spec.ts:21:7 › public registration page loads
    4 [chromium] › registration-canary.spec.ts:49:7 › event page responds
    4 [chromium] › registration-canary.spec.ts:69:7 › page contains elements
    4 [chromium] › admin-canary.spec.ts:34:7 › admin login page loads
  4 skipped (15.2s)
```

### GitHub Actions Output (with Retries)

```
Run canary tests
🚀 Starting Golden Path Canary Tests against: https://ticketcap.railway.app

Attempt 1:
Running 8 tests using 1 worker
  ✘ 8 failed (15.2s)

⚠️  First attempt failed. Retrying in 30 seconds...

[30 second delay]

Attempt 2:
Running 8 tests using 1 worker
  ✘ 8 failed (15.1s)

⚠️  Second attempt failed. Final retry in 30 seconds...

[30 second delay]

Attempt 3:
Running 8 tests using 1 worker
  ✘ 8 failed (15.3s)

🚨 PRODUCTION DOWN - Golden Path Canary FAILED after 3 attempts

Error: Process completed with exit code 1.
```

**Result:** ❌ Red X in GitHub Actions

**Artifacts Uploaded:**
- `canary-failure-report-123` (HTML test report)
- `canary-screenshots-123` (PNG screenshots)
- `canary-traces-123` (Playwright trace files)

---

## Canary Run with Transient Network Issue (Eventually Passes)

```bash
Run canary tests
🚀 Starting Golden Path Canary Tests against: https://ticketcap.railway.app

Attempt 1:
Running 8 tests using 1 worker
  ✘ 2 failed (timeout on admin tests)
  ✓ 6 passed

⚠️  First attempt failed. Retrying in 30 seconds...

[30 second delay]

Attempt 2:
Running 8 tests using 1 worker
  ✓ 8 passed (4.1s)

✅ Golden Path Canary: All tests passed
```

**Result:** ✅ Green checkmark (retry successful)

**Note:** This is why retry logic is important - prevents false positives from transient issues.

---

## GitHub Actions Alert (Slack Notification Example)

When Slack integration is enabled and tests fail:

```
📱 Slack Message in #production-alerts

🚨 PRODUCTION DOWN - Golden Path Canary FAILED

Repository: yourcompany/ticketcap
Run Number: 456
Production URL: https://ticketcap.railway.app
Failed At: Dec 18, 2025 at 3:00 PM

[View Workflow Run] (button)
```

---

## Example Test Artifacts

### Screenshot (Failure Point)

**Filename:** `test-results/admin-canary-authenticate/test-failed-1.png`

**Content:** Screenshot of error page or timeout state

### Trace File (Playwright Trace Viewer)

**Filename:** `test-results/admin-canary-authenticate/trace.zip`

**How to view:**
```bash
# Download from GitHub Actions artifacts
npx playwright show-trace trace.zip
```

**Shows:**
- Timeline of all actions
- Screenshots at each step
- Network requests
- Console logs
- DOM snapshots

---

## Performance Comparison

### Fast Production (Healthy)

```
Test                                    Duration
─────────────────────────────────────────────────
Public page loads                       234ms
Event page responds                     156ms
Page contains elements                   89ms
Admin login page loads                  123ms
Admin authenticates                     456ms
Dashboard loads                         678ms
Complete golden path                   1234ms
Session persists                        345ms
─────────────────────────────────────────────────
TOTAL                                  3.8s ✅
```

### Slow Production (Degraded)

```
Test                                    Duration
─────────────────────────────────────────────────
Public page loads                      1234ms ⚠️
Event page responds                     956ms
Page contains elements                  789ms
Admin login page loads                 1023ms ⚠️
Admin authenticates                    2456ms ⚠️
Dashboard loads                        2678ms ⚠️
Complete golden path                   4891ms ⚠️ (close to 5s limit)
Session persists                       1345ms ⚠️
─────────────────────────────────────────────────
TOTAL                                 15.4s ⚠️ (tests passing but slow)
```

**Action:** If you see this pattern, investigate performance degradation before it becomes an outage.

### Down Production (Failed)

```
Test                                    Duration
─────────────────────────────────────────────────
Public page loads                      4000ms ✘ (timeout)
Event page responds                    4000ms ✘ (timeout)
Page contains elements                 4000ms ✘ (timeout)
Admin login page loads                 3000ms ✘ (timeout)
Admin authenticates                       0ms ⊘ (skipped)
Dashboard loads                           0ms ⊘ (skipped)
Complete golden path                      0ms ⊘ (skipped)
Session persists                          0ms ⊘ (skipped)
─────────────────────────────────────────────────
TOTAL                                 15.0s ✘ FAILED
```

**Action:** Immediate incident response required.

---

## Viewing Results in GitHub Actions

### Successful Run

```
Actions → Golden Path Canary → Run #456

✅ Run canary tests
   Completed in 2m 15s

No artifacts uploaded (tests passed)
```

### Failed Run

```
Actions → Golden Path Canary → Run #457

✘ Run canary tests
   Failed in 3m 45s

Artifacts (3):
┌─────────────────────────────────────────────────┐
│ 📦 canary-failure-report-457 (2.3 MB)         │
│ 📦 canary-screenshots-457 (456 KB)            │
│ 📦 canary-traces-457 (1.1 MB)                 │
└─────────────────────────────────────────────────┘

Error:
🚨 PRODUCTION DOWN - Golden Path Canary FAILED
Tests failed after 3 retry attempts
Check uploaded artifacts for screenshots and traces
Production URL: https://ticketcap.railway.app
Run number: 457
```

---

## Summary

### Green (Healthy Production)
- All tests pass in <5 seconds
- No errors in logs
- All console output shows ✅

### Yellow (Degraded Production)
- Tests pass but slow (>3 seconds)
- Warnings in console output (⚠️)
- Response times increasing

### Red (Down Production)
- Tests fail after 3 retries
- Connection errors or timeouts
- Artifacts uploaded for debugging

---

**This example output shows exactly what to expect from the Golden Path Canary system in various scenarios.**

# Golden Path Canary - Production Deployment Checklist

Use this checklist when deploying the Golden Path Canary system to production.

---

## Pre-Deployment Checklist

### 1. Verify Files Exist

- [ ] `/tests/golden-path/registration-canary.spec.ts` exists
- [ ] `/tests/golden-path/admin-canary.spec.ts` exists
- [ ] `/.github/workflows/golden-path-canary.yml` exists
- [ ] `/docs/infrastructure/golden-path-canary-setup.md` exists
- [ ] `npm run test:canary` command exists in package.json

### 2. Review Documentation

- [ ] Read `/docs/infrastructure/CANARY_IMPLEMENTATION_SUMMARY.md`
- [ ] Read `/docs/infrastructure/golden-path-canary-setup.md`
- [ ] Review example outputs in `/tests/golden-path/EXAMPLE_OUTPUT.md`

---

## Production Setup (15 minutes)

### Step 1: Create Canary Admin (5 min)

- [ ] Login to Railway: `railway login`
- [ ] Link to production: `railway link`
- [ ] Run school manager: `railway run npm run school`
- [ ] Create canary school:
  - School Name: `Canary Health Check`
  - School Slug: `test-school`
- [ ] Create canary admin:
  - Email: `canary@yourdomain.com`
  - Password: `[generate strong password]`
  - Role: `ADMIN`
- [ ] Save credentials securely (you'll need them for GitHub secrets)

### Step 2: Create Canary Event (5 min)

- [ ] Login to production admin UI: `https://your-domain.railway.app/admin/login`
- [ ] Use canary admin credentials
- [ ] Create new event:
  - Title: `Canary Health Check Event`
  - Slug: `test-event`
  - Date: `2030-12-31` (far in future)
  - Time: `23:59`
  - Capacity: `100`
  - Status: `Published`
- [ ] Verify event accessible: `https://your-domain.railway.app/p/test-school/test-event`

### Step 3: Configure GitHub Secrets (3 min)

- [ ] Go to GitHub repo settings: `Settings → Secrets and variables → Actions`
- [ ] Add secret: `PRODUCTION_URL`
  - Value: Your Railway production URL (e.g., `https://ticketcap.railway.app`)
- [ ] Add secret: `CANARY_ADMIN_EMAIL`
  - Value: `canary@yourdomain.com` (from Step 1)
- [ ] Add secret: `CANARY_ADMIN_PASSWORD`
  - Value: Password from Step 1
- [ ] Verify all 3 secrets are set

### Step 4: Test Manually (2 min)

- [ ] Set local environment variables:
  ```bash
  export CANARY_ADMIN_EMAIL="canary@yourdomain.com"
  export CANARY_ADMIN_PASSWORD="your-password"
  ```
- [ ] Run canary tests against production:
  ```bash
  npm run test:canary -- --base-url=https://your-domain.railway.app --project=chromium
  ```
- [ ] Verify output shows: `8 passed (3-5s)`
- [ ] If tests fail, troubleshoot before proceeding

---

## Deployment Verification

### Step 5: Enable GitHub Actions

- [ ] Verify workflow file committed to main/production branch
- [ ] Go to `Settings → Actions → General`
- [ ] Select: `Allow all actions and reusable workflows`
- [ ] Click `Save`

### Step 6: Manual Workflow Trigger

- [ ] Go to `Actions` tab in GitHub
- [ ] Click `Golden Path Canary (Production Health Check)`
- [ ] Click `Run workflow`
- [ ] Select branch: `main` or `production`
- [ ] Click `Run workflow`
- [ ] Wait for workflow to complete (~2 minutes)
- [ ] Verify result: ✅ Green checkmark (all tests passed)

### Step 7: Review First Run

- [ ] Click on completed workflow run
- [ ] Expand `Run canary tests` step
- [ ] Verify output shows all 8 tests passing
- [ ] Check for any warnings in console output
- [ ] Confirm no artifacts uploaded (only happens on failure)

---

## Post-Deployment Monitoring

### Week 1: Daily Checks

- [ ] Day 1: Check that hourly runs are executing
- [ ] Day 2: Verify pass rate is 100%
- [ ] Day 3: Review execution times (<5s)
- [ ] Day 4: Check for any retries (should be rare)
- [ ] Day 5: Monitor for false positives
- [ ] Day 6: Test manual trigger still works
- [ ] Day 7: Review workflow history

### Week 2-4: Weekly Checks

- [ ] Week 2: Review 7-day pass rate (should be >95%)
- [ ] Week 3: Check for any performance degradation
- [ ] Week 4: Verify canary admin still exists

### Monthly: System Review

- [ ] Total runs this month: ~720 (24/day × 30 days)
- [ ] Pass rate: >95%
- [ ] False positive rate: <5%
- [ ] Any undetected outages: 0
- [ ] Average execution time: <5s
- [ ] Retry rate: <5%

---

## Optional Enhancements

### Slack Notifications (1 hour)

- [ ] Create Slack incoming webhook
- [ ] Add `SLACK_WEBHOOK_URL` to GitHub secrets
- [ ] Uncomment `notify-slack` job in workflow
- [ ] Test by triggering workflow with wrong credentials
- [ ] Verify Slack message appears in channel

### Email Notifications (30 min)

- [ ] Enable GitHub Actions email notifications:
  - `Settings (personal) → Notifications → Actions`
  - `✓ Send notifications for failed workflows`
- [ ] Or add custom email action to workflow

### Performance Monitoring (future)

- [ ] Add assertions for response time trends
- [ ] Track slowest test over time
- [ ] Alert when response time >3s

---

## Troubleshooting Checklist

### If Tests Fail in GitHub Actions

- [ ] Check GitHub Actions logs for error details
- [ ] Download failure artifacts (screenshots, traces)
- [ ] Verify production is actually down (manual check)
- [ ] Check Railway status: https://status.railway.app
- [ ] Verify canary admin exists in production
- [ ] Verify canary event exists and is published
- [ ] Check GitHub secrets are correct

### If Tests Pass Locally But Fail in GitHub

- [ ] Verify `PRODUCTION_URL` secret is correct
- [ ] Check secret names match exactly (case-sensitive)
- [ ] Ensure GitHub Actions has network access to Railway
- [ ] Review retry logic in workflow logs

### If Getting False Positives

- [ ] Check retry logs for transient errors
- [ ] Verify Railway is not experiencing issues
- [ ] Consider increasing timeout (currently 5s)
- [ ] Review network latency between GitHub Actions and Railway

---

## Success Criteria

### Deployment Successful When:

✅ Canary admin account exists in production
✅ Canary event is published and accessible
✅ GitHub secrets are configured
✅ Manual test run passes (8/8 tests)
✅ First automated run passes (hourly trigger)
✅ No failures after 24 hours of monitoring
✅ Team knows how to view results in GitHub Actions

### Monitoring Successful When:

✅ Hourly runs execute automatically
✅ Pass rate >95% after 1 week
✅ No undetected outages
✅ Team can interpret test results
✅ Alerts configured (email/Slack)

---

## Rollback Plan

### If Canary Causes Issues

**Disable workflow:**
```bash
# Option 1: Rename workflow file
mv .github/workflows/golden-path-canary.yml .github/workflows/golden-path-canary.yml.disabled

# Option 2: Delete workflow file
rm .github/workflows/golden-path-canary.yml

# Commit and push
git add .github/workflows/
git commit -m "Disable golden path canary workflow"
git push
```

**Remove from GitHub:**
```
Actions → Golden Path Canary → ⋯ (three dots) → Disable workflow
```

**Cleanup (optional):**
- [ ] Delete canary admin from production
- [ ] Delete canary event
- [ ] Delete GitHub secrets
- [ ] Remove `test:canary` script from package.json

---

## Documentation Reference

**Setup Guide:** `/docs/infrastructure/golden-path-canary-setup.md`
**Overview:** `/docs/infrastructure/golden-path-canary-overview.md`
**Summary:** `/docs/infrastructure/CANARY_IMPLEMENTATION_SUMMARY.md`
**Test Docs:** `/tests/golden-path/README.md`
**Examples:** `/tests/golden-path/EXAMPLE_OUTPUT.md`

---

## Sign-Off

**Deployment completed by:** _________________________

**Date:** _________________________

**Production URL:** _________________________

**Canary admin email:** _________________________

**First successful run:** _________________________

**Notes:**
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________

---

**Status:** 
- [ ] Pre-deployment checks complete
- [ ] Production setup complete
- [ ] Deployment verification complete
- [ ] Post-deployment monitoring started
- [ ] Team trained on viewing results
- [ ] Alerts configured

**Deployment Status:** ☐ In Progress  ☐ Complete  ☐ Blocked

**Next Review Date:** _________________________

# Golden Path Canary - Setup Guide

## Issue Summary

The Golden Path Canary tests are failing due to **missing GitHub repository secrets**. This guide will help you configure them properly.

---

## Current Status

❌ **FAILING** - Missing configuration:
- `CANARY_ADMIN_EMAIL` - Not set
- `CANARY_ADMIN_PASSWORD` - Not set
- `PRODUCTION_URL` - Using placeholder value

---

## Fix Instructions

### Step 1: Create a Canary Admin Account in Production

1. **Go to your production site:**
   ```
   https://kartis.info/admin/signup
   ```

2. **Create a dedicated "canary" admin account:**
   - Email: `canary@yourdomain.com` (or any email you control)
   - Password: Generate a strong password (you'll use this in GitHub secrets)
   - School name: "Canary Test School"
   - School slug: "test-school"

3. **Verify the email** (check your inbox and click verification link)

4. **Login and create a test event** (required for public registration tests):
   - Go to: https://kartis.info/admin/events/new
   - Event title: "Test Event"
   - Event slug: "test-event"
   - Capacity: 10
   - Save the event

### Step 2: Configure GitHub Repository Secrets

1. **Go to your GitHub repository:**
   ```
   https://github.com/MichaelMishaev/ticketsSchool/settings/secrets/actions
   ```

2. **Add these 3 secrets** (click "New repository secret"):

   **Secret 1: `PRODUCTION_URL`**
   ```
   Name: PRODUCTION_URL
   Value: https://kartis.info
   ```

   **Secret 2: `CANARY_ADMIN_EMAIL`**
   ```
   Name: CANARY_ADMIN_EMAIL
   Value: canary@yourdomain.com
   ```
   _(Use the email you created in Step 1)_

   **Secret 3: `CANARY_ADMIN_PASSWORD`**
   ```
   Name: CANARY_ADMIN_PASSWORD
   Value: <your-canary-password>
   ```
   _(Use the password you created in Step 1)_

### Step 3: Test the Configuration

1. **Manually trigger the workflow:**
   ```
   https://github.com/MichaelMishaev/ticketsSchool/actions/workflows/golden-path-canary.yml
   ```

2. **Click "Run workflow" → "Run workflow"**

3. **Wait ~2 minutes and verify all tests pass** ✅

---

## What These Tests Do

The Golden Path Canary runs **hourly** to detect production outages:

### Admin Tests (5 tests)
1. ✅ Admin login page loads successfully
2. ✅ Canary admin can authenticate
3. ✅ Admin dashboard loads after login
4. ✅ Complete flow completes in <5 seconds
5. ✅ Session persists across navigation

### Public Registration Tests (3 tests)
1. ✅ Public registration page loads
2. ✅ Page responds within acceptable time (<3s)
3. ✅ Page contains required form elements

**Total:** 8 critical tests that must pass every hour

---

## Expected Results

Once configured correctly, you should see:

```
✅ ADMIN LOGIN PAGE: Loaded in <500ms
✅ ADMIN LOGIN: Authenticated in <1000ms
✅ ADMIN DASHBOARD: Loaded successfully with authenticated session
✅ ADMIN GOLDEN PATH: Complete flow took <3000ms
✅ ADMIN SESSION: Persists across navigation
✅ PUBLIC REGISTRATION: Page loaded successfully with all required fields
✅ PUBLIC REGISTRATION: Page loaded in <2000ms
✅ PUBLIC REGISTRATION: Page structure is valid

Golden Path Canary: All tests passed
```

---

## Troubleshooting

### Tests still failing after adding secrets?

**Check 1: Verify secrets are set correctly**
```bash
# Go to Actions → Click on a failed run → Check the "Run Golden Path Canary Tests" step
# You should see:
🚀 Starting Golden Path Canary Tests against: https://kartis.info
# (NOT "https://your-production-url.railway.app")
```

**Check 2: Verify canary account works**
```bash
# Try logging in manually:
https://kartis.info/admin/login
# Email: canary@yourdomain.com
# Password: <your-canary-password>
```

**Check 3: Verify test event exists**
```bash
# Visit the public registration page:
https://kartis.info/p/test-school/test-event
# Should show registration form (not 404)
```

### Error: "❌ CANARY CONFIG ERROR"

This means GitHub secrets are not set. Double-check:
1. Secret names are EXACT (case-sensitive):
   - `PRODUCTION_URL` (not `production_url`)
   - `CANARY_ADMIN_EMAIL` (not `CANARY_EMAIL`)
   - `CANARY_ADMIN_PASSWORD` (not `CANARY_PASSWORD`)
2. No extra spaces in values
3. You saved the secrets (clicked "Add secret" button)

### Error: "❌ PRODUCTION DOWN - Page took >4000ms"

Your production server is slow or down:
1. Check Railway deployment: `railway status`
2. Check Railway logs: `railway logs`
3. Verify health endpoint: `curl https://kartis.info/api/health`

### Tests timeout after 5 seconds

Your production is too slow. Optimize:
1. Check Railway metrics (CPU, memory)
2. Upgrade Railway plan if needed
3. Optimize slow database queries

---

## Monitoring

Once configured, you'll get **automatic alerts** if production goes down:

- ⏰ **Runs:** Every hour (24 times per day)
- 📊 **Coverage:** Admin login + public registration
- 🔄 **Retries:** 3 attempts with 30s delays (handles transient issues)
- 📁 **Artifacts:** Screenshots and traces saved on failure
- ⚠️ **Alerts:** GitHub Actions notifications on failure

**View workflow runs:**
```
https://github.com/MichaelMishaev/ticketsSchool/actions/workflows/golden-path-canary.yml
```

---

## Security Notes

- The canary account should have **minimal permissions** (read-only would be ideal)
- Use a **unique password** (not your personal admin password)
- Consider using a **disposable email** (e.g., canary+test@yourdomain.com)
- **Never commit** these credentials to the repository (they're encrypted in GitHub Secrets)

---

## Quick Setup Checklist

- [ ] Create canary admin account at https://kartis.info/admin/signup
- [ ] Verify email
- [ ] Login and create test event (slug: "test-event")
- [ ] Add `PRODUCTION_URL` secret in GitHub
- [ ] Add `CANARY_ADMIN_EMAIL` secret in GitHub
- [ ] Add `CANARY_ADMIN_PASSWORD` secret in GitHub
- [ ] Manually trigger workflow to test
- [ ] Verify all 8 tests pass ✅

---

**Need Help?**
- Check workflow logs: https://github.com/MichaelMishaev/ticketsSchool/actions
- Verify secrets: https://github.com/MichaelMishaev/ticketsSchool/settings/secrets/actions
- Test production: https://kartis.info/api/health

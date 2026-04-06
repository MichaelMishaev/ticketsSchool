# Canary Test Account - Quick Setup Guide

## ✅ Step 1: Credentials Stored Securely (DONE)

I've saved your canary credentials in `.env.canary` (git-ignored):
- Email: `345287info@gmail.com`
- Password: `Jtbdtjtb6262`
- School slug: `testcanary`

**⚠️ This file is protected by .gitignore and will NEVER be committed to git.**

---

## 🔧 Step 2: Complete Account Setup

### A. Verify Email (REQUIRED)

1. **Check your email inbox:** `345287info@gmail.com`
2. **Look for email from:** kartis.info / noreply@kartis.com
3. **Click the verification link**
4. **You should see:** "אימייל אומת בהצלחה" (Email verified successfully)

### B. Login to Production

1. Go to: https://kartis.info/admin/login
2. Email: `345287info@gmail.com`
3. Password: `Jtbdtjtb6262`
4. **You should reach the admin dashboard**

### C. Create Test Event (For Public Registration Tests)

Once logged in:

1. **Go to Events:** https://kartis.info/admin/events/new
2. **Fill in:**
   - שם האירוע (Event Title): "Canary Test Event"
   - Slug: `test-event`
   - תיאור (Description): "Automated test event - do not delete"
   - Capacity: `10`
   - תאריך (Date): Any future date
3. **Click "צור אירוע" (Create Event)**
4. **Verify public page works:** https://kartis.info/p/testcanary/test-event

---

## 🔐 Step 3: Add GitHub Repository Secrets

### Go to GitHub Secrets:
```
https://github.com/MichaelMishaev/ticketsSchool/settings/secrets/actions
```

### Add These 3 Secrets:

Click "New repository secret" for each:

**Secret 1:**
```
Name: PRODUCTION_URL
Value: https://kartis.info
```

**Secret 2:**
```
Name: CANARY_ADMIN_EMAIL
Value: 345287info@gmail.com
```

**Secret 3:**
```
Name: CANARY_ADMIN_PASSWORD
Value: Jtbdtjtb6262
```

**⚠️ Important:**
- Copy-paste the values EXACTLY (no extra spaces)
- Secret names are CASE-SENSITIVE
- Click "Add secret" to save each one

---

## ✅ Step 4: Test the Canary Workflow

### Option A: Manual Trigger (Recommended)

1. Go to: https://github.com/MichaelMishaev/ticketsSchool/actions/workflows/golden-path-canary.yml
2. Click "Run workflow" button (top right)
3. Leave "Environment to test" as "production"
4. Click green "Run workflow" button
5. Wait ~2 minutes
6. **Expected result:** ✅ All 8 tests pass

### Option B: Wait for Hourly Run

The workflow runs automatically every hour. Next run will be at the top of the hour.

---

## 🎯 Expected Test Results

Once configured, you should see:

```
✅ Golden Path Canary - Admin Login & Dashboard
  ✅ admin login page loads successfully
  ✅ canary admin can authenticate successfully
  ✅ admin dashboard loads after login
  ✅ complete admin golden path completes in <5 seconds
  ✅ admin session persists across page navigation

✅ Golden Path Canary - Public Registration
  ✅ public registration page loads with form visible
  ✅ event page responds within acceptable time
  ✅ page contains event registration elements

8 passed (8 total)
```

---

## 🚨 Troubleshooting

### Error: "אימייל או סיסמה שגויים" (Email or password incorrect)

**Cause:** Email not verified yet

**Fix:**
1. Check email inbox for verification link
2. Click verification link
3. Try logging in again
4. If still failing, reset password at: https://kartis.info/admin/forgot-password

### Tests still failing with "CANARY CONFIG ERROR"

**Cause:** GitHub secrets not set or wrong names

**Fix:**
1. Verify secret names are EXACT (case-sensitive):
   - `PRODUCTION_URL` ✅
   - `production_url` ❌
   - `CANARY_ADMIN_EMAIL` ✅
   - `canary_email` ❌
2. No extra spaces in values
3. Click "Add secret" button (don't just type and navigate away)

### Event page shows 404

**Cause:** Test event not created or wrong slug

**Fix:**
1. Login to admin dashboard
2. Go to Events → New Event
3. Create event with slug exactly: `test-event`
4. Verify URL works: https://kartis.info/p/testcanary/test-event

### Tests timeout after 5 seconds

**Cause:** Production server slow or overloaded

**Fix:**
1. Check Railway status: `railway status`
2. Check Railway logs: `railway logs`
3. Consider upgrading Railway plan if needed

---

## 📋 Quick Checklist

Complete these steps in order:

- [ ] **Email Verification:** Check inbox and click verification link
- [ ] **Login Test:** Can you login to https://kartis.info/admin/login?
- [ ] **Create Event:** Created test event with slug `test-event`
- [ ] **Public Page:** Does https://kartis.info/p/testcanary/test-event work?
- [ ] **GitHub Secret 1:** Added `PRODUCTION_URL` = `https://kartis.info`
- [ ] **GitHub Secret 2:** Added `CANARY_ADMIN_EMAIL` = `345287info@gmail.com`
- [ ] **GitHub Secret 3:** Added `CANARY_ADMIN_PASSWORD` = `Jtbdtjtb6262`
- [ ] **Manual Test:** Triggered workflow manually and all 8 tests passed

---

## 🔒 Security Notes

- ✅ Credentials stored in `.env.canary` (git-ignored)
- ✅ Added to `.gitignore` patterns: `.env.canary`, `*canary*credentials*`
- ✅ GitHub Secrets are encrypted and only accessible to workflows
- ✅ Never committed to repository history

**Safe to use this password** because:
- It's a dedicated test account (not your personal account)
- It only has access to "testcanary" school
- Stored securely in GitHub Secrets (encrypted)
- Only used by automated tests (not shared publicly)

---

## 📞 Need Help?

If you get stuck:
1. Check GitHub Actions logs: https://github.com/MichaelMishaev/ticketsSchool/actions
2. Verify production health: https://kartis.info/api/health
3. Check Railway logs: `railway logs`

**Common issues:**
- Email not verified → Check spam folder
- Wrong GitHub secret names → Must be exact case
- Event 404 → Create event with exact slug `test-event`
- Login fails → Try password reset flow

---

**Once all steps are complete, your production will be monitored 24/7 with hourly health checks!** 🎉

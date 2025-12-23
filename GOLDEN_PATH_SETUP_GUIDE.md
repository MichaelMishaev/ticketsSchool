# Golden Path Canary + Branch Protection Setup Guide

**Time:** 60 minutes total
**Status:** Step-by-step instructions

---

## 🎯 PART 1: GOLDEN PATH CANARY (45 min)

### **Step 1: Create Canary Admin in Railway Production** (10 min)

**Terminal commands:**

```bash
# 1. Login to Railway (browser will open)
railway login

# 2. Link to your project
railway link

# 3. Create canary school and admin
railway run npm run school
```

**When prompted, enter:**

```
School name: Canary Health Check
School slug: test-school
Admin name: Canary Bot
Admin email: canary@yourdomain.com
Admin password: [SAVE THIS PASSWORD - you'll need it for GitHub secrets]
```

**✅ Expected output:**
```
✓ School created: Canary Health Check (test-school)
✓ Admin created: canary@yourdomain.com
```

**⚠️ IMPORTANT:** Save the password somewhere safe!

---

### **Step 2: Create Canary Event in Production** (10 min)

**Via Production UI:**

1. **Open production site:**
   ```bash
   railway open
   # Or go to: https://your-domain.railway.app
   ```

2. **Login with canary credentials:**
   - Email: `canary@yourdomain.com`
   - Password: [from Step 1]

3. **Create new event:**
   - Click "Create Event" or "אירוע חדש"
   - Fill in:
     ```
     Title: Canary Health Check Event
     Slug: test-event
     Date: 2030-12-31 (far in future)
     Time: 12:00
     Capacity: 100
     Event Type: CAPACITY_BASED (regular registration)
     Status: OPEN (פתוח להרשמה)
     ```
   - Click "Create" / "צור אירוע"

4. **Publish the event:**
   - Make sure status is "OPEN" / "פתוח להרשמה"
   - Event should be visible

5. **Verify public URL works:**
   ```bash
   # Open this URL in browser:
   https://your-domain.railway.app/p/test-school/test-event
   ```

   **✅ Expected:** Registration form loads successfully

---

### **Step 3: Configure GitHub Secrets** (10 min)

**Go to GitHub:**

1. **Open your repository settings:**
   ```
   https://github.com/MichaelMishaev/ticketsSchool/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Add 3 secrets:**

   **Secret 1: PRODUCTION_URL**
   ```
   Name: PRODUCTION_URL
   Value: https://your-actual-domain.railway.app
   ```
   *(Replace with your actual Railway domain)*

   **Secret 2: CANARY_ADMIN_EMAIL**
   ```
   Name: CANARY_ADMIN_EMAIL
   Value: canary@yourdomain.com
   ```
   *(Use the email from Step 1)*

   **Secret 3: CANARY_ADMIN_PASSWORD**
   ```
   Name: CANARY_ADMIN_PASSWORD
   Value: [password from Step 1]
   ```

**✅ Verify:** All 3 secrets should now be listed in Settings → Secrets → Actions

---

### **Step 4: Test Golden Path Canary** (15 min)

**Manual test first:**

```bash
# Set environment variables locally
export BASE_URL="https://your-domain.railway.app"
export CANARY_ADMIN_EMAIL="canary@yourdomain.com"
export CANARY_ADMIN_PASSWORD="your-password"

# Run canary tests locally
npm run test:canary
```

**✅ Expected output:**
```
Running 8 tests using 1 worker

✓ [registration-canary] public registration page loads with form visible
✓ [registration-canary] event page responds within acceptable time
✓ [registration-canary] page contains event registration elements
✓ [admin-canary] admin login page loads successfully
✓ [admin-canary] canary admin can authenticate successfully
✓ [admin-canary] admin dashboard loads after login
✓ [admin-canary] complete admin golden path completes in <5 seconds
✓ [admin-canary] admin session persists across page navigation

8 passed (3-5s)
```

**If tests fail:**
- Check production URL is accessible
- Verify canary event exists at `/p/test-school/test-event`
- Check credentials are correct

---

**Test on GitHub Actions:**

1. **Go to Actions tab:**
   ```
   https://github.com/MichaelMishaev/ticketsSchool/actions
   ```

2. **Click "Golden Path Canary" workflow**

3. **Click "Run workflow" dropdown**

4. **Click "Run workflow" button**

5. **Wait 1-2 minutes**

6. **Check result:**
   - ✅ Green checkmark = SUCCESS! Canary is working!
   - ❌ Red X = Failed, check logs

**If failed on GitHub:**
- Click the failed run
- Click "Run Golden Path Canary Tests" step
- Read error messages
- Common issues:
  - Wrong production URL
  - Canary event not published
  - Wrong credentials

---

### **Step 5: Verify Hourly Schedule is Active**

**Check the workflow file:**

```bash
cat .github/workflows/golden-path-canary.yml | grep -A 2 "schedule:"
```

**✅ Expected output:**
```yaml
  schedule:
    - cron: '0 * * * *'  # Every hour
```

**This means:**
- Canary will run automatically every hour
- You'll be notified if production goes down
- Detection time: <1 hour (vs 5 days before!)

---

### **Step 6: (Optional) Set Up Slack/Email Alerts** (15 min)

**For Slack notifications:**

1. **Create Slack webhook:**
   - Go to: https://api.slack.com/messaging/webhooks
   - Click "Create New App"
   - Choose "From scratch"
   - Name: "kartis.info Alerts"
   - Select your workspace
   - Click "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to ON
   - Click "Add New Webhook to Workspace"
   - Choose channel (e.g., #alerts)
   - Copy the webhook URL

2. **Add GitHub secret:**
   ```
   Name: SLACK_WEBHOOK_URL
   Value: [webhook URL from step 1]
   ```

3. **Uncomment Slack notification in workflow:**

   Edit `.github/workflows/golden-path-canary.yml`:

   Find this section (around line 100):
   ```yaml
   # Uncomment to enable Slack notifications
   # - name: Notify Slack on failure
   #   if: failure()
   #   run: |
   #     curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
   #       -H 'Content-Type: application/json' \
   #       -d '{"text":"🚨 PRODUCTION DOWN - Golden Path Canary FAILED"}'
   ```

   Change to:
   ```yaml
   - name: Notify Slack on failure
     if: failure()
     run: |
       curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
         -H 'Content-Type: application/json' \
         -d '{"text":"🚨 PRODUCTION DOWN - Golden Path Canary FAILED"}'
   ```

4. **Commit and push:**
   ```bash
   git add .github/workflows/golden-path-canary.yml
   git commit -m "feat: enable Slack notifications for Golden Path Canary"
   git push origin main
   ```

**For Email notifications:**

GitHub sends email notifications automatically for failed workflows if enabled in your account:

1. Go to: https://github.com/settings/notifications
2. Under "Actions", check:
   - ✅ "Send notifications for failed workflows"
3. Save

---

## ✅ GOLDEN PATH CANARY COMPLETE!

Your production is now monitored every hour. If the site goes down, you'll know within 60 minutes!

---

## 🛡️ PART 2: ENABLE BRANCH PROTECTION (15 min)

### **Step 1: Enable Protection on Main Branch** (10 min)

**Go to repository settings:**

1. **Open branch settings:**
   ```
   https://github.com/MichaelMishaev/ticketsSchool/settings/branches
   ```

2. **Click "Add rule" or "Add branch protection rule"**

3. **Configure the rule:**

   **Branch name pattern:**
   ```
   main
   ```

   **Check these boxes:**

   ✅ **Require a pull request before merging**
   - Required approvals: `1`
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require review from Code Owners (if you have CODEOWNERS file)

   ✅ **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - Search and select these status checks:
     - ☑️ `quality-gates / Type check`
     - ☑️ `quality-gates / Lint check`
     - ☑️ `quality-gates / Run P0 Critical Tests`

   ⚠️ **Note:** These checks will only appear after you create a PR that triggers them. If they don't appear yet, create a test PR first, then come back to add them.

   ✅ **Require conversation resolution before merging**

   ✅ **Require linear history**

   ✅ **Do not allow bypassing the above settings**

4. **Click "Create" or "Save changes"**

**✅ Expected result:**
```
✓ Branch protection rule created for main
```

---

### **Step 2: Enable Protection on Development Branch** (5 min)

**Repeat the same process for development branch:**

1. **Click "Add rule"**

2. **Branch name pattern:**
   ```
   development
   ```

3. **Configure (slightly relaxed rules for faster iteration):**

   ✅ **Require a pull request before merging**
   - Required approvals: `0` (allows self-merge for faster development)

   ✅ **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - Select same status checks as main:
     - ☑️ `quality-gates / Type check`
     - ☑️ `quality-gates / Lint check`
     - ☑️ `quality-gates / Run P0 Critical Tests`

   ✅ **Require conversation resolution before merging**

4. **Click "Create"**

**✅ Expected result:**
```
✓ Branch protection rule created for development
```

---

### **Step 3: Test Branch Protection** (5 min)

**Create a test PR to verify protection works:**

```bash
# Create test branch
git checkout main
git pull origin main
git checkout -b test-branch-protection

# Make a small change
echo "# Test Branch Protection $(date)" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify branch protection works"
git push -u origin test-branch-protection
```

**Create PR on GitHub:**

1. Go to: https://github.com/MichaelMishaev/ticketsSchool/pulls

2. Click "New pull request"

3. Base: `main`, Compare: `test-branch-protection`

4. Click "Create pull request"

5. **Watch what happens:**
   - ⏳ CI checks start running automatically
   - ⏳ Type check runs (~30s)
   - ⏳ Lint check runs (~20s)
   - ⏳ P0 tests run (~7-10 min)

6. **Before CI completes:**
   - Try to click "Merge pull request"
   - **✅ Expected:** Button is DISABLED with message:
     ```
     Merging is blocked
     Required status checks must pass before merging
     ```

7. **After CI completes (all green):**
   - **✅ Expected:** "Merge pull request" button becomes ENABLED
   - You can now merge (or close the test PR)

**✅ Branch protection is working if:**
- Merge button is disabled until CI passes
- All 3 checks (type, lint, tests) must pass
- You cannot bypass the checks

---

## ✅ BRANCH PROTECTION COMPLETE!

Your main and development branches are now protected. No broken code can be merged!

---

## 🎉 SETUP COMPLETE CHECKLIST

**Golden Path Canary:**
- [ ] Canary admin created in production
- [ ] Canary event created and published
- [ ] GitHub secrets configured (PRODUCTION_URL, CANARY_ADMIN_EMAIL, CANARY_ADMIN_PASSWORD)
- [ ] Manual test passed (8/8 tests)
- [ ] GitHub Actions test passed
- [ ] Hourly schedule verified
- [ ] (Optional) Slack/Email alerts configured

**Branch Protection:**
- [ ] Main branch protection enabled
- [ ] Development branch protection enabled
- [ ] Status checks configured (type, lint, P0 tests)
- [ ] Test PR verified protection works
- [ ] Merge button disabled until CI passes

---

## 📊 VERIFICATION COMMANDS

**Check if Golden Path Canary is working:**

```bash
# Check latest canary run
gh run list --workflow="golden-path-canary.yml" --limit 5

# View canary logs
gh run view [run-id] --log
```

**Check if branch protection is enabled:**

```bash
# Check main branch protection
gh api repos/MichaelMishaev/ticketsSchool/branches/main/protection | jq '.required_status_checks'

# Check development branch protection
gh api repos/MichaelMishaev/ticketsSchool/branches/development/protection | jq '.required_status_checks'
```

---

## 🆘 TROUBLESHOOTING

### **Golden Path Canary Issues:**

**Problem:** Tests fail with "ERR_CONNECTION_REFUSED"
**Solution:**
- Verify production URL is correct
- Check Railway service is running: `railway status`

**Problem:** Tests fail with "Invalid credentials"
**Solution:**
- Verify CANARY_ADMIN_EMAIL and CANARY_ADMIN_PASSWORD in GitHub secrets
- Try logging in manually to production

**Problem:** Tests fail with "Event not found"
**Solution:**
- Check event exists at `/p/test-school/test-event`
- Verify event status is "OPEN" (not PAUSED or CLOSED)
- Check event date is in the future

### **Branch Protection Issues:**

**Problem:** Status checks don't appear in branch protection settings
**Solution:**
- Create a test PR first to trigger the workflows
- Wait for workflows to run once
- Then the checks will appear in the list

**Problem:** Can still push directly to main
**Solution:**
- Check "Do not allow bypassing the above settings" is enabled
- Verify you're not an admin (admins can bypass by default)
- Go to Settings → Branches → Edit rule → Check all boxes

---

## 🎯 SUCCESS METRICS

**After 1 week, verify:**

- [ ] Golden Path Canary ran successfully 168 times (24 hours × 7 days)
- [ ] No false positives (canary failures when production was up)
- [ ] All PRs blocked until CI passes
- [ ] Zero broken merges to main

**Check metrics:**

```bash
# Canary success rate (should be >95%)
gh run list --workflow="golden-path-canary.yml" --limit 168 --json conclusion | jq '[.[] | select(.conclusion == "success")] | length'

# PR merge success rate
gh pr list --state merged --limit 20 --json number,statusCheckRollup
```

---

## 📚 NEXT STEPS

**After setup is complete:**

1. **Monitor for 1 week** - Watch canary runs, verify no false positives
2. **Fix any ESLint errors** - So hooks don't need `--no-verify`
3. **Complete P0 test coverage** - Currently 35%, target 100%
4. **Set up Sentry** - For runtime guard alerts (optional)

**Documentation:**
- Keep this guide for future reference
- Update team in chat about new branch protection rules
- Share `CONTRIBUTING.md` with all developers

---

**🎉 Congratulations! Your production is now monitored and protected!** 🚀

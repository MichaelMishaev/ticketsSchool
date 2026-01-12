# Golden Path Canary - Production Setup Guide

## Quick Start (5 Minutes)

This guide sets up automated hourly production health checks that detect outages within 1 hour.

---

## Step 1: Create Canary Admin Account in Production

### Option A: Via Railway CLI (Recommended)

```bash
# Login to Railway
railway login

# Link to your production project
railway link

# Run school manager
railway run npm run school

# Create canary school + admin:
# ✓ School Name: Canary Health Check
# ✓ School Slug: test-school
# ✓ Admin Email: canary@yourdomain.com
# ✓ Admin Name: Canary Bot
# ✓ Password: [generate strong password - save this!]
```

### Option B: Via Production Admin UI

1. Go to: `https://your-domain.railway.app/admin/signup`
2. Create account:
   - Email: `canary@yourdomain.com`
   - Password: `[strong password]`
   - Name: `Canary Bot`
   - School: `Canary Health Check`
   - Slug: `test-school`
3. Verify email (check inbox)
4. Save credentials securely

### Option C: Via Prisma Studio

```bash
railway run npx prisma studio

# 1. Create School:
#    - name: "Canary Health Check"
#    - slug: "test-school"
#    - subscriptionPlan: "FREE"
#
# 2. Create Admin:
#    - email: "canary@yourdomain.com"
#    - password: [bcrypt hash of password]
#    - name: "Canary Bot"
#    - role: "ADMIN"
#    - emailVerified: true
#    - schoolId: [ID from step 1]
```

**🔒 Save these credentials securely - you'll need them for GitHub secrets!**

---

## Step 2: Create Canary Event in Production

The public registration canary test expects a specific event to exist.

### Via Admin UI (Easy)

1. Login to production as canary admin:
   ```
   https://your-domain.railway.app/admin/login
   Email: canary@yourdomain.com
   Password: [your canary password]
   ```

2. Create new event:
   - **Title**: `Canary Health Check Event`
   - **Slug**: `test-event`
   - **Date**: `2030-12-31` (far in future so it never expires)
   - **Time**: `23:59`
   - **Capacity**: `100`
   - **Location**: `Automated Testing`
   - **Description**: `This event is used for automated production health monitoring. Do not delete.`
   - **Status**: `Published`

3. Verify event is accessible:
   ```
   https://your-domain.railway.app/p/test-school/test-event
   ```
   Should show registration form.

### Via Database (Advanced)

```bash
railway run npx prisma studio

# Create Event:
# - title: "Canary Health Check Event"
# - slug: "test-event"
# - schoolId: [canary school ID]
# - date: "2030-12-31T23:59:00Z"
# - capacity: 100
# - spotsReserved: 0
# - status: "PUBLISHED"
# - description: "Automated health monitoring - do not delete"
```

---

## Step 3: Configure GitHub Secrets

Add secrets to your GitHub repository for the canary workflow.

### Navigate to GitHub Secrets

```
Your Repo → Settings → Secrets and variables → Actions → New repository secret
```

### Add Required Secrets

Create **3 secrets**:

#### 1. PRODUCTION_URL
```
Name: PRODUCTION_URL
Value: https://your-actual-domain.railway.app
```
Example: `https://ticketcap-production.up.railway.app`

**How to find your Railway URL:**
```bash
railway status
# or visit Railway dashboard → Your Project → Deployment URL
```

#### 2. CANARY_ADMIN_EMAIL
```
Name: CANARY_ADMIN_EMAIL
Value: canary@yourdomain.com
```
(Use exact email from Step 1)

#### 3. CANARY_ADMIN_PASSWORD
```
Name: CANARY_ADMIN_PASSWORD
Value: [password from Step 1]
```
⚠️ **Do NOT commit this password to git or share it publicly!**

### Verify Secrets Are Set

```
Settings → Secrets and variables → Actions → Repository secrets

✓ PRODUCTION_URL
✓ CANARY_ADMIN_EMAIL
✓ CANARY_ADMIN_PASSWORD
```

---

## Step 4: Test Canary Manually (Verify Setup)

Before enabling automated runs, test manually to ensure everything works.

### Test Against Production

```bash
# Set environment variables (temporarily, for this terminal session)
export CANARY_ADMIN_EMAIL="canary@yourdomain.com"
export CANARY_ADMIN_PASSWORD="your-canary-password"

# Run canary tests against production
npm run test:canary -- \
  --base-url=https://your-domain.railway.app \
  --project=chromium \
  --reporter=list
```

### Expected Success Output

```
Running 8 tests using 1 worker

✓ public registration page loads with form visible (234ms)
✓ event page responds within acceptable time (156ms)
✓ page contains event registration elements (89ms)
✓ admin login page loads successfully (123ms)
✓ canary admin can authenticate successfully (456ms)
✓ admin dashboard loads after login (678ms)
✓ complete admin golden path completes in <5 seconds (1234ms)
✓ admin session persists across page navigation (890ms)

8 passed (3.8s)
```

### If Tests Fail

**Common issues:**

1. **Login fails**: Verify canary admin exists and password is correct
2. **Event not found**: Verify `/p/test-school/test-event` exists
3. **Timeout**: Production might be slow - increase timeout in tests
4. **Connection refused**: Check production URL is correct

---

## Step 5: Enable GitHub Actions Workflow

The workflow is already committed to your repo at:
```
.github/workflows/golden-path-canary.yml
```

### Verify Workflow File Exists

```bash
ls -la .github/workflows/golden-path-canary.yml
# Should show the file
```

### Enable GitHub Actions (if disabled)

```
Settings → Actions → General → Actions permissions
→ Select: "Allow all actions and reusable workflows"
→ Save
```

### Manually Trigger First Run

```
Actions tab → Golden Path Canary (Production Health Check)
→ Run workflow
→ Select branch: main or production
→ Run workflow
```

Watch the workflow run. It should complete in ~1 minute with all tests passing.

---

## Step 6: Monitor Canary Status

### GitHub Actions Dashboard

View canary runs:
```
Your Repo → Actions → Golden Path Canary
```

- **Green checkmark (✓)**: Production is healthy
- **Red X (✗)**: Production is down → investigate immediately

### Scheduled Runs

Canary runs **automatically every hour**:
- Schedule: `0 * * * *` (on the hour, every hour)
- Example: 1:00 AM, 2:00 AM, 3:00 AM, etc.

### View Run History

```
Actions → Golden Path Canary → All workflows

Filter by:
- Status (success/failure)
- Event (schedule vs workflow_dispatch)
- Date
```

---

## Step 7: Set Up Alerts (Optional)

### Option A: GitHub Notifications

Enable GitHub Actions email notifications:

```
Settings (personal) → Notifications → Actions
✓ Send notifications for failed workflows
```

### Option B: Slack Notifications

1. **Create Slack Incoming Webhook**:
   - Go to: https://api.slack.com/messaging/webhooks
   - Select channel (e.g., `#production-alerts`)
   - Copy webhook URL

2. **Add GitHub Secret**:
   ```
   SLACK_WEBHOOK_URL = https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. **Uncomment Slack job** in `.github/workflows/golden-path-canary.yml` (lines ~100-150)

4. **Test**: Trigger workflow with wrong password → verify Slack message

### Option C: Email Alerts

Use GitHub marketplace action: `dawidd6/action-send-mail@v3`

Example configuration in workflow:
```yaml
- name: Send email alert
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "🚨 TicketCap Production Down"
    to: ops@yourdomain.com
    from: alerts@yourdomain.com
```

---

## Verification Checklist

Before considering setup complete, verify:

- [ ] ✅ Canary admin account exists in production
- [ ] ✅ Canary event exists and is accessible (`/p/test-school/test-event`)
- [ ] ✅ GitHub secrets are set (PRODUCTION_URL, CANARY_ADMIN_EMAIL, CANARY_ADMIN_PASSWORD)
- [ ] ✅ Manual canary test passes against production
- [ ] ✅ GitHub Actions workflow exists (`.github/workflows/golden-path-canary.yml`)
- [ ] ✅ Workflow has run at least once successfully
- [ ] ✅ Alerts configured (GitHub/Slack/Email)

---

## Troubleshooting

### Tests Pass Manually But Fail in GitHub Actions

**Cause**: GitHub secrets not set or incorrect

**Fix**:
1. Verify secrets exist: `Settings → Secrets → Actions`
2. Verify secret names are **exact** (case-sensitive):
   - `PRODUCTION_URL`
   - `CANARY_ADMIN_EMAIL`
   - `CANARY_ADMIN_PASSWORD`
3. Re-trigger workflow

### Canary Passes But Production Is Actually Down

**Cause**: Canary tests too simple (only test basic flows)

**Fix**:
- Add more test scenarios (waitlist, event creation, etc.)
- Monitor additional metrics (response times, error rates)
- Set up external monitoring (Pingdom, UptimeRobot)

### False Positives (Canary fails, but production works)

**Causes**:
- Network issues between GitHub Actions runners and Railway
- Production slow but not down
- Rate limiting

**Fix**:
1. Check retry logic (currently 3 attempts, 30s delay)
2. Increase timeout (currently 5s)
3. Check Railway status: https://status.railway.app

### Workflow Not Running Hourly

**Fix**:
1. Verify workflow file is in `main` or default branch
2. Check GitHub Actions are enabled
3. Check cron syntax: `0 * * * *`
4. GitHub Actions may delay scheduled runs by up to 15 minutes

---

## Maintenance

### Updating Canary Password

If canary password is compromised:

1. **Reset in production**:
   ```bash
   railway run npx prisma studio
   # Update admin password (use bcrypt)
   ```

2. **Update GitHub secret**:
   ```
   Settings → Secrets → CANARY_ADMIN_PASSWORD → Update
   ```

3. **Test**: Manually trigger workflow to verify

### Deleting Canary Setup

If you need to disable canary monitoring:

1. **Delete workflow file**:
   ```bash
   rm .github/workflows/golden-path-canary.yml
   ```

2. **Delete GitHub secrets** (optional):
   ```
   Settings → Secrets → Delete PRODUCTION_URL, CANARY_ADMIN_EMAIL, CANARY_ADMIN_PASSWORD
   ```

3. **Delete canary admin** from production (optional):
   ```bash
   railway run npx prisma studio
   # Delete admin + school
   ```

---

## Success!

You now have automated production health monitoring that will detect outages within 1 hour!

**What happens next:**
- Canary runs every hour automatically
- If production goes down, you get alerted immediately
- View test results in GitHub Actions tab
- Download screenshots/traces if tests fail

**MTTR Improvement:**
- **Before**: 5 days to detect outage
- **After**: <1 hour to detect outage
- **97% reduction** in detection time

---

## Next Steps

### Phase 2: Enhanced Monitoring

Consider adding:
- **More golden paths**: Waitlist flow, event creation, CSV export
- **Performance monitoring**: Alert when response time >3 seconds
- **Database health**: Test DB connection separately
- **External monitoring**: Pingdom, UptimeRobot, Datadog
- **Status page**: Public status page for users (statuspage.io)

### Integration Recommendations

- **PagerDuty**: For on-call rotations
- **Datadog**: For metrics + APM + alerting
- **Sentry**: For error tracking + performance monitoring
- **LogRocket**: For session replay on errors

---

**Questions? See `/tests/golden-path/README.md` for detailed documentation.**

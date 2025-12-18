# Golden Path Canary - Production Health Monitoring

## Overview

The Golden Path Canary system provides **automated hourly monitoring** of TicketCap production to detect outages within 1 hour. After a 5-day undetected outage, this system ensures immediate notification when critical user flows break.

## How It Works

### 🔄 Automated Schedule
- **Runs every hour** via GitHub Actions (cron: `0 * * * *`)
- Tests run against production URL
- Tests complete in **<5 seconds** (fast, lightweight)
- **Retry logic**: 3 attempts with 30-second delays (handles transient network issues)

### ✅ What It Tests

#### 1. Public Registration Flow (`registration-canary.spec.ts`)
- Public event page loads (`/p/test-school/test-event`)
- Registration form is visible
- Required fields exist (name, phone, email)
- Submit button is present
- Response time <3 seconds

#### 2. Admin Authentication Flow (`admin-canary.spec.ts`)
- Admin login page loads
- Can authenticate with canary admin account
- Dashboard loads after login
- Session persists across navigation
- Complete flow <5 seconds

### 🚨 Alert System

When tests fail (after 3 retry attempts):
- **GitHub Actions job fails** (visible in Actions tab)
- **Error message**: `🚨 PRODUCTION DOWN - Golden Path Canary FAILED`
- **Artifacts uploaded**: screenshots, traces, HTML report
- **Optional**: Auto-create GitHub issue (see workflow comments)
- **Optional**: Send Slack/email notification (see setup below)

## Setup Instructions

### Step 1: Create Canary Admin Account in Production

You need a dedicated admin account for canary tests (never use a real user account):

```bash
# Option A: Via Railway CLI
railway run npm run school

# Then create a new school + admin:
# School Name: Canary Health Check
# School Slug: test-school
# Admin Email: canary@yourdomain.com
# Password: [generate strong password]

# Option B: Via production database (Prisma Studio)
railway run npx prisma studio

# Then manually create:
# 1. School with slug "test-school"
# 2. Admin with email "canary@yourdomain.com", role ADMIN
```

**Important**: Keep these credentials secure - they're stored as GitHub secrets.

### Step 2: Create Canary Event in Production

The public registration test expects a specific event URL:

```bash
# Via production admin dashboard:
1. Login as canary admin
2. Create new event:
   - Title: "Canary Health Check Event"
   - Slug: "test-event"
   - Date: Far in future (so it never expires)
   - Capacity: 100
   - Status: Published

# Verify URL works: https://your-domain.railway.app/p/test-school/test-event
```

**Alternative**: Modify `registration-canary.spec.ts` to use a different school/event slug.

### Step 3: Configure GitHub Secrets

Add these secrets to your GitHub repository:

```
Settings → Secrets and variables → Actions → New repository secret
```

**Required Secrets:**
- `PRODUCTION_URL` - Your Railway production URL (e.g., `https://ticketcap.railway.app`)
- `CANARY_ADMIN_EMAIL` - Email from Step 1 (e.g., `canary@yourdomain.com`)
- `CANARY_ADMIN_PASSWORD` - Password from Step 1

### Step 4: Enable GitHub Actions

Ensure GitHub Actions are enabled in your repository:

```
Settings → Actions → General → Allow all actions and reusable workflows
```

### Step 5: Test Manually

Before relying on automated runs, test manually:

```bash
# Set environment variables
export CANARY_ADMIN_EMAIL="canary@yourdomain.com"
export CANARY_ADMIN_PASSWORD="your-password"

# Run canary tests against production
npm run test:canary -- --base-url=https://your-domain.railway.app
```

Expected output:
```
✅ PUBLIC REGISTRATION: Page loaded in 234ms
✅ ADMIN LOGIN PAGE: Loaded in 156ms
✅ ADMIN LOGIN: Authenticated in 423ms
✅ ADMIN DASHBOARD: Loaded successfully
✅ ADMIN GOLDEN PATH: Complete flow took 1234ms

5 passed (5s)
```

## Monitoring & Alerts

### GitHub Actions Dashboard

View canary test results:
```
Your Repo → Actions → Golden Path Canary
```

- **Green checkmark**: Production is healthy
- **Red X**: Production is down (investigate immediately)

### Viewing Failed Test Artifacts

When canary fails, download artifacts:
```
Actions → Failed workflow run → Artifacts section

Downloads:
- canary-failure-report-XXX: HTML test report
- canary-screenshots-XXX: Screenshots at failure point
- canary-traces-XXX: Playwright trace files (replay test execution)
```

### Setting Up Slack Notifications (Optional)

Uncomment the `notify-slack` job in `.github/workflows/golden-path-canary.yml`:

1. **Create Slack Incoming Webhook:**
   - Go to: https://api.slack.com/messaging/webhooks
   - Create webhook for your channel (e.g., `#production-alerts`)
   - Copy webhook URL

2. **Add GitHub Secret:**
   ```
   Settings → Secrets → New secret
   Name: SLACK_WEBHOOK_URL
   Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. **Uncomment Slack job** in workflow file (lines ~100-150)

4. **Test:**
   - Manually trigger workflow with invalid credentials
   - Verify Slack message appears in your channel

### Setting Up Email Notifications (Optional)

Use GitHub Actions marketplace actions like:
- `dawidd6/action-send-mail@v3`
- `peter-evans/sendgrid-action@v1`

Add to workflow:
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
    body: "Golden Path Canary failed. Check workflow: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

## Troubleshooting

### Canary Tests Failing But Production Works

**Possible causes:**
1. **Canary account deleted/disabled** - Verify account exists in production
2. **Event deleted** - Verify `/p/test-school/test-event` exists
3. **Credentials changed** - Update GitHub secrets
4. **Network issues** - Check Railway status page

**Debug:**
```bash
# Download failed test artifacts from GitHub Actions
# Open playwright-report/index.html
# View screenshots and trace files to see exact failure point
```

### Tests Timing Out (>5 seconds)

**Causes:**
- Production server overloaded
- Database connection issues
- Railway region latency

**Solutions:**
- Increase timeout in test files (currently 5000ms)
- Check Railway metrics for CPU/memory spikes
- Verify DATABASE_URL is correct in Railway

### Environment Variable Not Found

Error: `CANARY_ADMIN_EMAIL and CANARY_ADMIN_PASSWORD must be set`

**Fix:**
1. Verify secrets are set in GitHub: `Settings → Secrets → Actions`
2. Secret names must match exactly (case-sensitive)
3. Re-trigger workflow after adding secrets

### False Positives (Canary fails, but production is up)

If you get frequent false alarms:
1. **Increase retry count** in workflow (currently 3 retries)
2. **Increase timeout** in test files (currently 5s)
3. **Add delay between retries** (currently 30s)
4. **Check Railway status**: https://status.railway.app

## Running Locally

Test canary against local dev server:

```bash
# Start dev server
npm run dev

# In another terminal, run canary tests
export CANARY_ADMIN_EMAIL="test@test.com"
export CANARY_ADMIN_PASSWORD="Password123!"

npm run test:canary
```

## Maintenance

### Updating Canary Credentials

If you need to change canary admin password:

1. **Update in production** (via Railway):
   ```bash
   railway run npx prisma studio
   # Update admin password (use bcrypt hash)
   ```

2. **Update GitHub secret**:
   ```
   Settings → Secrets → Actions → CANARY_ADMIN_PASSWORD → Update
   ```

3. **Test manually** to verify new credentials work

### Monitoring Canary Test History

View past runs:
```
GitHub → Actions → Golden Path Canary → Workflow runs

Filter by:
- Status (success/failure)
- Date range
- Manual vs scheduled runs
```

## Cost & Performance

- **Cost**: FREE (GitHub Actions includes 2,000 minutes/month for free tier)
- **Runtime**: ~5 seconds per run
- **Frequency**: 24 runs/day (hourly)
- **Monthly usage**: 24 runs × 30 days × 0.08 minutes = ~57 minutes/month
- **Data transfer**: Minimal (<1MB per run)

## Success Metrics

After deploying canary:
- **MTTR**: Mean Time To Recovery <1 hour (previously 5 days)
- **Detection**: 100% of production outages detected
- **False positives**: <5% (with retry logic)
- **Uptime visibility**: Real-time production health status

## Next Steps

### Phase 2: Advanced Monitoring (Future)
- Add more golden paths (waitlist flow, event creation)
- Monitor response times (alerting when slow)
- Synthetics monitoring (Datadog, New Relic)
- Database connection canary
- External monitoring (Pingdom, UptimeRobot)

### Integration Options
- PagerDuty: Critical alerts to on-call engineer
- Datadog: Metrics + alerting + dashboards
- Sentry: Error tracking with production health
- StatusPage: Public status page for users

# Production Monitoring Deployment Checklist

Complete checklist for deploying OpenTelemetry and Sentry monitoring to production.

## Pre-Deployment Setup

### 1. Create Accounts

- [ ] **Sentry Account**
  - Sign up at https://sentry.io/signup/
  - Create organization: `your-org`
  - Create project: `ticketcap`
  - Select platform: **Next.js**
  - Copy DSN and Auth Token

- [ ] **Grafana Cloud Account** (Optional - for OpenTelemetry)
  - Sign up at https://grafana.com/auth/sign-up/create-user
  - Create stack: `your-org-ticketcap`
  - Navigate to **Connections** → **OpenTelemetry**
  - Copy OTLP endpoint and credentials

### 2. Install Dependencies

```bash
# OpenTelemetry
npm install --save \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions \
  @opentelemetry/api

# Sentry
npm install --save @sentry/nextjs

# Wizard for Sentry setup
npx @sentry/wizard@latest -i nextjs
```

### 3. Enable Instrumentation

```bash
# Rename example file
mv instrumentation.example.ts instrumentation.ts
```

### 4. Update next.config.ts

```typescript
// Add to next.config.ts
const nextConfig = {
  experimental: {
    instrumentationHook: true,  // Enable instrumentation
  },
  // ... rest of config
}

// Wrap with Sentry config
module.exports = withSentryConfig(nextConfig, { ... })
```

---

## Local Testing

### 1. Set Environment Variables

Create `.env.local`:

```bash
# Sentry
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=ticketcap
SENTRY_ENVIRONMENT=development

# OpenTelemetry (Local)
OTEL_SERVICE_NAME=ticketcap
OTEL_ENVIRONMENT=development
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_TRACES_SAMPLER_ARG=1.0  # 100% sampling in dev
```

### 2. Start Jaeger (Local)

```bash
# Start Jaeger for local trace visualization
docker-compose up -d jaeger

# Verify Jaeger UI
open http://localhost:16686
```

### 3. Start Dev Server

```bash
npm run dev
```

### 4. Verify Setup

**Check Logs:**

```
✓ OpenTelemetry initialized: ticketcap (development)
✓ OTLP Endpoint: http://localhost:4318
✓ Sample Rate: 100%
```

**Test Sentry:**

```bash
# Create a test error
curl http://localhost:9000/api/test-error

# Check Sentry dashboard
open https://sentry.io/organizations/your-org/projects/ticketcap/
```

**Test OpenTelemetry:**

```bash
# Create some traffic
npm test

# Check Jaeger UI
open http://localhost:16686
# Select service: ticketcap
# View traces
```

---

## Production Deployment (Railway)

### 1. Set Production Environment Variables

```bash
# Sentry
railway variables set SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project"
railway variables set SENTRY_AUTH_TOKEN="your-auth-token"
railway variables set SENTRY_ORG="your-org"
railway variables set SENTRY_PROJECT="ticketcap"
railway variables set SENTRY_ENVIRONMENT="production"

# Client-side Sentry (public)
railway variables set NEXT_PUBLIC_SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project"
railway variables set NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"

# OpenTelemetry
railway variables set OTEL_SERVICE_NAME="ticketcap"
railway variables set OTEL_ENVIRONMENT="production"
railway variables set OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-prod-us-central-0.grafana.net/otlp"
railway variables set OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <base64-credentials>"
railway variables set OTEL_TRACES_SAMPLER_ARG="0.1"  # 10% sampling (reduce costs)
railway variables set OTEL_METRIC_EXPORT_INTERVAL="60000"  # 60 seconds
```

### 2. Deploy to Railway

```bash
git add .
git commit -m "feat: add production monitoring (OpenTelemetry + Sentry)"
git push origin main

# Watch deployment
railway logs --follow
```

### 3. Verify Deployment

**Check Logs:**

```bash
railway logs --tail 100 | grep -i "telemetry\|sentry"
```

Expected output:

```
✓ OpenTelemetry initialized: ticketcap (production)
✓ OTLP Endpoint: https://otlp-gateway-prod-us-central-0.grafana.net/otlp
✓ Sample Rate: 10%
```

**Test Health Check:**

```bash
curl https://kartis.info/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T10:00:00.000Z",
  "version": "ticketcap@abc123"
}
```

---

## Post-Deployment Setup

### 1. Create Grafana Dashboard

1. Navigate to https://your-org.grafana.net
2. Go to **Dashboards** → **New** → **Import**
3. Paste dashboard JSON from PRODUCTION_MONITORING_SETUP.md
4. Configure data sources:
   - **Tempo** for traces
   - **Prometheus** for metrics
5. Save dashboard

### 2. Create Sentry Dashboard

1. Navigate to https://sentry.io/organizations/your-org/projects/ticketcap/
2. Go to **Dashboards** → **Create Dashboard**
3. Add widgets:
   - **Error Frequency** (big number)
   - **Error Rate by Endpoint** (table)
   - **Slowest Transactions** (table)
   - **Payment Errors** (time series)
   - **User Impact** (big number)
4. Save dashboard

### 3. Configure Alerts

**Sentry Alerts:**

1. Navigate to **Alerts** → **Create Alert**
2. Create alerts for:
   - **Payment Failures:** `event.type:error AND transaction:"/api/payment/*"` (>5 in 10 min)
   - **High Error Rate:** `event.type:error` (>10 in 5 min)
   - **Database Errors:** `event.type:error AND error.type:"DatabaseError"` (any)
   - **Multi-Tenant Isolation:** `event.type:error AND tag:security_violation` (any)

**Grafana Alerts:**

1. Navigate to **Alerting** → **Alert Rules** → **New Alert Rule**
2. Create alerts for:
   - **High Error Rate:** `api_error_rate > 1` (for 5 minutes)
   - **Slow Payments:** `histogram_quantile(0.95, payment_processing_time_bucket) > 5000` (for 10 min)
   - **Event Capacity:** `registration_capacity_utilization > 0.95` (for 1 minute)
   - **Database Latency:** `histogram_quantile(0.95, db_query_duration_bucket) > 500` (for 5 min)

### 4. Setup Metric Collection (Cron Job)

**Option A: Railway Cron Job Service**

1. Create new Railway service
2. Select **Cron Job** type
3. Configure:
   - **Schedule:** `*/5 * * * *` (every 5 minutes)
   - **Command:** `npm run collect-metrics`
   - **Build Command:** `npm install`
4. Link to database service
5. Set same environment variables as main app
6. Deploy

**Option B: Manual Cron (Alternative)**

```bash
# On server (SSH access required)
crontab -e

# Add line:
*/5 * * * * cd /path/to/ticketcap && npm run collect-metrics >> /var/log/metrics.log 2>&1
```

### 5. Configure Notifications

**Sentry:**

1. Navigate to **Settings** → **Integrations**
2. Configure:
   - **Slack:** Add webhook URL
   - **Email:** Configure email addresses
   - **PagerDuty:** Add integration key (for critical alerts)

**Grafana:**

1. Navigate to **Alerting** → **Contact Points**
2. Configure:
   - **Slack:** Add webhook URL
   - **Email:** Configure SMTP settings
   - **PagerDuty:** Add integration key

---

## Verification Tests

### 1. Trigger Test Errors

```bash
# Create test error in Sentry
curl https://kartis.info/api/test-error

# Verify in Sentry dashboard
# Should appear within 1-2 minutes
```

### 2. Generate Test Traffic

```bash
# Run Playwright tests against production
PLAYWRIGHT_BASE_URL=https://kartis.info npm test

# Should generate traces in Grafana
```

### 3. Check Dashboards

- [ ] **Grafana:** Traces appear in Tempo
- [ ] **Grafana:** Metrics appear in Prometheus
- [ ] **Sentry:** Errors appear in Issues
- [ ] **Sentry:** Transactions appear in Performance

### 4. Test Alerts

**Sentry:**

```bash
# Generate 10 errors in 5 minutes
for i in {1..10}; do
  curl https://kartis.info/api/test-error
  sleep 30
done

# Should trigger "High Error Rate" alert
```

**Grafana:**

```bash
# Load test to trigger latency alert
hey -n 1000 -c 10 https://kartis.info/api/events

# Should trigger "Slow API" alert if p95 > 2s
```

---

## Post-Deployment Monitoring

### Week 1: Baseline Collection

- [ ] Monitor dashboards daily
- [ ] Record baseline metrics (error rate, latency, throughput)
- [ ] Adjust alert thresholds based on real traffic
- [ ] Review Sentry issues and mark false positives
- [ ] Verify source maps are uploading correctly

### Week 2: Optimization

- [ ] Reduce sampling rate if costs are high (`OTEL_TRACES_SAMPLER_ARG=0.05`)
- [ ] Add `ignoreErrors` for known non-critical errors
- [ ] Create custom dashboards for business metrics
- [ ] Document common errors in runbook

### Month 1: Review

- [ ] Review monitoring costs (Sentry + Grafana)
- [ ] Analyze top errors and performance bottlenecks
- [ ] Create incident response playbook
- [ ] Train team on dashboard usage
- [ ] Set up weekly monitoring review meeting

---

## Rollback Plan

If monitoring causes issues in production:

### 1. Disable OpenTelemetry

```bash
# Remove instrumentation hook
railway variables set NEXT_RUNTIME="edge"  # Skip instrumentation
# OR
railway variables unset OTEL_EXPORTER_OTLP_ENDPOINT

# Redeploy
git push origin main
```

### 2. Disable Sentry

```bash
# Remove Sentry DSN
railway variables unset SENTRY_DSN
railway variables unset NEXT_PUBLIC_SENTRY_DSN

# Redeploy
git push origin main
```

### 3. Revert Code Changes

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

---

## Cost Estimates

### Free Tier (Recommended for MVP)

- **Sentry Developer Plan:** $0/month
  - 5,000 errors/month
  - 10,000 performance events/month
  - 1 user

- **Grafana Cloud Free Tier:** $0/month
  - 50GB logs (14-day retention)
  - 10,000 metrics
  - 50GB traces (14-day retention)

**Total: $0/month**

### Paid Tier (Scale)

- **Sentry Team Plan:** $26/month
  - 50,000 errors/month
  - 100,000 performance events/month
  - Unlimited users

- **Grafana Cloud Pro:** $49/month
  - 100GB logs (30-day retention)
  - 100,000 metrics
  - 100GB traces (30-day retention)

**Total: ~$75/month**

---

## Support

### Documentation

- `/docs/monitoring/PRODUCTION_MONITORING_SETUP.md` - Complete setup guide
- `/docs/monitoring/INTEGRATION_EXAMPLES.md` - Code examples
- `/docs/monitoring/QUICK_REFERENCE.md` - Quick reference

### External Resources

- **OpenTelemetry:** https://opentelemetry.io/docs/
- **Sentry:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Grafana Cloud:** https://grafana.com/docs/grafana-cloud/

### Emergency Contacts

- **Sentry Support:** support@sentry.io
- **Grafana Support:** https://grafana.com/docs/grafana-cloud/account-management/support/
- **Internal Team:** [Add Slack channel or email]

---

**Deployment Date:** ******\_******
**Deployed By:** ******\_******
**Verified By:** ******\_******

**Last Updated:** 2026-01-12

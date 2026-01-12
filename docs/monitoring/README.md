# Production Monitoring Documentation

Complete documentation for OpenTelemetry and Sentry monitoring integration in kartis.info.

## Documentation Index

1. **[PRODUCTION_MONITORING_SETUP.md](./PRODUCTION_MONITORING_SETUP.md)** - Complete setup guide
   - OpenTelemetry installation and configuration
   - Sentry installation and configuration
   - Environment variables
   - Dashboard setup
   - Alerting rules
   - Railway deployment

2. **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)** - Code examples
   - API route monitoring
   - Registration flow tracing
   - Payment flow tracing
   - Server component examples
   - Error handling
   - Performance tracking

3. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference
   - Common imports
   - Quick patterns
   - Grafana queries
   - Sentry filters
   - Alert thresholds
   - Troubleshooting

## Quick Start

### 1. Install Dependencies

```bash
npm install --save \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http \
  @opentelemetry/api \
  @sentry/nextjs
```

### 2. Initialize Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

### 3. Enable Instrumentation

```bash
# Rename example file
mv instrumentation.example.ts instrumentation.ts

# Update next.config.ts (add experimental.instrumentationHook: true)
```

### 4. Set Environment Variables

```bash
# Sentry
export SENTRY_DSN="https://..."
export SENTRY_AUTH_TOKEN="..."

# OpenTelemetry
export OTEL_SERVICE_NAME="ticketcap"
export OTEL_EXPORTER_OTLP_ENDPOINT="https://..."
export OTEL_TRACES_SAMPLER_ARG="1.0"  # 100% in dev, 0.1 in prod
```

### 5. Restart Dev Server

```bash
npm run dev
```

### 6. Verify Setup

**OpenTelemetry (Local):**

```bash
docker-compose up -d jaeger
# Visit http://localhost:16686
```

**Sentry:**

- Visit https://sentry.io/organizations/your-org/projects/ticketcap/
- Check for test errors

## Key Files

### Configuration Files

- `/instrumentation.ts` - Next.js instrumentation hook (OpenTelemetry init)
- `/lib/monitoring/telemetry.ts` - OpenTelemetry configuration and utilities
- `/lib/monitoring/sentry.ts` - Sentry utilities (context, errors, tracking)
- `/lib/monitoring/metrics.ts` - Custom business metrics
- `/scripts/collect-metrics.ts` - Cron job for metric collection

### Sentry Config Files (Auto-generated)

- `/sentry.server.config.ts` - Server-side Sentry config
- `/sentry.client.config.ts` - Client-side Sentry config
- `/sentry.edge.config.ts` - Edge runtime Sentry config (middleware)

## Common Use Cases

### Track an API Route

```typescript
import { initSentryForRequest, setUserContext } from '@/lib/monitoring/sentry'
import { trackAPICall, startTimer } from '@/lib/monitoring/metrics'

export async function POST(request: Request) {
  const stopTimer = startTimer()
  initSentryForRequest(request)

  try {
    const admin = await getCurrentAdmin()
    setUserContext(admin.id, admin.email)

    // ... your logic

    trackAPICall('/api/endpoint', 'POST', 200, stopTimer())
    return NextResponse.json({ success: true })
  } catch (error) {
    trackAPICall('/api/endpoint', 'POST', 500, stopTimer())
    throw error
  }
}
```

### Track a Registration

```typescript
import { traceRegistration } from '@/lib/monitoring/telemetry'
import { trackRegistration } from '@/lib/monitoring/metrics'

const result = await traceRegistration(eventId, spotsCount, async () => {
  const registration = await createRegistration(data)
  trackRegistration(eventId, registration.status, stopTimer())
  return registration
})
```

### Track a Payment

```typescript
import { tracePayment } from '@/lib/monitoring/telemetry'
import { trackPayment } from '@/lib/monitoring/metrics'

const payment = await tracePayment(amount, currency, async () => {
  const payment = await processPayment(data)
  trackPayment(amount, 'COMPLETED', stopTimer(), currency)
  return payment
})
```

## Dashboards

### Grafana Cloud

1. Sign up: https://grafana.com/auth/sign-up/create-user
2. Navigate to **Dashboards** → **Import**
3. Import dashboard JSON (see PRODUCTION_MONITORING_SETUP.md)
4. Connect data sources (Tempo for traces, Prometheus for metrics)

### Sentry

1. Navigate to **Dashboards** → **Create Dashboard**
2. Add widgets:
   - Error Frequency
   - Error Rate by Endpoint
   - Slowest Transactions
   - Payment Errors
   - User Impact

## Alerting

### Critical Alerts (Immediate Response)

- Payment failure rate >10% (10 minutes)
- Database connection errors (any)
- Multi-tenant isolation failures (any)
- Capacity race conditions (any)

### Warning Alerts (Monitor)

- API error rate >1% (5 minutes)
- API latency p95 >2s (10 minutes)
- Payment processing slow (p95 >5s)
- Event capacity >95% (monitor for waitlist)

## Metric Collection

### Manual Collection

```bash
npm run collect-metrics
```

### Automated Collection (Railway Cron Job)

1. Create new Railway service (type: Cron Job)
2. Schedule: `*/5 * * * *` (every 5 minutes)
3. Command: `npm run collect-metrics`
4. Link to database service

## Troubleshooting

### No traces appearing

```bash
# Check OTLP endpoint
echo $OTEL_EXPORTER_OTLP_ENDPOINT

# Verify instrumentation is enabled
grep "instrumentationHook" next.config.ts

# Restart dev server
npm run dev
```

### Sentry errors not captured

```bash
# Test manually
node -e "require('@sentry/nextjs').captureMessage('Test error')"

# Check DSN
echo $SENTRY_DSN

# Check browser console for Sentry errors
```

### Source maps not uploaded

```bash
# Verify auth token
echo $SENTRY_AUTH_TOKEN

# Upload manually
npx sentry-cli releases files <release> upload-sourcemaps .next

# Check .sentryclirc file
cat .sentryclirc
```

## Best Practices

1. **Set context early** - Call `initSentryForRequest()` at the start of API routes
2. **Track all critical operations** - Registrations, payments, capacity checks
3. **Add breadcrumbs** - Provide debugging context before operations
4. **Filter sensitive data** - Never send PII to monitoring systems
5. **Use sampling in production** - Set `OTEL_TRACES_SAMPLER_ARG=0.1` (10%)
6. **Monitor costs** - Review Sentry/Grafana usage monthly

## Cost Optimization

### Reduce Trace Volume

```bash
# Lower sampling rate
OTEL_TRACES_SAMPLER_ARG=0.05  # 5% sampling
```

### Reduce Error Volume

```typescript
// sentry.server.config.ts
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Non-Error promise rejection captured',
  // Add more known errors
]
```

### Reduce Session Replay Volume

```typescript
// sentry.client.config.ts
replaysSessionSampleRate: 0.01,  // 1% of sessions
replaysOnErrorSampleRate: 1.0,   // 100% of errors
```

## Support

- **OpenTelemetry Docs:** https://opentelemetry.io/docs/
- **Sentry Docs:** https://docs.sentry.io/
- **Grafana Docs:** https://grafana.com/docs/
- **Internal Support:** See PRODUCTION_MONITORING_SETUP.md

---

**Last Updated:** 2026-01-12
**Maintained By:** Development Team

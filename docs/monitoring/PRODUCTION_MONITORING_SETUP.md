# Production Monitoring Setup Guide

## Overview

### Why Monitoring is Critical

Production monitoring is essential for maintaining system reliability, detecting issues before they impact users, and understanding system behavior under real-world load. For kartis.info, monitoring is particularly critical due to:

1. **Financial Transactions** - YaadPay payment processing requires real-time error detection
2. **Atomic Capacity Enforcement** - Race conditions must be detected immediately
3. **Multi-Tenant Architecture** - Data isolation failures could expose customer data
4. **Limited-Capacity Events** - Registration failures directly impact revenue
5. **Real-Time Operations** - Waitlist promotions and capacity updates need sub-second latency

**aiRules.md Principle #15: Production Monitoring**

> "Always monitor production systems with comprehensive observability (logs, metrics, traces)"

### Tool Selection Rationale

**OpenTelemetry** - Industry-standard observability framework

- ✅ Vendor-neutral (avoid lock-in)
- ✅ Auto-instrumentation for Next.js, Prisma, HTTP
- ✅ Distributed tracing across services
- ✅ Custom metrics for business logic
- ✅ Free exporters (Jaeger, Prometheus, Grafana Cloud)

**Sentry** - Error tracking and performance monitoring

- ✅ Excellent Next.js integration
- ✅ Source maps for production debugging
- ✅ User session replay
- ✅ Release tracking with git commits
- ✅ Generous free tier (5k errors/month, 10k transactions/month)

### Cost Analysis

**Free Tier (Recommended for MVP):**

- Sentry: 5,000 errors/month + 10,000 performance events/month
- Grafana Cloud: 50GB logs, 10k metrics, 50GB traces (14-day retention)
- Total: $0/month for small-to-medium deployments

**Paid Tier (Scale):**

- Sentry Team: $26/month (50k errors, 100k performance events)
- Grafana Cloud Pro: $49/month (100GB logs, 100k metrics)
- Total: ~$75/month for production-grade monitoring

---

## 1. OpenTelemetry Setup

### Installation

```bash
npm install --save \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions \
  @opentelemetry/api
```

### Configuration for Next.js

Create `instrumentation.ts` in the project root (Next.js 15+ instrumentation hook):

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on Node.js runtime (not Edge)
    const { initTelemetry } = await import('./lib/monitoring/telemetry')
    initTelemetry()
  }
}

export const onRequestError = async (err: Error, request: Request, context: any) => {
  // Send errors to telemetry
  const { recordError } = await import('./lib/monitoring/telemetry')
  recordError(err, {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  })
}
```

Update `next.config.ts`:

```typescript
const nextConfig = {
  // Enable instrumentation hook
  experimental: {
    instrumentationHook: true,
  },
  // ... rest of config
}
```

### Environment Variables

Add to `.env`:

```bash
# OpenTelemetry Configuration
OTEL_SERVICE_NAME=ticketcap
OTEL_ENVIRONMENT=production  # or "development", "staging"

# Grafana Cloud (Production)
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-encoded-credentials>

# Local Development (Jaeger)
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Tracing Configuration
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=1.0  # Sample 100% in dev, 0.1 (10%) in prod

# Metrics Configuration
OTEL_METRICS_EXPORTER=otlp
OTEL_METRIC_EXPORT_INTERVAL=60000  # Export every 60 seconds
```

### Tracing Critical Operations

The auto-instrumentation will automatically trace:

- ✅ HTTP requests (Next.js API routes)
- ✅ Database queries (Prisma)
- ✅ External HTTP calls (fetch, axios)

**Custom spans for business-critical operations:**

```typescript
// Example: Tracing registration with capacity check
import { trace } from '@opentelemetry/api'

const tracer = trace.getTracer('ticketcap')

export async function createRegistration(data: RegistrationData) {
  return await tracer.startActiveSpan('registration.create', async (span) => {
    try {
      span.setAttributes({
        'event.id': data.eventId,
        'registration.spots': data.spotsCount,
        'school.id': data.schoolId,
      })

      // Atomic capacity check (critical path)
      const result = await tracer.startActiveSpan(
        'registration.capacityCheck',
        async (checkSpan) => {
          const event = await prisma.event.findUnique({ where: { id: data.eventId } })
          checkSpan.setAttributes({
            'event.capacity': event.capacity,
            'event.spotsReserved': event.spotsReserved,
            'event.spotsAvailable': event.capacity - event.spotsReserved,
          })
          checkSpan.end()
          return event
        }
      )

      // Transaction (atomic increment)
      const registration = await tracer.startActiveSpan(
        'registration.transaction',
        async (txSpan) => {
          const result = await prisma.$transaction(async (tx) => {
            // ... atomic registration logic
          })
          txSpan.setAttributes({
            'registration.status': result.status,
            'registration.confirmationCode': result.registration.confirmationCode,
          })
          txSpan.end()
          return result
        }
      )

      span.setStatus({ code: 1 }) // OK
      span.end()
      return registration
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({ code: 2, message: (error as Error).message }) // ERROR
      span.end()
      throw error
    }
  })
}
```

### Local Development with Jaeger

Run Jaeger locally to visualize traces:

```bash
# Docker Compose (add to existing docker-compose.yml)
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # Jaeger UI
      - "4318:4318"    # OTLP HTTP receiver
    environment:
      - COLLECTOR_OTLP_ENABLED=true
```

Then:

```bash
docker-compose up -d jaeger
# Visit http://localhost:16686 for Jaeger UI
```

### Production with Grafana Cloud

1. Sign up at https://grafana.com/auth/sign-up/create-user
2. Navigate to **Connections** → **Add new connection** → **OpenTelemetry**
3. Copy the OTLP endpoint and credentials
4. Set environment variables in Railway:
   ```bash
   railway variables set OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-prod-us-central-0.grafana.net/otlp"
   railway variables set OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic <base64-encoded>"
   railway variables set OTEL_TRACES_SAMPLER_ARG="0.1"  # Sample 10% to reduce costs
   ```

---

## 2. Sentry Setup

### Installation

```bash
npm install --save @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

The wizard will:

- Create `sentry.client.config.ts` and `sentry.server.config.ts`
- Create `sentry.edge.config.ts` for middleware
- Update `next.config.ts` with Sentry webpack plugin
- Add `.sentryclirc` for CLI authentication

### Environment Variables

Add to `.env`:

```bash
# Sentry Configuration
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
SENTRY_AUTH_TOKEN=<auth-token>  # For uploading source maps
SENTRY_ORG=<your-org>
SENTRY_PROJECT=ticketcap

# Environment
SENTRY_ENVIRONMENT=production  # or "development", "staging"

# Release Tracking (auto-set by CI/CD)
SENTRY_RELEASE=ticketcap@1.0.0+<git-sha>
```

### Sentry Configuration Files

**`sentry.server.config.ts`** (Server-side errors):

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  release: process.env.SENTRY_RELEASE,

  // Sample rate (1.0 = 100% of errors)
  sampleRate: 1.0,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Profiling (CPU, memory)
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Integrations
  integrations: [
    new Sentry.Integrations.Prisma({ client: prisma }),
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
    }

    // Add custom context
    if (event.contexts) {
      event.contexts.runtime = {
        name: 'node',
        version: process.version,
      }
    }

    return event
  },

  // Ignore known errors
  ignoreErrors: ['ResizeObserver loop limit exceeded', 'Non-Error promise rejection captured'],
})
```

**`sentry.client.config.ts`** (Client-side errors):

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay (privacy-safe)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  integrations: [
    new Sentry.Replay({
      maskAllText: true, // Mask all text (privacy)
      blockAllMedia: true, // Block images/video (privacy)
    }),
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/kartis\.info/],
    }),
  ],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove PII from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          delete breadcrumb.data.phone
          delete breadcrumb.data.email
        }
        return breadcrumb
      })
    }

    return event
  },
})
```

### Custom Error Contexts

Add context to errors for better debugging:

```typescript
import * as Sentry from '@sentry/nextjs'

// In API routes
export async function POST(request: Request) {
  const admin = await getCurrentAdmin()

  // Set user context
  Sentry.setUser({
    id: admin.id,
    email: admin.email,
    role: admin.role,
  })

  // Set custom context
  Sentry.setContext('school', {
    id: admin.schoolId,
    name: admin.schoolName,
  })

  try {
    // ... operation
  } catch (error) {
    // Add tags for filtering
    Sentry.setTag('operation', 'registration.create')
    Sentry.setTag('event_id', eventId)

    // Add breadcrumb for debugging
    Sentry.addBreadcrumb({
      category: 'registration',
      message: 'Capacity check failed',
      level: 'warning',
      data: {
        eventId,
        spotsRequested: 5,
        spotsAvailable: 2,
      },
    })

    Sentry.captureException(error)
    throw error
  }
}
```

### Source Maps for Production Debugging

Source maps are automatically uploaded by the Sentry webpack plugin during build.

**Verify in `next.config.ts`:**

```typescript
const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  // ... your config
}

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry webpack plugin options
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // Sentry SDK options
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring-tunnel', // Bypass ad-blockers
    hideSourceMaps: true, // Don't expose source maps publicly
    disableLogger: true,
  }
)
```

**Upload source maps during build:**

```bash
# Railway will automatically upload during deployment
# Make sure SENTRY_AUTH_TOKEN is set in Railway
railway run npm run build
```

### Release Tracking

Track releases with git commits:

```bash
# In Railway build script
export SENTRY_RELEASE="ticketcap@$(git rev-parse --short HEAD)"
npm run build
```

Update `package.json`:

```json
{
  "scripts": {
    "build": "SENTRY_RELEASE=ticketcap@$(git rev-parse --short HEAD) next build"
  }
}
```

---

## 3. Custom Metrics

See `lib/monitoring/metrics.ts` for implementation.

### Key Metrics to Track

**1. Registration Metrics**

- `registration.created` (count) - Total registrations
- `registration.confirmed` (count) - Confirmed registrations
- `registration.waitlisted` (count) - Waitlisted registrations
- `registration.duration` (histogram) - Time to complete registration
- `registration.capacity_utilization` (gauge) - % of capacity used

**2. Payment Metrics**

- `payment.created` (count) - Payment attempts
- `payment.completed` (count) - Successful payments
- `payment.failed` (count) - Failed payments
- `payment.processing_time` (histogram) - Time to process payment
- `payment.amount` (histogram) - Payment amounts (ILS)

**3. API Metrics**

- `api.request.duration` (histogram) - Request latency
- `api.request.count` (count) - Request count by endpoint
- `api.error.count` (count) - Error count by endpoint
- `api.error.rate` (gauge) - Error rate (%)

**4. Database Metrics**

- `db.query.duration` (histogram) - Query latency
- `db.connection.count` (gauge) - Active connections
- `db.transaction.duration` (histogram) - Transaction duration

**5. Business Metrics**

- `event.capacity_reached` (count) - Events at full capacity
- `waitlist.promotion` (count) - Waitlist promotions
- `school.active_events` (gauge) - Active events per school

---

## 4. Dashboard Setup

### Grafana Dashboard

Create a dashboard in Grafana Cloud with the following panels:

**Panel 1: Registration Overview**

- Metrics: `registration.created`, `registration.confirmed`, `registration.waitlisted`
- Visualization: Time series graph (stacked area)
- Time range: Last 24 hours

**Panel 2: Payment Success Rate**

- Metric: `payment.completed / payment.created * 100`
- Visualization: Gauge (target: >95%)
- Alert: <90% success rate

**Panel 3: API Latency (p50, p95, p99)**

- Metric: `api.request.duration` (histogram)
- Visualization: Time series graph (multi-line)
- Alert: p99 > 2000ms

**Panel 4: Error Rate**

- Metric: `api.error.rate`
- Visualization: Time series graph
- Alert: >1% error rate

**Panel 5: Capacity Utilization**

- Metric: `registration.capacity_utilization`
- Visualization: Bar chart (by event)
- Alert: >95% capacity

**Panel 6: Database Performance**

- Metrics: `db.query.duration` (p50, p95, p99)
- Visualization: Heatmap
- Alert: p95 > 500ms

**Export dashboard JSON:**

```json
{
  "dashboard": {
    "title": "TicketCap Production Monitoring",
    "panels": [
      {
        "title": "Registration Overview",
        "targets": [
          {
            "expr": "rate(registration_created_total[5m])",
            "legendFormat": "Created"
          },
          {
            "expr": "rate(registration_confirmed_total[5m])",
            "legendFormat": "Confirmed"
          },
          {
            "expr": "rate(registration_waitlisted_total[5m])",
            "legendFormat": "Waitlisted"
          }
        ],
        "type": "timeseries"
      }
    ]
  }
}
```

### Sentry Dashboard

Navigate to **Dashboards** → **Create Dashboard** in Sentry.

**Widgets to add:**

1. **Error Frequency** (Big Number)
   - Query: `event.type:error`
   - Display: Total count (last 24h)

2. **Error Rate by Endpoint** (Table)
   - Query: `event.type:error`
   - Group by: `transaction`
   - Display: Count, error rate

3. **Slowest Transactions** (Table)
   - Query: `event.type:transaction`
   - Sort by: `p95(transaction.duration)` DESC
   - Display: Transaction, p50, p95, p99

4. **Payment Errors** (Time Series)
   - Query: `event.type:error AND transaction:"/api/payment/*"`
   - Display: Count over time

5. **User Impact** (Big Number)
   - Query: `event.type:error`
   - Display: Unique users affected

### Alerting Rules

**Grafana Alerts:**

```yaml
# Alert: High Error Rate
- alert: HighErrorRate
  expr: api_error_rate > 1
  for: 5m
  annotations:
    summary: 'Error rate above 1%'
    description: 'API error rate is {{ $value }}%'

# Alert: Slow Payments
- alert: SlowPaymentProcessing
  expr: histogram_quantile(0.95, payment_processing_time_bucket) > 5000
  for: 10m
  annotations:
    summary: 'Payment processing slow'
    description: 'p95 payment time is {{ $value }}ms'

# Alert: Capacity Reached
- alert: EventCapacityReached
  expr: registration_capacity_utilization > 0.95
  for: 1m
  annotations:
    summary: 'Event near capacity'
    description: 'Event {{ $labels.event_id }} is {{ $value }}% full'
```

**Sentry Alerts:**

1. Navigate to **Alerts** → **Create Alert**
2. Choose **Issues**
3. Set conditions:
   - **When:** `event.type:error`
   - **If:** `count() > 10 in 1h`
   - **Then:** Send notification to Slack/Email

**Critical alerts:**

- Payment failures (>5 in 10 minutes)
- Database connection errors (any)
- Multi-tenant isolation failures (any)
- Capacity race conditions (any)

---

## 5. Railway Deployment

### Environment Variables

Set in Railway dashboard:

```bash
# Sentry
railway variables set SENTRY_DSN="https://..."
railway variables set SENTRY_AUTH_TOKEN="..."
railway variables set SENTRY_ORG="your-org"
railway variables set SENTRY_PROJECT="ticketcap"
railway variables set SENTRY_ENVIRONMENT="production"

# OpenTelemetry
railway variables set OTEL_SERVICE_NAME="ticketcap"
railway variables set OTEL_ENVIRONMENT="production"
railway variables set OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-prod-us-central-0.grafana.net/otlp"
railway variables set OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic ..."
railway variables set OTEL_TRACES_SAMPLER_ARG="0.1"  # 10% sampling
```

### Build Configuration

No changes needed - Next.js instrumentation hook runs automatically.

### Health Check Endpoint

Create `/app/api/health/route.ts` for Railway health checks:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.SENTRY_RELEASE || 'unknown',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
```

Update Railway health check settings:

- **Health Check Path:** `/api/health`
- **Health Check Timeout:** 10 seconds
- **Health Check Interval:** 30 seconds

---

## 6. Testing Monitoring

### Local Testing

1. **Start Jaeger:**

   ```bash
   docker-compose up -d jaeger
   ```

2. **Run dev server:**

   ```bash
   npm run dev
   ```

3. **Generate test traffic:**

   ```bash
   # Run Playwright tests to generate traces
   npm test
   ```

4. **View traces:**
   - Open http://localhost:16686
   - Select service: `ticketcap`
   - View traces for registration, payment, API calls

### Production Testing

1. **Deploy to Railway:**

   ```bash
   git push origin main
   ```

2. **Verify Sentry:**
   - Open https://sentry.io/organizations/your-org/projects/ticketcap/
   - Check for errors and performance data

3. **Verify Grafana:**
   - Open https://your-org.grafana.net
   - Navigate to **Explore** → **Tempo** (traces)
   - Query: `{service.name="ticketcap"}`

4. **Trigger test error:**

   ```bash
   curl https://kartis.info/api/test-error
   ```

5. **Check alerts:**
   - Verify Slack/Email notifications
   - Check alert history in Grafana

---

## 7. Best Practices

### Performance

1. **Sample traces in production** - Use 10% sampling to reduce costs
2. **Use span attributes sparingly** - Avoid large payloads
3. **Batch metric exports** - Export every 60 seconds (not real-time)
4. **Filter sensitive data** - Remove PII from traces and errors

### Security

1. **Never log sensitive data** - Phone numbers, emails, passwords
2. **Use beforeSend hooks** - Filter data before sending to Sentry
3. **Rotate auth tokens** - SENTRY_AUTH_TOKEN, OTEL_EXPORTER_OTLP_HEADERS
4. **Enable source map hiding** - `hideSourceMaps: true` in Sentry config

### Debugging

1. **Use breadcrumbs** - Add context before operations
2. **Set custom contexts** - schoolId, eventId, userId
3. **Tag errors** - operation, endpoint, error_type
4. **Link traces to errors** - Use `trace_id` to correlate

### Maintenance

1. **Review dashboards weekly** - Adjust alert thresholds
2. **Archive old releases** - Keep last 10 releases in Sentry
3. **Clean up test data** - Filter test events from production metrics
4. **Update dependencies** - OpenTelemetry and Sentry SDK

---

## 8. Troubleshooting

### Traces not appearing in Jaeger

**Solution:**

```bash
# Check if OTLP receiver is running
curl http://localhost:4318/v1/traces

# Verify environment variable
echo $OTEL_EXPORTER_OTLP_ENDPOINT

# Restart dev server
npm run dev
```

### Sentry errors not captured

**Solution:**

```bash
# Verify DSN is set
echo $SENTRY_DSN

# Test Sentry manually
node -e "require('@sentry/nextjs').captureMessage('Test error')"

# Check browser console for Sentry initialization errors
```

### Source maps not uploaded

**Solution:**

```bash
# Verify auth token
echo $SENTRY_AUTH_TOKEN

# Upload manually
npx sentry-cli releases files <release> upload-sourcemaps .next

# Check .sentryclirc file exists
cat .sentryclirc
```

### High costs (Sentry/Grafana)

**Solution:**

- Reduce trace sampling: `OTEL_TRACES_SAMPLER_ARG=0.05` (5%)
- Reduce replay sampling: `replaysSessionSampleRate: 0.01` (1%)
- Filter noisy errors: Add to `ignoreErrors` array
- Archive old data: Reduce retention period

---

## 9. Next Steps

After completing this setup:

1. ✅ Monitor production for 1 week
2. ✅ Adjust alert thresholds based on real traffic
3. ✅ Create runbook for common errors (docs/runbooks/)
4. ✅ Train team on dashboard usage
5. ✅ Set up weekly monitoring review meeting
6. ✅ Document incident response process

---

## Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Grafana Cloud Setup](https://grafana.com/docs/grafana-cloud/quickstart/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Prisma OpenTelemetry](https://www.prisma.io/docs/concepts/components/prisma-client/opentelemetry-tracing)

---

**Last Updated:** 2026-01-12
**Maintained By:** Development Team

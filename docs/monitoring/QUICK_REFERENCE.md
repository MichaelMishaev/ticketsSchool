# Monitoring Quick Reference

Quick reference for common monitoring tasks.

## Common Imports

```typescript
// OpenTelemetry
import {
  createSpan,
  traceRegistration,
  tracePayment,
  addSpanAttributes,
} from '@/lib/monitoring/telemetry'

// Sentry
import {
  initSentryForRequest,
  setUserContext,
  setSchoolContext,
  setEventContext,
  addBreadcrumb,
  captureError,
} from '@/lib/monitoring/sentry'

// Metrics
import { trackRegistration, trackPayment, trackAPICall, startTimer } from '@/lib/monitoring/metrics'
```

## Quick Patterns

### API Route Skeleton

```typescript
export async function POST(request: Request) {
  const stopTimer = startTimer()
  initSentryForRequest(request)

  try {
    const admin = await getCurrentAdmin()
    setUserContext(admin.id, admin.email)

    // ... your logic here

    trackAPICall('/api/endpoint', 'POST', 200, stopTimer())
    return NextResponse.json({ success: true })
  } catch (error) {
    trackAPICall('/api/endpoint', 'POST', 500, stopTimer())
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### Registration Flow

```typescript
const result = await traceRegistration(eventId, spotsCount, async () => {
  addBreadcrumb('registration', 'Starting registration')

  const registration = await prisma.$transaction(async (tx) => {
    // ... atomic registration logic
  })

  trackRegistration(eventId, registration.status, stopTimer())
  return registration
})
```

### Payment Flow

```typescript
const payment = await tracePayment(amount, currency, async () => {
  addBreadcrumb('payment', 'Creating payment')
  setPaymentContext(paymentId, orderId)

  // ... payment logic

  trackPayment(amount, 'COMPLETED', stopTimer(), currency)
  return payment
})
```

### Database Query

```typescript
const queryTimer = startTimer()
const events = await prisma.event.findMany({ where: { ... } })
trackDatabaseQuery('event', 'findMany', queryTimer())
```

### Custom Span

```typescript
await createSpan(
  'custom.operation',
  async (span) => {
    span.setAttribute('key', 'value')
    // ... do work
  },
  { operation: 'custom' }
)
```

## Environment Variables

```bash
# Sentry
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
SENTRY_ENVIRONMENT=production

# OpenTelemetry
OTEL_SERVICE_NAME=ticketcap
OTEL_EXPORTER_OTLP_ENDPOINT=https://...
OTEL_TRACES_SAMPLER_ARG=0.1  # 10% sampling
```

## Common Grafana Queries

```promql
# Registration rate (per minute)
rate(registration_created_total[5m])

# Payment success rate
(rate(payment_completed_total[5m]) / rate(payment_created_total[5m])) * 100

# API latency p95
histogram_quantile(0.95, api_request_duration_bucket)

# Error rate
(rate(api_error_count_total[5m]) / rate(api_request_count_total[5m])) * 100

# Capacity utilization
registration_capacity_utilization{event_id="..."}
```

## Sentry Filters

```
# Find all payment errors
event.type:error AND transaction:"/api/payment/*"

# Find errors for specific school
school_id:abc123

# Find slow transactions (>2s)
event.type:transaction AND transaction.duration:>2000

# Find errors affecting users
event.type:error AND user.id:*
```

## Alert Thresholds

| Metric               | Warning | Critical |
| -------------------- | ------- | -------- |
| Error Rate           | >1%     | >5%      |
| Payment Success      | <95%    | <90%     |
| API Latency (p95)    | >1s     | >2s      |
| Database Query (p95) | >500ms  | >1s      |
| Capacity Utilization | >90%    | >98%     |

## Dashboard Links

- **Grafana:** https://your-org.grafana.net/d/ticketcap
- **Sentry:** https://sentry.io/organizations/your-org/projects/ticketcap/
- **Jaeger (Local):** http://localhost:16686

## Troubleshooting

### No traces in Jaeger

```bash
# Check OTLP endpoint
curl http://localhost:4318/v1/traces

# Verify environment variable
echo $OTEL_EXPORTER_OTLP_ENDPOINT

# Restart dev server
npm run dev
```

### Sentry errors not captured

```bash
# Test manually
node -e "require('@sentry/nextjs').captureMessage('Test')"

# Check DSN
echo $SENTRY_DSN
```

### High costs

```bash
# Reduce sampling
OTEL_TRACES_SAMPLER_ARG=0.05  # 5%

# Filter noisy errors (sentry.server.config.ts)
ignoreErrors: ['ResizeObserver loop limit exceeded']
```

## Support

- OpenTelemetry: https://opentelemetry.io/docs/
- Sentry: https://docs.sentry.io/
- Internal Docs: /docs/monitoring/PRODUCTION_MONITORING_SETUP.md

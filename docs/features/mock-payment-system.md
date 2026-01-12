# Mock Payment System (YaadPay)

## Overview

The mock payment system allows local development and testing of payment flows without connecting to the real YaadPay payment gateway. This solves the domain validation error that occurs when testing payments from localhost.

## Configuration

### Enable Mock Mode

Add to your `.env` file:
```bash
YAADPAY_MOCK_MODE="true"  # Enable mock payments (bypass YaadPay)
```

### Disable Mock Mode (Use Real YaadPay)

Remove the variable or set to `"false"`:
```bash
YAADPAY_MOCK_MODE="false"  # Use real YaadPay gateway
```

**Important:** Restart the dev server after changing this variable:
```bash
npm run dev
```

## How Mock Mode Works

### Flow Diagram

```
User fills registration form
↓
Clicks "המשך לתשלום" (Continue to Payment)
↓
POST /api/payment/create
  - Creates registration with paymentStatus="PROCESSING"
  - Creates payment record with status="PROCESSING"
  - Generates mock payment intent ID
↓
IF YAADPAY_MOCK_MODE="true":
  Shows green mock payment screen (2 seconds)
  - "✅ תשלום אומת בהצלחה (מצב בדיקה)"
  - "🧪 MOCK MODE - Development Only" badge
↓
Auto-redirect to /api/payment/callback?CCode=0&Order=...&Id=MOCK-...
↓
Callback validates payment
  - Updates payment status to "COMPLETED"
  - Updates registration paymentStatus to "COMPLETED"
  - Generates QR code
  - Sends confirmation email
↓
Redirect to /payment/success?code=[confirmationCode]
```

### Mock Parameters Generated

When mock mode is enabled, the following YaadPay response parameters are simulated:

- `CCode: "0"` - Success code (0 = success in YaadPay)
- `Order: [paymentIntentId]` - Your unique payment intent ID (cuid)
- `Id: "MOCK-[timestamp]"` - Mock transaction ID
- `ConfirmationCode: "MOCK-[random]"` - Mock confirmation code
- `Amount: [actual amount]` - Real amount from registration
- `Param1: [metadata JSON]` - Contains eventId, schoolId, registrationId

## Testing Payment Flow

### 1. Create Event with Payment

```typescript
// In admin dashboard
Event Settings:
- Payment Required: ✅ Yes
- Payment Timing: Upfront
- Pricing Model: Fixed Price or Per Guest
- Price Amount: 10.00 ILS (or any amount)
```

### 2. Access Public Registration

Navigate to: `http://localhost:9000/p/[schoolSlug]/[eventSlug]`

### 3. Fill Registration Form

Required fields for payment events:
- Name
- Phone (Israeli format: 10 digits starting with 0)
- Email (REQUIRED for payment events)
- Any custom fields configured

### 4. Submit Payment

Click "המשך לתשלום" button

### 5. Observe Mock Payment Screen

You should see:
```
✅ תשלום אומת בהצלחה (מצב בדיקה)
מעביר אותך לאישור ההרשמה...
🧪 MOCK MODE - Development Only
```

Green gradient background with spinning loader

### 6. Success Page

After 2 seconds, you're redirected to:
```
/payment/success?code=[CONFIRMATION-CODE]
```

Shows:
- Success message
- Event details
- Confirmation code
- QR code (for check-in)
- Option to add to calendar

### 7. Check Email

Confirmation email sent to the email provided in registration form with:
- Event details
- Confirmation code
- QR code attachment
- Cancellation link (if enabled)

## Code Implementation

### Location: `/app/api/payment/create/route.ts`

```typescript
// Lines 299-394
if (process.env.YAADPAY_MOCK_MODE === 'true') {
  console.log('[Payment] MOCK MODE: Simulating successful payment')

  // Generate mock callback params
  const mockParams = new URLSearchParams({
    CCode: '0',  // Success
    Order: result.payment.yaadPayOrderId!,
    Id: `MOCK-${Date.now()}`,
    ConfirmationCode: `MOCK-${Math.random().toString(36).substring(7).toUpperCase()}`,
    Amount: amountDue.toString(),
    Param1: JSON.stringify({ /* metadata */ })
  })

  // Return green screen HTML with auto-redirect
  return new NextResponse(mockRedirectHTML, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
```

### Location: `/app/api/payment/callback/route.ts`

```typescript
// Callback handler (unchanged)
// Processes both real and mock payments identically
// Lines 46-287
async function handleCallback(request: NextRequest) {
  // Parse callback params (works for both mock and real)
  const params = parseCallbackParams(request)

  // Validate callback
  const validation = validateCallback(params)

  // Update payment + registration in transaction
  // Send confirmation email
  // Redirect to success/failed page
}
```

## Database Records

### Mock Payment Record

```sql
SELECT * FROM "Payment" WHERE "yaadPayOrderId" = 'kn88cuf75drholow8ickm1ks';

id                     | cmkaaxf090001it9uv07shtss
schoolId               | cmka9d0pg0000itkp48ujfxor
eventId                | cmka9d0pg0005itkp5l3gdx6t
registrationId         | cmkaaxf090001it9uv07shtss
amount                 | 10.00
currency               | ILS
status                 | COMPLETED
paymentMethod          | yaadpay
yaadPayOrderId         | kn88cuf75drholow8ickm1ks
yaadPayTransactionId   | MOCK-1736631020456
yaadPayConfirmCode     | MOCK-A7K3PQ
completedAt            | 2026-01-11T22:30:25.000Z
```

### Mock Registration Record

```sql
SELECT * FROM "Registration" WHERE "paymentIntentId" = 'kn88cuf75drholow8ickm1ks';

id                     | cmkaaxf090001it9uv07shtss
eventId                | cmka9d0pg0005itkp5l3gdx6t
status                 | CONFIRMED
paymentStatus          | COMPLETED
paymentIntentId        | kn88cuf75drholow8ickm1ks
amountDue              | 10.00
amountPaid             | 10.00
confirmationCode       | A7K3PQ
```

## Benefits of Mock Mode

### 1. **No External Dependencies**
- Test payments without YaadPay credentials
- No domain whitelisting required
- Works on localhost, Docker, CI/CD

### 2. **Fast Iteration**
- No waiting for external API
- Instant payment confirmation
- No network latency

### 3. **Deterministic Testing**
- Always returns success (CCode=0)
- Predictable behavior for E2E tests
- No flaky test failures

### 4. **Cost Savings**
- No test transaction fees
- No accidental real charges
- Safe for development

### 5. **Offline Development**
- Works without internet connection
- No VPN or ngrok required
- Full local development

## Production Deployment

**⚠️ CRITICAL:** Mock mode must be DISABLED in production.

### Railway Environment Variables

```bash
# Production .env (Railway)
YAADPAY_MOCK_MODE="false"  # ❌ MUST BE FALSE IN PRODUCTION
# Or remove this variable entirely

# Use real YaadPay credentials
YAADPAY_MASOF="0010342319"
YAADPAY_API_SECRET="de16c30ee166641da366bb04e3d0d53e0629adf6"
YAADPAY_DOMAIN_ID="hyp1234"
YAADPAY_BASE_URL="https://yaadpay.co.il/p/"
```

### Verification

Check production logs for:
```
[YaadPay] Creating payment request: {
  orderId: '...',
  amount: '10.00',
  masof: '0010342319',  // Real terminal number
  testMode: false
}
```

If you see `MOCK MODE` in production logs, IMMEDIATELY disable mock mode.

## E2E Testing with Mock Mode

### Playwright Tests

```typescript
// tests/suites/payment-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Payment Flow (Mock Mode)', () => {
  test('should complete payment successfully', async ({ page }) => {
    // Ensure YAADPAY_MOCK_MODE="true" in .env.test

    // Navigate to event registration
    await page.goto('/p/test-school/test-event')

    // Fill registration form
    await page.fill('[name="name"]', 'Test User')
    await page.fill('[name="phone"]', '0501234567')
    await page.fill('[name="email"]', 'test@example.com')

    // Submit payment
    await page.click('button:has-text("המשך לתשלום")')

    // Should see mock payment screen
    await expect(page.locator('text=תשלום אומת בהצלחה')).toBeVisible()
    await expect(page.locator('text=MOCK MODE')).toBeVisible()

    // Wait for auto-redirect to success page
    await page.waitForURL(/\/payment\/success/)

    // Verify confirmation code is shown
    await expect(page.locator('text=קוד אישור')).toBeVisible()
  })
})
```

## Troubleshooting

### Mock Mode Not Working

**Symptom:** Still seeing YaadPay validation error

**Solution:**
1. Verify `.env` has `YAADPAY_MOCK_MODE="true"` (with quotes)
2. Restart dev server: `npm run dev`
3. Clear browser cache and cookies
4. Check server logs for `[Payment] MOCK MODE: Simulating successful payment`

### Payment Stuck on Mock Screen

**Symptom:** Green screen shows but doesn't redirect

**Solution:**
1. Check browser console for JavaScript errors
2. Verify callback URL is correct: `http://localhost:9000/api/payment/callback`
3. Check database for payment record with status="PROCESSING"
4. Manually navigate to callback URL with mock params

### Email Not Sent

**Symptom:** Payment succeeds but no confirmation email

**Solution:**
1. Check `RESEND_API_KEY` is configured
2. In development, only sends to your Resend account owner email
3. Check server logs for email errors
4. Email sending failures don't block payment success

### Database Issues

**Symptom:** Payment created but registration not found

**Solution:**
1. Check foreign key constraint: `registrationId` must exist
2. Verify transaction completed successfully
3. Check for isolation level errors (Serializable conflicts)
4. Review server logs for transaction errors

## Security Considerations

### Mock Mode Detection

The `/lib/yaadpay.ts` library checks for mock mode:

```typescript
if (process.env.YAADPAY_MOCK_MODE === 'true') {
  // Mock mode enabled
}
```

### Preventing Mock Mode in Production

**Railway Build Hook (Recommended):**

Add to `package.json`:
```json
{
  "scripts": {
    "build": "npm run validate:env && next build",
    "validate:env": "node scripts/validate-production-env.js"
  }
}
```

**scripts/validate-production-env.js:**
```javascript
if (process.env.NODE_ENV === 'production' &&
    process.env.YAADPAY_MOCK_MODE === 'true') {
  console.error('❌ ERROR: YAADPAY_MOCK_MODE cannot be enabled in production')
  process.exit(1)
}
```

## Logs and Monitoring

### Development Logs

```
[Payment] MOCK MODE: Simulating successful payment
[Payment] Created payment session: {
  paymentIntentId: 'kn88cuf75drholow8ickm1ks',
  registrationId: 'cmkaaxf090001it9uv07shtss',
  eventId: 'cmka9d0pg0005itkp5l3gdx6t',
  amount: '10.00',
  currency: 'ILS'
}
[Payment Callback] Received: {
  CCode: '0',
  Order: 'kn88cuf75drholow8ickm1ks',
  Id: 'MOCK-1736631020456',
  method: 'GET'
}
[Payment Callback] Payment successful, sending confirmation email
[Payment Callback] Confirmation email sent to: test@example.com
```

### Production Logs (Mock Disabled)

```
[YaadPay] Creating payment request: {
  orderId: 'kn88cuf75drholow8ickm1ks',
  amount: '10.00',
  masof: '0010342319',
  testMode: false
}
[Payment] Created payment session: { ... }
```

## Related Files

- `/app/api/payment/create/route.ts` - Payment creation + mock mode logic
- `/app/api/payment/callback/route.ts` - Callback handler (works with both)
- `/lib/yaadpay.ts` - YaadPay client library
- `/app/payment/success/page.tsx` - Success page
- `/app/payment/failed/page.tsx` - Failure page
- `/.env.example` - Environment variable template
- `/docs/3rdparty/creaditCardService/instructions.md` - YaadPay credentials

## Summary

✅ **Mock Mode Enabled:** All payments succeed instantly without external API
✅ **Use for:** Local development, testing, CI/CD, offline work
❌ **Never use in:** Production, staging with real users
✅ **Always verify:** Check logs, database, email confirmation
✅ **Documentation:** This file, code comments, .env.example

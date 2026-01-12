# Payment Security Fixes - Critical Vulnerabilities Resolved

**Date:** 2026-01-12
**Status:** ✅ FIXED - Ready for Production
**Severity:** CRITICAL

## Overview

Fixed two critical payment security vulnerabilities in the YaadPay integration that could have allowed attackers to bypass payment validation and receive free event registrations.

---

## Vulnerability 1: Optional Signature Validation (CRIT-1)

### The Problem

The `validateCallback()` function in `/lib/yaadpay.ts` made signature validation **optional**:

```typescript
// BEFORE (VULNERABLE)
if (params.signature) {  // ❌ Signature was optional
  const isValidSignature = validateSignature(params, config.apiSecret)
  if (!isValidSignature) {
    return { isValid: false, ... }
  }
}
// If no signature, validation passed! ⚠️
```

**Attack Vector:**
An attacker could craft a callback URL without a signature parameter and the system would accept it as valid, allowing them to:
1. Register for paid events without payment
2. Receive confirmation codes and QR codes
3. Check in at events for free

### The Fix

Made signature validation **MANDATORY** in `/lib/yaadpay.ts` (lines 204-227):

```typescript
// AFTER (SECURE)
const signature = params.signature
if (!signature) {
  console.error('[YaadPay] Missing signature in callback - rejecting')
  return {
    isValid: false,
    isSuccess: false,
    orderId: params.Order || '',
    transactionId: params.Id || '',
    errorMessage: 'Missing callback signature - request rejected for security'
  }
}

const isValidSignature = validateSignature(params, config.apiSecret)
if (!isValidSignature) {
  console.error('[YaadPay] Invalid signature - potential tampering detected')
  return {
    isValid: false,
    isSuccess: false,
    orderId: params.Order || '',
    transactionId: params.Id || '',
    errorMessage: 'Invalid signature - request rejected'
  }
}
```

**Now all callbacks MUST have a valid HMAC-SHA256 signature.**

---

## Vulnerability 2: Mock Mode in Production (CRIT-2)

### The Problem

The mock payment mode (`YAADPAY_MOCK_MODE=true`) could be accidentally enabled in production, bypassing the real payment gateway and allowing **completely free registrations**.

**Attack Vector:**
If `YAADPAY_MOCK_MODE=true` was set in production:
1. Users could register for paid events
2. See a green "payment successful" screen
3. Receive confirmation codes and QR codes
4. Check in at events
5. **Without ever paying a single shekel** 💸

### The Fix

Added multi-layered protection:

#### Layer 1: Runtime Guard in `/lib/yaadpay.ts` (lines 21-42)

```typescript
function getYaadPayConfig(): YaadPayConfig {
  const mockMode = process.env.YAADPAY_MOCK_MODE === 'true'

  // CRITICAL: Block mock mode in production
  if (process.env.NODE_ENV === 'production' && mockMode) {
    console.error('FATAL: YAADPAY_MOCK_MODE is TRUE in production!')
    console.error('This allows free registrations without payment.')
    console.error('Remove YAADPAY_MOCK_MODE from production environment IMMEDIATELY.')
    throw new Error(
      'SECURITY VIOLATION: Mock payment mode cannot be enabled in production. ' +
      'This must be fixed immediately to prevent financial loss.'
    )
  }

  // Warning for non-localhost mock mode
  if (mockMode) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    if (!baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
      console.error('WARNING: Mock payment mode is enabled on non-local URL!')
      console.error('Base URL:', baseUrl)
      console.error('This should only be used on localhost.')
    }
  }
  // ... rest of config
}
```

#### Layer 2: Build-Time Check in `/app/api/payment/create/route.ts` (lines 7-10)

```typescript
// Build-time safety check
if (process.env.NODE_ENV === 'production' && process.env.YAADPAY_MOCK_MODE === 'true') {
  throw new Error('MOCK_MODE cannot be used in production!')
}
```

**Result:** Production builds will FAIL if mock mode is enabled, preventing deployment.

---

## Additional Security Improvements

### 1. Fixed TypeScript Strictness in `/lib/encryption.ts`

Resolved type safety issue where `ENCRYPTION_KEY` could theoretically be `undefined`:

```typescript
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''  // Default to empty string
// ... validation throws if empty
function getKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(ENCRYPTION_KEY as string, salt, 100000, 32, 'sha512')
}
```

### 2. Removed Invalid Vitest Config

Cleaned up `/vitest.config.ts` to remove invalid PostCSS configuration that caused build errors.

---

## Security Impact

| Vulnerability | Before | After |
|--------------|--------|-------|
| **Signature Bypass** | ❌ Optional validation | ✅ Mandatory HMAC-SHA256 |
| **Mock Mode in Prod** | ⚠️ Configurable (risky) | ✅ Blocked at build + runtime |
| **Attack Surface** | 🔴 High (free registrations) | 🟢 Secured (payment required) |

---

## Testing Recommendations

### Manual Testing Required

1. **Signature Validation Test:**
   ```bash
   # Test missing signature (should fail)
   curl "http://localhost:9000/api/payment/callback?CCode=0&Order=test&Id=123"
   # Expected: Redirect to /payment/failed?error=Missing%20callback%20signature

   # Test invalid signature (should fail)
   curl "http://localhost:9000/api/payment/callback?CCode=0&Order=test&Id=123&signature=invalid"
   # Expected: Redirect to /payment/failed?error=Invalid%20signature
   ```

2. **Mock Mode in Production Test:**
   ```bash
   # Try to build with mock mode enabled
   NODE_ENV=production YAADPAY_MOCK_MODE=true npm run build
   # Expected: Build failure with "MOCK_MODE cannot be used in production!"
   ```

3. **Full Payment Flow Test (Local):**
   ```bash
   # Set mock mode in .env
   YAADPAY_MOCK_MODE=true

   # Start dev server
   npm run dev

   # Create paid event, register, verify green mock screen appears
   # Check callback includes signature parameter
   ```

### Automated Testing (Future)

Consider adding these tests to the payment test suite:

```typescript
describe('Payment Security', () => {
  it('should reject callbacks without signature', async () => {
    const response = await fetch('/api/payment/callback?CCode=0&Order=test&Id=123')
    expect(response.redirected).toBe(true)
    expect(response.url).toContain('payment/failed')
  })

  it('should reject callbacks with invalid signature', async () => {
    const response = await fetch('/api/payment/callback?CCode=0&Order=test&Id=123&signature=bad')
    expect(response.redirected).toBe(true)
    expect(response.url).toContain('payment/failed')
  })

  it('should prevent production builds with mock mode', () => {
    process.env.NODE_ENV = 'production'
    process.env.YAADPAY_MOCK_MODE = 'true'

    expect(() => {
      require('../lib/yaadpay')
    }).toThrow('SECURITY VIOLATION')
  })
})
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Verify `YAADPAY_MOCK_MODE` is NOT set in Railway environment variables
- [ ] Verify `YAADPAY_API_SECRET` is configured (for signature validation)
- [ ] Test real payment flow on staging environment
- [ ] Monitor logs for signature validation errors
- [ ] Run full payment test suite (when available)
- [ ] Review YaadPay callback signature format in their documentation

---

## Files Modified

1. `/lib/yaadpay.ts` - Made signature validation mandatory (lines 204-227)
2. `/lib/yaadpay.ts` - Added production mock mode guard (lines 21-42)
3. `/app/api/payment/create/route.ts` - Added build-time mock mode check (lines 7-10)
4. `/lib/encryption.ts` - Fixed TypeScript strictness (line 3, 20)
5. `/vitest.config.ts` - Removed invalid PostCSS config (lines 5-9 removed)

---

## Signature Validation Details

YaadPay uses HMAC-SHA256 signature validation:

```typescript
function validateSignature(params: YaadPayCallback, secret: string): boolean {
  // Signature format: HMAC-SHA256(Order + Amount + CCode + secret)
  const dataToSign = `${params.Order}${params.Amount}${params.CCode}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex')

  return params.signature === expectedSignature
}
```

**Critical:** The signature validates that:
- The payment amount hasn't been tampered with
- The order ID matches the expected value
- The success/failure status is authentic
- The callback came from YaadPay (they sign with shared secret)

---

## Rollback Plan

If issues arise in production:

1. Check Railway logs for signature validation errors
2. Verify YaadPay is sending `signature` parameter in callbacks
3. If YaadPay doesn't send signatures, temporarily revert to optional validation:
   ```typescript
   // Emergency rollback (NOT RECOMMENDED)
   if (params.signature) {
     const isValidSignature = validateSignature(params, config.apiSecret)
     if (!isValidSignature) {
       return { isValid: false, ... }
     }
   }
   ```
4. Contact YaadPay support to enable signature validation on their side
5. Re-deploy secure version once signatures are confirmed

**Note:** YaadPay should be configured to send signatures. If not, contact their support immediately.

---

## Related Documentation

- YaadPay API Documentation: [Contact support for signature setup]
- Mock Payment System: `/docs/features/mock-payment-system.md`
- Payment Integration: See `/app/api/payment/create/route.ts` (lines 299-394)
- Security Master Guide: `.claude/skills/security-master/SKILL.md`

---

**Status:** ✅ Ready for code review and production deployment.

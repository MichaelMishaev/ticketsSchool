# 🔴 CRITICAL: Payment Bypass Vulnerability - FIXED

**Date:** 2026-01-10
**Severity:** CRITICAL (Revenue Loss + Security Vulnerability)
**Status:** ✅ FIXED
**Testing:** Ready for verification

---

## 🚨 What Was the Problem?

Events configured with **payment required** were allowing users to register for FREE, bypassing payment entirely.

**Your Event:**
- Event: "נתניה תל אביב" (ID: cmk8tq6r00001itqa7gp6p4xw)
- Payment: Required (₪10 per person)
- Timing: UPFRONT (payment before registration)
- Users were able to register WITHOUT PAYMENT ❌

---

## 🔍 Root Cause: TWO Critical Bugs Working Together

### Bug #1: Payment API Field Mismatch
**File:** `/app/api/payment/create/route.ts` (Line 133)

**Problem:**
```typescript
// Payment API expected 'guestsCount' (for table-based events)
const guestsCount = Number(registrationData.guestsCount)  // ❌ undefined for capacity-based

// But capacity-based events send 'spotsCount'
// Frontend: { spotsCount: 2 }  →  Payment API: expects guestsCount
// Result: Payment creation failed with "Invalid guest count"
```

**Impact:** Payment API returned 400 error, preventing payment creation

---

### Bug #2: Registration API Security Hole (MORE CRITICAL)
**File:** `/app/api/p/[schoolSlug]/[eventSlug]/register/route.ts` (Line 275)

**Problem:**
```typescript
// Only checked for POST_REGISTRATION payment
const requiresPostPayment = event.paymentRequired && event.paymentTiming === 'POST_REGISTRATION'

// UPFRONT events: requiresPostPayment = false
// ❌ API treated UPFRONT events as FREE
// ❌ Created registration without payment
// ❌ Generated QR code
// ❌ Sent confirmation email
// ❌ User got in for FREE!
```

**Impact:** Users could bypass payment by calling registration API directly

---

## ✅ The Fixes

### Fix #1: Payment API - Accept Both spotsCount and guestsCount
**File:** `/app/api/payment/create/route.ts` (Lines 131-143)

**BEFORE:**
```typescript
} else if (event.pricingModel === 'PER_GUEST') {
  const guestsCount = Number(registrationData.guestsCount)  // ❌ Only guestsCount

  if (!guestsCount || guestsCount < 1) {
    return NextResponse.json(
      { error: 'Invalid guest count for per-guest pricing' },
      { status: 400 }
    )
  }

  amountDue = event.priceAmount.mul(guestsCount)
}
```

**AFTER:**
```typescript
} else if (event.pricingModel === 'PER_GUEST') {
  // Price per guest/spot (works for both TABLE_BASED and CAPACITY_BASED events)
  // TABLE_BASED events send 'guestsCount', CAPACITY_BASED events send 'spotsCount'
  const participantCount = Number(registrationData.guestsCount || registrationData.spotsCount)  // ✅ Both!

  if (!participantCount || participantCount < 1) {
    return NextResponse.json(
      { error: 'Invalid participant count for per-guest pricing' },
      { status: 400 }
    )
  }

  amountDue = event.priceAmount.mul(participantCount)
}
```

**Result:** Payment API now works for both TABLE_BASED and CAPACITY_BASED events

---

### Fix #2: Registration API - Reject UPFRONT Payment Events
**File:** `/app/api/p/[schoolSlug]/[eventSlug]/register/route.ts` (Lines 69-74)

**ADDED:**
```typescript
// CRITICAL SECURITY CHECK: Reject UPFRONT payment events
// UPFRONT payment events must go through the payment API first (/api/payment/create)
// This prevents users from bypassing payment by calling the registration API directly
if (event.paymentRequired && event.paymentTiming === 'UPFRONT') {
  throw new Error('This event requires upfront payment. Please complete payment first.')
}
```

**Result:** Users CANNOT bypass payment by calling registration API directly

---

## 🧪 How to Test the Fix

### 1. Test Payment Flow (Should Work Now)

```bash
# Navigate to your event:
http://localhost:9000/p/tests/ntnyh-tl-abyb

# Fill in the form:
- Name: Test User
- Phone: 0501234567
- Email: test@test.com
- Spots: 2

# Click "המשך לתשלום (₪20)" button
```

**Expected Result:**
- ✅ Payment API accepts the request (no "Invalid guest count" error)
- ✅ Returns HTML redirect form
- ✅ Auto-submits to YaadPay payment page
- ✅ User sees payment page (or test mode message)

**Note:** Payment will redirect to YaadPay. If YaadPay credentials are not configured, you'll see an error about missing credentials (expected in dev mode).

---

### 2. Test Security Fix (Should Reject)

Try to bypass payment by calling registration API directly:

```bash
curl -X POST http://localhost:9000/api/p/tests/ntnyh-tl-abyb/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Bypass",
    "phone": "0509999999",
    "email": "bypass@test.com",
    "spotsCount": 2
  }'
```

**Expected Result:**
```json
{
  "error": "This event requires upfront payment. Please complete payment first."
}
```

**Status Code:** 400 (Bad Request)

---

## 📋 Files Modified

1. **`/app/api/payment/create/route.ts`**
   - Lines 131-143: Accept both `spotsCount` and `guestsCount`
   - Updated error message to "Invalid participant count"

2. **`/app/api/p/[schoolSlug]/[eventSlug]/register/route.ts`**
   - Lines 69-74: Added security check to reject UPFRONT payment events
   - Prevents payment bypass vulnerability

3. **`/app/docs/bugs/bugs.md`**
   - Added Bug #18: Payment API Field Mismatch
   - Added Bug #19: Registration API Security Hole
   - Full documentation with root cause, fix, and testing

4. **`/BUG-REPORT-PAYMENT-BYPASS.md`**
   - Detailed analysis of the vulnerability

---

## ✅ Verification Checklist

Before deploying to production, verify:

### Frontend Flow (User Experience)
- [ ] Navigate to paid event registration page
- [ ] Fill in all required fields
- [ ] Select number of spots/participants
- [ ] Click "המשך לתשלום" button
- [ ] Verify payment API is called (check Network tab)
- [ ] Verify NO "Invalid guest count" error
- [ ] Verify redirects to payment page (or shows error if YaadPay not configured)

### Security (Payment Bypass Prevention)
- [ ] Try calling registration API directly (should return 400 error)
- [ ] Verify error message: "This event requires upfront payment"
- [ ] Verify NO registration is created
- [ ] Verify NO QR code is generated
- [ ] Verify NO confirmation email is sent

### Free Events (Should Still Work)
- [ ] Create a FREE event (paymentRequired: false)
- [ ] Register through public page
- [ ] Verify registration works normally
- [ ] Verify QR code generated
- [ ] Verify confirmation email sent

### POST_REGISTRATION Events (Should Still Work)
- [ ] Create POST_REGISTRATION payment event
- [ ] Register through public page
- [ ] Verify registration created with PENDING payment
- [ ] Verify email sent with payment link
- [ ] Verify QR code NOT generated yet

---

## 🚀 Next Steps

### 1. Local Testing (NOW)
```bash
# Start dev server
npm run dev

# Test the payment flow
# Navigate to: http://localhost:9000/p/tests/ntnyh-tl-abyb
```

### 2. YaadPay Configuration (Before Production)
You need to configure YaadPay credentials in your environment:

```env
# .env.local (development) or Railway variables (production)
YAADPAY_MASOF="your-terminal-number"
YAADPAY_API_SECRET="your-api-secret"
YAADPAY_DOMAIN_ID="your-domain-id"
YAADPAY_BASE_URL="https://yaadpay.co.il/p/"
YAADPAY_TEST_MODE="false"
```

**Without these configured:**
- Payment API will return error: "Payment system not configured"
- This is expected behavior to prevent accidental production payments in dev

### 3. Production Deployment
```bash
# After testing locally, deploy fixes:
git add .
git commit -m "fix(payment): critical payment bypass vulnerabilities

- Fix payment API to accept both spotsCount and guestsCount
- Add security check to reject UPFRONT payment events
- Prevent revenue loss from payment bypass
- See PAYMENT-BYPASS-FIX-SUMMARY.md for details

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to Railway (auto-deploys)
git push origin development
```

---

## 💰 Impact

### Before Fix
- **Revenue at risk:** Unlimited (all paid events could be bypassed)
- **Security:** Users could attend ANY paid event for free
- **Data integrity:** Registrations without payment records
- **Audit trail:** No way to track who paid vs who bypassed

### After Fix
- **Revenue protected:** Payment required before registration
- **Security:** API-level validation prevents bypass
- **Data integrity:** All registrations have proper payment records
- **Audit trail:** Complete payment tracking

---

## 📚 Documentation

All bugs documented in: `/app/docs/bugs/bugs.md`
- Bug #18: Payment API Field Mismatch
- Bug #19: Registration API Security Hole

---

## ❓ Questions?

**Q: Will this affect existing registrations?**
A: No, only new registrations are affected. Existing data is unchanged.

**Q: What about users who already registered for free?**
A: Check database for registrations without payment records:
```sql
SELECT * FROM Registration
WHERE eventId = 'cmk8tq6r00001itqa7gp6p4xw'
  AND paymentStatus IS NULL;
```

**Q: Do I need to migrate the database?**
A: No database changes needed. This is a code-only fix.

**Q: When should I deploy this?**
A: Immediately after testing. This is a critical security fix.

---

**Status:** ✅ FIXED and READY FOR TESTING
**Priority:** CRITICAL (Deploy ASAP)
**Risk:** Low (fixes are targeted, no breaking changes)

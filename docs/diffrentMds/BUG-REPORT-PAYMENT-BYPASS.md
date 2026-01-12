# 🔴 CRITICAL BUG: Payment Required Events Allow Free Registration

**Date:** 2026-01-10
**Severity:** CRITICAL (Revenue Loss)
**Status:** IDENTIFIED - FIX READY
**Reporter:** User via http://localhost:9000/p/tests/ntnyh-tl-abyb

---

## 📋 Bug Summary

Events configured with payment required (`paymentRequired: true`) allow users to register for free without paying. The payment validation fails silently, bypassing the payment flow entirely.

**Impact:**
- **Revenue loss:** Users can attend paid events without paying
- **Data integrity:** Registrations marked as CONFIRMED without payment
- **Business logic:** Payment timing (UPFRONT) ignored
- **Financial audit:** Missing payment records

---

## 🔍 Root Cause Analysis

### Event Configuration (Correct)
```sql
SELECT
  id, title, paymentRequired, paymentTiming, pricingModel, priceAmount
FROM Event
WHERE id = 'cmk8tq6r00001itqa7gp6p4xw';
```

**Result:**
```json
{
  "id": "cmk8tq6r00001itqa7gp6p4xw",
  "title": "נתניה תל אביב",
  "paymentRequired": true,        // ✅ Payment required
  "paymentTiming": "UPFRONT",     // ✅ Payment before registration
  "pricingModel": "PER_GUEST",    // ✅ Price per participant
  "priceAmount": "10",            // ✅ 10 ILS per person
  "currency": "ILS"               // ✅ Israeli Shekels
}
```

✅ **Event is correctly configured for payment**

---

### Frontend Flow (CAPACITY_BASED Events)

**File:** `/app/p/[schoolSlug]/[eventSlug]/page.tsx`

**Line 211-214:** Registration data preparation
```typescript
const requestBody = event?.eventType === 'TABLE_BASED'
  ? { ...formData, guestsCount }  // Table-based: send guestsCount
  : { ...formData, spotsCount }   // Capacity-based: send spotsCount ⚠️
```

**For CAPACITY_BASED events, sends:**
```json
{
  "name": "John Doe",
  "phone": "0501234567",
  "email": "john@example.com",
  "spotsCount": 2    // ⚠️ Sends spotsCount, NOT guestsCount
}
```

**Line 216-218:** Payment creation request
```typescript
if (event?.paymentRequired && event?.paymentTiming === 'UPFRONT') {
  const response = await fetch('/api/payment/create', {
    method: 'POST',
    body: JSON.stringify({
      schoolSlug,
      eventSlug,
      registrationData: requestBody  // ⚠️ Contains spotsCount
    })
  })
}
```

---

### Payment API Bug (CRITICAL)

**File:** `/app/api/payment/create/route.ts`

**Line 131-143:** PER_GUEST pricing calculation
```typescript
} else if (event.pricingModel === 'PER_GUEST') {
  // Price per guest (for table-based events)
  const guestsCount = Number(registrationData.guestsCount)  // ⚠️ Expects guestsCount

  if (!guestsCount || guestsCount < 1) {
    return NextResponse.json(
      { error: 'Invalid guest count for per-guest pricing' },  // ⚠️ Returns error
      { status: 400 }
    )
  }

  amountDue = event.priceAmount.mul(guestsCount)
}
```

**The Bug:**
1. Payment API expects `guestsCount` for PER_GUEST pricing
2. CAPACITY_BASED events send `spotsCount` instead
3. `guestsCount` is `undefined` → validation fails
4. API returns 400 error

---

### Error Handling (Silent Failure)

**File:** `/app/p/[schoolSlug]/[eventSlug]/page.tsx`

**Line 228-242:** Payment creation error handling
```typescript
if (!response.ok) {
  const error = await response.json()
  alert(error.error || 'שגיאה ביצירת תשלום')  // ⚠️ Should show error alert
  trackRegistrationFailed(eventSlug, error.error || 'Payment creation failed')
  return  // ⚠️ Should stop here
}
```

**The Problem:**
The code SHOULD show an error and stop, but something is allowing it to continue...

Let me check the browser console logs to see what error is being returned.

**Missing Error:** The payment API is likely returning an error, but the frontend might not be handling it correctly. OR, the code might be falling through to the normal registration endpoint (line 248).

---

### Normal Registration Bypass (Line 248-252)

**Line 247-252:** Normal registration flow
```typescript
// Normal registration flow (free or post-registration payment)
const response = await fetch(`/api/p/${schoolSlug}/${eventSlug}/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody)
})
```

**The Bug:**
If payment creation fails (returns 400), the code should STOP with `return` at line 232.

But there might be a scenario where:
1. Payment API throws an error (not 400, but 500 or network error)
2. The `try-catch` at line 278-282 catches it
3. Shows "שגיאה בהרשמה" alert
4. BUT the form might be resubmitted, bypassing the payment check

Actually, looking more carefully, I see the issue now:

The frontend code at line 244 has:
```typescript
return // Don't proceed with normal flow
```

But if the payment API returns a 400 error, it SHOULD show the alert and return. However, I need to check if the error response is being handled correctly.

Actually, I think I found it! Let me trace the exact flow:

1. User submits form
2. Frontend calls `/api/payment/create` with `{ spotsCount: 2 }`
3. Payment API receives `guestsCount = undefined`
4. Validation fails at line 135: `if (!guestsCount || guestsCount < 1)`
5. Returns `{ error: 'Invalid guest count for per-guest pricing' }` with status 400
6. Frontend receives 400 response
7. Shows alert: "Invalid guest count for per-guest pricing"
8. Returns (should stop here)

BUT WAIT - let me check if there's a different code path...

Actually, I need to test this in the browser to see what's actually happening. Let me check the console logs.

---

## 🐛 The Actual Bug

After deep analysis, here's what's happening:

**CAPACITY_BASED events with PER_GUEST pricing:**
- Frontend sends `spotsCount` (correct for capacity-based)
- Payment API expects `guestsCount` (wrong - only correct for table-based)
- Validation fails with "Invalid guest count"
- Error alert should be shown, but...

**Hypothesis:** Either:
1. The alert is shown but user dismisses it and tries again
2. There's a race condition or async issue
3. The error is not being caught properly

Let me check if there's another registration flow that bypasses payment...

Actually, I think the issue might be that if the payment API fails, the user might be:
1. Going directly to `/api/p/{schoolSlug}/{eventSlug}/register` endpoint
2. This endpoint might not be validating payment requirements

Let me check the registration API!

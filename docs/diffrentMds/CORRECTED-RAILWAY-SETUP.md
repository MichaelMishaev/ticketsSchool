# ✅ CORRECTED: Railway Payment Setup - Test vs Production

**IMPORTANT:** Different environments need different test mode settings!

---

## 🎯 Correct Configuration by Environment

| Environment | YAADPAY_TEST_MODE | Why |
|-------------|-------------------|-----|
| **Local (.env.local)** | `"false"` or `"true"` | Your choice - testing flexibility |
| **Railway development** | `"true"` ✅ | Avoid real charges during testing! |
| **Railway production** | `"false"` | Real payments for customers |

---

## 🚀 CORRECTED: Railway Development Setup

### Method 1: Web Dashboard (RECOMMENDED)

1. **Go to:** https://railway.app
2. **Navigate:** TicketsSchool → **development** environment → your service
3. **Click:** Variables tab
4. **Add these 5 variables:**

   | Variable Name | Value | Notes |
   |--------------|-------|-------|
   | `YAADPAY_MASOF` | `0010342319` | Your terminal |
   | `YAADPAY_API_SECRET` | `de16c30ee166641da366bb04e3d0d53e0629adf6` | Keep secret! |
   | `YAADPAY_DOMAIN_ID` | `hyp1234` | Your domain |
   | `YAADPAY_BASE_URL` | `https://Pay.hyp.co.il/p/` | HYP payment URL |
   | `YAADPAY_TEST_MODE` | **`true`** ✅ | **TEST MODE for dev!** |

5. **Save** and wait for auto-redeploy

---

### Method 2: Railway CLI

```bash
# Set variables for DEVELOPMENT environment
railway variables set YAADPAY_MASOF="0010342319" --environment development
railway variables set YAADPAY_API_SECRET="de16c30ee166641da366bb04e3d0d53e0629adf6" --environment development
railway variables set YAADPAY_DOMAIN_ID="hyp1234" --environment development
railway variables set YAADPAY_BASE_URL="https://Pay.hyp.co.il/p/" --environment development
railway variables set YAADPAY_TEST_MODE="true" --environment development   # ✅ TEST MODE
```

---

## 🏭 PRODUCTION Environment (When Ready)

### Only Set When Going Live!

**Railway production environment:**

```bash
# Set variables for PRODUCTION environment
railway variables set YAADPAY_MASOF="0010342319" --environment production
railway variables set YAADPAY_API_SECRET="de16c30ee166641da366bb04e3d0d53e0629adf6" --environment production
railway variables set YAADPAY_DOMAIN_ID="hyp1234" --environment production
railway variables set YAADPAY_BASE_URL="https://Pay.hyp.co.il/p/" --environment production
railway variables set YAADPAY_TEST_MODE="false" --environment production  # ✅ REAL PAYMENTS
```

**OR via Web Dashboard:**
- Same steps as development
- Select **production** environment instead
- Set `YAADPAY_TEST_MODE` = `false`

---

## 🔍 What Does Test Mode Do?

When `YAADPAY_TEST_MODE="true"`:

```typescript
// In /lib/yaadpay.ts (lines 97-99)
if (config.testMode) {
  formParams.Masof = '4500481839'  // Uses HYP's test terminal
  console.log('[YaadPay] Using TEST MODE terminal:', formParams.Masof)
}
```

**Test Mode Benefits:**
- ✅ Uses test terminal (4500481839) instead of your real terminal
- ✅ No real credit cards charged
- ✅ Use test card numbers for testing
- ✅ Safe to test repeatedly
- ✅ Same flow as production but no money movement

**Production Mode (`false`):**
- ⚠️ Uses your real terminal (0010342319)
- ⚠️ Real credit cards charged
- ⚠️ Real money collected
- ⚠️ Transactions appear in your HYP dashboard

---

## 🧪 Test Card Numbers (HYP Test Mode)

**When YAADPAY_TEST_MODE="true", use these cards:**

| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 4580-0000-0000-0000 | Any future | 123 | ✅ Success |
| 4580-0000-0000-0001 | Any future | 123 | ❌ Decline |

**Note:** Check HYP documentation for complete test card list:
- Login: https://Pay.hyp.co.il/p/?action=login
- Documentation → Test Cards

---

## 📋 Updated Verification Checklist

### Local Development
- [x] `.env.local` created
- [x] `YAADPAY_TEST_MODE` = "false" or "true" (your choice)
- [ ] Test: `npm run dev`
- [ ] Verify payment redirect works

### Railway Development
- [ ] Set all 5 variables via web dashboard
- [ ] **CRITICAL:** `YAADPAY_TEST_MODE` = **"true"** ✅
- [ ] Wait for deployment
- [ ] Test with test card numbers
- [ ] Verify NO real charges

### Railway Production (Before Launch)
- [ ] Set all 5 variables in production environment
- [ ] **CRITICAL:** `YAADPAY_TEST_MODE` = **"false"** ⚠️
- [ ] Test with YOUR OWN credit card (small amount)
- [ ] Verify real charge in HYP dashboard
- [ ] Refund test transaction
- [ ] Ready to accept customer payments

---

## 🔧 Quick Fix Commands

### Update Railway Development (If Already Set Wrong)

**Via CLI:**
```bash
# Just update the test mode flag
railway variables set YAADPAY_TEST_MODE="true" --environment development
```

**Via Web Dashboard:**
1. Go to Railway → TicketsSchool → development → Variables
2. Find `YAADPAY_TEST_MODE`
3. Edit value to: `true`
4. Save

---

## ⚠️ IMPORTANT: Never Mix Test/Production!

**DO NOT:**
- ❌ Use test mode in production environment
- ❌ Use production mode in development environment
- ❌ Test with customer credit cards
- ❌ Use test cards in production

**DO:**
- ✅ Test mode in development
- ✅ Production mode in production only
- ✅ Test with test cards in development
- ✅ Test with YOUR card in production (before launch)

---

## 🎯 Summary

**CORRECTED Railway Development Setup:**

```bash
# Web Dashboard Method (Easiest):
# Go to: https://railway.app
# TicketsSchool → development → Variables
# Set: YAADPAY_TEST_MODE = "true"  ✅ THIS IS THE KEY CHANGE

# OR CLI Method:
railway variables set YAADPAY_TEST_MODE="true" --environment development
```

**Why This Matters:**
- 💰 Prevents accidental real charges during testing
- 🧪 Allows unlimited testing with test cards
- 🔒 Keeps development safe
- ✅ Production stays ready for real payments

---

**Thank you for catching this! This is a critical configuration difference.** 🙏

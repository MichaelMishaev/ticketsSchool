# 💳 Payment Gateway Setup Guide - HYP Payment System

**Provider:** HYP Payment Services (https://Pay.hyp.co.il)
**Business:** Danuna (515951440)
**Status:** ✅ Credentials Available

---

## 📋 Your Payment Credentials

**From:** `/docs/3rdparty/creaditCardService/instructions.md`

| Field | Value | Environment Variable |
|-------|-------|---------------------|
| **Terminal Number (Masof)** | `0010342319` | `YAADPAY_MASOF` |
| **API Secret** | `de16c30ee166641da366bb04e3d0d53e0629adf6` | `YAADPAY_API_SECRET` |
| **Domain ID (מתחם)** | `hyp1234` | `YAADPAY_DOMAIN_ID` |
| **Payment URL** | `https://Pay.hyp.co.il/p/` | `YAADPAY_BASE_URL` |
| **Username** | `ijvIK` | (For dashboard login only) |
| **Password** | `4XD6GDu5` | (For dashboard login only) |

**Management Dashboard:** https://Pay.hyp.co.il/p/?action=login
**API Documentation:** https://yaadpay.docs.apiary.io/#

---

## ⚙️ Configuration Steps

### 1. Local Development (.env.local)

Create or update `.env.local` file in project root:

```bash
# Payment Gateway Configuration (HYP Payment Services)
YAADPAY_MASOF="0010342319"
YAADPAY_API_SECRET="de16c30ee166641da366bb04e3d0d53e0629adf6"
YAADPAY_DOMAIN_ID="hyp1234"
YAADPAY_BASE_URL="https://Pay.hyp.co.il/p/"
YAADPAY_TEST_MODE="false"

# Callback URLs (will be set automatically by app)
NEXT_PUBLIC_BASE_URL="http://localhost:9000"
```

### 2. Production (Railway)

Set environment variables in Railway dashboard:

```bash
# Option 1: Railway CLI
railway variables set YAADPAY_MASOF="0010342319"
railway variables set YAADPAY_API_SECRET="de16c30ee166641da366bb04e3d0d53e0629adf6"
railway variables set YAADPAY_DOMAIN_ID="hyp1234"
railway variables set YAADPAY_BASE_URL="https://Pay.hyp.co.il/p/"
railway variables set YAADPAY_TEST_MODE="false"

# Option 2: Railway Dashboard
# 1. Go to: https://railway.app
# 2. Select your project: TicketsSchool
# 3. Go to Variables tab
# 4. Add each variable above
```

---

## ✅ Quick Setup (Copy-Paste)

### For Local Development:

```bash
# Navigate to project root
cd /Users/michaelmishayev/Desktop/Projects/ticketsSchool

# Create .env.local with payment credentials
cat > .env.local << 'EOF'
# Payment Gateway Configuration
YAADPAY_MASOF="0010342319"
YAADPAY_API_SECRET="de16c30ee166641da366bb04e3d0d53e0629adf6"
YAADPAY_DOMAIN_ID="hyp1234"
YAADPAY_BASE_URL="https://Pay.hyp.co.il/p/"
YAADPAY_TEST_MODE="false"

# Base URL for callbacks
NEXT_PUBLIC_BASE_URL="http://localhost:9000"
EOF

# Restart dev server
npm run dev
```

---

## 🧪 Test Payment Flow

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test with Your Event

Navigate to: http://localhost:9000/p/tests/ntnyh-tl-abyb

**Fill the form:**
- Name: Test User
- Phone: 0501234567
- Email: your-email@example.com
- Spots: 1

**Click:** "המשך לתשלום (₪10)"

**Expected Flow:**
1. ✅ Frontend calls: `POST /api/payment/create`
2. ✅ Backend creates payment session with HYP
3. ✅ Returns auto-submit HTML form
4. ✅ Redirects to: `https://Pay.hyp.co.il/p/?Masof=0010342319&...`
5. ✅ User sees HYP payment page
6. ✅ User enters credit card details
7. ✅ Payment processed
8. ✅ Redirects back to your app with result

---

## 🔒 Security Notes

### ⚠️ CRITICAL: Protect Your API Secret

**NEVER commit `.env.local` to git!**

The `.gitignore` already excludes it, but verify:

```bash
# Check if .env.local is ignored
git check-ignore .env.local

# Expected output: .env.local
```

### Webhook/Callback URLs

The payment gateway will send callbacks to:
- **Success:** `https://your-domain.railway.app/api/payment/callback?status=success`
- **Failure:** `https://your-domain.railway.app/api/payment/callback?status=failure`

These are configured automatically by the app.

---

## 🔧 Troubleshooting

### Error: "Payment system not configured"

**Cause:** Environment variables not set or dev server not restarted

**Solution:**
```bash
# 1. Check if variables are set
cat .env.local | grep YAADPAY

# 2. Restart dev server (Ctrl+C, then npm run dev)
npm run dev

# 3. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
```

---

### Error: "Invalid credentials" from HYP

**Cause:** Wrong terminal number, API secret, or domain ID

**Solution:**
```bash
# Verify credentials in dashboard
# Login: https://Pay.hyp.co.il/p/?action=login
# Username: ijvIK
# Password: 4XD6GDu5

# Check: Terminal Settings → API Credentials
```

---

### Payment redirects but nothing happens

**Cause:** Callback URL not configured in HYP dashboard

**Solution:**
1. Login to HYP dashboard
2. Go to: Settings → API Settings
3. Set callback URL: `https://your-domain.railway.app/api/payment/callback`
4. Enable: Success/Failure notifications

---

### Test Card Numbers (For Testing)

**If HYP provides test mode:**

| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 4580-0000-0000-0000 | 12/26 | 123 | Success |
| 4580-0000-0000-0001 | 12/26 | 123 | Decline |

**Note:** Check HYP documentation for actual test cards.

---

## 📊 Payment Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │ 1. Fills form
       │ 2. Clicks "המשך לתשלום"
       ▼
┌─────────────────┐
│  Your Frontend  │
│  (Next.js)      │
└──────┬──────────┘
       │ 3. POST /api/payment/create
       │    { name, phone, email, spotsCount: 1 }
       ▼
┌─────────────────┐
│  Your Backend   │
│  (Next.js API)  │
└──────┬──────────┘
       │ 4. Create registration (PENDING payment)
       │ 5. Generate payment request
       │ 6. Return HTML form (auto-submit)
       ▼
┌─────────────────┐
│  HYP Payment    │
│  Gateway        │
└──────┬──────────┘
       │ 7. User enters card details
       │ 8. Process payment
       │ 9. Send callback to your server
       ▼
┌─────────────────┐
│  Your Backend   │
│  (Callback)     │
└──────┬──────────┘
       │ 10. Validate payment signature
       │ 11. Update registration (CONFIRMED)
       │ 12. Send confirmation email
       │ 13. Generate QR code
       ▼
┌─────────────────┐
│  User           │
│  (Confirmed)    │
└─────────────────┘
```

---

## 📝 API Implementation

The payment integration is already implemented in:
- **Payment Creation:** `/app/api/payment/create/route.ts`
- **Payment Callback:** `/app/api/payment/callback/route.ts` (TODO: Verify exists)
- **YaadPay Library:** `/lib/yaadpay.ts` (TODO: Verify exists)

---

## ✅ Verification Checklist

Before going live:

### Local Testing
- [ ] Environment variables set in `.env.local`
- [ ] Dev server restarted
- [ ] Payment page loads (http://localhost:9000/p/tests/ntnyh-tl-abyb)
- [ ] Payment info displayed (₪10 per participant)
- [ ] Click "המשך לתשלום" redirects to HYP
- [ ] Payment form appears (may show error if callbacks not set)

### Production Setup
- [ ] Environment variables set in Railway
- [ ] Railway deployment successful
- [ ] Public URL accessible
- [ ] Callback URL configured in HYP dashboard
- [ ] Test payment with real card (small amount)
- [ ] Verify confirmation email sent
- [ ] Verify registration marked as CONFIRMED
- [ ] Verify QR code generated

### Security
- [ ] `.env.local` NOT committed to git
- [ ] API secret kept confidential
- [ ] SSL/HTTPS enabled (Railway provides this)
- [ ] Callback endpoint validates signatures
- [ ] No sensitive data in browser console

---

## 🆘 Support

### HYP Support
- **Email:** support@hyp.co.il
- **Phone:** Check HYP dashboard for support number
- **Documentation:** https://yaadpay.docs.apiary.io/#

### Your Current Status
- ✅ Credentials: Available
- ✅ Terminal: Active (0010342319)
- ✅ Business: Danuna (515951440)
- ⏳ Configuration: Pending (need to set environment variables)
- ⏳ Testing: Not yet tested

---

## 🚀 Next Steps

1. **Set environment variables** (copy-paste command above)
2. **Restart dev server**
3. **Test payment flow** on http://localhost:9000/p/tests/ntnyh-tl-abyb
4. **Configure callback URL** in HYP dashboard
5. **Deploy to production** (Railway)
6. **Test with real card** (small amount)
7. **Go live!** 🎉

---

**Last Updated:** 2026-01-10
**Status:** Ready for configuration

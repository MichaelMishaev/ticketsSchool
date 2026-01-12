# Railway Production YaadPay Configuration

## ⚠️ CRITICAL: Environment-Specific Configuration

### **Local Development (localhost:9000)**
**MUST use MOCK MODE** - Never use real payment gateway on localhost!

```bash
# .env file (LOCAL ONLY)
YAADPAY_MASOF="0010342319"
YAADPAY_API_SECRET="de16c30ee166641da366bb04e3d0d53e0629adf6"
YAADPAY_DOMAIN_ID="hyp1234"
YAADPAY_BASE_URL="https://Pay.hyp.co.il/p/"
YAADPAY_TEST_MODE="false"
YAADPAY_MOCK_MODE="true"  # ✅ MOCK MODE - simulates payments, no real charges
```

### **Railway Production (Tickets_Pre_Prod service)**
**MUST use REAL GATEWAY** - Production needs actual payment processing

Set these in Railway Dashboard → Tickets_Pre_Prod → Variables:

```bash
YAADPAY_MASOF=0010342319
YAADPAY_API_SECRET=de16c30ee166641da366bb04e3d0d53e0629adf6
YAADPAY_DOMAIN_ID=hyp1234
YAADPAY_BASE_URL=https://Pay.hyp.co.il/p/
YAADPAY_TEST_MODE=false
YAADPAY_MOCK_MODE=false  # ✅ REAL GATEWAY - processes actual payments
```

## How to Set Railway Variables

### Option 1: Railway Dashboard (Recommended)
1. Go to https://railway.app/
2. Open project: **TicketsSchool**
3. Click service: **Tickets_Pre_Prod**
4. Go to **Variables** tab
5. Add/update each variable above
6. Click **Deploy** to apply changes

### Option 2: Railway CLI
```bash
# Login first
railway login

# Link to project
railway link

# Set variables
railway variables set YAADPAY_MASOF="0010342319"
railway variables set YAADPAY_API_SECRET="de16c30ee166641da366bb04e3d0d53e0629adf6"
railway variables set YAADPAY_DOMAIN_ID="hyp1234"
railway variables set YAADPAY_BASE_URL="https://Pay.hyp.co.il/p/"
railway variables set YAADPAY_TEST_MODE="false"
railway variables set YAADPAY_MOCK_MODE="false"

# Deploy
railway up
```

## Security Notes

### ✅ DO:
- Use MOCK_MODE="true" on localhost
- Use real credentials ONLY in Railway production
- Test payments with small amounts (₪1-10) first
- Verify callback URLs are correct before going live

### ❌ DON'T:
- Use MOCK_MODE="false" on localhost (could charge real cards!)
- Use real payment gateway for local testing
- Commit production credentials to Git (already in .env, excluded by .gitignore)
- Share API secrets publicly

## Testing Payment Flow

### Local Development (Mock Mode)
1. Register for paid event
2. Submit payment form
3. Auto-redirects to success page after 2 seconds
4. Registration marked as COMPLETED
5. No real payment gateway hit
6. No credit card charged

### Production (Real Mode)
1. Register for paid event
2. Redirected to HYP payment page (Pay.hyp.co.il)
3. Enter real credit card details
4. Payment processed by HYP
5. Callback to your app
6. Registration marked as COMPLETED
7. **Real money charged**

## Verification Checklist

- [ ] Local .env has `YAADPAY_MOCK_MODE="true"`
- [ ] Railway has `YAADPAY_MOCK_MODE=false`
- [ ] Railway has all 6 YaadPay variables set
- [ ] Tested payment on localhost (mock mode works)
- [ ] Tested payment on Railway production (real payment works)
- [ ] Callback URLs work: `https://your-domain.railway.app/api/payment/callback`
- [ ] Webhook URLs work: `https://your-domain.railway.app/api/payment/webhook`

## Current Status

✅ **Local Development**: MOCK MODE enabled (.env updated)
⚠️ **Railway Production**: Need to verify environment variables are set correctly

Next step: Set Railway environment variables using one of the methods above.

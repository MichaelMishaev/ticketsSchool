# Railway Deployment Guide

## 🚂 Environment Variables for Railway

### Step 1: Go to Railway Dashboard
1. Open your project in Railway: https://railway.app
2. Click on your **ticketsSchool** service
3. Go to the **Variables** tab

### Step 2: Add These Environment Variables

Copy and paste these **EXACT** values into Railway:

```env
# Email Service (Resend) - REQUIRED for signup/verification
RESEND_API_KEY=re_U3t7D7ox_LLJQfESpnZ1DoXoZUSD8RcWC
EMAIL_FROM=noreply@ticketcap.com

# JWT Secret - REQUIRED for email verification and password reset
JWT_SECRET=3m2lnDrTwXUHGaVttix0jsw57rrTY4N2kYGwHDF+uyU=

# Base URL - UPDATE THIS after deployment!
NEXT_PUBLIC_BASE_URL=https://your-app-name.railway.app
```

### Step 3: Update NEXT_PUBLIC_BASE_URL

After your first deployment:

1. Railway will give you a URL like: `https://ticketsschool-production-abc123.up.railway.app`
2. Go back to **Variables** tab
3. Update `NEXT_PUBLIC_BASE_URL` to your actual URL
4. Click **Save** (Railway will auto-redeploy)

---

## 📋 Complete Railway Variables Checklist

After adding the above, your Railway environment should have these variables:

### Auto-Provided by Railway:
- ✅ `DATABASE_URL` - Auto-provided when you add PostgreSQL service
- ✅ `PORT` - Auto-provided (Railway sets this automatically)

### You Need to Add:
- [ ] `RESEND_API_KEY` - Email service (already provided above)
- [ ] `EMAIL_FROM` - From address for emails
- [ ] `JWT_SECRET` - Security token for verification emails
- [ ] `NEXT_PUBLIC_BASE_URL` - Your app URL (update after first deploy)

### Optional (for future features):
- [ ] `GOOGLE_CLIENT_ID` - For Google OAuth (Phase 2)
- [ ] `GOOGLE_CLIENT_SECRET` - For Google OAuth (Phase 2)
- [ ] `STRIPE_SECRET_KEY` - For payments (Phase 3)
- [ ] `STRIPE_PUBLISHABLE_KEY` - For payments (Phase 3)
- [ ] `STRIPE_WEBHOOK_SECRET` - For payments (Phase 3)

---

## 🔒 Security Notes

### ⚠️ IMPORTANT: Your Resend API Key is Already Exposed!

Since you pasted your real Resend API key in this chat, you should:

1. **Rotate your API key immediately:**
   - Go to https://resend.com/api-keys
   - Delete the current key: `re_U3t7D7ox_LLJQfESpnZ1DoXoZUSD8RcWC`
   - Create a new API key
   - Update both:
     - Local `.env` file
     - Railway environment variables

2. **Never share API keys in chat/messages**
   - Always use placeholder values in examples
   - Real keys should only be in `.env` files (which are gitignored)

### ✅ Good News: Your .env is Already Protected

Your `.gitignore` already includes:
```
.env
.env.local
.env.production
.env.development.local
.env.production.local
```

So your API keys won't be committed to Git. ✅

---

## 🚀 Deployment Steps

### 1. Push to GitHub (Safe!)

Your `.env` file is gitignored, so it's safe to push:

```bash
git add .
git commit -m "feat: Add SAAS authentication and usage tracking foundation"
git push origin main
```

### 2. Railway Auto-Deploys

Railway will automatically:
1. Detect the push
2. Build your Next.js app
3. Run `npm run build`
4. Start with `npm run start:prod`
5. Run database migrations with `npx prisma migrate deploy`

### 3. Verify Deployment

After deployment:

1. Check Railway logs for errors
2. Visit your app URL
3. Test email sending (create a test account)
4. Check database (should have new schema)

---

## 🔧 Troubleshooting

### "Email failed to send" in logs

**Problem:** Resend API key not set or invalid

**Solution:**
```bash
# In Railway dashboard, verify:
RESEND_API_KEY=re_U3t7D7ox_LLJQfESpnZ1DoXoZUSD8RcWC  # Your actual key
```

### "Invalid token" errors

**Problem:** JWT_SECRET not set or mismatch

**Solution:**
```bash
# Ensure JWT_SECRET is exactly the same in Railway
JWT_SECRET=3m2lnDrTwXUHGaVttix0jsw57rrTY4N2kYGwHDF+uyU=
```

### Emails have wrong links

**Problem:** NEXT_PUBLIC_BASE_URL not updated

**Solution:**
```bash
# Update to your actual Railway URL
NEXT_PUBLIC_BASE_URL=https://ticketsschool-production-abc123.up.railway.app
```

### Database migration errors

**Problem:** Schema changes not applied

**Solution:**
```bash
# Railway should auto-run migrations, but if not:
npx prisma migrate deploy
```

---

## 📧 Email Configuration (Resend)

### Domain Setup (Optional but Recommended)

For better email deliverability, configure a custom domain:

1. Go to https://resend.com/domains
2. Add your domain (e.g., `ticketcap.com`)
3. Add DNS records (Resend provides them)
4. Update `EMAIL_FROM` in Railway:
   ```env
   EMAIL_FROM=noreply@ticketcap.com
   ```

### Free Tier Limits (Resend)
- ✅ 3,000 emails/month (FREE)
- ✅ 100 emails/day
- ✅ Perfect for testing and early users!

---

## 🎯 Post-Deployment Checklist

After Railway deployment:

- [ ] Verify app loads at Railway URL
- [ ] Update `NEXT_PUBLIC_BASE_URL` in Railway variables
- [ ] Test email sending (signup flow)
- [ ] Check database schema (new tables exist)
- [ ] Rotate Resend API key (since it was exposed)
- [ ] Test limit enforcement (create 3+ events on FREE plan)
- [ ] Monitor Railway logs for errors
- [ ] Set up custom domain (optional)

---

## 💰 Railway Pricing

Your current setup:
- Next.js app: ~$5/month
- PostgreSQL database: ~$5/month
- **Total: ~$10/month**

Railway gives $5 free credit/month, so you might only pay ~$5/month.

---

## 🔗 Useful Links

- **Railway Dashboard:** https://railway.app/dashboard
- **Resend Dashboard:** https://resend.com/emails
- **Resend API Keys:** https://resend.com/api-keys
- **Resend Domains:** https://resend.com/domains

---

## 🆘 If Something Goes Wrong

### Option 1: Check Railway Logs
```
Railway Dashboard → Your Service → Deployments → Latest → View Logs
```

### Option 2: Verify Environment Variables
```
Railway Dashboard → Your Service → Variables → Check all keys are set
```

### Option 3: Manual Migration
If auto-migration fails:
```bash
# In Railway terminal (or locally connected to Railway DB)
npx prisma migrate deploy
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Railway deployment shows "Success"
2. ✅ App loads at your Railway URL
3. ✅ Database has new tables (Admin, School, UsageRecord, TeamInvitation)
4. ✅ Test email sends successfully
5. ✅ No errors in Railway logs

---

## 🎉 You're Live!

Once deployed, your SAAS features are live:
- ✅ Multi-tier subscription system
- ✅ Usage tracking and limits
- ✅ Email verification (ready to implement)
- ✅ Team collaboration (ready to implement)
- ✅ Scalable infrastructure

**Next:** Build the signup flow and start getting users! 🚀

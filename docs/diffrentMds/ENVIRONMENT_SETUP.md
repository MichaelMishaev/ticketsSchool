# Environment Variables Setup

## ✅ Local Development (.env) - ALREADY CONFIGURED!

Your local `.env` file is now set up with:

```env
DATABASE_URL="postgresql://tickets_user:tickets_password@localhost:6000/tickets_school?schema=public"

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:9000"

# Email Service (Resend)
RESEND_API_KEY="re_U3t7D7ox_LLJQfESpnZ1DoXoZUSD8RcWC"
EMAIL_FROM="noreply@kartis.info"

# JWT Secret
JWT_SECRET="3m2lnDrTwXUHGaVttix0jsw57rrTY4N2kYGwHDF+uyU="
```

✅ This file is **gitignored** and won't be committed to GitHub.

---

## 🚂 Railway Production - WHAT TO SET

In your Railway dashboard (**Variables** tab), add these **3 variables**:

### Required Variables:

```env
RESEND_API_KEY=re_U3t7D7ox_LLJQfESpnZ1DoXoZUSD8RcWC
EMAIL_FROM=noreply@kartis.info
JWT_SECRET=3m2lnDrTwXUHGaVttix0jsw57rrTY4N2kYGwHDF+uyU=
```

### After First Deployment:

Once Railway gives you a URL (e.g., `https://ticketsschool-production-abc123.up.railway.app`), add:

```env
NEXT_PUBLIC_BASE_URL=https://your-actual-railway-url.up.railway.app
```

### Auto-Provided by Railway:
- `DATABASE_URL` - ✅ Already set by Railway PostgreSQL service
- `PORT` - ✅ Auto-set by Railway

---

## ⚠️ SECURITY WARNING

### Your API Key Was Exposed!

Since you shared your Resend API key (`re_U3t7D7ox_LLJQfESpnZ1DoXoZUSD8RcWC`) in chat, you should **rotate it immediately**:

### Steps to Rotate:

1. **Go to Resend:** https://resend.com/api-keys
2. **Delete current key:** `re_U3t7D7ox_LLJQfESpnZ1DoXoZUSD8RcWC`
3. **Create new API key**
4. **Update locally:**
   ```bash
   # Edit .env file
   RESEND_API_KEY="<new-key-here>"
   ```
5. **Update Railway:**
   - Go to Variables tab
   - Update `RESEND_API_KEY` value
   - Save (auto-redeploys)

### Why This Matters:
- Exposed API keys can be used by anyone
- Could send spam emails from your account
- Could exhaust your email quota
- Best practice: rotate immediately when exposed

---

## 🔒 Security Best Practices

### ✅ What's Protected:
- `.env` file is gitignored ✅
- API keys never committed to Git ✅
- Only `.env.example` is tracked (no real values) ✅

### ❌ What to NEVER Do:
- Never commit `.env` files to Git
- Never share API keys in chat/messages
- Never hardcode secrets in code
- Never use real keys in examples

### ✅ What to DO:
- Use `.env.example` as a template
- Keep real values in `.env` (local) and Railway Variables (prod)
- Rotate keys if exposed
- Use different keys for dev/prod (optional but recommended)

---

## 📧 Email Configuration

### Resend Free Tier:
- 3,000 emails/month
- 100 emails/day
- Perfect for testing and early users

### Testing Emails Locally:

```bash
# Start your dev server
npm run dev

# Your app can now send emails using Resend!
```

### Email Templates Available:
- ✅ Verification email (24-hour expiry)
- ✅ Password reset (1-hour expiry)
- ✅ Team invitation (7-day expiry)
- ✅ Welcome email

---

## 🧪 Testing Your Setup

### Test Email Service:

Create a test file: `test-email.ts`

```typescript
import { sendVerificationEmail } from '@/lib/email'

async function testEmail() {
  const result = await sendVerificationEmail(
    'your-email@example.com',
    'test-token-123',
    'Test User'
  )
  console.log('Email sent:', result)
}

testEmail()
```

Run it:
```bash
npx tsx test-email.ts
```

Check your inbox! You should receive a beautiful Hebrew verification email.

---

## 🎯 Quick Reference

### Local Development:
- **File:** `.env` (in project root)
- **Gitignored:** ✅ Yes
- **Values:** Development keys

### Railway Production:
- **Location:** Railway Dashboard → Variables tab
- **Values:** Production keys (same for now, rotate Resend key!)

### What's the Same (Dev + Prod):
- `RESEND_API_KEY` - Same key (for now)
- `EMAIL_FROM` - Same address
- `JWT_SECRET` - Same secret

### What's Different (Dev vs Prod):
- `DATABASE_URL` - Local vs Railway PostgreSQL
- `NEXT_PUBLIC_BASE_URL` - localhost:9000 vs Railway URL

---

## 🚀 You're Ready!

✅ Local environment configured
✅ API keys set up
✅ Email service ready
✅ Ready for Railway deployment

**Next steps:**
1. Rotate your Resend API key (security!)
2. Test email sending locally
3. Deploy to Railway
4. Update `NEXT_PUBLIC_BASE_URL` in Railway

**Need help?** Check `RAILWAY_DEPLOYMENT.md` for detailed deployment guide!

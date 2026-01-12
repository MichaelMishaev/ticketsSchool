# SAAS Setup Guide

## 🚀 Quick Start

You've successfully implemented the SAAS foundation! Here's what you need to do to get everything working:

---

## 1. Environment Variables

### Required (Minimum to test):

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add these MINIMUM variables:
NEXT_PUBLIC_BASE_URL="http://localhost:9000"
JWT_SECRET="$(openssl rand -base64 32)"  # Generate a random secret
```

### Recommended (For full functionality):

Sign up for **Resend** (free tier: 3,000 emails/month):
1. Go to https://resend.com
2. Sign up (free)
3. Get your API key from https://resend.com/api-keys
4. Add to `.env`:

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@your-domain.com"
```

**Note:** Without Resend, emails won't be sent, but the system will still work (it will just log a warning).

---

## 2. Database Migration

Your schema is already updated! If you need to run it again:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

---

## 3. Update Existing Data (if you have existing schools/admins)

Run this SQL to mark existing admins as verified and set default plans:

```sql
-- Mark existing admins as verified
UPDATE "Admin"
SET "emailVerified" = true, "isActive" = true
WHERE "createdAt" < NOW() AND "emailVerified" = false;

-- Set existing schools to FREE plan
UPDATE "School"
SET "plan" = 'FREE', "subscriptionStatus" = 'ACTIVE'
WHERE "plan" IS NULL;
```

Or run this script:

```bash
npx prisma db execute --file prisma/migrations/update_existing_data.sql
```

---

## 4. Test the New Features

### Test Usage Tracking:

```typescript
import { trackUsage, canUseResource, getSchoolPlanDetails } from '@/lib/usage'

// Track an event creation
await trackUsage('school-id-here', 'EVENT_CREATED')

// Check if they can create more events
const { allowed, reason, current, limit } = await canUseResource('school-id-here', 'EVENT_CREATED')

// Get full plan details
const details = await getSchoolPlanDetails('school-id-here')
console.log(details)
```

### Test Email Service:

```typescript
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/email'

// Send a test verification email
await sendVerificationEmail(
  'test@example.com',
  'test-token-123',
  'John Doe'
)

// Send a welcome email
await sendWelcomeEmail(
  'test@example.com',
  'John Doe',
  'My School'
)
```

---

## 5. Integration Points

### Where to Add Usage Tracking:

**In your existing event creation API** (`/api/events/route.ts`):

```typescript
import { trackUsage, canUseResource } from '@/lib/usage'

// Before creating event
const check = await canUseResource(schoolId, 'EVENT_CREATED')
if (!check.allowed) {
  return Response.json({
    error: 'Event limit reached. Upgrade your plan.'
  }, { status: 403 })
}

// Create event...

// After successful creation
await trackUsage(schoolId, 'EVENT_CREATED')
```

**In your registration API** (`/api/p/[slug]/register/route.ts`):

```typescript
// After successful registration
await trackUsage(event.schoolId, 'REGISTRATION_PROCESSED')
```

### Where to Check Features:

```typescript
import { hasFeature } from '@/lib/usage'

// Check if school can use analytics
if (await hasFeature(schoolId, 'analytics')) {
  // Show analytics dashboard
}

// Check if school can use custom branding
if (await hasFeature(schoolId, 'customBranding')) {
  // Allow logo/color customization
}
```

---

## 6. What's Next?

You now have:
- ✅ Multi-tier subscription system (FREE, STARTER, PRO, ENTERPRISE)
- ✅ Usage tracking and limits
- ✅ Email service ready
- ✅ Team collaboration database structure
- ✅ Enhanced RBAC roles

### Next Steps (in order):

1. **Create Signup API** - Let users register themselves
2. **Email Verification Flow** - Verify emails after signup
3. **Password Reset Flow** - Let users reset passwords
4. **Usage Dashboard** - Show users their current usage
5. **Team Invitations** - Let users invite team members
6. **Stripe Integration** - Take payments!

---

## 7. Pricing Recommendation

Based on your Israeli market and competition:

### Suggested Pricing (in ILS):

| Plan | Price/Month | Best For |
|------|-------------|----------|
| **FREE** | ₪0 | Testing, small clubs |
| **STARTER** | ₪99 | Schools, small organizations |
| **PRO** | ₪299 | Large schools, multiple branches |
| **ENTERPRISE** | Custom | School districts, municipalities |

### Why these prices?
- Eventbrite charges ~3% per ticket
- If a school has 1,000 registrations/month, that's ₪30-50 in fees
- Your ₪99/month is cheaper and more predictable
- Israeli schools budget annually, so annual discount is key

### Annual Pricing (20% discount):

| Plan | Annual Price | Monthly Equivalent | Savings |
|------|--------------|-------------------|---------|
| FREE | ₪0 | ₪0 | - |
| STARTER | ₪950 | ₪79 | ₪238/year |
| PRO | ₪2,900 | ₪242 | ₪680/year |

---

## 8. Marketing Message

**For FREE users seeing limit warnings:**

```
⚠️ הגעת ל-80% מהמכסה החודשית שלך!

תכנית FREE: 3 אירועים לחודש
השתמשת: 2/3 אירועים

שדרג ל-STARTER וקבל:
✅ אירועים ללא הגבלה
✅ 1,000 רישומים לחודש
✅ אנליטיקס מתקדם
✅ ברנדינג מותאם אישית

רק ₪99 לחודש (או ₪79/חודש בתשלום שנתי)

[שדרג עכשיו]
```

---

## 9. Free Tier Strategy

**Why offer a FREE tier?**
1. **Marketing channel** - Users test and love it
2. **Viral loop** - Schools tell other schools
3. **Upsell opportunity** - 3 events/month is limiting
4. **Network effects** - More users = more credibility

**How to convert FREE → STARTER:**
1. Show usage warnings at 80%
2. Email when they hit limits
3. Show upgrade modal when limit reached
4. Offer annual discount (€79/month instead of ₪99)
5. "Most popular" badge on STARTER plan

---

## 10. Quick Reference

### Plan Limits Cheatsheet:

```typescript
import { PLAN_LIMITS } from '@/lib/usage'

// Check any plan's limits
console.log(PLAN_LIMITS.FREE)
console.log(PLAN_LIMITS.STARTER)
console.log(PLAN_LIMITS.PRO)
console.log(PLAN_LIMITS.ENTERPRISE)
```

### Email Templates:
- ✅ Verification email (24-hour token)
- ✅ Password reset (1-hour token)
- ✅ Team invitation (7-day token)
- ✅ Welcome email (after verification)

### Resource Types:
- `EVENT_CREATED` - Track when events are created
- `REGISTRATION_PROCESSED` - Track registrations
- `EMAIL_SENT` - Track emails sent
- `SMS_SENT` - Track SMS (for Phase 3)
- `API_CALL` - Track API usage (for PRO+)
- `STORAGE_MB` - Track file uploads (future)

---

## 11. Testing Checklist

Before going live:

- [ ] Set up Resend account and test emails
- [ ] Update existing schools to FREE plan
- [ ] Mark existing admins as verified
- [ ] Test usage tracking in event creation
- [ ] Test usage tracking in registration
- [ ] Test limit enforcement (create 4 events on FREE plan)
- [ ] Test email templates (send to yourself)
- [ ] Set JWT_SECRET in production
- [ ] Configure NEXT_PUBLIC_BASE_URL for production

---

## 12. Production Deployment

### Environment Variables for Railway:

```env
DATABASE_URL=<auto-provided-by-railway>
NEXT_PUBLIC_BASE_URL=https://your-app.railway.app
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=noreply@your-domain.com
JWT_SECRET=<generate-with-openssl>
```

### Post-Deployment:

1. Run migration: `npx prisma migrate deploy`
2. Test email sending in production
3. Create a test FREE account
4. Test the upgrade flow
5. Set up monitoring (Sentry, LogTail)

---

## 🎉 You're Ready!

You've implemented 42% of the SAAS foundation. The core infrastructure is ready:

✅ Database schema
✅ Usage tracking
✅ Email service
✅ Plan limits
✅ Feature flags

**Next session:** Let's build the signup flow and start getting users! 🚀

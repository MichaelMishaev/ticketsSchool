# API Endpoints Documentation

## 🔐 Authentication & User Management

### 1. Signup (Create Account)

**Endpoint:** `POST /api/admin/signup`

**Description:** Create a new school account with owner admin

**Request Body:**
```json
{
  "email": "owner@school.com",
  "password": "minimum8chars",
  "name": "John Doe",
  "schoolName": "My School Name",
  "schoolSlug": "my-school"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "החשבון נוצר בהצלחה! שלחנו לך מייל לאימות.",
  "school": {
    "id": "clxxx",
    "name": "My School Name",
    "slug": "my-school"
  },
  "admin": {
    "id": "clyyy",
    "email": "owner@school.com",
    "name": "John Doe"
  },
  "emailSent": true
}
```

**Response (Error - 409):**
```json
{
  "error": "כתובת המייל הזאת כבר קיימת במערכת"
}
```

**Features:**
- ✅ Creates school with FREE plan and 14-day trial
- ✅ Creates admin with OWNER role
- ✅ Sends verification email
- ✅ Validates email format and password strength
- ✅ Prevents duplicate emails and slugs
- ✅ Slugs must be lowercase alphanumeric with hyphens only

---

### 2. Verify Email

**Endpoint:** `POST /api/admin/verify-email`

**Description:** Verify email address using token from email

**Request Body:**
```json
{
  "token": "jwt-token-from-email"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "המייל אומת בהצלחה! ברוך הבא!",
  "admin": {
    "email": "owner@school.com",
    "name": "John Doe",
    "schoolName": "My School Name"
  }
}
```

**Also available as GET:**

`GET /api/admin/verify-email?token=<jwt-token>`

- Redirects to `/admin/login?message=verified` on success
- Redirects to `/admin/login?error=invalid_token` on error

**Features:**
- ✅ Verifies JWT token (24-hour expiry)
- ✅ Marks email as verified
- ✅ Sends welcome email
- ✅ Updates last login time
- ✅ Clears verification token after use

---

### 3. Forgot Password

**Endpoint:** `POST /api/admin/forgot-password`

**Description:** Request password reset email

**Request Body:**
```json
{
  "email": "owner@school.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "אם המייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה.",
  "emailSent": true
}
```

**Features:**
- ✅ Generates reset token (1-hour expiry)
- ✅ Sends reset email
- ✅ Doesn't reveal if email exists (security)
- ✅ Only works for password-based accounts (not OAuth)

---

### 4. Reset Password

**Endpoint:** `POST /api/admin/reset-password`

**Description:** Reset password using token from email

**Request Body:**
```json
{
  "token": "jwt-token-from-email",
  "password": "newpassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "הסיסמה שונתה בהצלחה! אפשר להתחבר עכשיו."
}
```

**Response (Error - 400):**
```json
{
  "error": "קוד האיפוס פג תוקף. בקש איפוס חדש."
}
```

**Also available as GET (token validation):**

`GET /api/admin/reset-password?token=<jwt-token>`

Returns:
```json
{
  "valid": true,
  "email": "owner@school.com",
  "name": "John Doe"
}
```

**Features:**
- ✅ Validates password strength (min 8 chars)
- ✅ Verifies token (JWT + database check)
- ✅ Checks 1-hour expiry
- ✅ Hashes new password with bcrypt
- ✅ Clears reset token after use

---

## 📧 Email Templates

All emails are Hebrew RTL with beautiful responsive design:

### 1. Verification Email
- **Subject:** "אימות כתובת מייל - kartis.info"
- **Expiry:** 24 hours
- **CTA:** "אמת את המייל שלך"
- **Color:** Purple gradient

### 2. Password Reset Email
- **Subject:** "איפוס סיסמה - kartis.info"
- **Expiry:** 1 hour
- **CTA:** "אפס סיסמה"
- **Color:** Pink/red gradient

### 3. Welcome Email
- **Subject:** "ברוך הבא ל-kartis.info! 🎉"
- **Sent:** After email verification
- **Content:** Getting started guide
- **Color:** Green gradient

### 4. Team Invitation Email (Coming Soon)
- **Subject:** "הזמנה לצוות {schoolName} - kartis.info"
- **Expiry:** 7 days
- **CTA:** "קבל הזמנה"
- **Color:** Blue gradient

---

## 🧪 Testing

### Test Signup Flow:

```bash
# Run the test script
npx tsx scripts/test-signup.ts
```

This will test:
- ✅ Successful signup
- ✅ Duplicate email prevention
- ✅ Duplicate slug prevention
- ✅ Email sending

### Manual Testing with curl:

```bash
# Signup
curl -X POST http://localhost:9000/api/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User",
    "schoolName": "Test School",
    "schoolSlug": "test-school"
  }'

# Verify Email (you'll get the token from email)
curl -X POST http://localhost:9000/api/admin/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "your-jwt-token-here"}'

# Forgot Password
curl -X POST http://localhost:9000/api/admin/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Reset Password (you'll get the token from email)
curl -X POST http://localhost:9000/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-jwt-token-here",
    "password": "newpassword123"
  }'
```

---

## 🔒 Security Features

### Password Security:
- ✅ Minimum 8 characters
- ✅ Bcrypt hashing (10 rounds)
- ✅ No plain text storage

### Token Security:
- ✅ JWT with expiry
- ✅ Verification: 24 hours
- ✅ Password reset: 1 hour
- ✅ Tokens stored in database
- ✅ Single-use tokens (cleared after use)

### Email Security:
- ✅ Email enumeration protection (forgot password)
- ✅ Lowercase normalization
- ✅ Format validation
- ✅ OAuth-only account protection

### Input Validation:
- ✅ Email format (regex)
- ✅ Password strength
- ✅ Slug format (alphanumeric + hyphens)
- ✅ Required fields
- ✅ Duplicate prevention

---

## 📊 Database Changes on Signup

```sql
-- New School (FREE plan, 14-day trial)
INSERT INTO "School" (
  name, slug, plan, subscriptionStatus, trialEndsAt
) VALUES (
  'My School Name',
  'my-school',
  'FREE',
  'TRIAL',
  NOW() + INTERVAL '14 days'
);

-- New Admin (OWNER role, unverified)
INSERT INTO "Admin" (
  email, passwordHash, name, role, schoolId,
  emailVerified, verificationToken
) VALUES (
  'owner@school.com',
  '<bcrypt-hash>',
  'John Doe',
  'OWNER',
  '<school-id>',
  false,
  '<jwt-token>'
);
```

---

## 🚀 Integration with Existing Code

### Update Login to Check Email Verification

In `/lib/auth.server.ts`, the `login()` function should check:

```typescript
if (!admin.emailVerified) {
  // Don't allow login until email is verified
  return null
}
```

### Add Usage Tracking to Event Creation

In `/app/api/events/route.ts`:

```typescript
import { trackUsage, canUseResource } from '@/lib/usage'

// Before creating event
const check = await canUseResource(schoolId, 'EVENT_CREATED')
if (!check.allowed) {
  return Response.json({
    error: 'הגעת למגבלת האירועים. שדרג את התכנית שלך.'
  }, { status: 403 })
}

// After successful creation
await trackUsage(schoolId, 'EVENT_CREATED')
```

### Add Usage Tracking to Registration

In `/app/api/p/[slug]/register/route.ts`:

```typescript
// After successful registration
await trackUsage(event.schoolId, 'REGISTRATION_PROCESSED')
```

---

## 📈 What's Next?

### Phase 3: UI Components (Coming Soon)
- [ ] Signup page (`/admin/signup`)
- [ ] Email verification page (`/admin/verify-email`)
- [ ] Forgot password page (`/admin/forgot-password`)
- [ ] Reset password page (`/admin/reset-password`)
- [ ] Login page updates (show verification messages)

### Phase 4: Team Management (Coming Soon)
- [ ] Team invitation API
- [ ] Accept invitation API
- [ ] Team members list
- [ ] Role management

### Phase 5: Usage Dashboard (Coming Soon)
- [ ] Usage metrics display
- [ ] Plan comparison
- [ ] Upgrade modal
- [ ] Billing portal

---

## 🎉 Summary

You now have a complete authentication system with:

- ✅ Self-service signup
- ✅ Email verification
- ✅ Password reset
- ✅ Beautiful Hebrew emails
- ✅ Secure token management
- ✅ 14-day trial on signup
- ✅ FREE plan by default
- ✅ Ready for user onboarding!

**Test it now:** `npx tsx scripts/test-signup.ts`

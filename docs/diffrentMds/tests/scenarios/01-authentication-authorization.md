# Authentication & Authorization Test Scenarios

## 1. Email/Password Signup

### 1.1 Happy Path - Complete Signup Flow
- **Given**: User is on landing page
- **When**: User clicks signup, fills valid details (email, password, name, schoolName, schoolSlug)
- **Then**:
  - Account created successfully
  - Verification email sent
  - User redirected to verification pending page
  - School and admin records created in DB
  - schoolId is NULL until onboarding complete

### 1.2 Email Verification
- **Given**: User signed up and received verification email
- **When**: User clicks verification link
- **Then**:
  - emailVerified set to true
  - User redirected to login page
  - Success message shown

### 1.3 Validation - Invalid Email Format
- **Given**: User on signup form
- **When**: User enters invalid email (no @, no domain, etc.)
- **Then**: Form validation error shown, submit disabled

### 1.4 Validation - Weak Password
- **Given**: User on signup form
- **When**: User enters password < 6 characters
- **Then**: Password strength error shown

### 1.5 Validation - Missing Required Fields
- **Given**: User on signup form
- **When**: User leaves required fields empty (email, password, name, schoolName, schoolSlug)
- **Then**:
  - Missing fields highlighted in red
  - Error notification box shown above submit
  - Submit button disabled with Hebrew text "נא למלא את כל השדות החובה"

### 1.6 Duplicate Email
- **Given**: Email already exists in database
- **When**: User tries to signup with same email
- **Then**: Error message "Email already registered"

### 1.7 Duplicate School Slug
- **Given**: School slug already exists
- **When**: User enters taken slug
- **Then**: Error message "School slug already taken"

### 1.8 Mobile Signup Flow
- **Given**: User on mobile device (375px width)
- **When**: User fills signup form
- **Then**:
  - All fields visible and accessible
  - Touch targets minimum 44px height
  - Input text visible (text-gray-900 bg-white classes)
  - Hebrew RTL layout correct

---

## 2. Login Flow

### 2.1 Happy Path - Successful Login
- **Given**: User has verified email and account
- **When**: User enters correct email/password
- **Then**:
  - JWT session cookie created (admin_session, 7 days)
  - User redirected to dashboard if schoolId exists
  - User redirected to onboarding if schoolId is NULL

### 2.2 Invalid Credentials
- **Given**: User on login page
- **When**: User enters wrong email or password
- **Then**: Error message "Invalid credentials"

### 2.3 Unverified Email Login Attempt
- **Given**: User signed up but didn't verify email
- **When**: User tries to login
- **Then**: Error message "Please verify your email first"

### 2.4 Session Persistence
- **Given**: User logged in successfully
- **When**: User closes browser and reopens within 7 days
- **Then**: User still logged in (session cookie valid)

### 2.5 Session Expiration
- **Given**: User logged in 7+ days ago
- **When**: User tries to access protected route
- **Then**: Redirected to login page

### 2.6 Mobile Login
- **Given**: User on mobile device
- **When**: User logs in
- **Then**:
  - Form fields properly sized
  - Password visible toggle works
  - Remember me checkbox touchable

---

## 3. Google OAuth Flow

### 3.1 New User - Google Signup
- **Given**: User not in system
- **When**: User clicks "Sign in with Google" and completes OAuth
- **Then**:
  - New admin account created
  - emailVerified set to true automatically
  - Google account linked (googleId saved)
  - User redirected to onboarding
  - No password set (password field NULL)

### 3.2 Existing User - Auto Link (No Password)
- **Given**: User exists with email but NO password set
- **When**: User signs in with Google
- **Then**:
  - Google account auto-linked
  - User logged in successfully
  - Session created with schoolId

### 3.3 Existing User - Require Password Confirmation
- **Given**: User exists with password already set
- **When**: User tries to sign in with Google
- **Then**:
  - System prompts for password confirmation (security)
  - User must enter existing password to link Google account
  - After confirmation, Google linked successfully

### 3.4 OAuth Callback Error Handling
- **Given**: Google OAuth flow initiated
- **When**: User denies permissions or error occurs
- **Then**:
  - User redirected to login with error message
  - No account created
  - Error logged

---

## 4. Password Reset Flow

### 4.1 Happy Path - Forgot Password
- **Given**: User forgot password
- **When**: User enters email on forgot password page
- **Then**:
  - Reset email sent to address
  - Email contains secure reset token
  - Token expires after set time (e.g., 1 hour)

### 4.2 Reset Password with Valid Token
- **Given**: User received reset email
- **When**: User clicks link and enters new password
- **Then**:
  - Password updated in database
  - Old password no longer works
  - User redirected to login
  - Success message shown

### 4.3 Expired Reset Token
- **Given**: Reset token older than expiration time
- **When**: User tries to use expired token
- **Then**: Error message "Reset link expired, request new one"

### 4.4 Invalid Reset Token
- **Given**: User has malformed or invalid token
- **When**: User tries to access reset page
- **Then**: Error message "Invalid reset link"

---

## 5. Logout Flow

### 5.1 Standard Logout
- **Given**: User logged in
- **When**: User clicks logout button
- **Then**:
  - Session cookie deleted
  - User redirected to landing/login page
  - Protected routes no longer accessible

### 5.2 Logout from Multiple Tabs
- **Given**: User logged in on multiple browser tabs
- **When**: User logs out from one tab
- **Then**: All tabs should reflect logged out state

---

## 6. Role-Based Access Control (RBAC)

### 6.1 SUPER_ADMIN Access
- **Given**: User is SUPER_ADMIN
- **When**: User accesses any school's data or admin routes
- **Then**:
  - Can view all schools
  - Can access /api/admin/super/* endpoints
  - Can view feedback
  - Bypasses schoolId filters

### 6.2 OWNER Role Permissions
- **Given**: User is OWNER of school
- **When**: User accesses features
- **Then**:
  - Can manage team (invite, remove members)
  - Can view billing (future)
  - Can create/edit/delete events
  - Can view/edit registrations
  - Limited to own schoolId

### 6.3 ADMIN Role Permissions
- **Given**: User is ADMIN of school
- **When**: User accesses features
- **Then**:
  - Can create/edit/delete events
  - Can view/edit registrations
  - Cannot manage team
  - Limited to own schoolId

### 6.4 MANAGER Role Permissions
- **Given**: User is MANAGER of school
- **When**: User accesses features
- **Then**:
  - Can view events (read-only)
  - Can edit registrations
  - Cannot create/delete events
  - Limited to own schoolId

### 6.5 VIEWER Role Permissions
- **Given**: User is VIEWER of school
- **When**: User accesses features
- **Then**:
  - Can view events (read-only)
  - Can view registrations (read-only)
  - Cannot edit anything
  - Limited to own schoolId

### 6.6 Unauthorized Role Access Attempt
- **Given**: User with insufficient role (e.g., VIEWER)
- **When**: User tries to access higher permission endpoint (e.g., create event)
- **Then**:
  - 403 Forbidden error
  - Error message shown
  - Action not performed

---

## 7. Session & Token Management

### 7.1 JWT Token Structure
- **Given**: User logs in
- **When**: JWT token created
- **Then**:
  - Contains: adminId, email, role, schoolId, schoolName
  - Signed with JWT_SECRET
  - HTTP-only cookie (prevents XSS)
  - 7-day expiration

### 7.2 Session Update After Onboarding
- **Given**: User completes onboarding (schoolId changes from NULL to value)
- **When**: Onboarding API returns success
- **Then**:
  - Session cookie updated with new schoolId
  - encodeSession() called with updated data
  - User can immediately access school-scoped resources

### 7.3 Middleware Token Validation
- **Given**: User accessing protected route
- **When**: Middleware checks token
- **Then**:
  - Uses jose library (Edge Runtime compatible)
  - Validates signature with JWT_SECRET
  - Rejects invalid/expired tokens
  - Allows valid tokens through

### 7.4 Missing JWT_SECRET
- **Given**: JWT_SECRET environment variable not set
- **When**: Server starts or user tries to login
- **Then**:
  - Error thrown (no fallback allowed)
  - Application refuses to start/authenticate

---

## 8. Email Verification Edge Cases

### 8.1 Resend Verification Email
- **Given**: User didn't receive verification email
- **When**: User requests resend
- **Then**:
  - New verification email sent
  - Old verification link still works (or invalidated)

### 8.2 Already Verified Account
- **Given**: User already verified email
- **When**: User clicks verification link again
- **Then**: Message "Email already verified"

### 8.3 Development Mode Email Restrictions
- **Given**: Using Resend test mode (EMAIL_FROM="onboarding@resend.dev")
- **When**: Sending verification email
- **Then**:
  - Can only send to account owner email
  - Production requires verified domain

---

## 9. Security Scenarios

### 9.1 XSS Prevention - JWT in HTTP-only Cookie
- **Given**: Malicious script injected in page
- **When**: Script tries to access session token
- **Then**: Cannot access HTTP-only cookie via JavaScript

### 9.2 CSRF Protection
- **Given**: User logged in
- **When**: Malicious site tries to make requests
- **Then**:
  - SameSite cookie attribute prevents CSRF
  - Requests from different origin rejected

### 9.3 Password Storage
- **Given**: User creates account with password
- **When**: Password saved to database
- **Then**:
  - Password hashed (bcrypt/similar)
  - Plain text password never stored

### 9.4 Session Hijacking Prevention
- **Given**: Attacker obtains session token
- **When**: Token used from different IP/device
- **Then**:
  - (Future) Detect suspicious activity
  - (Future) Require re-authentication

---

## 10. Mobile-Specific Auth Scenarios

### 10.1 Touch Target Sizes
- **Given**: User on mobile device
- **When**: User interacts with auth forms
- **Then**:
  - All buttons minimum 44px height
  - Adequate spacing between elements
  - Easy to tap without misclicks

### 10.2 Password Visibility Toggle
- **Given**: User entering password on mobile
- **When**: User taps "show password" icon
- **Then**: Password switches between masked/visible

### 10.3 Auto-fill Support
- **Given**: User has saved credentials
- **When**: User visits login page
- **Then**:
  - Browser auto-fill works correctly
  - Fields properly labeled for auto-fill

---

## Test Coverage Priority

**Critical (P0):**
- 1.1, 2.1, 2.2, 3.1, 5.1, 6.1-6.5, 7.1-7.3

**High (P1):**
- 1.2-1.8, 2.3-2.4, 3.2-3.3, 4.1-4.2, 9.1-9.3

**Medium (P2):**
- 2.5-2.6, 3.4, 4.3-4.4, 5.2, 7.4, 8.1-8.2

**Low (P3):**
- 8.3, 9.4, 10.1-10.3

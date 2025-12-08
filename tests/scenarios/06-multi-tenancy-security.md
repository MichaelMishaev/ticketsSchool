# Multi-Tenancy & Security Test Scenarios

## 1. Data Isolation - Events

### 1.1 School A Cannot Access School B Events via API
- **Given**: School A admin logged in (schoolId = 1)
- **When**: Admin tries GET /api/events with School B's event ID
- **Then**:
  - 403 Forbidden or 404 Not Found error
  - No event data returned
  - schoolId filter enforced server-side
  - Attempt logged for security audit

### 1.2 School A Cannot Access School B Events via URL
- **Given**: School A admin logged in
- **When**: Admin navigates to /admin/events/[school-b-event-id]
- **Then**:
  - Access denied
  - Redirected to own events or error page
  - No data visible

### 1.3 Event Creation Automatically Scoped to School
- **Given**: Admin logged in (schoolId = 5)
- **When**: Admin creates event
- **Then**:
  - Event.schoolId automatically set to 5 (from session)
  - Cannot manually specify different schoolId
  - Validation enforces schoolId

### 1.4 Event List Filtered by schoolId
- **Given**: Database has events from multiple schools
- **When**: School A admin requests event list
- **Then**:
  - WHERE clause includes: schoolId = [admin's schoolId]
  - Only School A events returned
  - Count reflects only accessible events

### 1.5 Event Update Enforces schoolId
- **Given**: Admin tries to update event via API
- **When**: PUT /api/events/[id] sent
- **Then**:
  - Server validates event.schoolId === admin.schoolId
  - Update rejected if mismatch
  - 403 Forbidden error

### 1.6 Event Delete Enforces schoolId
- **Given**: Admin tries to delete event
- **When**: DELETE /api/events/[id] sent
- **Then**:
  - Server validates event.schoolId === admin.schoolId
  - Delete rejected if mismatch
  - 403 Forbidden error

---

## 2. Data Isolation - Registrations

### 2.1 School A Cannot Access School B Registrations
- **Given**: School A admin logged in
- **When**: Admin tries to access School B event's registrations
- **Then**:
  - Event lookup fails due to schoolId mismatch
  - No registrations visible
  - 403 Forbidden error

### 2.2 Registration List Query Joins Event schoolId
- **Given**: Admin requests registrations for event
- **When**: API query executes
- **Then**:
  - Query joins Registration → Event → School
  - WHERE clause: Event.schoolId = admin.schoolId
  - No registrations from other schools returned

### 2.3 Registration Edit Enforces schoolId
- **Given**: Admin tries to edit registration
- **When**: PATCH /api/events/[eventId]/registrations/[regId]
- **Then**:
  - Server validates Event.schoolId === admin.schoolId
  - Edit rejected if mismatch
  - No cross-school updates

### 2.4 Registration Cancel Enforces schoolId
- **Given**: Admin tries to cancel registration
- **When**: API call made
- **Then**:
  - Event schoolId validated
  - Cancel rejected if not own school
  - Capacity updates only for own school

### 2.5 Export Registrations Scoped by schoolId
- **Given**: Admin exports registrations
- **When**: CSV generated
- **Then**:
  - Only registrations from own school's events
  - No data leakage across schools
  - CSV reflects schoolId filter

---

## 3. Data Isolation - School Information

### 3.1 School A Cannot View School B Details
- **Given**: School A admin logged in
- **When**: Admin tries GET /api/schools/[school-b-id]
- **Then**:
  - 403 Forbidden error (non-SUPER_ADMIN)
  - No school data returned
  - Only own school visible

### 3.2 School A Cannot Edit School B Details
- **Given**: School A admin tries to update School B
- **When**: API call made
- **Then**:
  - Update rejected
  - schoolId validation fails
  - 403 Forbidden error

### 3.3 School Slug Uniqueness Enforced Globally
- **Given**: School A has slug "beeri"
- **When**: School B tries to use slug "beeri"
- **Then**:
  - Validation error
  - Slug must be globally unique
  - Cannot create duplicate

### 3.4 School List Only Shows Own School (non-SUPER_ADMIN)
- **Given**: Regular admin requests schools
- **When**: GET /api/schools called
- **Then**:
  - Only own school returned
  - Or endpoint returns 403 if not SUPER_ADMIN
  - No list of all schools visible

---

## 4. Data Isolation - Team Management

### 4.1 School A Cannot Invite to School B
- **Given**: School A OWNER logged in
- **When**: OWNER tries to send invitation
- **Then**:
  - Invitation.schoolId automatically set to School A
  - Cannot specify different schoolId
  - Invitee joins School A only

### 4.2 School A Cannot View School B Team Members
- **Given**: School A admin requests team list
- **When**: GET /api/team called
- **Then**:
  - WHERE Admin.schoolId = School A
  - Only School A team members returned
  - No access to other schools' teams

### 4.3 School A Cannot Remove School B Team Member
- **Given**: School A OWNER tries to remove user
- **When**: Remove team member API called
- **Then**:
  - Validates target admin.schoolId === session schoolId
  - Removal rejected if different school
  - 403 Forbidden error

### 4.4 Team Invitation Token Scoped to School
- **Given**: Invitation sent for School A
- **When**: Invitee accepts
- **Then**:
  - Admin.schoolId set to School A (from invitation)
  - Cannot use token to join different school
  - schoolId from invitation, not user choice

---

## 5. SUPER_ADMIN Special Access

### 5.1 SUPER_ADMIN Bypasses schoolId Filter
- **Given**: User is SUPER_ADMIN
- **When**: SUPER_ADMIN accesses events/registrations
- **Then**:
  - No schoolId filter applied (or all schools accessible)
  - Can view all schools' data
  - Special handling in API routes

### 5.2 SUPER_ADMIN Can Impersonate School
- **Given**: SUPER_ADMIN wants to manage specific school
- **When**: SUPER_ADMIN selects school context
- **Then**:
  - Session temporarily scoped to that school
  - Acts as OWNER of that school
  - Clear UI indicator of impersonation

### 5.3 SUPER_ADMIN Can Create Events for Any School
- **Given**: SUPER_ADMIN creating event
- **When**: Event created
- **Then**:
  - Can manually specify schoolId
  - Not restricted to own schoolId
  - Dropdown to select school

### 5.4 SUPER_ADMIN Can Access All Schools Endpoint
- **Given**: SUPER_ADMIN requests school list
- **When**: GET /api/admin/super/schools called
- **Then**:
  - All schools returned
  - Searchable, filterable
  - Non-SUPER_ADMIN gets 403

### 5.5 SUPER_ADMIN Cannot Be Demoted by OWNER
- **Given**: SUPER_ADMIN in school team
- **When**: OWNER tries to change SUPER_ADMIN role
- **Then**:
  - Action rejected
  - SUPER_ADMIN role protected
  - Only platform can manage SUPER_ADMIN

---

## 6. Session Security

### 6.1 Session Contains schoolId
- **Given**: User logs in
- **When**: JWT token created
- **Then**:
  - Token payload includes: adminId, email, role, schoolId
  - schoolId used for all data filtering
  - Cannot be modified client-side (signed token)

### 6.2 Session schoolId Updated After Onboarding
- **Given**: User completes onboarding (schoolId was NULL)
- **When**: Onboarding API returns success
- **Then**:
  - New JWT token generated with schoolId
  - Session cookie updated
  - Next request uses new schoolId

### 6.3 Session Invalidated on schoolId Change
- **Given**: Admin's schoolId changed (e.g., switched schools)
- **When**: schoolId updated in database
- **Then**:
  - Old session no longer valid for new school
  - User must re-login
  - Or session auto-updated (if supported)

### 6.4 Session Tamper Detection
- **Given**: Attacker modifies JWT payload (e.g., change schoolId)
- **When**: Tampered token sent to server
- **Then**:
  - Signature validation fails
  - 401 Unauthorized error
  - Access denied

### 6.5 Session Replay Attack Prevention
- **Given**: Attacker captures valid JWT token
- **When**: Attacker uses token from different IP/device
- **Then**:
  - (Current) Token still valid (no additional checks)
  - (Future) Detect anomalous usage patterns
  - (Future) Require re-authentication

### 6.6 Session Expiration Enforced
- **Given**: JWT token expired (> 7 days old)
- **When**: User makes request with expired token
- **Then**:
  - Token validation fails
  - 401 Unauthorized error
  - User redirected to login

---

## 7. API Authorization Patterns

### 7.1 Consistent schoolId Enforcement Pattern
- **Given**: Any API route handling school-scoped data
- **When**: Request processed
- **Then**:
  - ALWAYS extract schoolId from session
  - ALWAYS add to WHERE clause
  - NEVER trust client-sent schoolId
  - Example pattern:
    ```typescript
    const admin = await requireAdmin(request)
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return 403 Forbidden
      }
      where.schoolId = admin.schoolId
    }
    ```

### 7.2 Reject schoolId in Request Body
- **Given**: Client sends schoolId in request body
- **When**: Event/registration created or updated
- **Then**:
  - schoolId from body IGNORED
  - schoolId from session ALWAYS used
  - Prevents client-side tampering

### 7.3 Validate schoolId on Every Operation
- **Given**: Admin performing action on resource
- **When**: API validates access
- **Then**:
  - Fetch resource from database
  - Compare resource.schoolId === admin.schoolId
  - Reject if mismatch
  - Return 403 Forbidden

### 7.4 N+1 Query Prevention with schoolId
- **Given**: API returns list of events with registrations
- **When**: Query executed
- **Then**:
  - Use Prisma include/select with WHERE
  - Single query with JOIN and schoolId filter
  - No additional queries per event
  - Performance and security optimized

---

## 8. SQL Injection Prevention

### 8.1 Prisma Parameterized Queries
- **Given**: User input used in database queries
- **When**: Query executed via Prisma
- **Then**:
  - All inputs automatically parameterized
  - No raw SQL string concatenation
  - SQL injection impossible

### 8.2 Raw SQL Queries (If Any) Are Safe
- **Given**: Raw SQL query needed (e.g., complex analytics)
- **When**: Query executed
- **Then**:
  - Use Prisma.$queryRaw with tagged template
  - Parameters passed separately
  - Never concatenate user input

### 8.3 User Input Validation
- **Given**: User submits form data
- **When**: Data processed server-side
- **Then**:
  - Type checking (TypeScript)
  - Format validation (email, phone, etc.)
  - Length limits enforced
  - Special characters sanitized if needed

---

## 9. XSS Prevention

### 9.1 React Auto-Escaping
- **Given**: User-generated content displayed (event title, description)
- **When**: Content rendered in React
- **Then**:
  - React automatically escapes HTML
  - No `dangerouslySetInnerHTML` used
  - XSS attack prevented

### 9.2 User Input Sanitization
- **Given**: Rich text or HTML allowed (future feature)
- **When**: Content saved to database
- **Then**:
  - HTML sanitized (e.g., with DOMPurify)
  - Only safe tags allowed
  - Script tags stripped

### 9.3 Content Security Policy (Future)
- **Given**: Application loading
- **When**: HTTP response sent
- **Then**:
  - CSP header set
  - Restricts script sources
  - Prevents inline script execution

---

## 10. CSRF Prevention

### 10.1 SameSite Cookie Attribute
- **Given**: Session cookie created
- **When**: Cookie attributes set
- **Then**:
  - SameSite=Lax or Strict
  - Prevents cross-site request with cookie
  - CSRF attacks mitigated

### 10.2 Origin Validation (Future)
- **Given**: API request received
- **When**: Server validates request
- **Then**:
  - Check Origin or Referer header
  - Reject requests from unauthorized origins
  - Whitelist own domain

### 10.3 CSRF Token (Future Enhancement)
- **Given**: State-changing operations
- **When**: Form submitted
- **Then**:
  - CSRF token required
  - Token validated server-side
  - Token tied to session

---

## 11. Authentication Security

### 11.1 Password Hashing
- **Given**: User creates account with password
- **When**: Password stored
- **Then**:
  - Password hashed (bcrypt or similar)
  - Salt automatically applied
  - Plain text password never stored
  - Hash irreversible

### 11.2 Password Strength Enforcement
- **Given**: User setting password
- **When**: Password validated
- **Then**:
  - Minimum 6 characters (or stronger)
  - (Future) Require mix of char types
  - (Future) Check against common passwords

### 11.3 Brute Force Protection (Future)
- **Given**: Attacker attempting multiple logins
- **When**: Many failed attempts detected
- **Then**:
  - Rate limiting applied (e.g., 5 attempts per 15 min)
  - Account temporarily locked
  - CAPTCHA required

### 11.4 Password Reset Token Security
- **Given**: User requests password reset
- **When**: Reset token generated
- **Then**:
  - Token cryptographically random
  - Token stored hashed
  - Token expires after 1 hour
  - Single-use token (invalidated after use)

---

## 12. Authorization Edge Cases

### 12.1 Admin with NULL schoolId
- **Given**: Admin account with schoolId = NULL (incomplete onboarding)
- **When**: Admin tries to access school-scoped resource
- **Then**:
  - 403 Forbidden error
  - Redirected to onboarding
  - No data access until schoolId set

### 12.2 Admin Removed from School
- **Given**: Admin's schoolId set to NULL (removed by OWNER)
- **When**: Admin tries to access previous school's data
- **Then**:
  - Session no longer valid for that school
  - 403 Forbidden error
  - Cannot access any school-scoped resources

### 12.3 Admin Switches Schools
- **Given**: Admin invited to different school
- **When**: Admin accepts invitation
- **Then**:
  - admin.schoolId updated to new school
  - Session updated
  - Loses access to previous school
  - (Future) Multi-school support

### 12.4 Role Downgrade
- **Given**: OWNER demotes ADMIN to MANAGER
- **When**: ADMIN (now MANAGER) tries to create event
- **Then**:
  - Next request reflects new role
  - Insufficient permissions error
  - Action denied

### 12.5 Concurrent Session with Role Change
- **Given**: Admin logged in on multiple devices
- **When**: Role changed by OWNER
- **Then**:
  - (Current) Old sessions still have old role until re-login
  - (Future) Invalidate all sessions on role change
  - (Future) Real-time session sync

---

## 13. Sensitive Data Exposure

### 13.1 Error Messages Don't Leak Data
- **Given**: Error occurs during operation
- **When**: Error response sent to client
- **Then**:
  - Generic user-friendly message shown
  - Stack traces NOT exposed
  - Database errors NOT shown
  - Internal details logged server-side only

### 13.2 API Responses Don't Include Sensitive Fields
- **Given**: Admin object returned in API
- **When**: Response serialized
- **Then**:
  - Password hash excluded
  - JWT secret never sent
  - Internal IDs minimized
  - Only necessary fields included

### 13.3 Registration Data Privacy
- **Given**: Public event page
- **When**: Page loads
- **Then**:
  - Registrant details NOT visible to public
  - Only aggregate stats (e.g., "25/50 spots taken")
  - No names, emails, phones exposed

### 13.4 Email Addresses Hidden in UI (Future)
- **Given**: MANAGER or VIEWER viewing registrations
- **When**: Registration list shown
- **Then**:
  - Email partially masked (e.g., "j***@example.com")
  - Full email only for ADMIN/OWNER
  - Privacy protection for sensitive data

---

## 14. Audit Logging (Future)

### 14.1 Log Critical Actions
- **Given**: Admin performs sensitive action
- **When**: Action completes
- **Then**:
  - Log entry created: who, what, when, resource ID
  - Actions logged: create/edit/delete event, cancel registration, role changes
  - Logs immutable and timestamped

### 14.2 Log Failed Authorization Attempts
- **Given**: Admin tries to access unauthorized resource
- **When**: 403 Forbidden returned
- **Then**:
  - Attempt logged with: adminId, attempted resource, timestamp
  - Helps detect malicious activity
  - Alerts for repeated violations

### 14.3 Audit Log Viewing (SUPER_ADMIN)
- **Given**: SUPER_ADMIN needs to investigate
- **When**: Audit log accessed
- **Then**:
  - Searchable by admin, action, date range
  - Filterable by school
  - Exportable for analysis

---

## 15. Secure Configuration

### 15.1 JWT_SECRET Must Be Set
- **Given**: Application starting
- **When**: Environment checked
- **Then**:
  - Error if JWT_SECRET missing
  - No fallback to default/weak secret
  - Minimum length enforced (32 chars)

### 15.2 Production DATABASE_URL Secured
- **Given**: Deploying to production
- **When**: Database connection established
- **Then**:
  - SSL/TLS enforced (sslmode=require)
  - No hardcoded credentials
  - Environment variable used

### 15.3 Email API Keys Not Exposed
- **Given**: Sending emails via Resend
- **When**: API called
- **Then**:
  - RESEND_API_KEY in environment only
  - Never sent to client
  - Never logged in plain text

### 15.4 HTTPS Enforced in Production
- **Given**: Production deployment
- **When**: User accesses site
- **Then**:
  - HTTPS required
  - HTTP redirects to HTTPS
  - HSTS header set (future)

---

## 16. Input Validation & Sanitization

### 16.1 Slug Format Validation
- **Given**: User entering school or event slug
- **When**: Slug validated
- **Then**:
  - Only lowercase letters, numbers, hyphens
  - No spaces or special characters
  - Max length enforced (e.g., 50 chars)

### 16.2 Email Format Validation
- **Given**: User entering email
- **When**: Email validated
- **Then**:
  - Standard email regex/validator used
  - Rejects invalid formats
  - No SQL injection via email field

### 16.3 Phone Number Normalization
- **Given**: User entering Israeli phone
- **When**: Phone validated
- **Then**:
  - Normalized to 10 digits
  - Only digits stored
  - Prevents injection via phone field

### 16.4 Integer Boundaries
- **Given**: User entering numeric value (capacity, spots)
- **When**: Value validated
- **Then**:
  - Minimum and maximum enforced
  - Prevents integer overflow
  - Rejects negative where inappropriate

### 16.5 String Length Limits
- **Given**: User entering text (title, description, name)
- **When**: Value validated
- **Then**:
  - Maximum length enforced (database column limits)
  - Prevents buffer overflow
  - Truncation or rejection

---

## Test Coverage Priority

**Critical (P0):**
- 1.1-1.6, 2.1-2.4, 3.1-3.2, 4.1-4.4, 5.1-5.4, 6.1-6.6, 7.1-7.3, 11.1, 15.1

**High (P1):**
- 5.5, 8.1-8.3, 9.1, 10.1, 11.2-11.4, 12.1-12.4, 13.1-13.3, 15.2-15.4, 16.1-16.3

**Medium (P2):**
- 2.5, 3.3-3.4, 7.4, 9.2-9.3, 10.2-10.3, 12.5, 13.4, 14.1-14.3, 16.4-16.5

**Low (P3):**
- None (all security scenarios are important)

# Edge Cases & Error Handling Test Scenarios

## 1. Database Connection Errors

### 1.1 Database Unavailable on Startup
- **Given**: PostgreSQL container not running
- **When**: Application starts
- **Then**:
  - Error logged clearly
  - Health check endpoint returns unhealthy
  - User sees "Service unavailable" page
  - Application doesn't crash

### 1.2 Database Connection Lost During Request
- **Given**: Active database connection
- **When**: Database goes down mid-request
- **Then**:
  - Transaction rolled back gracefully
  - User sees error message
  - No partial data saved
  - Connection pool attempts reconnect

### 1.3 Database Timeout
- **Given**: Slow query or unresponsive database
- **When**: Query exceeds timeout (e.g., 30 seconds)
- **Then**:
  - Query aborted
  - Timeout error returned
  - User sees "Request timed out"
  - Connection released back to pool

### 1.4 Connection Pool Exhausted
- **Given**: Maximum database connections reached
- **When**: New request needs connection
- **Then**:
  - Request queued or rejected gracefully
  - Error message: "Service busy, try again"
  - Connection pool size visible in monitoring
  - No application crash

---

## 2. Email Sending Failures

### 2.1 Resend API Unavailable
- **Given**: Registration confirmed
- **When**: Resend API returns 503 Service Unavailable
- **Then**:
  - Registration still saved to database
  - Error logged with registration ID
  - Admin notified of email failure
  - Retry mechanism (future)

### 2.2 Invalid Email Address
- **Given**: User enters malformed email that passes client validation
- **When**: Server tries to send email
- **Then**:
  - Email sending fails
  - Registration still saved
  - User sees confirmation code on screen (backup)
  - Error logged with details

### 2.3 Resend API Rate Limit Hit
- **Given**: Many registrations in short time
- **When**: Resend rate limit exceeded
- **Then**:
  - Emails queued for retry
  - Registrations still saved
  - Admin notified of delay
  - Emails sent when rate limit resets

### 2.4 Email Bounce (Future)
- **Given**: Email sent successfully
- **When**: Email bounces (invalid recipient)
- **Then**:
  - Bounce webhook received
  - Registration flagged in admin panel
  - Admin notified to contact registrant
  - Bounce rate tracked

### 2.5 Unverified Domain in Production
- **Given**: EMAIL_FROM domain not verified at Resend
- **When**: Email send attempted
- **Then**:
  - Clear error message
  - Setup instructions shown
  - Emails not sent until verified
  - Development workaround available

---

## 3. Concurrent Operations

### 3.1 Two Users Register for Last Spot
- **Given**: Event has 1 spot left
- **When**: Two users submit simultaneously
- **Then**:
  - Prisma transaction ensures atomicity
  - First transaction: CONFIRMED, spotsReserved = capacity
  - Second transaction: WAITLIST
  - No over-booking

### 3.2 Admin Edits Event While User Registers
- **Given**: User filling registration form
- **When**: Admin changes event capacity or closes registration
- **Then**:
  - Registration uses latest event data
  - If capacity reduced: may go to waitlist
  - If event closed: registration rejected
  - Clear error message to user

### 3.3 Two Admins Edit Same Registration
- **Given**: Registration open in two admin tabs
- **When**: Both admins save changes
- **Then**:
  - Last write wins (Prisma default)
  - Or: Optimistic locking error (future)
  - Conflict detection (future)

### 3.4 Admin Cancels While User Registering
- **Given**: User submitting registration
- **When**: Admin cancels event simultaneously
- **Then**:
  - Registration transaction checks event status
  - If cancelled: registration rejected
  - User sees "Event cancelled" error

### 3.5 Bulk Operations Race Conditions
- **Given**: Admin performs bulk cancel on 50 registrations
- **When**: Another admin edits one of those registrations
- **Then**:
  - Database transaction handles conflict
  - Consistent final state
  - No lost updates

---

## 4. Invalid or Malformed Data

### 4.1 Extremely Long Input Strings
- **Given**: User enters 10,000 character event description
- **When**: Form submitted
- **Then**:
  - Validation enforces max length (e.g., 2000 chars)
  - Error message shown
  - Database column limits prevent overflow
  - Truncation or rejection

### 4.2 Special Characters in Names
- **Given**: User enters name with emojis, special chars (e.g., "John 👨‍💻 Doe")
- **When**: Registration submitted
- **Then**:
  - UTF-8 encoding preserves characters
  - Stored correctly in database
  - Displays correctly in UI
  - No corruption

### 4.3 Hebrew and English Mixed
- **Given**: Event title has mixed Hebrew and English
- **When**: Event created
- **Then**:
  - Both languages stored correctly
  - Slug generated appropriately
  - Display handles bidirectional text
  - No rendering issues

### 4.4 Null or Undefined Values
- **Given**: API receives null/undefined for optional field
- **When**: Data processed
- **Then**:
  - Null handled gracefully (stored as NULL or default)
  - No "null" string stored
  - No crashes from null pointer

### 4.5 Invalid JSON in Custom Fields
- **Given**: Corrupted customFields JSON in database
- **When**: Registration loaded
- **Then**:
  - Error caught and logged
  - Fallback to empty object or default
  - Admin notified of data issue
  - No application crash

### 4.6 Negative Numbers
- **Given**: User somehow submits negative capacity or spots
- **When**: Validation runs
- **Then**:
  - Rejected by server validation
  - Minimum value enforced (e.g., 1)
  - Error message shown

### 4.7 Non-Integer Numbers
- **Given**: User enters "5.5" for spots
- **When**: Validation runs
- **Then**:
  - Rounded or rejected (depending on business logic)
  - Integer type enforced
  - Clear error if decimals not allowed

---

## 5. Time & Date Edge Cases

### 5.1 Timezone Handling - Israel Time
- **Given**: User creates event in Israel (GMT+2 or GMT+3 DST)
- **When**: Date/time saved
- **Then**:
  - Timestamp stored in UTC in database
  - Displayed in Israel time to users
  - DST transitions handled correctly

### 5.2 Event at Midnight
- **Given**: Event scheduled for 00:00
- **When**: Event displayed
- **Then**:
  - Time shown correctly (midnight)
  - No off-by-one date errors
  - Correctly identified as future/past

### 5.3 Daylight Saving Time Transition
- **Given**: Event scheduled during DST change
- **When**: DST transition occurs
- **Then**:
  - Time adjusted correctly
  - No duplicate or skipped hours
  - Notifications sent at correct time

### 5.4 Very Old Dates
- **Given**: User (or test) enters date from year 1900
- **When**: Date processed
- **Then**:
  - Handled without overflow
  - Validation may warn for unrealistic dates
  - Database stores correctly

### 5.5 Very Future Dates
- **Given**: User enters event date in year 2100
- **When**: Date processed
- **Then**:
  - Stored correctly
  - No overflow errors
  - May show warning for far future

### 5.6 Invalid Date Formats
- **Given**: User enters "31/02/2024" (invalid)
- **When**: Validation runs
- **Then**:
  - Date parsing fails
  - Error message shown
  - Cannot submit invalid date

### 5.7 Event Crosses Midnight
- **Given**: Event starts at 11:00 PM, ends 2:00 AM next day
- **When**: Event displayed
- **Then**:
  - Start and end dates shown clearly
  - Duration calculated correctly
  - No confusion about date

---

## 6. Network & Connectivity

### 6.1 Slow Network Connection
- **Given**: User on slow 3G connection
- **When**: Page loading or form submitting
- **Then**:
  - Loading indicators shown
  - Timeouts reasonable (30+ seconds)
  - Partial content loads progressively
  - User not left hanging

### 6.2 Network Lost During Form Fill
- **Given**: User filling registration form
- **When**: Connection lost
- **Then**:
  - Form data preserved locally (if possible)
  - Error shown when submit attempted
  - Retry option provided
  - No data loss

### 6.3 Intermittent Connection
- **Given**: Connection drops and reconnects
- **When**: User submits form
- **Then**:
  - Retry logic attempts request
  - Double submission prevented
  - Success or clear error message

### 6.4 Request Timeout
- **Given**: API request takes too long
- **When**: Timeout threshold reached (e.g., 30s)
- **Then**:
  - Request aborted
  - User sees timeout error
  - Retry option provided
  - Server cleans up partial work

---

## 7. File Upload Edge Cases (Future)

### 7.1 Very Large File
- **Given**: User uploads 50MB event image
- **When**: Upload attempted
- **Then**:
  - Size limit enforced (e.g., 5MB max)
  - Error message before upload starts
  - No server overload

### 7.2 Invalid File Type
- **Given**: User uploads .exe or .pdf as event image
- **When**: File validated
- **Then**:
  - Only allowed types accepted (jpg, png, webp)
  - Error message shown
  - Upload rejected

### 7.3 Corrupted Image File
- **Given**: User uploads corrupted image
- **When**: Image processing attempted
- **Then**:
  - Error caught during processing
  - User notified
  - Fallback to no image

### 7.4 File Upload Interrupted
- **Given**: Upload in progress
- **When**: Connection lost
- **Then**:
  - Partial upload cleaned up
  - User can retry
  - No orphaned files

---

## 8. Browser & Device Issues

### 8.1 JavaScript Disabled
- **Given**: User has JavaScript disabled
- **When**: Page loads
- **Then**:
  - (Current) Forms may not work fully
  - (Future) Progressive enhancement allows basic functionality
  - Message prompts to enable JS

### 8.2 Cookies Disabled
- **Given**: User disabled cookies
- **When**: User tries to login
- **Then**:
  - Session cookie cannot be set
  - Error message: "Cookies required"
  - Login fails gracefully

### 8.3 Outdated Browser
- **Given**: User on very old browser (IE11, old Safari)
- **When**: Application loads
- **Then**:
  - Polyfills may handle compatibility
  - Or: Upgrade browser message shown
  - No crashes, graceful degradation

### 8.4 Ad Blocker Interference
- **Given**: User has aggressive ad blocker
- **When**: Page loads
- **Then**:
  - Critical functionality not blocked
  - If analytics blocked: app still works
  - No reliance on blocked resources

### 8.5 Browser Back Button After Submission
- **Given**: User submitted form and sees confirmation
- **When**: User clicks browser back button
- **Then**:
  - Returns to form page
  - Form cleared or shows success message
  - No duplicate submission

---

## 9. Data Integrity

### 9.1 Orphaned Events (School Deleted)
- **Given**: School deleted, but events remain
- **When**: System runs integrity check
- **Then**:
  - Orphaned events detected
  - Soft-deleted or archived
  - Or: Cascade delete with school

### 9.2 Orphaned Registrations (Event Deleted)
- **Given**: Event deleted with registrations
- **When**: Registrations queried
- **Then**:
  - Either cascade deleted with event
  - Or: Archived with deleted event reference
  - No broken foreign keys

### 9.3 Admin with Invalid schoolId
- **Given**: Admin.schoolId references non-existent school
- **When**: Admin tries to login or access data
- **Then**:
  - Error caught during session validation
  - Access denied
  - Admin redirected to support/error page

### 9.4 Mismatched spotsReserved
- **Given**: Event.spotsReserved doesn't match count of CONFIRMED registrations
- **When**: Detected (manual check or automated)
- **Then**:
  - Admin notified of discrepancy
  - Repair script available
  - Root cause investigated

### 9.5 Duplicate Confirmation Codes
- **Given**: System generates confirmation code
- **When**: Collision check performed
- **Then**:
  - If duplicate found, regenerate
  - Retry until unique
  - Extremely rare but handled

---

## 10. API Rate Limiting & Abuse (Future)

### 10.1 Excessive Registration Attempts
- **Given**: Same IP submits 100 registrations in 1 minute
- **When**: Rate limit threshold exceeded
- **Then**:
  - IP temporarily blocked
  - CAPTCHA required
  - Admin notified of suspicious activity

### 10.2 API Endpoint Abuse
- **Given**: Attacker hammers login endpoint
- **When**: Too many requests detected
- **Then**:
  - Rate limiting applied (e.g., 10 req/min per IP)
  - 429 Too Many Requests error
  - Temporary block

### 10.3 Scraping Protection
- **Given**: Bot scraping public event pages
- **When**: Excessive page loads detected
- **Then**:
  - Rate limiting applied
  - robots.txt respected
  - CAPTCHA for suspicious behavior

---

## 11. Payment & Billing Edge Cases (Future)

### 11.1 Payment Processing Timeout
- **Given**: User upgrading plan via Stripe
- **When**: Payment processing times out
- **Then**:
  - User sees error, instructed to check email
  - Webhook will update plan when payment succeeds
  - No partial state

### 11.2 Webhook Missed or Delayed
- **Given**: Stripe sends webhook but app doesn't receive
- **When**: Payment completed but plan not upgraded
- **Then**:
  - Polling mechanism checks payment status
  - Or: User can manually sync
  - Eventually consistent

### 11.3 Refund Issued
- **Given**: User's payment refunded
- **When**: Refund webhook received
- **Then**:
  - Plan downgraded or suspended
  - Usage limits re-applied
  - User notified

---

## 12. Locale & Language

### 12.1 Browser Locale Not Hebrew
- **Given**: User from non-Hebrew locale
- **When**: Application loads
- **Then**:
  - (Current) Hebrew interface shown (hardcoded)
  - (Future) Detect locale and offer language selection
  - English fallback available

### 12.2 Mixed RTL and LTR Text
- **Given**: Hebrew text with embedded English words/numbers
- **When**: Rendered in UI
- **Then**:
  - Bidirectional text algorithm handles correctly
  - Numbers display left-to-right within RTL context
  - No garbled text

### 12.3 Date Formatting
- **Given**: Date displayed to user
- **When**: Formatted for display
- **Then**:
  - Hebrew locale format (e.g., "17/10/2024")
  - Or: Localized format (day, month, year)
  - Consistent across app

---

## 13. Unusual User Behavior

### 13.1 User Opens 50 Browser Tabs
- **Given**: User opens event registration in 50 tabs
- **When**: User submits from multiple tabs
- **Then**:
  - Each submission independent
  - Duplicate registrations created (if different data)
  - Or: Email uniqueness check prevents duplicates (future)

### 13.2 User Rapidly Clicks Submit
- **Given**: User clicks submit button 10 times quickly
- **When**: Form processing
- **Then**:
  - Submit button disabled after first click
  - Only one request sent
  - No duplicate registrations

### 13.3 User Manipulates Hidden Form Fields
- **Given**: User edits hidden input values via browser DevTools
- **When**: Form submitted
- **Then**:
  - Server validates all data
  - Ignores client-sent IDs (e.g., schoolId)
  - Rejects invalid manipulations

### 13.4 User Bookmarks Dynamic Page
- **Given**: User bookmarks registration confirmation page
- **When**: User visits bookmark later
- **Then**:
  - Confirmation code may no longer display
  - Or: Confirmation lookup available (future)
  - Graceful handling

---

## 14. Third-Party Service Failures

### 14.1 Google OAuth Service Down
- **Given**: User tries to sign in with Google
- **When**: Google OAuth unavailable
- **Then**:
  - Error message shown
  - Fallback to email/password login suggested
  - No application crash

### 14.2 DNS Resolution Failure
- **Given**: External API call (Resend, Google, etc.)
- **When**: DNS lookup fails
- **Then**:
  - Error caught and logged
  - User sees generic error
  - Operation fails gracefully

### 14.3 SSL Certificate Error
- **Given**: Calling external HTTPS service
- **When**: SSL certificate invalid or expired
- **Then**:
  - Connection refused
  - Error logged
  - User notified of service issue

---

## 15. Deployment & Configuration Errors

### 15.1 Missing Environment Variable
- **Given**: Required env var (JWT_SECRET) not set
- **When**: Application starts
- **Then**:
  - Startup fails with clear error
  - Logs indicate missing variable
  - Application doesn't run in invalid state

### 15.2 Invalid Database URL
- **Given**: DATABASE_URL malformed
- **When**: Prisma tries to connect
- **Then**:
  - Connection error thrown
  - Clear error message
  - Application health check fails

### 15.3 Port Already in Use
- **Given**: Port 9000 already occupied
- **When**: Application starts
- **Then**:
  - Error: "Port already in use"
  - Instructions to change port or stop conflicting process
  - Application doesn't start

### 15.4 Prisma Client Out of Sync
- **Given**: Database schema changed but `prisma generate` not run
- **When**: Application queries database
- **Then**:
  - Type errors or runtime errors
  - Clear error message prompts to run `prisma generate`

---

## 16. Resource Exhaustion

### 16.1 Memory Leak (Future Monitoring)
- **Given**: Application running for extended period
- **When**: Memory usage grows indefinitely
- **Then**:
  - Monitoring alerts trigger
  - Application restarted automatically
  - Leak investigated and fixed

### 16.2 Disk Space Full
- **Given**: Server disk fills up (logs, uploads, etc.)
- **When**: New file write attempted
- **Then**:
  - Error caught gracefully
  - User sees error message
  - Monitoring alerts admin

### 16.3 CPU Spike
- **Given**: Extremely heavy operation (e.g., export 100k registrations)
- **When**: Server CPU at 100%
- **Then**:
  - Other requests may slow down
  - Timeouts may occur
  - Load balancing handles (production)

---

## 17. Data Migration Issues

### 17.1 Schema Migration Failure
- **Given**: Running `prisma migrate deploy`
- **When**: Migration fails midway
- **Then**:
  - Migration rolled back
  - Database state consistent
  - Error logged, manual intervention needed

### 17.2 Data Type Change Migration
- **Given**: Changing column type (e.g., VARCHAR(50) → VARCHAR(100))
- **When**: Migration runs
- **Then**:
  - Existing data preserved
  - No data loss
  - Validation updated

### 17.3 Adding Non-Nullable Column
- **Given**: Adding required column to table with data
- **When**: Migration runs
- **Then**:
  - Default value provided
  - Or: Two-step migration (add nullable, populate, make required)
  - No migration failure

---

## Test Coverage Priority

**Critical (P0):**
- 1.1-1.4, 2.1-2.3, 3.1-3.4, 4.1, 4.4, 5.1-5.3, 6.1-6.4, 8.2, 9.1-9.4, 15.1-15.4

**High (P1):**
- 2.4-2.5, 3.5, 4.2-4.3, 4.5-4.7, 5.4-5.7, 7.1-7.4, 8.1, 8.3-8.5, 9.5, 12.1-12.3, 13.1-13.4, 14.1-14.3

**Medium (P2):**
- 6.5-6.7, 10.1-10.3, 11.1-11.3, 16.1-16.3, 17.1-17.3

**Low (P3):**
- 7.5-7.7, 13.4, 16.4

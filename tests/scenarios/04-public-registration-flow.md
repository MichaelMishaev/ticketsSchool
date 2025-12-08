# Public Registration Flow Test Scenarios

## 1. View Event - Public Page

### 1.1 Happy Path - Access Public Event Page
- **Given**: Event exists and is published
- **When**: User navigates to /p/[schoolSlug]/[eventSlug]
- **Then**:
  - Event details displayed (title, description, date, time, location)
  - School name/logo shown
  - Capacity info visible (e.g., "25/50 spots taken")
  - Registration form accessible
  - Hebrew RTL layout correct

### 1.2 Event Not Found
- **Given**: Invalid school slug or event slug
- **When**: User navigates to non-existent event
- **Then**:
  - 404 error page shown
  - User-friendly Hebrew message
  - Link back to homepage or school page

### 1.3 Event Full - View Only
- **Given**: Event at full capacity (spotsReserved === capacity)
- **When**: User views event page
- **Then**:
  - "FULL" status prominently displayed
  - Waitlist registration option shown (if enabled)
  - Existing registrations not visible to public

### 1.4 Past Event - View Only
- **Given**: Event date already passed
- **When**: User views event page
- **Then**:
  - "Event has ended" message shown
  - Registration form hidden/disabled
  - Event details still viewable

### 1.5 Cancelled Event
- **Given**: Event cancelled by admin
- **When**: User views event page
- **Then**:
  - "Event cancelled" notice prominent
  - Cancellation reason shown (if provided)
  - Registration form disabled

### 1.6 Mobile Public Page View
- **Given**: User on mobile device (375px width)
- **When**: User views event page
- **Then**:
  - All content visible without horizontal scroll
  - Images responsive
  - Registration form accessible
  - Hebrew text right-aligned

---

## 2. Registration Form - Standard Fields

### 2.1 Happy Path - Complete Registration (Spots Available)
- **Given**: User on event page with spots available
- **When**: User fills form (name, email, phone, spots) and submits
- **Then**:
  - Atomic transaction checks capacity
  - Registration created with status: CONFIRMED
  - spotsReserved incremented
  - Confirmation code generated (6-character unique)
  - Success message shown with confirmation code
  - Confirmation email sent

### 2.2 Registration Form Validation - Missing Fields
- **Given**: User on registration form
- **When**: User submits with missing required fields
- **Then**:
  - Missing fields highlighted in red
  - Error notification box shown above submit
  - Hebrew message: "נא למלא את כל השדות החובה"
  - Form not submitted

### 2.3 Email Validation
- **Given**: User entering email
- **When**: User enters invalid email format
- **Then**:
  - Real-time or on-submit validation error
  - Hebrew message: "כתובת דוא״ל לא תקינה"
  - Cannot submit until fixed

### 2.4 Phone Number Validation - Israeli Format
- **Given**: User entering phone number
- **When**: User enters phone in various formats
- **Then**:
  - Accepts: 0501234567, 050-123-4567, +972501234567
  - Normalizes to 10 digits starting with 0
  - Validation error if invalid format
  - Hebrew error message

### 2.5 Spots Count Validation
- **Given**: User selecting number of spots
- **When**: User enters spot count
- **Then**:
  - Minimum: 1 spot
  - Maximum: event capacity or reasonable limit (e.g., 10)
  - Cannot register for 0 spots
  - Cannot register for more spots than available

### 2.6 Mobile Registration Form
- **Given**: User on mobile device
- **When**: User fills registration form
- **Then**:
  - All input fields visible (text not white on white)
  - Input fields have classes: text-gray-900 bg-white
  - Touch targets minimum 44px height
  - Submit button accessible without scrolling
  - Keyboard doesn't hide submit button

---

## 3. Registration Form - Custom Fields

### 3.1 Text Field Custom Field
- **Given**: Event has custom text field (e.g., "Player name")
- **When**: User fills registration
- **Then**:
  - Custom field shown in form
  - Required validation if marked required
  - Data saved to Registration.customFields JSON

### 3.2 Email Custom Field
- **Given**: Event has custom email field (e.g., "Parent email")
- **When**: User enters email
- **Then**:
  - Email format validated
  - Stored in customFields

### 3.3 Phone Custom Field
- **Given**: Event has custom phone field (e.g., "Emergency contact")
- **When**: User enters phone
- **Then**:
  - Israeli phone format validated
  - Normalized to 10 digits
  - Stored in customFields

### 3.4 Dropdown Custom Field
- **Given**: Event has dropdown field (e.g., "T-shirt size: S, M, L, XL")
- **When**: User selects option
- **Then**:
  - Dropdown rendered with options
  - Selected value saved
  - Required validation if marked

### 3.5 Checkbox Custom Field
- **Given**: Event has checkbox (e.g., "Agree to terms")
- **When**: User checks/unchecks
- **Then**:
  - Boolean value saved
  - Required validation if marked (must be checked)

### 3.6 Textarea Custom Field
- **Given**: Event has textarea (e.g., "Special requirements")
- **When**: User enters long text
- **Then**:
  - Multi-line input allowed
  - Character limit enforced (e.g., 500 chars)
  - Optional field typically

### 3.7 Number Custom Field
- **Given**: Event has number field (e.g., "Age")
- **When**: User enters number
- **Then**:
  - Only numeric input accepted
  - Min/max validation if set
  - Stored as number type

### 3.8 Custom Fields Order
- **Given**: Event has multiple custom fields
- **When**: Form rendered
- **Then**:
  - Fields appear in order defined by admin
  - Standard fields (name, email, phone) first
  - Custom fields below
  - Clear labels and placeholders

---

## 4. Capacity Enforcement

### 4.1 Registration When Spots Available
- **Given**: Event has 50 capacity, 30 spots reserved, user registers for 5
- **When**: Registration submitted
- **Then**:
  - Atomic transaction checks: 30 + 5 <= 50 (OK)
  - Status: CONFIRMED
  - spotsReserved updated to 35
  - Confirmation code generated

### 4.2 Registration Fills Last Spots
- **Given**: Event has 50 capacity, 48 spots reserved, user registers for 2
- **When**: Registration submitted
- **Then**:
  - Status: CONFIRMED
  - spotsReserved = 50 (event now full)
  - User receives confirmation

### 4.3 Registration Exceeds Capacity - Waitlist
- **Given**: Event has 50 capacity, 50 spots reserved, user registers for 2
- **When**: Registration submitted
- **Then**:
  - Status: WAITLIST
  - spotsReserved NOT incremented (stays at 50)
  - Waitlist message shown to user
  - Confirmation code still generated
  - User notified they're on waitlist

### 4.4 Concurrent Registrations - Race Condition Prevention
- **Given**: Event has 50 capacity, 49 spots reserved
- **When**: Two users simultaneously register for 1 spot each
- **Then**:
  - Prisma transaction ensures atomic increment
  - First request: CONFIRMED (spotsReserved = 50)
  - Second request: WAITLIST (capacity full)
  - No over-registration occurs

### 4.5 Bulk Registration Near Capacity
- **Given**: Event has 50 capacity, 48 spots reserved, user registers for 5
- **When**: Registration submitted
- **Then**:
  - Check: 48 + 5 = 53 > 50
  - Status: WAITLIST (entire registration)
  - User notified: "Not enough spots, added to waitlist"

---

## 5. Confirmation & Feedback

### 5.1 Successful Registration Confirmation
- **Given**: Registration confirmed
- **When**: Transaction completes
- **Then**:
  - Success message displayed in Hebrew
  - Confirmation code shown prominently (e.g., "קוד אישור: ABC123")
  - Instructions to save code
  - Event details reiterated

### 5.2 Confirmation Email Sent
- **Given**: Registration confirmed
- **When**: Email sending triggered
- **Then**:
  - Email sent to provided address
  - Contains: event details, confirmation code, date/time, location
  - Hebrew text with RTL layout
  - Reply-to set to school email

### 5.3 Waitlist Registration Notification
- **Given**: User added to waitlist
- **When**: Waitlist confirmation shown
- **Then**:
  - Clear message: "Event full, you're on waitlist"
  - Position in waitlist shown (e.g., "#3 in line")
  - Confirmation code still provided
  - Explanation that they'll be notified if spot opens

### 5.4 Confirmation Code Format
- **Given**: Registration created
- **When**: Confirmation code generated
- **Then**:
  - 6 characters alphanumeric (uppercase)
  - Unique across all registrations
  - Easy to read (no confusing chars like 0/O, 1/I)

### 5.5 Confirmation Page Actions
- **Given**: User sees confirmation page
- **When**: User interacts
- **Then**:
  - Button to "Add to Calendar" (iCal download)
  - Button to "Share" event
  - Link to register for another event

---

## 6. Error Handling

### 6.1 Network Error During Submission
- **Given**: User submits form
- **When**: Network connection lost
- **Then**:
  - Error message: "Connection error, please try again"
  - Form data preserved (not cleared)
  - Retry button shown

### 6.2 Server Error During Registration
- **Given**: User submits valid form
- **When**: Server error occurs (DB down, etc.)
- **Then**:
  - User-friendly error message (not stack trace)
  - Registration not created
  - User prompted to try again later
  - Error logged server-side

### 6.3 Double Submission Prevention
- **Given**: User submits form
- **When**: User clicks submit multiple times rapidly
- **Then**:
  - Submit button disabled after first click
  - Loading indicator shown
  - Only one registration created

### 6.4 Email Sending Failure
- **Given**: Registration successful but email fails
- **When**: Resend API error occurs
- **Then**:
  - Registration still created (don't rollback)
  - User sees confirmation code on screen
  - Admin notified of email failure
  - Retry email sending in background

### 6.5 Invalid Event ID in Form
- **Given**: User manipulates form data
- **When**: Invalid eventId submitted
- **Then**:
  - 400 Bad Request error
  - User-friendly error message
  - No registration created

---

## 7. Usage Limit Enforcement

### 7.1 School Hits Registration Limit
- **Given**: School on FREE plan (100 registrations/month), 99 registrations used
- **When**: 101st registration attempted
- **Then**:
  - Error message: "Registration temporarily unavailable"
  - Admin notified via email/dashboard
  - User sees: "Event registration paused, contact organizer"
  - trackUsage() increments count

### 7.2 School Within Limits
- **Given**: School has quota available
- **When**: Registration submitted
- **Then**:
  - Registration processed normally
  - Usage counter incremented
  - No restrictions

---

## 8. WhatsApp Integration (Future)

### 8.1 Share Event to WhatsApp
- **Given**: User on event page
- **When**: User clicks "Share to WhatsApp"
- **Then**:
  - WhatsApp opened with pre-filled message
  - Message contains event title and link
  - Works on mobile and desktop

### 8.2 Confirmation via WhatsApp
- **Given**: Registration confirmed
- **When**: School has WhatsApp notifications enabled
- **Then**:
  - Confirmation message sent to user's phone
  - Contains confirmation code and event details

---

## 9. Accessibility & UX

### 9.1 Hebrew RTL Layout
- **Given**: User views Hebrew content
- **When**: Page renders
- **Then**:
  - Text aligned right
  - Form fields right-aligned
  - Icons/arrows flipped appropriately
  - dir="rtl" attribute set

### 9.2 Loading States
- **Given**: User submits form
- **When**: Waiting for server response
- **Then**:
  - Submit button shows loading spinner
  - Button text changes to "שולח..." (Sending...)
  - Form fields disabled during submission

### 9.3 Keyboard Navigation
- **Given**: User navigating with keyboard
- **When**: User tabs through form
- **Then**:
  - Tab order logical (top to bottom)
  - All fields focusable
  - Submit button accessible via Enter key

### 9.4 Screen Reader Compatibility
- **Given**: User with screen reader
- **When**: User navigates form
- **Then**:
  - Labels properly associated with inputs
  - Error messages announced
  - Required fields indicated
  - ARIA attributes set

### 9.5 Mobile Touch Targets
- **Given**: User on mobile device
- **When**: User taps form elements
- **Then**:
  - All interactive elements minimum 44px height
  - Adequate spacing between elements (8px+)
  - No accidental taps

---

## 10. Pre-Registration Checks

### 10.1 Registration Deadline Enforcement
- **Given**: Event has registration deadline (e.g., 24 hours before)
- **When**: User tries to register after deadline
- **Then**:
  - Form disabled
  - Message: "Registration closed"
  - Deadline clearly displayed

### 10.2 Event Not Yet Open for Registration (Future)
- **Given**: Event registration opens at future date
- **When**: User views event before open date
- **Then**:
  - Form shows countdown to opening
  - "Registration opens in X days" message
  - Option to set reminder

### 10.3 Duplicate Registration Prevention
- **Given**: User already registered for event
- **When**: User tries to register again with same email
- **Then**:
  - (Future) Detect duplicate
  - Show message: "Already registered with this email"
  - Display existing confirmation code
  - Option to modify registration

---

## 11. Mobile-Specific Scenarios

### 11.1 Mobile Form Input Keyboards
- **Given**: User on mobile device
- **When**: User focuses input fields
- **Then**:
  - Email field: email keyboard with @
  - Phone field: numeric keyboard
  - Name field: standard keyboard with capital first letter

### 11.2 Mobile Date/Time Display
- **Given**: User views event date/time on mobile
- **When**: Page renders
- **Then**:
  - Date formatted Hebrew locale
  - Time in 24-hour format (Israel standard)
  - Timezone indicated (Israel Time)

### 11.3 Mobile Confirmation Code Display
- **Given**: User receives confirmation on mobile
- **When**: Confirmation page shown
- **Then**:
  - Code large and readable (minimum 24px font)
  - Copy button next to code
  - Confirmation easily shareable (WhatsApp, SMS)

### 11.4 Mobile Form Scrolling
- **Given**: Long registration form with many custom fields
- **When**: User fills form on mobile
- **Then**:
  - Smooth scrolling
  - Focused field scrolls into view (not hidden by keyboard)
  - Submit button always accessible

---

## 12. Performance & Load

### 12.1 Fast Page Load
- **Given**: User accessing public event page
- **When**: Page loads
- **Then**:
  - Initial render < 2 seconds
  - Images optimized and lazy-loaded
  - No blocking JavaScript

### 12.2 Form Validation Performance
- **Given**: User filling form
- **When**: User types in fields
- **Then**:
  - Real-time validation responsive (< 100ms)
  - No lag or stuttering
  - Debounced validation for complex checks

### 12.3 High Traffic Handling
- **Given**: Popular event with many simultaneous registrations
- **When**: Multiple users submit at once
- **Then**:
  - Database transactions handle concurrency
  - No deadlocks or race conditions
  - Response time remains acceptable (< 3 seconds)

---

## 13. Analytics & Tracking

### 13.1 Registration Funnel Tracking
- **Given**: User journey through registration
- **When**: User interacts with form
- **Then**:
  - Track: page view, form start, form submit, confirmation
  - Identify drop-off points
  - (Future) Google Analytics events

### 13.2 Conversion Rate Tracking
- **Given**: Event page viewed multiple times
- **When**: Some views convert to registrations
- **Then**:
  - Calculate: registrations / page views
  - Track over time
  - Identify successful events

---

## Test Coverage Priority

**Critical (P0):**
- 1.1, 2.1, 2.2, 2.4, 4.1-4.4, 5.1-5.4, 6.1-6.3, 9.5

**High (P1):**
- 1.2-1.3, 2.3, 2.5-2.6, 3.1-3.8, 1.4-1.6, 5.5, 6.4, 7.1, 9.1-9.2

**Medium (P2):**
- 4.5, 6.5, 7.2, 9.3-9.4, 10.1-10.3, 11.1-11.4, 12.1-12.2

**Low (P3):**
- 8.1-8.2, 10.2, 12.3, 13.1-13.2

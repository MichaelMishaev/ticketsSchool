# Event Management Test Scenarios

## 1. Create Event - Basic Flow

### 1.1 Happy Path - Create Simple Event
- **Given**: User is ADMIN or higher with schoolId
- **When**: User fills event form (title, description, date, time, capacity, location)
- **Then**:
  - Event created in database with schoolId
  - Unique slug auto-generated from title
  - spotsReserved initialized to 0
  - Event appears in dashboard list
  - Public URL generated: /p/[schoolSlug]/[eventSlug]

### 1.2 Event Form Validation - Missing Required Fields
- **Given**: User on create event page
- **When**: User submits without required fields (title, date, capacity)
- **Then**:
  - Missing fields highlighted in red
  - Error notification shown
  - Hebrew message: "נא למלא את כל השדות החובה"
  - Submit button disabled

### 1.3 Event Date/Time Validation
- **Given**: User creating event
- **When**: User enters past date or invalid time
- **Then**:
  - Error message "Event date must be in future"
  - Cannot submit with invalid date
  - Timezone handled correctly (Israel time)

### 1.4 Capacity Validation
- **Given**: User setting event capacity
- **When**: User enters invalid capacity (0, negative, non-number)
- **Then**:
  - Validation error shown
  - Minimum capacity: 1
  - Maximum capacity: reasonable limit (e.g., 10000)

### 1.5 Event Slug Uniqueness
- **Given**: Event title might generate duplicate slug
- **When**: System creates slug from title
- **Then**:
  - If slug exists, append number (e.g., "soccer-game-2")
  - Check uniqueness within school only (different schools can have same slug)
  - Max length enforced

### 1.6 Hebrew Event Title & Description
- **Given**: User enters Hebrew text
- **When**: Event created with Hebrew
- **Then**:
  - Text stored correctly (UTF-8)
  - Displays right-to-left in UI
  - Slug generated from transliterated Hebrew or generic pattern

### 1.7 Mobile Event Creation
- **Given**: User on mobile device
- **When**: User creates event
- **Then**:
  - All form fields visible and accessible
  - Date/time pickers mobile-friendly
  - Input text visible (not white on white)
  - Submit button reachable

---

## 2. Create Event - Advanced Fields

### 2.1 Custom Registration Fields
- **Given**: User creating event with custom fields
- **When**: User adds custom fields (text, checkbox, dropdown, etc.)
- **Then**:
  - fieldsSchema JSON saved with field definitions
  - Field types: TEXT, EMAIL, PHONE, NUMBER, CHECKBOX, DROPDOWN, TEXTAREA
  - Each field can be required or optional
  - Field order preserved

### 2.2 Custom Field Validation Rules
- **Given**: User defining custom field
- **When**: User sets field as required or adds validation
- **Then**:
  - Required fields enforced during registration
  - Email fields validated for format
  - Phone fields validated for Israeli format
  - Number fields validate numeric input

### 2.3 Pre-fill Custom Fields
- **Given**: User adding custom field
- **When**: User wants to pre-populate options (dropdown)
- **Then**:
  - Dropdown options stored as array
  - Options displayed in registration form
  - User can select one option

### 2.4 Event Image Upload
- **Given**: User creating event
- **When**: User uploads event image/poster
- **Then**:
  - Image validated (format, size limit)
  - Stored securely (future: S3)
  - Displayed on public event page
  - Optimized for mobile viewing

### 2.5 Registration Deadline
- **Given**: User setting registration cutoff
- **When**: User sets deadline (e.g., 24 hours before event)
- **Then**:
  - Deadline stored in database
  - Public registration closed after deadline
  - Admin can still manually register

### 2.6 Multiple Sessions/Time Slots
- **Given**: Event has multiple time slots (e.g., 10 AM, 2 PM, 6 PM)
- **When**: User creates event with sessions
- **Then**:
  - (Future) Sessions stored separately
  - (Current) Users specify in description/custom fields
  - Each session has own capacity

---

## 3. Edit Event

### 3.1 Happy Path - Edit Event Details
- **Given**: User is ADMIN or higher, event exists
- **When**: User updates title, description, date, location
- **Then**:
  - Changes saved to database
  - Updated event displayed immediately
  - Public page reflects changes
  - Slug not changed (to preserve URLs)

### 3.2 Edit Event Capacity - Increase
- **Given**: Event has 50 capacity, 30 spots reserved
- **When**: User increases capacity to 70
- **Then**:
  - Capacity updated
  - 20 additional spots available
  - If waitlist exists, notify admin to move to confirmed

### 3.3 Edit Event Capacity - Decrease (Valid)
- **Given**: Event has 50 capacity, 30 spots reserved
- **When**: User decreases capacity to 40
- **Then**:
  - Capacity updated
  - 10 spots available
  - No registrations affected (30 < 40)

### 3.4 Edit Event Capacity - Decrease (Invalid)
- **Given**: Event has 50 capacity, 40 spots reserved
- **When**: User tries to decrease capacity to 30
- **Then**:
  - Error message "Cannot reduce capacity below confirmed registrations"
  - Capacity not updated
  - User prompted to cancel registrations first

### 3.5 Change Event Date - Past Event
- **Given**: Event date already passed
- **When**: User tries to edit past event
- **Then**:
  - Warning shown "Event already occurred"
  - Allow edit (for corrections) but show prominent warning
  - Option to duplicate as new event instead

### 3.6 Edit Custom Fields - Existing Registrations
- **Given**: Event has registrations with custom field data
- **When**: User modifies custom fields schema
- **Then**:
  - Warning: "Existing registrations may have incomplete data"
  - Existing data preserved
  - New registrations use updated schema
  - (Future) Option to migrate existing data

### 3.7 Change Event Slug Manually
- **Given**: User wants to update event slug
- **When**: User changes slug field
- **Then**:
  - Warning shown "Public URL will change"
  - Old URL shows 404 or redirects to new URL
  - Check slug uniqueness within school

### 3.8 Unauthorized Edit Attempt (MANAGER/VIEWER)
- **Given**: User is MANAGER or VIEWER
- **When**: User tries to edit event
- **Then**:
  - 403 Forbidden error
  - Edit button hidden in UI
  - Form fields read-only

---

## 4. Delete Event

### 4.1 Delete Event with No Registrations
- **Given**: Event exists with 0 registrations
- **When**: User (ADMIN or higher) deletes event
- **Then**:
  - Confirmation prompt shown
  - Event soft-deleted or hard-deleted
  - Removed from event list
  - Public URL shows 404

### 4.2 Delete Event with Registrations
- **Given**: Event has confirmed registrations
- **When**: User tries to delete event
- **Then**:
  - Severe warning shown with registration count
  - Requires typing event title to confirm
  - Option to export registrations first
  - Email notification sent to registrants (optional)

### 4.3 Cascade Delete - Registrations
- **Given**: Event deleted with registrations
- **When**: Deletion confirmed
- **Then**:
  - All registrations deleted/archived
  - spotsReserved data removed
  - Historical data preserved (usage tracking)

### 4.4 Soft Delete vs Hard Delete
- **Given**: Event being deleted
- **When**: Deletion process runs
- **Then**:
  - (Recommended) Soft delete: Add `deletedAt` timestamp
  - Event hidden from UI but data preserved
  - Can be restored by SUPER_ADMIN if needed
  - Hard delete only for SUPER_ADMIN

### 4.5 Unauthorized Delete Attempt (MANAGER/VIEWER)
- **Given**: User is MANAGER or VIEWER
- **When**: User tries to delete event
- **Then**:
  - 403 Forbidden error
  - Delete button hidden in UI

---

## 5. View Event Details (Admin)

### 5.1 Event Dashboard View
- **Given**: User is logged in admin
- **When**: User views events dashboard
- **Then**:
  - List of school's events shown
  - Sorted by date (upcoming first)
  - Shows: title, date, capacity, spots reserved, status
  - Quick stats visible (confirmed, waitlist, cancelled)

### 5.2 Event Detail Page
- **Given**: User clicks event from list
- **When**: Event detail page loads
- **Then**:
  - Full event info displayed
  - Registration statistics shown
  - Recent registrations list
  - Action buttons: Edit, Delete, View Public Page, Export

### 5.3 Event Status Indicators
- **Given**: Event exists in various states
- **When**: User views event list
- **Then**:
  - Visual indicators:
    - "FULL" if spotsReserved >= capacity
    - "OPEN" if spots available
    - "PAST" if date passed
    - "DRAFT" if not published (future)

### 5.4 Filter Events
- **Given**: User on events dashboard
- **When**: User applies filters
- **Then**:
  - Filter by: upcoming/past, full/open, date range
  - Search by title/description
  - Results update immediately

### 5.5 Sort Events
- **Given**: User viewing event list
- **When**: User clicks sort options
- **Then**:
  - Sort by: date, created date, title, capacity, spots reserved
  - Ascending/descending toggle

---

## 6. Duplicate Event

### 6.1 Duplicate Event Feature
- **Given**: Event exists
- **When**: User clicks "Duplicate event"
- **Then**:
  - New event created with same details
  - Title appended with " (Copy)"
  - New unique slug generated
  - Date/time editable (future date)
  - spotsReserved reset to 0
  - Registrations NOT copied

### 6.2 Duplicate with Custom Fields
- **Given**: Original event has custom fields
- **When**: Event duplicated
- **Then**:
  - fieldsSchema copied exactly
  - Field order preserved
  - Validation rules copied

---

## 7. Event Capacity Management

### 7.1 Real-time Capacity Counter
- **Given**: Event with registrations
- **When**: New registration confirmed
- **Then**:
  - spotsReserved incremented atomically
  - Dashboard shows updated count
  - No race conditions (Prisma transaction)

### 7.2 At-Capacity Event
- **Given**: Event has spotsReserved === capacity
- **When**: User views event
- **Then**:
  - Status shows "FULL"
  - New registrations go to waitlist
  - Admin can still manually add (override)

### 7.3 Over-Capacity (Admin Override)
- **Given**: Event at capacity
- **When**: Admin manually adds registration
- **Then**:
  - Option to "Override capacity" with checkbox
  - spotsReserved can exceed capacity
  - Visual warning shown

### 7.4 Waitlist Counter
- **Given**: Event full with waitlist
- **When**: Admin views event
- **Then**:
  - Waitlist count shown separately
  - List of waitlist registrations accessible
  - Option to move to confirmed if spots open

---

## 8. Event Visibility & Status

### 8.1 Publish/Unpublish Event (Future)
- **Given**: Event in draft mode
- **When**: User publishes event
- **Then**:
  - Public URL becomes accessible
  - Status changed to "PUBLISHED"
  - Can be unpublished (hides public page)

### 8.2 Past Event Handling
- **Given**: Event date passed
- **When**: User or system checks event
- **Then**:
  - Automatically marked as "PAST"
  - Public registration disabled
  - Admin can still view/edit registrations
  - Analytics available

### 8.3 Cancelled Event
- **Given**: Event needs to be cancelled
- **When**: Admin cancels event (not deletes)
- **Then**:
  - Status set to "CANCELLED"
  - Public page shows cancellation notice
  - Option to send cancellation emails
  - Registrations preserved but status updated

---

## 9. Event Analytics

### 9.1 Registration Timeline
- **Given**: Event with registrations over time
- **When**: Admin views analytics
- **Then**:
  - Chart showing registrations by date/time
  - Peak registration periods identified
  - Conversion funnel (views → registrations)

### 9.2 Demographic Stats (Custom Fields)
- **Given**: Event with custom fields (age, gender, location, etc.)
- **When**: Admin views stats
- **Then**:
  - Breakdown by custom field values
  - Charts/graphs for visualization
  - Exportable to CSV

### 9.3 No-Show Tracking (Future)
- **Given**: Event occurred
- **When**: Admin marks attendees
- **Then**:
  - Track who attended vs confirmed
  - No-show rate calculated
  - Use for future capacity planning

---

## 10. Multi-Tenant Event Isolation

### 10.1 School A Cannot See School B Events
- **Given**: Two different schools exist
- **When**: School A admin accesses events
- **Then**:
  - Only School A events shown
  - API filters by schoolId automatically
  - No data leakage

### 10.2 Event Creation Tracks schoolId
- **Given**: Admin creating event
- **When**: Event saved to database
- **Then**:
  - schoolId from session added to event
  - Cannot create events for other schools
  - SUPER_ADMIN can specify schoolId manually

### 10.3 SUPER_ADMIN View All Events
- **Given**: User is SUPER_ADMIN
- **When**: SUPER_ADMIN accesses events
- **Then**:
  - Can see events from all schools
  - Filter by school
  - Can impersonate school to manage

---

## 11. Event URL & Public Sharing

### 11.1 Public URL Format
- **Given**: Event created
- **When**: User views public URL
- **Then**:
  - Format: /p/[schoolSlug]/[eventSlug]
  - Example: /p/beeri/soccer-game-2024
  - QR code generated for sharing (future)

### 11.2 Share Event
- **Given**: Admin wants to share event
- **When**: Admin clicks "Share" button
- **Then**:
  - Copy link to clipboard
  - Share via WhatsApp, email, social media (future)
  - QR code downloadable

### 11.3 Event Slug Collision (Different Schools)
- **Given**: Two schools have event with same title
- **When**: Both create "soccer-game"
- **Then**:
  - School A: /p/school-a/soccer-game
  - School B: /p/school-b/soccer-game
  - No conflict (scoped by school)

---

## 12. Event Templates (Future)

### 12.1 Save Event as Template
- **Given**: Event with custom fields and settings
- **When**: User saves as template
- **Then**:
  - Template stored with schema
  - Available for reuse
  - Name and description saved

### 12.2 Create Event from Template
- **Given**: Template exists
- **When**: User creates event from template
- **Then**:
  - All fields pre-populated
  - Custom fields included
  - User can modify before saving

---

## 13. Mobile Event Management

### 13.1 Mobile Event List View
- **Given**: User on mobile device
- **When**: User views event list
- **Then**:
  - List scrollable and readable
  - Key info visible (title, date, capacity)
  - Touch targets adequate (44px)

### 13.2 Mobile Event Creation
- **Given**: User creating event on mobile
- **When**: User fills form
- **Then**:
  - Date picker mobile-friendly
  - All fields accessible without zoom
  - Hebrew RTL correct

### 13.3 Mobile Event Actions
- **Given**: User on mobile viewing event
- **When**: User performs actions (edit, delete, share)
- **Then**:
  - Actions accessible via menu
  - Confirmation dialogs mobile-optimized
  - No accidental deletions (require confirmation)

---

## Test Coverage Priority

**Critical (P0):**
- 1.1, 1.2, 1.5, 3.1, 3.3-3.4, 4.1-4.2, 5.1-5.3, 7.1-7.3, 10.1-10.2

**High (P1):**
- 1.3-1.4, 2.1-2.5, 3.2, 3.5-3.6, 5.4-5.5, 6.1, 8.1-8.3, 11.1-11.3

**Medium (P2):**
- 1.6-1.7, 2.6, 3.7-3.8, 4.3-4.5, 6.2, 7.4, 9.1-9.2, 10.3, 12.1-12.2

**Low (P3):**
- 9.3, 13.1-13.3

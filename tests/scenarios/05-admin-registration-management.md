# Admin Registration Management Test Scenarios

## 1. View Registrations

### 1.1 Happy Path - View Event Registrations List
- **Given**: User is ADMIN or higher for event's school
- **When**: User views event's registrations page
- **Then**:
  - List of all registrations shown
  - Displays: name, email, phone, spots, status, confirmation code, timestamp
  - Sorted by registration date (newest first)
  - Confirmed and waitlist separated or filterable

### 1.2 Registration Count Summary
- **Given**: Event has various registration statuses
- **When**: Admin views registrations
- **Then**:
  - Summary stats shown:
    - Total confirmed: X
    - Total waitlist: Y
    - Total cancelled: Z
    - Spots reserved: X / capacity

### 1.3 Empty Registrations List
- **Given**: Event has 0 registrations
- **When**: Admin views registrations
- **Then**:
  - Empty state message: "No registrations yet"
  - Prompt to share event link
  - QR code or shareable link prominent

### 1.4 Search Registrations
- **Given**: Event has many registrations
- **When**: Admin searches by name, email, or confirmation code
- **Then**:
  - Results filtered in real-time
  - Matches highlighted
  - Clear search results

### 1.5 Filter Registrations
- **Given**: Admin on registrations page
- **When**: Admin applies filters
- **Then**:
  - Filter by status: CONFIRMED, WAITLIST, CANCELLED
  - Filter by date range
  - Filter by spots count
  - Clear filters button available

### 1.6 Sort Registrations
- **Given**: Admin viewing registrations
- **When**: Admin clicks column headers
- **Then**:
  - Sort by: date, name, email, spots, status
  - Ascending/descending toggle
  - Sort preference persisted

### 1.7 Pagination (Large Event)
- **Given**: Event has 500+ registrations
- **When**: Admin views list
- **Then**:
  - Paginated (e.g., 50 per page)
  - Page navigation controls
  - Jump to page option
  - Total count shown

### 1.8 Mobile Registrations List View
- **Given**: Admin on mobile device
- **When**: Viewing registrations
- **Then**:
  - Responsive table or card layout
  - Key info visible (name, status, spots)
  - Swipe actions for quick edit/cancel

---

## 2. View Registration Details

### 2.1 View Single Registration Detail
- **Given**: Admin clicks registration from list
- **When**: Detail view opens
- **Then**:
  - All standard fields shown: name, email, phone, spots
  - All custom fields shown with values
  - Registration metadata: status, confirmation code, created date
  - Event info referenced

### 2.2 View Custom Field Data
- **Given**: Registration has custom field responses
- **When**: Admin views details
- **Then**:
  - Custom fields displayed with labels
  - Values formatted correctly (dates, numbers, text)
  - Empty optional fields indicated

### 2.3 Registration Timeline (Future)
- **Given**: Registration with status changes
- **When**: Admin views history
- **Then**:
  - Timeline of events:
    - Registered at X
    - Confirmed at Y
    - Edited at Z
    - Cancelled at W

---

## 3. Edit Registration

### 3.1 Happy Path - Edit Registration Details (ADMIN)
- **Given**: User is ADMIN or higher
- **When**: Admin edits registration (name, email, phone)
- **Then**:
  - Changes saved to database
  - Validation applied (email format, phone format)
  - Success message shown
  - Updated data reflected immediately

### 3.2 Edit Registration - Change Spots Count
- **Given**: Registration has 2 spots, event capacity allows
- **When**: Admin changes spots to 3
- **Then**:
  - spotsReserved incremented by 1 (atomic)
  - Registration updated
  - Capacity check enforced

### 3.3 Edit Registration - Reduce Spots
- **Given**: Registration has 5 spots
- **When**: Admin reduces to 2 spots
- **Then**:
  - spotsReserved decremented by 3
  - 3 spots freed up
  - If waitlist exists, admin prompted to move waitlist to confirmed

### 3.4 Edit Custom Fields
- **Given**: Registration has custom field data
- **When**: Admin edits custom field values
- **Then**:
  - customFields JSON updated
  - Validation rules applied
  - Changes saved

### 3.5 Edit Registration - Manager Role
- **Given**: User is MANAGER (not ADMIN)
- **When**: Manager edits registration
- **Then**:
  - Can edit: name, email, phone, custom fields
  - Can change status (CONFIRMED ↔ CANCELLED)
  - Cannot delete registration

### 3.6 Edit Registration - Viewer Role
- **Given**: User is VIEWER
- **When**: Viewer tries to edit
- **Then**:
  - 403 Forbidden error
  - Edit button hidden
  - Form fields read-only

### 3.7 Edit Validation Errors
- **Given**: Admin editing registration
- **When**: Admin enters invalid data (bad email, invalid phone)
- **Then**:
  - Validation errors shown
  - Changes not saved
  - Clear error messages in Hebrew

### 3.8 Mobile Registration Edit
- **Given**: Admin on mobile device
- **When**: Editing registration
- **Then**:
  - Form fields accessible
  - Input text visible (not white on white)
  - Save button reachable
  - Validation errors clear

---

## 4. Cancel Registration

### 4.1 Happy Path - Cancel Registration (ADMIN)
- **Given**: Registration is CONFIRMED
- **When**: Admin clicks "Cancel registration"
- **Then**:
  - Confirmation prompt shown
  - Status changed to CANCELLED
  - spotsReserved decremented by spots count
  - Freed spots available for new registrations
  - Cancellation email sent to registrant (optional)

### 4.2 Cancel Registration - Free Up Capacity
- **Given**: Event full, waitlist exists, admin cancels CONFIRMED registration
- **When**: Cancellation completes
- **Then**:
  - Spots freed
  - Admin notified to move waitlist to confirmed
  - Automatic waitlist promotion option (future)

### 4.3 Cancel Registration - Waitlist
- **Given**: Registration is WAITLIST
- **When**: Admin cancels
- **Then**:
  - Status changed to CANCELLED
  - No capacity change (waitlist doesn't affect spotsReserved)
  - Removed from waitlist queue

### 4.4 Cancel Registration Confirmation Prompt
- **Given**: Admin clicks cancel
- **When**: Prompt shown
- **Then**:
  - Clear warning: "This will free up X spots"
  - Option to send cancellation email
  - Requires explicit confirmation

### 4.5 Uncancel Registration (Reactivate)
- **Given**: Registration was CANCELLED
- **When**: Admin clicks "Reactivate"
- **Then**:
  - Capacity check performed
  - If spots available: status → CONFIRMED, spotsReserved incremented
  - If full: status → WAITLIST
  - User notified of reactivation

### 4.6 Bulk Cancel Registrations
- **Given**: Admin selects multiple registrations
- **When**: Admin clicks "Bulk cancel"
- **Then**:
  - Confirmation prompt with count
  - All selected cancelled atomically
  - spotsReserved updated correctly
  - Summary shown (X cancelled, Y freed spots)

---

## 5. Manually Add Registration

### 5.1 Happy Path - Manual Registration (Spots Available)
- **Given**: Admin wants to register someone manually
- **When**: Admin fills form (name, email, phone, spots)
- **Then**:
  - Registration created with status: CONFIRMED
  - spotsReserved incremented
  - Confirmation code generated
  - Email sent to registrant
  - Admin sees success message with confirmation code

### 5.2 Manual Registration - Event Full
- **Given**: Event at capacity
- **When**: Admin manually registers someone
- **Then**:
  - Option shown: "Add to waitlist" or "Override capacity"
  - If override: registration CONFIRMED, capacity exceeded
  - If waitlist: status WAITLIST

### 5.3 Manual Registration - Custom Fields
- **Given**: Event has custom fields
- **When**: Admin manually registers
- **Then**:
  - Custom fields shown in form
  - Admin fills custom data
  - Validation applied
  - Data saved to customFields JSON

### 5.4 Manual Registration - Skip Email
- **Given**: Admin manually registering
- **When**: Admin checks "Don't send confirmation email"
- **Then**:
  - Registration created
  - No email sent
  - Admin sees confirmation code to share manually

### 5.5 Manual Registration Validation
- **Given**: Admin filling manual registration form
- **When**: Admin submits with errors
- **Then**:
  - Standard validation applies (email, phone, required fields)
  - Form not submitted until valid

---

## 6. Move Waitlist to Confirmed

### 6.1 Promote from Waitlist - Manual
- **Given**: Registration on WAITLIST, spots now available
- **When**: Admin clicks "Move to confirmed"
- **Then**:
  - Status changed to CONFIRMED
  - spotsReserved incremented
  - Email sent: "Spot available! You're now confirmed"
  - Confirmation code provided

### 6.2 Bulk Promote from Waitlist
- **Given**: Multiple WAITLIST registrations, spots available
- **When**: Admin selects multiple and clicks "Confirm"
- **Then**:
  - Capacity check for total spots needed
  - All or none confirmed (transaction)
  - spotsReserved updated
  - Emails sent to all

### 6.3 Waitlist Promotion - Insufficient Capacity
- **Given**: Waitlist registration needs 5 spots, only 3 available
- **When**: Admin tries to confirm
- **Then**:
  - Error message: "Not enough spots (need 5, have 3)"
  - Registration stays on waitlist
  - Option to partially fulfill (future) or override capacity

### 6.4 Automatic Waitlist Promotion (Future)
- **Given**: CONFIRMED registration cancelled, waitlist exists
- **When**: Cancellation frees spots
- **Then**:
  - System automatically promotes first waitlist registration(s)
  - Emails sent automatically
  - Admin notified of auto-promotion

### 6.5 Waitlist Order
- **Given**: Multiple registrations on waitlist
- **When**: Admin views waitlist
- **Then**:
  - Sorted by registration timestamp (first in line first)
  - Position number shown (e.g., "#1 in line")
  - Fair queue management (FIFO)

---

## 7. Export Registrations

### 7.1 Happy Path - Export to CSV
- **Given**: Event has registrations
- **When**: Admin clicks "Export to CSV"
- **Then**:
  - CSV file generated with all registrations
  - Columns: name, email, phone, spots, status, confirmation code, custom fields
  - Hebrew characters encoded correctly (UTF-8 BOM)
  - File downloaded immediately

### 7.2 Export Filtered Results
- **Given**: Admin applied filters (e.g., only CONFIRMED)
- **When**: Admin exports
- **Then**:
  - Only filtered registrations exported
  - CSV reflects current view
  - Filename indicates filter (e.g., "event-confirmed-2024-10-17.csv")

### 7.3 Export with Custom Fields
- **Given**: Event has custom fields, registrations have data
- **When**: Admin exports
- **Then**:
  - Each custom field is a column
  - Column headers from field labels
  - Empty fields shown as empty cells

### 7.4 Export Large Dataset
- **Given**: Event has 1000+ registrations
- **When**: Admin clicks export
- **Then**:
  - Loading indicator shown
  - File generates without timeout
  - Download starts when ready
  - All records included

### 7.5 Export to Excel (Future)
- **Given**: Admin prefers Excel format
- **When**: Admin selects "Export to Excel"
- **Then**:
  - .xlsx file generated
  - Formatting preserved (RTL for Hebrew)
  - Multiple sheets if needed (confirmed, waitlist, cancelled)

### 7.6 Export Email List
- **Given**: Admin wants email list for mail merge
- **When**: Admin clicks "Export email list only"
- **Then**:
  - CSV with only email addresses
  - One per line, no duplicates
  - Can be imported to email marketing tools

### 7.7 Export Mobile
- **Given**: Admin on mobile device
- **When**: Admin exports CSV
- **Then**:
  - File downloads to device
  - Can be shared via apps (WhatsApp, email, drive)
  - Format preserved

---

## 8. Send Messages to Registrants

### 8.1 Send Email to All Registrants (Future)
- **Given**: Admin wants to notify registrants
- **When**: Admin composes message and sends
- **Then**:
  - Email sent to all CONFIRMED registrations
  - Option to include WAITLIST
  - BCC used (privacy)
  - School email as From address

### 8.2 Send Email to Selected Registrants
- **Given**: Admin selects specific registrations
- **When**: Admin clicks "Email selected"
- **Then**:
  - Email compose modal opens
  - Pre-filled To addresses
  - Can add custom message
  - Event details included

### 8.3 WhatsApp Broadcast (Future)
- **Given**: School has WhatsApp Business integration
- **When**: Admin sends WhatsApp message
- **Then**:
  - Message sent via WhatsApp API
  - Template compliance (opt-in required)
  - Delivery status tracked

### 8.4 SMS Notifications (PRO Plan)
- **Given**: School on PRO plan with SMS credits
- **When**: Admin sends SMS
- **Then**:
  - SMS sent to phone numbers
  - Character limit enforced (160 chars)
  - Delivery status shown
  - SMS quota decremented

---

## 9. Registration Analytics

### 9.1 View Registration Timeline
- **Given**: Event has registrations over time
- **When**: Admin views analytics tab
- **Then**:
  - Chart showing registrations by date
  - Peak periods highlighted
  - Cumulative line graph

### 9.2 Custom Fields Analytics
- **Given**: Event has custom fields (e.g., age, location)
- **When**: Admin views breakdown
- **Then**:
  - Pie chart or bar chart of field values
  - Example: Age distribution, T-shirt size breakdown
  - Exportable data

### 9.3 Conversion Funnel
- **Given**: Event page views tracked
- **When**: Admin views funnel
- **Then**:
  - Views → Started form → Submitted → Confirmed
  - Percentages at each stage
  - Identify drop-off points

### 9.4 Cancellation Rate
- **Given**: Event has cancellations
- **When**: Admin views stats
- **Then**:
  - Cancellation rate calculated (cancelled / total)
  - Trends over time
  - Comparison with past events

---

## 10. Check-In Management (Future)

### 10.1 Check-In Registrant
- **Given**: Event day, registrant arrives
- **When**: Admin checks in registrant (scans QR code or enters code)
- **Then**:
  - Registration marked as "Checked In"
  - Timestamp recorded
  - Duplicate check-in prevented

### 10.2 View Check-In Status
- **Given**: Event in progress
- **When**: Admin views check-in list
- **Then**:
  - List shows checked-in vs not checked-in
  - Real-time updates
  - Filter by check-in status

### 10.3 QR Code Check-In
- **Given**: Registrant has QR code on confirmation email
- **When**: Admin scans QR code at entrance
- **Then**:
  - Registration looked up instantly
  - Check-in recorded
  - Name displayed for verification

### 10.4 Manual Check-In Adjustment
- **Given**: Registrant checked in by mistake
- **When**: Admin unchecks check-in
- **Then**:
  - Check-in removed
  - Status reverted
  - Audit log recorded

---

## 11. Registration Notes & Communication

### 11.1 Add Notes to Registration (ADMIN)
- **Given**: Admin viewing registration
- **When**: Admin adds internal note
- **Then**:
  - Note saved to registration
  - Note not visible to registrant
  - Admin name and timestamp recorded
  - Multiple notes supported

### 11.2 View Registration Notes
- **Given**: Registration has notes
- **When**: Admin views registration
- **Then**:
  - All notes listed chronologically
  - Author and timestamp shown
  - Can edit/delete own notes

### 11.3 Flag Registration (Future)
- **Given**: Registration needs attention
- **When**: Admin flags it
- **Then**:
  - Visual indicator (star, color, tag)
  - Filterable by flagged
  - Used for follow-up

---

## 12. Multi-Tenant Registration Isolation

### 12.1 School A Cannot See School B Registrations
- **Given**: Two schools with events
- **When**: School A admin accesses registrations
- **Then**:
  - Only School A event registrations visible
  - API enforces schoolId filter
  - No data leakage

### 12.2 SUPER_ADMIN View All Registrations
- **Given**: User is SUPER_ADMIN
- **When**: SUPER_ADMIN accesses registrations
- **Then**:
  - Can view any school's registrations
  - Filter by school
  - Can export across schools (if needed)

### 12.3 Cross-School Registration Attempt
- **Given**: Admin tries to access registration from different school
- **When**: Direct URL or API call made
- **Then**:
  - 403 Forbidden error
  - No data returned
  - Attempt logged for security

---

## 13. Mobile Admin Registration Management

### 13.1 Mobile Registrations Table
- **Given**: Admin on mobile device
- **When**: Viewing registrations list
- **Then**:
  - Card layout instead of table
  - Key info visible: name, spots, status
  - Tap to expand for details

### 13.2 Mobile Quick Actions
- **Given**: Admin on mobile viewing registration
- **When**: Admin performs actions
- **Then**:
  - Swipe left/right for quick cancel/edit
  - Bottom action sheet for more options
  - Confirmation dialogs optimized for mobile

### 13.3 Mobile Export
- **Given**: Admin on mobile needs to export
- **When**: Admin clicks export
- **Then**:
  - CSV generated and downloaded
  - Can share via system share sheet (email, WhatsApp, drive)

### 13.4 Mobile Search & Filter
- **Given**: Admin on mobile with many registrations
- **When**: Admin searches or filters
- **Then**:
  - Search bar sticky at top
  - Filter drawer slides from bottom
  - Results update smoothly

---

## 14. Permissions by Role

### 14.1 OWNER - Full Registration Management
- **Given**: User is OWNER
- **When**: Managing registrations
- **Then**:
  - Can view, edit, cancel, add, export
  - Can send emails/messages
  - Can view analytics
  - Full access to all features

### 14.2 ADMIN - Full Registration Management
- **Given**: User is ADMIN
- **When**: Managing registrations
- **Then**:
  - Same as OWNER for registrations
  - Cannot manage team or billing
  - Can do all registration operations

### 14.3 MANAGER - Limited Edit Access
- **Given**: User is MANAGER
- **When**: Managing registrations
- **Then**:
  - Can view all registrations
  - Can edit registration details
  - Can cancel/reactivate
  - Cannot delete registrations
  - Cannot export (optional restriction)

### 14.4 VIEWER - Read-Only Access
- **Given**: User is VIEWER
- **When**: Viewing registrations
- **Then**:
  - Can view registrations list and details
  - Cannot edit, cancel, add, or export
  - All action buttons hidden
  - Forms read-only

---

## Test Coverage Priority

**Critical (P0):**
- 1.1, 1.2, 2.1, 3.1, 3.2, 4.1, 4.2, 5.1, 6.1, 7.1, 12.1-12.3, 14.1-14.4

**High (P1):**
- 1.3-1.7, 2.2, 3.3-3.5, 4.3-4.5, 5.2-5.4, 6.2-6.5, 7.2-7.4, 9.1-9.2

**Medium (P2):**
- 1.8, 2.3, 3.6-3.8, 4.6, 5.5, 7.5-7.7, 8.1-8.4, 9.3-9.4, 11.1-11.3, 13.1-13.4

**Low (P3):**
- 6.4, 10.1-10.4

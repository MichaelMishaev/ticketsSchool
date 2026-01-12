# 📚 TicketCap Complete System Wiki

**Comprehensive guide to all TicketCap features with step-by-step instructions**

Last Updated: 2026-01-09

---

## 📖 Table of Contents

1. [Event Management](#1-event-management)
2. [Registration System](#2-registration-system)
3. [Table Management](#3-table-management)
4. [Check-In System](#4-check-in-system)
5. [Attendance Tracking](#5-attendance-tracking)
6. [Ban Management](#6-ban-management)
7. [Team & Admin Management](#7-team--admin-management)
8. [Filtering & Search](#8-filtering--search)
9. [Dashboard & Analytics](#9-dashboard--analytics)
10. [Super Admin Features](#10-super-admin-features)

---

## 1. Event Management

### 1.1 Creating a New Event

**Step-by-step:**

1. **Navigate to Events Page**
   - Click "אירועים" in the sidebar
   - Click "+ אירוע חדש" button

2. **Choose Event Type**
   - **Capacity-Based**: Traditional spot-based registration (e.g., sports games, lectures)
   - **Table-Based**: Seating assignments (e.g., dinners, galas)

3. **Fill Event Details**
   - **Title** (כותרת): Event name (e.g., "משחק כדורגל מחזור 5")
   - **Slug** (קישור): URL-friendly identifier (auto-generated from title)
   - **Description** (תיאור): Optional event details
   - **Game Type** (סוג משחק): Sport/activity type
   - **Location** (מיקום): Event venue
   - **Start Date/Time** (תאריך התחלה): When event begins
   - **End Date/Time** (תאריך סיום): Optional end time
   - **Capacity** (קיבולת): Maximum attendees (capacity-based only)

4. **Configure Registration Fields**
   - Click "+ הוסף שדה" to add custom fields
   - Field types: Text, Number, Email, Phone, Dropdown
   - Mark fields as required/optional
   - Example fields:
     - "שם הילד" (Child Name) - Text, Required
     - "טלפון הורה" (Parent Phone) - Phone, Required
     - "כמות כרטיסים" (Ticket Count) - Number

5. **Set Event Conditions** (Optional)
   - Terms & conditions text
   - Require acceptance checkbox
   - Completion message after registration

6. **Save Event**
   - Click "צור אירוע" button
   - Event appears in events list
   - Public URL: `https://yoursite.com/p/[school-slug]/[event-slug]`

---

### 1.2 Event Status Management

**Event Statuses:**

- **OPEN** 🟢: Accepting registrations
- **PAUSED** ⏸️: Temporarily stop registrations (event still visible)
- **CLOSED** 🔴: Finalized, no new registrations

**How to Change Status:**

1. Navigate to event details page
2. Click "עריכת אירוע" button
3. Select new status from dropdown
4. Save changes

**Use Cases:**
- **PAUSED**: When event is full but you want to keep public page visible
- **CLOSED**: After event ends, for archival purposes

---

### 1.3 Editing Events

**Step-by-step:**

1. Go to Events page (`/admin/events`)
2. Click on event title to open details
3. Click "עריכת אירוע" button
4. Modify any field (title, date, capacity, custom fields, etc.)
5. Click "שמור שינויים"

**What You Can Edit:**
- Event details (title, description, location)
- Date/time
- Capacity (Note: Cannot reduce below current registrations)
- Custom fields (add/remove/modify)
- Status (OPEN/PAUSED/CLOSED)

**What You Cannot Edit:**
- Event slug (URL remains permanent)
- Event type (CAPACITY_BASED vs TABLE_BASED)

---

### 1.4 Deleting Events

**Step-by-step:**

1. Go to Events page
2. Select events to delete (checkboxes)
3. Click "מחק אירועים נבחרים" button
4. Confirm deletion in modal
5. All registrations, check-ins, and tables are deleted (cascade)

**⚠️ Warning:**
- Deletion is **permanent** and cannot be undone
- All associated data (registrations, check-ins) will be deleted
- Use CLOSED status instead if you want to archive

---

### 1.5 Event Filtering

**Available Filters:**

1. **By Event Type**
   - Filter: "הצג הכל | מבוסס קיבולת | מבוסס שולחנות"
   - Use case: Find all table-based events

2. **By Status**
   - Filter: "הכל | פעיל | מושהה | סגור"
   - Use case: See only active events

3. **By Date**
   - Filter: "כל התאריכים | השבוע | החודש"
   - Use case: Upcoming events only

4. **By Search**
   - Search bar: Search by title or confirmation code
   - Use case: Find specific event quickly

---

## 2. Registration System

### 2.1 Public Registration Flow

**User Experience:**

1. **Access Public URL**
   - URL format: `https://yoursite.com/p/[school-slug]/[event-slug]`
   - Example: `https://ticketcap.com/p/beeri/soccer-game-5`

2. **View Event Details**
   - Event title, description, location
   - Date/time
   - Capacity status (e.g., "20/30 מקומות תפוסים")
   - Terms & conditions (if set)

3. **Fill Registration Form**
   - All required custom fields
   - Phone number (Israeli format: 10 digits starting with 0)
   - Email (optional, unless required by custom field)
   - Guest count (for table-based events)

4. **Submit Registration**
   - Click "הירשם לאירוע" button
   - System checks:
     - Required fields filled
     - Phone format valid
     - User not banned
     - Capacity available

5. **Receive Confirmation**
   - **If spots available:**
     - Status: CONFIRMED ✅
     - Confirmation code generated (6-digit alphanumeric)
     - QR code displayed
     - Cancellation link provided (if enabled)
   - **If full:**
     - Status: WAITLIST ⏳
     - Position in waitlist shown
     - Notification: "תתקבל הודעה כשיש מקום"

---

### 2.2 Registration Status Management

**Status Types:**

- **CONFIRMED** ✅: Spot secured
- **WAITLIST** ⏳: Queued for availability
- **CANCELLED** ❌: User cancelled registration

**How to Change Status (Admin):**

1. Go to event details page
2. Find registration in list
3. Click "..." menu
4. Select "שנה סטטוס"
5. Choose new status
6. Save

**Use Cases:**
- Move WAITLIST → CONFIRMED when spot opens
- Move CONFIRMED → CANCELLED for no-shows
- Move CANCELLED → CONFIRMED to restore registration

---

### 2.3 Admin Registration Management

**View All Registrations:**

1. Navigate to event details (`/admin/events/[id]`)
2. See registrations table with:
   - Confirmation code
   - Name (from custom fields)
   - Phone number
   - Email
   - Spots count
   - Status badge
   - Registration date

**Filter Registrations:**

- **By Status**: "הכל | מאושר | המתנה | בוטל"
- **By Search**: Search by name, phone, email, or confirmation code
- **By Date**: Registration date range

**Export to CSV:**

1. Click "ייצא ל-CSV" button
2. Downloads all registrations with all custom fields
3. File name: `event-[slug]-registrations.csv`

---

### 2.4 Registration Search

**Global Search by Confirmation Code:**

1. Go to any event page
2. Enter confirmation code in search bar
3. System searches across ALL events in your school
4. Returns:
   - Event name
   - Registration details
   - Status
   - Check-in status

**Use Case:**
- Attendee arrives with confirmation code but doesn't know event name
- Quick lookup across all events

---

### 2.5 Cancellation System

**Enable Cancellation for Event:**

1. Edit event
2. Check "אפשר ביטול" checkbox
3. Set cancellation deadline (hours before event)
4. Optionally require cancellation reason

**User Self-Service Cancellation:**

1. User receives cancellation link with confirmation email
2. Link format: `/cancel/[cancellation-token]`
3. User clicks link
4. Confirms cancellation
5. Optionally provides reason (if required)
6. Registration status → CANCELLED

**Cancellation Rules:**
- Cannot cancel after deadline (e.g., 2 hours before event)
- Cannot cancel WAITLIST registrations (use "remove" instead)
- Cancelled spots return to capacity pool
- Waitlist automatically promoted if enabled

---

## 3. Table Management

### 3.1 Creating Tables

**Single Table Creation:**

1. Go to table-based event details
2. Click "הוסף שולחן" button
3. Fill fields:
   - **Table Number/Name**: "1", "שולחן 5", "VIP-3", etc.
   - **Capacity**: Maximum guests (e.g., 8)
   - **Minimum Order**: Minimum guests required (e.g., 4)
   - **Status**: AVAILABLE (default)
4. Click "צור שולחן"

**Table Statuses:**
- **AVAILABLE** 🟢: Open for reservations
- **RESERVED** 🔒: Assigned to registration
- **INACTIVE** ⚪: Hidden from public (e.g., VIP reserved)

---

### 3.2 Duplicate Tables (Bulk Creation)

**Create 30+ tables in seconds:**

1. Create first table (e.g., "שולחן 1", capacity 8, min 4)
2. Click **📋 Copy icon** next to table
3. **Duplicate Modal appears:**
   - Enter number of duplicates (1-100)
   - **Live Preview** shows auto-generated names:
     - "שולחן 1" → "שולחן 2", "שולחן 3", ... "שולחן 31"
     - "Table-5" → "Table-6", "Table-7", ... "Table-35"
   - All tables inherit capacity, minOrder, status
4. Click "צור שולחנות" button
5. 30+ tables created in ~2 seconds

**Smart Auto-Increment:**
- Detects Hebrew numbers: "שולחן 5" → 6, 7, 8...
- Detects English numbers: "Table-5" → 6, 7, 8...
- Handles formats: "5", "שולחן 5", "Table-5", "VIP-5"

**Use Case:**
- Wedding venue: Create 40 tables in 30 seconds
- Conference: Duplicate "שולחן 1" → 50 tables instantly

---

### 3.3 Table Templates System

**Save Current Tables as Template:**

1. Configure tables for an event (30 tables, various sizes)
2. Click "שמור כתבנית" button
3. Enter template details:
   - **Name**: "חתונה 200 אורחים" (Wedding 200 Guests)
   - **Description**: "40 שולחנות, כל שולחן 8 מקומות, מינימום 4"
   - **Public**: Check if want to share with all schools (SUPER_ADMIN only)
4. Template saved to school templates library

**Apply Template to New Event:**

1. Create new table-based event
2. Click "החל תבנית" button
3. Select template from dropdown:
   - **Private Templates**: School-specific templates
   - **Public Templates**: Shared by SUPER_ADMIN
4. Click "החל תבנית"
5. All tables created instantly with template configuration

**Popular Templates** (SUPER_ADMIN curated):
- "Wedding 200" - 40 tables, 8 seats each
- "Gala 40 Tables" - Mixed seating (4-10 seats)
- "Conference 30" - 30 tables, 6 seats each

**Template Details:**
- Stores: Table numbers, capacity, minOrder, count
- Reusable across multiple events
- Edit/delete templates anytime
- Track popularity (timesUsed counter)

---

### 3.4 Bulk Edit Tables

**Edit Multiple Tables at Once:**

1. **Select Tables:**
   - Check boxes next to tables to edit
   - Can select 2-100 tables

2. **Click "עריכה קבוצתית" button**

3. **Bulk Edit Modal:**
   - **Capacity**: Leave empty to skip, or enter new value (e.g., "10")
   - **Minimum Order**: Leave empty to skip, or enter new value (e.g., "5")
   - **Status**: Leave as "אל תשנה" or select AVAILABLE/INACTIVE

4. **Preview Changes:**
   - Modal shows how many tables will be updated
   - "20 שולחנות ישודרגו לקיבולת 10"

5. **Click "עדכן שולחנות"**
   - All selected tables updated instantly

**Use Case:**
- Change capacity of 30 tables from 8 → 10
- Mark 15 tables as INACTIVE for VIP section

---

### 3.5 Bulk Delete Tables

**Delete Multiple Tables:**

1. Select tables to delete (checkboxes)
2. Click "מחק שולחנות נבחרים" button
3. Confirm deletion

**Protection Rules:**
- ✅ Can delete: AVAILABLE and INACTIVE tables
- ❌ Cannot delete: RESERVED tables
- Error: "לא ניתן למחוק שולחנות עם הרשמות"

---

### 3.6 Table Assignment Logic

**Automatic Table Assignment:**

When user registers:
1. System finds all AVAILABLE tables
2. Filters tables where `capacity >= guestsCount >= minOrder`
3. Selects **smallest fitting table** (best-fit algorithm)
4. Updates table status → RESERVED
5. Links registration to table

**Example:**
- User requests 6 guests
- Available tables: 4-seat, 8-seat, 10-seat
- System assigns: **8-seat table** (smallest that fits)

**Waitlist Logic:**
- If no fitting table available → Status: WAITLIST
- When table freed (cancellation) → Auto-assign waitlist (priority order)

---

### 3.7 Table Reordering

**Change Display Order:**

1. Go to event tables view
2. Drag-drop tables to reorder (⬆️⬇️ icons)
3. Or use "שנה סדר" button for manual ordering
4. Save changes

**Use Case:**
- Group VIP tables at top
- Arrange tables by section/floor

---

## 4. Check-In System

### 4.1 Generating Check-In Link

**Create Secure Check-In URL:**

1. Go to event details page
2. Find "קישור צ'ק-אין" section
3. Click "צור קישור צ'ק-אין" button
4. **Secure token generated** (43-character base64url)
5. Copy shareable URL: `/check-in/[eventId]/[token]`

**Sharing Check-In Link:**
- Send to staff via WhatsApp/Email
- No authentication required (token-based access)
- Anyone with link can check in attendees
- Link expires when event is deleted

**Regenerate Token:**
- Click "חדש קישור" to invalidate old link
- Use case: Link leaked, need new secure URL

---

### 4.2 Check-In Page Interface

**Access Check-In Page:**
- URL: `https://yoursite.com/check-in/[eventId]/[token]`
- No login required (token-based)

**Page Features:**

1. **Live Stats Header**
   - "24/30 (80%)" - Checked in / Total (Percentage)
   - Updates every 10 seconds automatically

2. **Filter Tabs**
   - **All (30)**: All registrations
   - **Checked In ✅ (24)**: Already attended
   - **Not Yet ⏳ (6)**: Awaiting check-in

3. **Search Bar**
   - Search by: Name, phone, or confirmation code
   - Real-time filtering

4. **QR Scanner Button**
   - Click 📷 camera icon
   - Activate QR scanner (requires camera permission)
   - Scan QR code from registration confirmation
   - Auto-checks in attendee

---

### 4.3 Check-In Methods

**Method 1: Manual Check-In**

1. Find attendee in list (search or scroll)
2. **Participant card shows:**
   - Name
   - Phone number
   - Spots/guests count
   - Confirmation code (truncated)
   - Status: ⏳ Yellow card = Not checked in
3. Click "סמן כנוכח" button
4. Card turns **green** ✅
5. Check-in timestamp recorded

**Method 2: QR Code Scanning**

1. Click 📷 camera button
2. Allow camera permission
3. Point camera at QR code
4. System reads confirmation code
5. Auto-marks as attended
6. Visual feedback: Green checkmark ✅

**Method 3: Confirmation Code Entry**

1. Type confirmation code in search bar
2. Registration appears in filtered list
3. Click "סמן כנוכח" button

---

### 4.4 Undo Check-In

**Revert Accidental Check-In:**

1. Find checked-in participant (green card ✅)
2. Click "בטל צ'ק-אין" button
3. Confirm undo action
4. Optional: Enter undo reason
5. Card returns to yellow ⏳
6. Audit trail recorded:
   - `undoneAt`: Timestamp
   - `undoneBy`: Staff name
   - `undoneReason`: Optional text

**Use Case:**
- Accidentally checked in wrong person
- Person didn't actually attend (fraud detection)

---

### 4.5 Banned Users on Check-In

**Ban Status Display:**

- **Red card** 🔴 with ban warning
- Shows:
  - "משתמש חסום" (User Banned)
  - Ban reason
  - Remaining games OR expiration date
- **No check-in button** (disabled)

**Use Case:**
- Staff sees banned user trying to enter
- Visual warning to deny entry

---

## 5. Attendance Tracking

### 5.1 Post-Event Attendance Review

**View No-Shows After Event:**

1. Go to event details
2. Wait for event to end (`endAt` passed)
3. Click "סקירת נוכחות" tab
4. **Statistics displayed:**
   - Total registered: 30
   - Checked in: 24
   - No-shows: 6
   - Attendance rate: 80%

**No-Show List:**
- Table with all no-show registrations
- Columns: Name, Phone, Spots, Confirmation Code
- **Select no-shows** to create bans

---

### 5.2 Attendance History (Per User)

**View User's Attendance Record:**

1. From no-show list, click on phone number
2. **Attendance history modal opens:**
   - Total events: 12
   - Attended: 9
   - No-shows: 3
   - Attendance rate: 75%
3. **Last 10 events table:**
   - Event name
   - Date
   - Status: ✅ Attended or ❌ No-show

**Use Case:**
- Decide if user deserves ban
- Check if pattern of no-shows exists

---

### 5.3 Creating Bans from No-Shows

**Quick Ban Workflow:**

1. From attendance review page
2. Select no-show users (checkboxes)
3. Click "צור חסימות" button
4. **Ban modal opens** (see Ban Management section)
5. Choose ban type and reason
6. Submit → All selected users banned

---

## 6. Ban Management

### 6.1 Ban System Overview

**Purpose:** Prevent users from registering for events due to repeated no-shows or policy violations.

**Identification:** Phone-based (Israeli market standard)

**Multi-Tenant:** Bans are school-specific (cannot affect other schools)

**Ban Types:**
1. **Game-Based Ban**: Ban from next N events (e.g., 3 events)
2. **Date-Based Ban**: Ban until specific date (e.g., 30 days)

---

### 6.2 Creating Bans

**Step-by-Step:**

1. **Navigate to Ban Management**
   - Sidebar → "הגדרות" → "חסימות"

2. **Click "צור חסימה חדשה" button**

3. **Select Users to Ban:**
   - **Option A**: Select from no-show list (attendance review)
   - **Option B**: Manually enter phone numbers

4. **Choose Ban Type:**
   - **Game-Based** (מבוסס משחקים):
     - Click "מבוסס משחקים" tab
     - Enter number of events (default: 3)
     - Example: Ban from next 3 events
   - **Date-Based** (מבוסס תאריך):
     - Click "מבוסס תאריך" tab
     - Select expiration date from calendar
     - Example: Banned until 2026-02-15

5. **Enter Ban Reason:**
   - Free text field (Hebrew supported)
   - Examples:
     - "לא הגיע ל-3 משחקים רצופים"
     - "הפרה של תנאי השימוש"
     - "התנהגות לא הולמת"

6. **Submit:**
   - Click "צור חסימה" button
   - Toast notification: "2 משתמשים נחסמו בהצלחה"

**Bulk Ban Creation:**
- Select multiple users from no-show list
- All get same ban type, duration, and reason
- Efficient for batch processing

---

### 6.3 Ban Enforcement

**During Registration:**

1. User fills registration form
2. System checks for active ban:
   - Query: `phoneNumber + schoolId + active = true`
   - **Game-Based**: Check if `eventsBlocked < bannedGamesCount`
   - **Date-Based**: Check if `expiresAt >= now()`

3. **If Banned:**
   - ❌ Registration rejected
   - **Error message displayed** (Hebrew):
     - Game-Based: "מצטערים, חשבונך חסום ל-3 משחקים נוספים. סיבה: לא הגיע ל-3 משחקים רצופים"
     - Date-Based: "מצטערים, חשבונך חסום עד 15/02/2026. סיבה: הפרה של תנאי השימוש"
   - HTTP Status: 403 Forbidden

4. **If Not Banned:**
   - ✅ Registration proceeds normally

---

### 6.4 Ban Counter Tracking

**Game-Based Ban Logic:**

**After Event Ends:**
1. System calls `incrementBanCountersForEvent(eventId)`
2. Finds all active game-based bans for school
3. Increments `eventsBlocked` counter for each ban
4. **Auto-Deactivation:**
   - When `eventsBlocked >= bannedGamesCount`
   - Sets `active = false`
   - Ban expires automatically

**Example:**
- User banned from 3 events
- Counter: 0/3 → 1/3 → 2/3 → 3/3
- After 3rd event: Ban auto-deactivates

**Manual Trigger:**
- Admin can manually trigger counter increment
- Or set up cron job for automatic processing

---

### 6.5 Ban List & Filtering

**View All Bans:**

1. Navigate to "חסימות" page
2. **Ban list table shows:**
   - User details (phone, name, email)
   - Status badge:
     - 🔴 **Active**: Currently enforced
     - ⚪ **Finished**: Expired or lifted
   - Ban date
   - Expiration: "2 משחקים נותרו" or "פג תוקף ב-15/02/2026"
   - Reason (amber box)
   - Created by (admin name)
   - Lifted info (if applicable)

**Filter by Status:**
- **Active** 🔴: Currently enforced bans
- **Expired** ⚪: Finished/lifted bans
- **All**: Complete ban history

**Search Bans:**
- Search bar: Enter phone, name, or email
- Real-time filtering

**Use Case:**
- Check if specific user is banned
- Review ban history
- Audit ban reasons

---

### 6.6 Lifting Bans

**Remove Ban Early:**

1. Find ban in ban list
2. Click "הסר חסימה" button
3. **Lift Ban Modal:**
   - Optional: Enter lift reason
   - Examples:
     - "טעות במערכת"
     - "משתמש התנצל"
     - "נסיבות מיוחדות"
4. Click "הסר חסימה" button
5. Ban deactivated:
   - `active = false`
   - `liftedAt = now()`
   - `liftedBy = admin.name`
   - `liftedReason = entered text`

**Audit Trail:**
- All lift actions recorded
- Who lifted, when, and why
- Ban moves to "Expired" list

**Use Case:**
- User apologizes and deserves second chance
- Mistake in ban creation
- Special circumstances

---

### 6.7 Ban Expiration Cleanup

**Automatic Expiration:**

**Date-Based Bans:**
- Cron job calls `deactivateExpiredBans()`
- Finds bans where `expiresAt < now()`
- Sets `active = false`
- Should run daily

**Game-Based Bans:**
- Auto-deactivate when counter reaches limit
- No manual cleanup needed

**Manual Cleanup:**
- Admin can trigger `deactivateExpiredBans()` anytime
- Useful for immediate cleanup

---

## 7. Team & Admin Management

### 7.1 Role-Based Access Control

**Available Roles:**

1. **SUPER_ADMIN** 👑
   - Platform owner
   - Access to ALL schools
   - Manage schools, admins, public templates
   - Cannot be created via UI (database only)

2. **OWNER** 🏢
   - School owner
   - Billing & subscription management
   - Team management (invite/remove)
   - All event operations

3. **ADMIN** 👤
   - School admin
   - All event operations
   - Registration management
   - Ban management
   - Cannot manage team

4. **MANAGER** 📋
   - School manager
   - View events
   - Edit registrations
   - Cannot create/delete events

5. **VIEWER** 👀
   - School viewer
   - Read-only access
   - View events, registrations
   - Cannot edit anything

---

### 7.2 Inviting Team Members

**Step-by-Step:**

1. **Navigate to Team Page**
   - Sidebar → "צוות" → "ניהול צוות"

2. **Click "הזמן חבר צוות" button**

3. **Fill Invitation Form:**
   - **Email**: Team member's email address
   - **Role**: Select from dropdown (ADMIN/MANAGER/VIEWER/OWNER)
   - **Optional Message**: Personal note

4. **Click "שלח הזמנה" button**

5. **Invitation Sent:**
   - Email sent to invitee with invitation link
   - Unique token generated
   - Expiration date set (default: 7 days)
   - Status: PENDING ⏳

**Invitation Email:**
- Subject: "הוזמנת להצטרף לצוות של [School Name]"
- Contains: Invitation link with unique token
- Link format: `/team/accept-invitation?token=xxxxx`

---

### 7.3 Managing Invitations

**View All Invitations:**

- Table shows:
  - Email
  - Role
  - Status: PENDING/ACCEPTED/EXPIRED/REVOKED
  - Sent date
  - Expires date

**Actions:**

1. **Resend Invitation:**
   - Click "שלח שוב" button
   - New email sent with same token
   - Expiration extended

2. **Revoke Invitation:**
   - Click "בטל" button
   - Status → REVOKED
   - Link no longer valid

3. **Delete Invitation:**
   - Click trash icon
   - Removes invitation record

---

### 7.4 Accepting Invitations

**Invitee Experience:**

1. Receive invitation email
2. Click invitation link
3. **If No Account:**
   - Redirected to signup page
   - Email pre-filled
   - Create password
   - Account created and linked to school
4. **If Existing Account:**
   - Redirected to login
   - Login with existing credentials
   - Account linked to invited school
5. **Invitation Accepted:**
   - Status → ACCEPTED ✅
   - Access granted immediately
   - Redirected to dashboard

---

### 7.5 Removing Team Members

**Step-by-Step:**

1. Go to Team page
2. Find team member in list
3. Click "הסר" button
4. Confirm removal
5. **Actions:**
   - User removed from school
   - Cannot access school data
   - User account remains (can join other schools)

**⚠️ Warning:**
- Cannot remove yourself
- Cannot remove school owner (unless you're SUPER_ADMIN)

---

## 8. Filtering & Search

### 8.1 Event Filters

**Available Filters:**

1. **Event Type**
   - All Events
   - Capacity-Based Only
   - Table-Based Only

2. **Event Status**
   - All
   - Open (OPEN)
   - Paused (PAUSED)
   - Closed (CLOSED)

3. **Date Range**
   - All Dates
   - This Week
   - This Month
   - Custom Range

4. **Search**
   - By title
   - By slug
   - By confirmation code (global search)

**How to Use:**
1. Go to Events page
2. Select filters from dropdowns
3. Type in search bar
4. Results update in real-time

---

### 8.2 Registration Filters

**Available Filters:**

1. **Status**
   - All
   - Confirmed (CONFIRMED)
   - Waitlist (WAITLIST)
   - Cancelled (CANCELLED)

2. **Date Range**
   - All Dates
   - Today
   - This Week
   - This Month
   - Custom Range

3. **Search**
   - By name
   - By phone
   - By email
   - By confirmation code

**How to Use:**
1. Go to event details → Registrations tab
2. Select status filter
3. Set date range (if needed)
4. Type in search bar
5. Results update instantly

---

### 8.3 Ban Filters

**Available Filters:**

1. **Status**
   - Active (🔴)
   - Expired (⚪)
   - All

2. **Search**
   - By phone number
   - By name
   - By email

**How to Use:**
1. Go to "חסימות" page
2. Select status: "פעיל | פג תוקף | הכל"
3. Type in search bar
4. Results filter in real-time

**Use Case:**
- Find active bans quickly
- Search for specific user's ban history

---

### 8.4 Check-In Filters

**Available Filters:**

1. **Tabs**
   - All (30)
   - Checked In ✅ (24)
   - Not Yet ⏳ (6)

2. **Search**
   - By name
   - By phone
   - By confirmation code

**How to Use:**
1. On check-in page
2. Click filter tab
3. Type in search bar
4. Matching participants appear

**Use Case:**
- Find specific attendee quickly
- See who hasn't checked in yet

---

### 8.5 Table Filters

**Available Filters:**

1. **Status**
   - All
   - Available (AVAILABLE)
   - Reserved (RESERVED)
   - Inactive (INACTIVE)

2. **Capacity Range**
   - All Sizes
   - Small (1-4)
   - Medium (5-8)
   - Large (9+)

3. **Search**
   - By table number/name

**How to Use:**
1. Go to event tables view
2. Select status filter
3. Choose capacity range
4. Search by table number

---

## 9. Dashboard & Analytics

### 9.1 Dashboard Overview

**Key Metrics:**

1. **Active Events** 🎫
   - Count of OPEN events
   - Click to see list

2. **Total Registrations** 📋
   - Sum of all CONFIRMED registrations
   - Click to see drilldown

3. **Waitlist** ⏳
   - Count of WAITLIST registrations
   - Click to see details

4. **Overall Occupancy** 📊
   - Average occupancy rate across all events
   - Percentage: (Confirmed / Total Capacity) × 100

**Recent Events:**
- Last 5 events created
- Quick links to event details

---

### 9.2 Drilldown Modals

**View Detailed Breakdown:**

1. Click on any metric card
2. **Modal opens with:**
   - Complete list of items
   - Additional details
   - Actions (view/edit)
3. Scroll through full data
4. Click item to navigate

**Example - Active Events Drilldown:**
- Lists all OPEN events
- Shows: Title, Date, Occupancy, Capacity
- Click event → Navigate to details

---

### 9.3 Event Statistics

**Per-Event Stats:**

- Total registrations
- Confirmed count
- Waitlist count
- Cancelled count
- Occupancy rate %
- Checked-in count (if event ended)
- No-show count (if event ended)

**Where to Find:**
- Event details page header
- Dashboard recent events

---

## 10. Super Admin Features

### 10.1 School Management

**View All Schools:**

1. Login as SUPER_ADMIN
2. Navigate to "Super Admin" → "Schools"
3. **Schools list shows:**
   - School name
   - Slug
   - Plan (FREE/STARTER/PRO/ENTERPRISE)
   - Status (ACTIVE/PAUSED)
   - Created date
   - Admin count
   - Event count

**School Actions:**

1. **View School Details:**
   - Click school name
   - See all events, admins, usage stats

2. **Delete School:**
   - Click delete icon
   - Confirm deletion
   - ⚠️ Cascades: All events, registrations, tables, bans deleted

---

### 10.2 Admin Management (Global)

**View All Admins:**

1. Navigate to "Super Admin" → "Admins"
2. **Admins list shows:**
   - Name, Email
   - School
   - Role
   - Last login
   - Status

**Admin Actions:**

1. **View Admin:**
   - Click admin name
   - See profile, activity

2. **Delete Admin:**
   - Click delete icon
   - Confirm deletion
   - User removed from school

---

### 10.3 Platform Overview

**Global Statistics:**

- Total schools
- Total admins
- Total events
- Total registrations
- Total revenue (billing integration)

**Where to Find:**
- Super Admin dashboard

---

### 10.4 Public Template Management

**Create Public Templates:**

1. Login as SUPER_ADMIN
2. Create table configuration
3. Save as template
4. **Check "Public" checkbox**
5. Template visible to ALL schools

**Popular Templates:**
- Curated by SUPER_ADMIN
- Used by multiple schools
- Track usage count

---

## 📊 Quick Reference

### Event Lifecycle

```
Create Event → Open (Registrations) → Check-In (During Event) →
Attendance Review (After Event) → Ban No-Shows → Close Event
```

### Registration Flow

```
Public URL → Fill Form → Submit →
  ├─ Confirmed ✅ (if capacity available)
  └─ Waitlist ⏳ (if full)
```

### Ban Enforcement

```
User Registers → System Checks Ban →
  ├─ Banned ❌ → Reject (403 Forbidden)
  └─ Not Banned ✅ → Allow Registration
```

### Check-In Flow

```
Access Check-In URL → Scan QR / Manual Search →
Mark as Attended → Card Turns Green ✅
```

---

## 🔑 Keyboard Shortcuts

- `Ctrl + K` (macOS: `⌘ + K`): Quick search
- `Ctrl + /`: Toggle sidebar
- `Esc`: Close modal
- `Tab`: Navigate form fields
- `Enter`: Submit form

---

## 🆘 Support

**Need Help?**
- In-app: Click "עזרה" in sidebar
- Email: support@ticketcap.com
- Documentation: `/docs/`

---

**Last Updated:** 2026-01-09
**Version:** 1.0.0
**System:** TicketCap Multi-Tenant Event Management

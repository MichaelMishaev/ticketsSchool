# Attendance Review & Ban Management System

Complete system for tracking no-shows and managing user bans in TicketCap (Phases 6 & 7).

## Overview

This system allows admins to:
1. **Review attendance** after events and identify no-shows
2. **View user history** to see attendance patterns
3. **Ban repeat offenders** from registering for future events
4. **Manage bans** with flexible expiration rules

## Architecture

### Database Models

#### UserBan (already created in Phase 1)
```prisma
model UserBan {
  id              String   @id
  phoneNumber     String   // Primary identifier (Israeli phone)
  email           String?
  name            String?
  schoolId        String   // Multi-tenant isolation
  reason          String   // Free text reason
  bannedGamesCount Int     @default(3)  // For game-based bans
  bannedAt        DateTime
  expiresAt       DateTime?  // null = game-based
  eventsBlocked   Int      @default(0)  // Counter for game-based
  active          Boolean  @default(true)
  liftedAt        DateTime?
  liftedBy        String?
  liftedReason    String?
  createdBy       String   // Admin who created ban
}
```

### API Routes

#### 1. GET `/api/events/[id]/attendance`
**Purpose:** Get no-show list for post-event review

**Response:**
```json
{
  "event": {
    "id": "event_123",
    "title": "משחק כדורגל",
    "startAt": "2024-01-15T18:00:00Z"
  },
  "stats": {
    "total": 30,
    "checkedIn": 24,
    "noShows": 6,
    "attendanceRate": 80
  },
  "noShows": [
    {
      "id": "reg_456",
      "name": "דוד כהן",
      "phone": "0501234567",
      "spotsCount": 2,
      "confirmationCode": "ABC123"
    }
  ]
}
```

**Security:**
- Requires authentication
- Enforces multi-tenant isolation (schoolId check)
- Returns only non-cancelled registrations

#### 2. GET `/api/admin/attendance/history?phone={phone}`
**Purpose:** Get attendance history for a specific user

**Response:**
```json
{
  "phone": "0501234567",
  "stats": {
    "totalEvents": 5,
    "attendedEvents": 2,
    "noShowEvents": 3,
    "attendanceRate": 40
  },
  "recentEvents": [
    {
      "eventId": "event_123",
      "eventTitle": "משחק כדורגל",
      "eventDate": "2024-01-15T18:00:00Z",
      "attended": false
    }
  ]
}
```

**Security:**
- Requires authentication
- Only returns data for admin's school (multi-tenant isolation)
- Limited to last 10 events

#### 3. POST `/api/admin/bans`
**Purpose:** Create bans for one or more users

**Request:**
```json
{
  "users": [
    {
      "phoneNumber": "0501234567",
      "email": "user@example.com",
      "name": "דוד כהן"
    }
  ],
  "reason": "לא הגיע ל-3 משחקים רצופים",
  "bannedGamesCount": 3,  // OR expiresAt
  "expiresAt": "2024-02-15T00:00:00Z"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "bansCreated": 1,
  "bans": [...]
}
```

**Logic:**
- Updates existing active ban if found (instead of creating duplicate)
- Resets `eventsBlocked` counter when updating
- Supports both game-based and date-based bans

**Security:**
- Requires authentication
- Enforces schoolId for non-SUPER_ADMIN
- Validates required fields

#### 4. GET `/api/admin/bans?status=active&search=phone`
**Purpose:** List all bans for school with filtering

**Query Parameters:**
- `status`: 'active' | 'expired' | 'all'
- `search`: Search by phone, name, or email

**Response:**
```json
{
  "bans": [
    {
      "id": "ban_789",
      "phoneNumber": "0501234567",
      "name": "דוד כהן",
      "reason": "לא הגיע ל-3 משחקים רצופים",
      "bannedAt": "2024-01-10T10:00:00Z",
      "expiresAt": null,
      "isActive": true,
      "isDateBased": false,
      "remainingGames": 2,
      "createdByName": "מנהל ראשי"
    }
  ],
  "counts": {
    "active": 3,
    "expired": 12,
    "total": 15
  }
}
```

**Security:**
- Requires authentication
- Filters by schoolId (multi-tenant isolation)

#### 5. PATCH `/api/admin/bans/[id]/lift`
**Purpose:** Lift (remove) a ban early

**Request:**
```json
{
  "reason": "התנצל והבטיח להגיע בעתיד"
}
```

**Response:**
```json
{
  "success": true,
  "ban": {...}
}
```

**Logic:**
- Sets `active: false`
- Records `liftedAt`, `liftedBy`, `liftedReason`

**Security:**
- Requires authentication
- Verifies admin has access to ban's school

## User Interface

### 1. Attendance Review Page
**Route:** `/app/admin/events/[id]/attendance/page.tsx`

**Features:**
- **Stats Summary Box:**
  - Total registered: 30
  - Checked in: 24 (80%)
  - No-shows: 6 (20%)

- **No-Show List:**
  - Name, phone, confirmation code
  - Spots count
  - Checkbox for bulk selection
  - "Show attendance history" button (loads on-demand)

- **Attendance History Display:**
  - "הגיע ל-2 מתוך 5 משחקים"
  - Badge with color:
    - 🟢 80%+ = Green (good)
    - ⚠️ 50-80% = Amber (warning)
    - 🔴 <50% = Red (poor)

- **Sticky Bottom Bar:**
  - Shows count of selected users
  - "חסום משתמשים" button

- **Ban Modal:**
  - Shows selected users
  - Radio buttons: "מספר משחקים" | "תאריך תפוגה"
  - Input: Number (default: 3) OR date picker
  - Textarea: Free-text reason
  - Actions: [ביטול] [אישור חסימה]

**Colors:**
- Active: Purple accent (#9333ea / purple-600)
- Good attendance: #10b981 (green-500)
- Warning: #f59e0b (amber-500)
- Poor: #ef4444 (red-500)

### 2. Ban Management Page
**Route:** `/app/admin/settings/bans/page.tsx`

**Features:**
- **Search Bar:**
  - Search by phone, name, or email

- **Filter Tabs:**
  - [פעילים (3)] [הסתיימו (12)] [הכל (15)]

- **Ban Cards:**
  - Status badge: 🔴 פעיל / הסתיים
  - User info: Name, phone, email
  - Details grid:
    - תאריך חסימה: 15/01/2024 18:30
    - תאריך תפוגה: 15/02/2024 OR "2 משחקים נוספים"
    - אירועים שנחסמו: 1
    - נוצר על ידי: מנהל ראשי
  - Reason box (amber background)
  - Lifted info (green background if lifted)
  - Actions: [הסר חסימה] button

- **Lift Ban Modal:**
  - Shows user details
  - Optional reason textarea
  - Actions: [ביטול] [הסר חסימה]

**Colors:**
- Active ban: #ef4444 (red-500)
- Expired ban: #9ca3af (gray-400)
- Lifted ban: #10b981 (green-500)

## User Flows

### Flow 1: Ban Users After Event
1. Admin goes to event details page
2. Clicks "📊 ניהול נוכחות" button (purple)
3. Reviews no-show list
4. Clicks "📊 הצג היסטוריית נוכחות" for suspicious users
5. Sees poor attendance (e.g., "הגיע ל-1 מתוך 3 משחקים - 🔴 33%")
6. Checks boxes for repeat offenders
7. Clicks "חסום משתמשים" in sticky bar
8. Modal opens:
   - Shows 2 selected users
   - Selects "מספר משחקים"
   - Enters "3"
   - Types reason: "לא הגיע ל-3 משחקים רצופים"
9. Clicks "אישור חסימה"
10. Toast: "2 משתמשים נחסמו בהצלחה"

### Flow 2: View & Lift Ban
1. Admin goes to Settings page
2. Clicks "ניהול חסימות" card
3. Sees active bans (default filter)
4. Searches for specific phone number
5. Views ban details:
   - Reason: "לא הגיע ל-3 משחקים רצופים"
   - Remaining: "1 משחקים נוספים"
6. Clicks "הסר חסימה"
7. Modal opens
8. Types reason: "התנצל והבטיח להגיע בעתיד"
9. Clicks "הסר חסימה"
10. Toast: "החסימה הוסרה בהצלחה"

### Flow 3: Check Ban Status (Registration)
When a user tries to register (already implemented in Phase 2):
1. System checks for active ban by phone number
2. If banned:
   - Shows error: "נראה שאתה חסום מרישום לאירועים זמנית"
   - Displays reason: "לא הגעת ל-3 משחקים רצופים"
   - Shows expiration: "החסימה תפוג ב-15/02/2024" OR "עוד 2 משחקים"
3. If not banned:
   - Registration proceeds normally

## Integration with Check-In System

The attendance review system builds on the existing check-in infrastructure:

### Existing Check-In API (Phase 1-5)
- `GET /api/check-in/[eventId]/[token]` - Returns registrations with `checkIn` field
- `POST /api/check-in/[eventId]/[token]` - Creates CheckIn record
- CheckIn model tracks who attended

### New Attendance Review APIs (Phase 6-7)
- Use existing `checkIn` relationship to identify no-shows
- Query registrations WHERE `checkIn IS NULL` OR `checkIn.undoneAt IS NOT NULL`
- Calculate attendance rate across multiple events

## Mobile-First Design

All pages follow TicketCap patterns:
- **Touch targets:** 44px minimum height
- **Responsive:** Works on 375px width
- **Hebrew RTL:** `dir="rtl"` on all containers
- **Input styles:** `text-gray-900 bg-white` to prevent white-on-white
- **Sticky bars:** Fixed bottom for bulk actions

## Multi-Tenant Isolation

Critical security patterns:
```typescript
// API Route Pattern
const admin = await requireAdmin()

// Non-SUPER_ADMIN must have schoolId
if (admin.role !== 'SUPER_ADMIN' && !admin.schoolId) {
  return NextResponse.json(
    { error: 'Admin must have a school assigned' },
    { status: 403 }
  )
}

// Filter by schoolId
const schoolFilter = admin.role === 'SUPER_ADMIN'
  ? {}
  : { schoolId: admin.schoolId }

const bans = await prisma.userBan.findMany({
  where: {
    ...schoolFilter,
    // ... other filters
  }
})
```

## Testing Checklist

### API Tests
- [ ] GET /api/events/[id]/attendance returns correct no-shows
- [ ] GET /api/admin/attendance/history filters by school
- [ ] POST /api/admin/bans creates ban successfully
- [ ] POST /api/admin/bans updates existing ban (no duplicates)
- [ ] GET /api/admin/bans filters by status correctly
- [ ] PATCH /api/admin/bans/[id]/lift marks ban as inactive
- [ ] Multi-tenant isolation prevents cross-school access

### UI Tests
- [ ] Attendance page loads stats correctly
- [ ] Checkbox selection works
- [ ] Attendance history loads on demand
- [ ] Ban modal opens with selected users
- [ ] Ban type toggle works (games vs date)
- [ ] Ban creation succeeds
- [ ] Ban list filters work (active/expired/all)
- [ ] Search filters bans correctly
- [ ] Lift ban modal works
- [ ] Mobile layout is usable (375px)
- [ ] RTL layout is correct

### Edge Cases
- [ ] Empty no-show list shows friendly message
- [ ] User with no history shows "no data"
- [ ] Expired bans show correctly
- [ ] Game-based ban counter decrements
- [ ] Date-based ban expires automatically
- [ ] Lifting ban removes it from active list

## Future Enhancements

### Automatic Ban System (Future)
- Auto-ban after X no-shows in Y days
- Configurable thresholds per school
- Email notification to banned users

### Analytics Dashboard (Future)
- School-wide attendance trends
- Most reliable vs unreliable users
- Event attendance correlation (day/time)

### Appeals Process (Future)
- Users can appeal bans
- Admin review queue
- Automatic unban after appeal approval

## Navigation

### Access Points
1. **Event Details Page → Attendance Review:**
   - Purple button: "📊 ניהול נוכחות"

2. **Settings Page → Ban Management:**
   - Quick actions card: "ניהול חסימות"

3. **Attendance Review → Ban Management:**
   - Link in ban modal: "צפה בכל החסימות"

## Performance Considerations

### Attendance History
- Loaded on-demand (not with initial page load)
- Limited to last 10 events per user
- Cached in component state after first load

### Ban List
- Paginated for schools with many bans (future)
- Filtered server-side (not client-side)
- Search debounced to reduce API calls

### Database Indexes
Already optimized in schema:
```prisma
@@index([phoneNumber, schoolId, active])
@@index([schoolId, active])
@@index([expiresAt])
```

## Summary

The Attendance Review & Ban Management system provides admins with complete control over managing no-shows and enforcing attendance policies. The system is:

- **Mobile-first:** Works great on phones (44px touch targets, responsive)
- **Hebrew RTL:** Proper right-to-left layout
- **Multi-tenant:** School-level data isolation
- **Flexible:** Game-based OR date-based bans
- **User-friendly:** Clear workflows, helpful messages
- **Production-ready:** Error handling, validation, security

All pages follow TicketCap conventions and integrate seamlessly with existing check-in infrastructure.

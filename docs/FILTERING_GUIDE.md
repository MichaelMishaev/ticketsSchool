# 🔍 TicketCap Filtering & Search Guide

Complete guide to filtering and searching across all TicketCap features.

---

## 📋 Table of Contents

1. [Event Filtering](#1-event-filtering)
2. [Registration Filtering](#2-registration-filtering)
3. [Ban System Filtering](#3-ban-system-filtering)
4. [Check-In Filtering](#4-check-in-filtering)
5. [Table Filtering](#5-table-filtering)
6. [Advanced Search Tips](#6-advanced-search-tips)

---

## 1. Event Filtering

### Available Filters

#### **Event Type Filter**
```
Location: Events page → Top filter bar
Options:
  ✓ All Events (הכל)
  ✓ Capacity-Based (מבוסס קיבולת)
  ✓ Table-Based (מבוסס שולחנות)

Use Case:
- Find all table-based dinner events
- List only capacity-based sports events
```

#### **Event Status Filter**
```
Location: Events page → Status dropdown
Options:
  ✓ All (הכל)
  ✓ Open (פתוח) - Accepting registrations
  ✓ Paused (מושהה) - Temporarily stopped
  ✓ Closed (סגור) - Finalized

Use Case:
- See only active/open events
- Find paused events to reopen
- Archive view of closed events
```

#### **Date Range Filter**
```
Location: Events page → Date picker
Options:
  ✓ All Dates
  ✓ This Week
  ✓ This Month
  ✓ Custom Range (date picker)

Use Case:
- Upcoming events this week
- Events in specific month
- Historical date range analysis
```

#### **Search Bar**
```
Location: Events page → Top search input
Search by:
  ✓ Event title (partial match)
  ✓ Event slug
  ✓ Confirmation code (global search)

Examples:
- "כדורגל" → All soccer events
- "game-5" → Event with slug "game-5"
- "A3X7K2" → Registration with code A3X7K2 (shows event)
```

### **Example Filter Combinations**

**Find all open soccer events this month:**
```
1. Event Type: All Events
2. Status: Open (פתוח)
3. Date Range: This Month
4. Search: "כדורגל"
Result: Active soccer events in current month
```

**Find all table-based events (dinners/galas):**
```
1. Event Type: Table-Based (מבוסס שולחנות)
2. Status: All
3. Date Range: All Dates
Result: All dinner/gala events with table assignments
```

---

## 2. Registration Filtering

### Available Filters

#### **Status Filter**
```
Location: Event details → Registrations tab
Options:
  ✓ All (הכל)
  ✓ Confirmed (מאושר) ✅
  ✓ Waitlist (המתנה) ⏳
  ✓ Cancelled (בוטל) ❌

Use Case:
- View confirmed attendees only
- Check waitlist count
- See cancelled registrations
```

#### **Date Range Filter**
```
Location: Registration tab → Date filter
Options:
  ✓ All Dates
  ✓ Today
  ✓ This Week
  ✓ This Month
  ✓ Custom Range

Use Case:
- Registrations from last 24 hours
- Weekly registration trends
- Compare registration dates
```

#### **Search Bar**
```
Location: Registration tab → Search input
Search by:
  ✓ Name (שם) - Parent or child name
  ✓ Phone number (טלפון)
  ✓ Email (אימייל)
  ✓ Confirmation code (קוד אישור)

Examples:
- "יוסי" → All registrations with "יוסי" in name
- "0501234567" → Registration for phone 050-123-4567
- "user@gmail.com" → Registration by email
- "A3X7K2" → Specific confirmation code
```

### **Example Filter Combinations**

**Find all confirmed registrations from this week:**
```
1. Status: Confirmed (מאושר)
2. Date Range: This Week
Result: All confirmed registrations in last 7 days
```

**Search for specific user across status:**
```
1. Status: All (הכל)
2. Search: "0501234567" (phone)
Result: All registrations (confirmed/waitlist/cancelled) for this phone
```

**Waitlist analysis:**
```
1. Status: Waitlist (המתנה)
2. Date Range: All Dates
Result: All users currently on waitlist
Action: Manually promote to confirmed when spots open
```

---

## 3. Ban System Filtering

### Available Filters

#### **Ban Status Filter**
```
Location: Settings → Bans page → Status tabs
Options:
  ✓ Active (פעיל) 🔴
  ✓ Expired (פג תוקף) ⚪
  ✓ All (הכל)

Definitions:
- Active: Currently enforced (blocks registration)
- Expired: Ban completed or lifted
- All: Complete ban history
```

#### **Search Bar**
```
Location: Bans page → Search input
Search by:
  ✓ Phone number (טלפון) - Primary identifier
  ✓ Name (שם)
  ✓ Email (אימייל)

Examples:
- "0501234567" → Find ban for phone number
- "יוסי כהן" → Find ban by name
- "user@gmail.com" → Find ban by email
```

### **Understanding Ban Types**

#### **Game-Based Bans**
```
Display: "2 משחקים נותרים" (2 games remaining)
Logic:
- eventsBlocked < bannedGamesCount
- Counter increments after each event
- Auto-deactivates when counter reaches limit

Example:
Banned from 3 games:
  Event 1 ends → 1/3 games blocked
  Event 2 ends → 2/3 games blocked
  Event 3 ends → 3/3 games blocked → Ban expires
```

#### **Date-Based Bans**
```
Display: "פג תוקף ב-15/02/2026" (Expires on 15/02/2026)
Logic:
- expiresAt date set
- Active until date passes
- Auto-deactivates after date

Example:
Banned until 2026-02-15:
  Current date < 2026-02-15 → Active
  Current date >= 2026-02-15 → Expired
```

### **Example Filter Combinations**

**Find all currently enforced bans:**
```
1. Status: Active (פעיל)
2. Search: (empty)
Result: All users currently banned from registering
```

**Check if specific user is banned:**
```
1. Status: Active (פעיל)
2. Search: "0501234567"
Result:
  - If found: User is banned (shows reason + expiration)
  - If not found: User not banned (can register)
```

**Review ban history for user:**
```
1. Status: All (הכל)
2. Search: "0501234567"
Result: Complete ban history (active + expired + lifted)
```

**Find all game-based bans:**
```
1. Status: Active (פעיל)
2. Review results: Look for "X משחקים נותרים"
Result: Active game-based bans with remaining games
```

**Find all date-based bans expiring soon:**
```
1. Status: Active (פעיל)
2. Review results: Look for "פג תוקף ב-[date]"
3. Check dates manually
Result: Bans expiring in next week/month
```

---

## 4. Check-In Filtering

### Available Filters

#### **Status Tabs**
```
Location: Check-in page → Top tabs
Options:
  ✓ All (30) - All registrations
  ✓ Checked In ✅ (24) - Already attended
  ✓ Not Yet ⏳ (6) - Awaiting check-in

Live counts update every 10 seconds

Use Case:
- See who hasn't checked in yet
- Review attendance list
- Focus on pending check-ins
```

#### **Search Bar**
```
Location: Check-in page → Search input
Search by:
  ✓ Name (שם)
  ✓ Phone number (טלפון)
  ✓ Confirmation code (קוד)

Examples:
- "יוסי" → Find registration by name
- "0501234567" → Find by phone
- "A3X7K2" → Find by confirmation code (for QR scan)
```

### **Visual Status Indicators**

```
Card Colors:
  🟢 Green → Checked in (shows check-in time)
  🟡 Yellow → Not checked in (shows "Mark as Attended" button)
  🔴 Red → Banned user (no button, shows ban reason)
```

### **Example Filter Combinations**

**Find who hasn't checked in yet:**
```
1. Tab: Not Yet ⏳
Result: All registrations without check-in
Action: Check them in or contact them
```

**Search specific attendee:**
```
1. Tab: All
2. Search: "יוסי כהן"
Result: Registration found, shows check-in status
```

**QR Code Workflow:**
```
1. Click camera button 📷
2. Scan QR code
3. System auto-searches by confirmation code
4. Auto-marks as attended
```

---

## 5. Table Filtering

### Available Filters

#### **Status Filter**
```
Location: Event tables view → Status dropdown
Options:
  ✓ All
  ✓ Available (זמין) 🟢
  ✓ Reserved (שמור) 🔒
  ✓ Inactive (לא פעיל) ⚪

Use Case:
- Find available tables for manual assignment
- See all reserved tables
- Manage inactive/VIP tables
```

#### **Capacity Range Filter**
```
Location: Table view → Capacity filter
Options:
  ✓ All Sizes
  ✓ Small (1-4 seats)
  ✓ Medium (5-8 seats)
  ✓ Large (9+ seats)

Use Case:
- Find small tables for couples
- Large tables for families
- Mixed capacity analysis
```

#### **Search Bar**
```
Location: Table view → Search input
Search by:
  ✓ Table number/name

Examples:
- "1" → Table 1
- "VIP" → All VIP tables
- "Patio" → All patio tables
```

### **Example Filter Combinations**

**Find available medium tables:**
```
1. Status: Available (זמין)
2. Capacity: Medium (5-8)
Result: Available tables with 5-8 seats
Action: Manually assign to waitlist user
```

**See all reserved tables:**
```
1. Status: Reserved (שמור)
2. Capacity: All Sizes
Result: All tables with assigned registrations
Action: View registration details
```

**Find specific table:**
```
1. Search: "15"
Result: Table 15 (any status)
Action: Edit or view details
```

---

## 6. Advanced Search Tips

### **Global Confirmation Code Search**

**Search from any page:**
```
1. Go to Events page
2. Enter confirmation code: "A3X7K2"
3. System searches ALL events in your school
4. Returns:
   - Event name + link
   - Registration details
   - Status (confirmed/waitlist/cancelled)
   - Check-in status (if event ended)
```

**Use Cases:**
- User arrives with code but doesn't know event name
- Quick lookup for customer support
- Cross-event registration validation

---

### **Phone Number Search Best Practices**

**Israeli Phone Format:**
```
Accepted formats:
  ✓ 0501234567 (standard 10 digits)
  ✓ 050-123-4567 (with dashes)
  ✓ 050 123 4567 (with spaces)
  ✗ +972501234567 (use 0501234567 instead)

System auto-normalizes to: 0501234567
```

**Search Tips:**
- Always use 10 digits starting with 0
- No need to remove dashes/spaces (system handles it)
- Search works across registrations, bans, check-ins

---

### **Multi-Field Search Strategy**

**Finding a Specific User:**

**Step 1: Try phone number (most reliable)**
```
Search: "0501234567"
If found → Done
If not found → Try step 2
```

**Step 2: Try name (partial match)**
```
Search: "יוסי"
If multiple results → Narrow by other filters
If no results → Try step 3
```

**Step 3: Try email (if available)**
```
Search: "user@gmail.com"
If found → Done
If not found → User might not be registered
```

---

### **Date-Based Analysis**

**Compare registration patterns:**

**Week 1 vs Week 2:**
```
Filter 1:
- Date Range: [2026-01-01 to 2026-01-07]
- Status: Confirmed
- Count: 50 registrations

Filter 2:
- Date Range: [2026-01-08 to 2026-01-14]
- Status: Confirmed
- Count: 75 registrations

Insight: 50% increase in week 2
```

---

### **Combining Filters for Reports**

**Weekly Active Events Report:**
```
1. Event Type: All
2. Status: Open (פתוח)
3. Date Range: This Week
4. Export: CSV (if available)
Result: All active events happening this week
```

**No-Show Analysis:**
```
1. Go to past event → Attendance tab
2. See no-show count + percentage
3. Select no-show users
4. Create bans or send reminders
```

**Waitlist Promotion Workflow:**
```
1. Event details → Registrations tab
2. Status: Waitlist (המתנה)
3. Sort by: Registration date (first-come-first-served)
4. Select top user
5. Change status → Confirmed
6. Assign available table (if table-based)
```

---

## 🎯 Quick Reference

### Filter Shortcuts

| What You Want | Where to Go | Filters to Use |
|---------------|-------------|----------------|
| Active events this week | Events page | Status: Open, Date: This Week |
| All confirmed attendees | Event details | Status: Confirmed |
| Currently banned users | Bans page | Status: Active |
| Who hasn't checked in | Check-in page | Tab: Not Yet ⏳ |
| Available tables | Event tables | Status: Available |
| Find specific user | Any page | Search: phone/name/email |
| Waitlist users | Event details | Status: Waitlist |

### Search Syntax

| Search Type | Example | Result |
|-------------|---------|--------|
| Phone | `0501234567` | Exact match |
| Name (partial) | `יוסי` | All "יוסי" |
| Email | `user@gmail.com` | Exact match |
| Confirmation code | `A3X7K2` | Exact registration |
| Event title | `כדורגל` | All soccer events |

---

**Last Updated:** 2026-01-09
**Version:** 1.0.0

# Check-In System

Mobile-first Hebrew RTL check-in interface for event attendance tracking.

## Features

### 1. QR Code Scanner
- Full-screen camera modal with auto-detection
- Uses html5-qrcode library
- Instant check-in feedback
- Error handling for camera permissions

### 2. Live Statistics
- Real-time check-in percentage
- Auto-refreshes every 10 seconds
- Visual progress bar
- Shows checked-in / total registrations

### 3. Registration Management
- Search by name, phone, or confirmation code
- Filter tabs: All / Checked-in / Not checked-in
- Color-coded cards:
  - ✅ Green = Checked in (with timestamp)
  - ⏳ Amber = Not checked in yet
  - 🚫 Red = Banned user (shows reason)

### 4. Mobile-First Design
- Touch targets: 48px minimum (iOS accessibility)
- Cards: 72px minimum height
- RTL Hebrew layout
- 375px → Desktop responsive
- Optimistic UI updates

## URL Structure

```
/check-in/[eventId]/[token]
```

**Example:**
```
https://ticketcap.com/check-in/clx123abc/abcd1234-ef56-7890
```

## API Endpoints Used

All endpoints are public but token-protected:

- `GET /api/check-in/[eventId]/[token]` - Get registrations list
- `POST /api/check-in/[eventId]/[token]` - Check in registration
- `DELETE /api/check-in/[eventId]/[token]/[registrationId]` - Undo check-in
- `GET /api/check-in/[eventId]/[token]/stats` - Get live statistics

## Components

### CheckInStats.tsx
- Live statistics display
- Auto-refresh every 10 seconds
- Gradient background with progress bar
- Shows percentage and counts

### CheckInCard.tsx
- Individual registration card
- Color-coded status (green/amber/red)
- Ban information display
- Check-in/undo buttons
- Touch-friendly (44px+ buttons)

### QRScanner.tsx
- Full-screen camera modal
- Uses html5-qrcode library
- Auto-closes after successful scan
- Permission error handling
- Camera tips and instructions

### page.tsx
- Main check-in page
- Search and filter functionality
- Optimistic UI updates
- Toast notifications
- Real-time stats integration

## User Flow

1. Gate keeper opens check-in URL (from admin dashboard)
2. Page loads with all registrations
3. Options:
   - **QR Scan:** Click camera button → Scan QR code → Auto check-in
   - **Manual:** Search for attendee → Click "סמן נוכח" button
4. Real-time stats update automatically
5. Can undo check-ins if needed

## Mobile Optimization

- Large touch targets (48px+)
- Sticky header with QR button
- Smooth scrolling
- Optimistic UI updates
- Toast notifications
- RTL Hebrew layout
- Works on 375px width (iPhone SE)

## Accessibility

- WCAG AA compliant colors
- Touch targets ≥ 44px (iOS standard)
- Clear status indicators
- Error messages in Hebrew
- Keyboard navigation support

## Error Handling

- Camera permission denied → Clear error message
- Invalid QR code → Toast notification
- Network errors → Retry mechanism
- Already checked in → Prevent duplicates
- Banned users → Disable check-in button

## Security

- Token-based authentication (no login required)
- Token validation on every API call
- Checksum validation for QR codes
- No sensitive data exposed in URL
- Audit trail for all check-ins (undoneAt field)

## Testing Checklist

- [ ] QR scanner opens camera
- [ ] Manual check-in works
- [ ] Undo check-in works
- [ ] Search filters correctly
- [ ] Filter tabs work
- [ ] Stats update in real-time
- [ ] Works on mobile (375px)
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Camera permissions handling
- [ ] Banned users can't check in
- [ ] Toast notifications appear
- [ ] Optimistic UI updates correctly
- [ ] Network error recovery

## Future Enhancements

- Offline mode with sync
- Bulk check-in (select multiple)
- Export attendance report
- Photo capture on check-in
- Sound feedback for QR scan
- Attendance notes/comments
- Check-in history timeline
- Real-time push updates (WebSocket)

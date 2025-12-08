# UI/UX & Accessibility Test Scenarios

## 1. Mobile Responsiveness

### 1.1 Mobile Viewport - 375px Width (iPhone SE)
- **Given**: User on smallest common mobile (375px)
- **When**: User views any page
- **Then**:
  - No horizontal scroll
  - All content fits within viewport
  - Text readable without zoom
  - Touch targets minimum 44px height

### 1.2 Mobile Viewport - 428px Width (iPhone Pro Max)
- **Given**: User on larger iPhone
- **When**: User views pages
- **Then**:
  - Layout optimized for larger screen
  - No unnecessary white space
  - Content scales appropriately

### 1.3 Tablet Viewport - 768px (iPad)
- **Given**: User on iPad
- **When**: User views admin dashboard
- **Then**:
  - Responsive layout (not just scaled mobile)
  - Multi-column where appropriate
  - Touch targets adequate
  - Landscape and portrait handled

### 1.4 Desktop - 1920px Wide Monitor
- **Given**: User on large desktop monitor
- **When**: User views pages
- **Then**:
  - Content centered or max-width applied
  - Not stretched edge-to-edge
  - Readable line lengths
  - Good use of space

### 1.5 Form Inputs on Mobile
- **Given**: User filling form on mobile
- **When**: Input focused
- **Then**:
  - Input field zooms if needed
  - Viewport meta tag prevents unwanted zoom
  - Keyboard doesn't hide submit button
  - Text visible (not white on white)

### 1.6 Tables on Mobile
- **Given**: Admin viewing registration table on mobile
- **When**: Table rendered
- **Then**:
  - Horizontal scroll or card layout
  - Key columns prioritized
  - Actions accessible
  - Readable without pinch zoom

### 1.7 Navigation on Mobile
- **Given**: User on mobile viewing admin pages
- **When**: Navigation menu used
- **Then**:
  - Hamburger menu or bottom nav
  - Touch-friendly menu items
  - Current page highlighted
  - Easy to navigate

---

## 2. Hebrew RTL Layout

### 2.1 Text Alignment - Hebrew
- **Given**: Page contains Hebrew text
- **When**: Page renders
- **Then**:
  - Text aligned to right
  - dir="rtl" attribute set on HTML or containers
  - Reading flow right-to-left
  - Proper word wrapping

### 2.2 Form Labels - RTL
- **Given**: Form with Hebrew labels
- **When**: Form displayed
- **Then**:
  - Labels positioned to right of inputs
  - Proper spacing
  - Aligned correctly
  - No LTR/RTL conflicts

### 2.3 Icons and Arrows - RTL
- **Given**: UI has directional icons (arrows, chevrons)
- **When**: RTL layout active
- **Then**:
  - Icons flipped horizontally where appropriate
  - Navigation arrows point correct direction
  - Visually balanced

### 2.4 Mixed Hebrew and English
- **Given**: Text with both Hebrew and English words
- **When**: Rendered
- **Then**:
  - Hebrew portions RTL
  - English portions LTR within RTL context
  - Numbers display correctly
  - No scrambled text

### 2.5 Buttons in RTL
- **Given**: Buttons with icons and text
- **When**: RTL layout
- **Then**:
  - Icon and text order correct (icon left of text in RTL = visually on right)
  - Button padding balanced
  - Hover/active states work

### 2.6 Date and Time Display - RTL
- **Given**: Event date displayed in Hebrew interface
- **When**: Date formatted
- **Then**:
  - Hebrew month names (if used)
  - Time in 24-hour format (Israel standard)
  - Right-to-left layout
  - Clear and readable

---

## 3. Touch Targets & Mobile UX

### 3.1 Minimum Touch Target Size
- **Given**: Interactive elements (buttons, links, checkboxes)
- **When**: User on mobile device
- **Then**:
  - Minimum 44x44px touch area (iOS guideline)
  - Adequate spacing between targets (8px minimum)
  - No accidental taps

### 3.2 Form Input Touch Targets
- **Given**: Form inputs on mobile
- **When**: User taps to focus
- **Then**:
  - Input field minimum 44px height
  - Entire field clickable (not just visible area)
  - Labels also increase touch area

### 3.3 Checkbox and Radio Button Size
- **Given**: Checkboxes/radios in form
- **When**: User on mobile taps
- **Then**:
  - Visual size minimum 24x24px
  - Touch target 44x44px (with padding)
  - Easy to select without precision

### 3.4 Swipe Gestures (Future)
- **Given**: User on mobile viewing list
- **When**: User swipes left/right on item
- **Then**:
  - Quick actions revealed (e.g., delete, edit)
  - Native-like experience
  - Clear visual feedback

### 3.5 Pull-to-Refresh (Future)
- **Given**: User on mobile viewing dynamic list
- **When**: User pulls down
- **Then**:
  - List refreshes with latest data
  - Loading indicator shown
  - Smooth animation

---

## 4. Visual Feedback & Loading States

### 4.1 Button Click Feedback
- **Given**: User clicks button
- **When**: Button clicked
- **Then**:
  - Visual state change (hover, active)
  - On mobile: tap highlight
  - Disabled state during processing
  - Clear indication action received

### 4.2 Form Submission Loading
- **Given**: User submits form
- **When**: Processing
- **Then**:
  - Submit button shows spinner
  - Button text changes (e.g., "שולח...")
  - Form fields disabled
  - User knows something's happening

### 4.3 Page Load Indicators
- **Given**: User navigating to new page
- **When**: Page loading
- **Then**:
  - Loading spinner or skeleton screen
  - Progress indicator if appropriate
  - No blank white screen
  - User knows to wait

### 4.4 Data Fetching Indicators
- **Given**: Admin loading registrations list
- **When**: Data fetching from API
- **Then**:
  - Loading state shown (spinner, skeleton)
  - Previous data may remain visible with overlay
  - Clear when data arrives

### 4.5 Success Feedback
- **Given**: Operation completed successfully
- **When**: User sees result
- **Then**:
  - Success message shown (green, checkmark)
  - Auto-dismiss after few seconds or dismissible
  - Clear confirmation of action

### 4.6 Error Feedback
- **Given**: Operation fails
- **When**: Error occurs
- **Then**:
  - Error message shown (red, X icon)
  - Specific error description
  - Suggested action (retry, contact support)
  - Stays visible until dismissed

---

## 5. Form Usability

### 5.1 Input Field Labels
- **Given**: Form with inputs
- **When**: User views form
- **Then**:
  - Every input has clear label
  - Labels associated with inputs (for attribute)
  - Labels visible even when field focused
  - No placeholder-only labels

### 5.2 Required Field Indicators
- **Given**: Form with required fields
- **When**: Form displayed
- **Then**:
  - Required fields marked (asterisk or "חובה")
  - Legend/note explains marking
  - Clear distinction from optional fields

### 5.3 Placeholder Text
- **Given**: Input fields with placeholders
- **When**: User views empty field
- **Then**:
  - Placeholder shows example input
  - Placeholder not substitute for label
  - Disappears on focus
  - Sufficient contrast (WCAG 2.0 AA)

### 5.4 Error Message Display
- **Given**: User submits form with errors
- **When**: Validation fails
- **Then**:
  - Error messages near relevant fields
  - Summary of errors at top (optional)
  - Fields with errors highlighted (red border)
  - Specific error text (not generic)

### 5.5 Input Field Focus States
- **Given**: User tabs or clicks through form
- **When**: Field focused
- **Then**:
  - Clear visual focus indicator (outline)
  - Meets WCAG contrast requirements
  - Visible in all states (light/dark mode)

### 5.6 Auto-focus on Page Load (Careful)
- **Given**: User lands on form page (e.g., login)
- **When**: Page loads
- **Then**:
  - First input auto-focused (if appropriate)
  - No auto-focus if disruptive (mobile keyboard)
  - User can immediately type

### 5.7 Input Autocomplete Attributes
- **Given**: Form fields for standard data (name, email, phone)
- **When**: User starts typing
- **Then**:
  - Browser autocomplete works (autocomplete="name", "email", etc.)
  - Saves user time
  - Reduces errors

### 5.8 Keyboard Navigation Through Form
- **Given**: User using keyboard only
- **When**: User tabs through form
- **Then**:
  - Logical tab order (top to bottom, right to left for RTL)
  - All interactive elements reachable
  - No tab traps
  - Can submit with Enter key

---

## 6. Color & Contrast

### 6.1 Text Contrast - Normal Text
- **Given**: Body text on background
- **When**: User views page
- **Then**:
  - Contrast ratio ≥ 4.5:1 (WCAG AA)
  - Text readable in bright and dim lighting
  - No low-contrast gray-on-gray

### 6.2 Text Contrast - Large Text
- **Given**: Headings and large UI text
- **When**: User views page
- **Then**:
  - Contrast ratio ≥ 3:1 (WCAG AA for large text)
  - Clear and readable

### 6.3 Button and Link Contrast
- **Given**: Interactive elements
- **When**: User views page
- **Then**:
  - Text on buttons: ≥ 4.5:1 contrast
  - Links distinguishable from body text
  - Don't rely on color alone (underline links)

### 6.4 Focus Indicator Contrast
- **Given**: Element has keyboard focus
- **When**: User tabs to element
- **Then**:
  - Focus outline ≥ 3:1 contrast with background
  - Visible and clear

### 6.5 Error and Success Message Contrast
- **Given**: Success (green) or error (red) message shown
- **When**: User reads message
- **Then**:
  - Text contrast ≥ 4.5:1 even on colored background
  - Icons supplement color (not color alone)

### 6.6 Input Field Text Visibility (CRITICAL)
- **Given**: User filling form on mobile
- **When**: User types in input
- **Then**:
  - Text color: dark (e.g., text-gray-900)
  - Background: light (e.g., bg-white)
  - NOT white text on white background
  - Classes: "text-gray-900 bg-white" applied

---

## 7. Keyboard Accessibility

### 7.1 Keyboard-Only Navigation
- **Given**: User navigating site with keyboard only (no mouse)
- **When**: User presses Tab key
- **Then**:
  - All interactive elements focusable
  - Logical focus order
  - No keyboard traps
  - Skip links available (future)

### 7.2 Enter Key to Submit Forms
- **Given**: User filling form with keyboard
- **When**: User presses Enter in last field
- **Then**:
  - Form submits
  - Same as clicking submit button
  - Works consistently

### 7.3 Escape Key to Close Modals
- **Given**: Modal or dialog open
- **When**: User presses Escape key
- **Then**:
  - Modal closes
  - Focus returns to trigger element
  - Standard behavior

### 7.4 Arrow Keys in Dropdowns (Future)
- **Given**: Dropdown menu open
- **When**: User presses Up/Down arrows
- **Then**:
  - Selection moves through options
  - Enter selects option
  - Escape closes without selecting

### 7.5 Tab Traps Prevention
- **Given**: Modal dialog open
- **When**: User tabs through focusable elements
- **Then**:
  - Focus cycles within modal only
  - Can't tab out to background content
  - Escape key exits modal

---

## 8. Screen Reader Compatibility

### 8.1 Semantic HTML Structure
- **Given**: Page rendered
- **When**: Screen reader navigates
- **Then**:
  - Proper heading hierarchy (h1, h2, h3)
  - Landmarks used (nav, main, footer)
  - Lists use ul/ol/li tags
  - Buttons are <button>, links are <a>

### 8.2 Image Alt Text
- **Given**: Images on page (event images, logos)
- **When**: Screen reader encounters image
- **Then**:
  - Meaningful alt text provided
  - Decorative images: alt="" (empty)
  - No "image of" prefix needed

### 8.3 Form Labels and Descriptions
- **Given**: Form input fields
- **When**: Screen reader focuses field
- **Then**:
  - Label announced
  - If error: error message announced
  - If required: "required" announced
  - Proper associations (for/id, aria-describedby)

### 8.4 Button and Link Text
- **Given**: Interactive elements
- **When**: Screen reader encounters button/link
- **Then**:
  - Text clearly describes action
  - No "click here" generic text
  - Icon-only buttons have aria-label

### 8.5 Status Messages (ARIA Live Regions)
- **Given**: Dynamic content updates (success/error messages)
- **When**: Message appears
- **Then**:
  - Announced by screen reader (aria-live="polite" or "assertive")
  - User informed of change without losing place

### 8.6 Loading States Announced
- **Given**: Content loading
- **When**: Loading starts
- **Then**:
  - aria-busy="true" on container
  - Loading message in aria-live region
  - User knows to wait

### 8.7 Table Accessibility
- **Given**: Data table (registrations list)
- **When**: Screen reader navigates table
- **Then**:
  - Proper <table>, <th>, <td> structure
  - Headers associated with data (scope attribute)
  - Caption or summary provided

---

## 9. Visual Design & Consistency

### 9.1 Consistent Button Styles
- **Given**: Buttons throughout app
- **When**: User views pages
- **Then**:
  - Primary buttons: consistent color and style
  - Secondary buttons: distinct from primary
  - Destructive actions: red or warning color
  - Disabled: clear visual difference

### 9.2 Consistent Color Palette
- **Given**: UI elements across app
- **When**: User navigates
- **Then**:
  - Colors used consistently (blue = primary, red = error, green = success)
  - School branding colors used where appropriate
  - No random color variations

### 9.3 Typography Consistency
- **Given**: Text throughout app
- **When**: User reads content
- **Then**:
  - Consistent font family
  - Heading sizes hierarchical (h1 > h2 > h3)
  - Line height readable (1.5-1.75 for body)
  - Font weights used meaningfully

### 9.4 Spacing and Layout
- **Given**: UI components
- **When**: User views page
- **Then**:
  - Consistent padding/margin (e.g., 4px, 8px, 16px, 24px)
  - Visual hierarchy clear
  - Grouped elements close together
  - Separated sections distinct

### 9.5 Iconography
- **Given**: Icons used throughout
- **When**: User sees icons
- **Then**:
  - Consistent icon set (same style)
  - Icons meaningful (universally recognized)
  - Supplemented with text labels
  - Size consistent (16px, 20px, 24px)

---

## 10. Animations & Transitions

### 10.1 Smooth Transitions
- **Given**: UI state changes (hover, open menu, show modal)
- **When**: Transition occurs
- **Then**:
  - Smooth CSS transition (e.g., 150-300ms)
  - Not jarring or abrupt
  - Improves UX, not distracting

### 10.2 Reduced Motion Preference
- **Given**: User has "prefers-reduced-motion" enabled
- **When**: Page loads
- **Then**:
  - Animations disabled or minimized
  - Transitions instant or very short
  - Respects user preference (accessibility)

### 10.3 Loading Animations
- **Given**: Content loading
- **When**: Spinner or skeleton shown
- **Then**:
  - Animation smooth and not too fast
  - Not epilepsy-triggering (no rapid flashing)
  - Subtle and professional

### 10.4 Page Transitions (Future)
- **Given**: User navigating between pages
- **When**: Page changes
- **Then**:
  - Smooth fade or slide transition
  - Loading state shown if delay
  - Feels like single-page app

---

## 11. Error Prevention & Recovery

### 11.1 Confirmation for Destructive Actions
- **Given**: User clicks "Delete event" button
- **When**: Button clicked
- **Then**:
  - Confirmation modal appears
  - Clear warning message
  - Requires explicit confirmation (not just OK)
  - Can cancel easily

### 11.2 Unsaved Changes Warning
- **Given**: User editing form and navigates away
- **When**: User tries to leave page
- **Then**:
  - Browser confirms: "You have unsaved changes"
  - User can cancel and stay
  - Or: Auto-save draft (future)

### 11.3 Clear Error Messages
- **Given**: User makes mistake
- **When**: Error shown
- **Then**:
  - Error text specific and actionable
  - Example: "Email required" not "Error: field empty"
  - Hebrew language
  - Friendly tone

### 11.4 Undo Actions (Future)
- **Given**: User performs reversible action (e.g., cancel registration)
- **When**: Action completes
- **Then**:
  - Success message with "Undo" button
  - Time window to undo (e.g., 5 seconds)
  - Easy to recover from mistakes

---

## 12. Performance Perception

### 12.1 Optimistic UI Updates
- **Given**: User performs action (e.g., cancel registration)
- **When**: Action triggered
- **Then**:
  - UI updates immediately (optimistic)
  - If server fails, revert with error
  - Feels instant and responsive

### 12.2 Skeleton Screens
- **Given**: Content loading (e.g., event list)
- **When**: Page loads
- **Then**:
  - Skeleton placeholder shown
  - Approximate layout of content
  - Better UX than blank page or spinner

### 12.3 Progressive Image Loading
- **Given**: Event page with large image
- **When**: Image loads
- **Then**:
  - Low-quality placeholder first (LQIP)
  - Then full-quality image fades in
  - Or: Lazy load images below fold

### 12.4 Instant Search Feedback
- **Given**: User typing in search box
- **When**: User types each character
- **Then**:
  - Results update immediately (debounced)
  - Loading indicator if fetching
  - Fast and responsive

---

## 13. Empty States

### 13.1 No Events Created Yet
- **Given**: New school with no events
- **When**: Admin views events dashboard
- **Then**:
  - Friendly empty state message
  - Call-to-action: "Create your first event"
  - Illustration or icon (optional)
  - Not just blank page

### 13.2 No Registrations Yet
- **Given**: Event with 0 registrations
- **When**: Admin views registrations
- **Then**:
  - Empty state message: "No registrations yet"
  - Suggestion: "Share event link to get registrations"
  - Public URL prominently shown

### 13.3 Search Results Empty
- **Given**: User searches registrations
- **When**: No matches found
- **Then**:
  - "No results found for '[query]'"
  - Suggestion: Try different search term
  - Clear filters button

### 13.4 Waitlist Empty
- **Given**: Event has no waitlist registrations
- **When**: Admin views waitlist tab
- **Then**:
  - "No one on waitlist"
  - Positive message (not negative)

---

## 14. Mobile Keyboard Handling

### 14.1 Email Input Keyboard
- **Given**: User focuses email field on mobile
- **When**: Keyboard appears
- **Then**:
  - Email keyboard shown (with @)
  - input type="email"
  - Easier to type email

### 14.2 Phone Input Keyboard
- **Given**: User focuses phone field on mobile
- **When**: Keyboard appears
- **Then**:
  - Numeric keyboard shown
  - input type="tel"
  - Easier to enter phone number

### 14.3 Number Input Keyboard
- **Given**: User focuses number field (age, spots)
- **When**: Keyboard appears
- **Then**:
  - Numeric keyboard
  - input type="number" or inputmode="numeric"

### 14.4 Keyboard Doesn't Hide Submit Button
- **Given**: User filling form on mobile
- **When**: Keyboard appears
- **Then**:
  - Submit button still visible or scrollable
  - User can complete form
  - Viewport adjusted appropriately

---

## 15. Internationalization & Locale

### 15.1 Date Format Localization
- **Given**: Date displayed
- **When**: User in Israel
- **Then**:
  - Date format: DD/MM/YYYY (Israel standard)
  - Or: Hebrew date names
  - Consistent across app

### 15.2 Number Format Localization
- **Given**: Numbers displayed (capacity, spots)
- **When**: Formatted for display
- **Then**:
  - Thousands separator appropriate (e.g., 1,000 or 1.000)
  - Decimal separator appropriate
  - Consistent with locale

### 15.3 Currency Display (Future)
- **Given**: Prices shown (paid events)
- **When**: User views price
- **Then**:
  - Currency symbol: ₪ (shekel)
  - Format: ₪50 or 50₪
  - Consistent placement

### 15.4 Time Format - 24-hour
- **Given**: Event time shown
- **When**: Formatted
- **Then**:
  - 24-hour format (Israel standard: 14:30 not 2:30 PM)
  - Or: Clearly marked AM/PM if 12-hour

---

## Test Coverage Priority

**Critical (P0):**
- 1.1, 1.5, 2.1-2.4, 3.1-3.3, 4.1-4.6, 5.1-5.5, 6.1, 6.6, 7.1-7.2

**High (P1):**
- 1.2-1.4, 1.6-1.7, 2.5-2.6, 3.4, 5.6-5.8, 6.2-6.5, 7.3-7.5, 8.1-8.4, 9.1-9.5, 11.1-11.3, 14.1-14.4

**Medium (P2):**
- 8.5-8.7, 10.1-10.3, 11.4, 12.1-12.4, 13.1-13.4, 15.1-15.4

**Low (P3):**
- 10.4, 12.5

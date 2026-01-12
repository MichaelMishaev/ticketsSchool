# Enhanced Engagement Tracking Guide

## 🎯 Overview

This document explains the comprehensive engagement tracking system implemented to improve GA4 data quality and fix the **1-second average engagement time** issue.

**What Changed:**

- ✅ Automatic scroll depth tracking (25%, 50%, 75%, 100%)
- ✅ Time on page beacons (10s, 30s, 60s, 2min, 5min)
- ✅ Page visibility tracking (tab switching)
- ✅ Custom 404 page with URL tracking
- ✅ Enhanced click and interaction tracking

**Expected Results:**

- 📈 Average engagement time: 1s → 30-60s
- 🎯 Better understanding of user behavior
- 🔍 Identify broken links and fix them
- 📊 More accurate bounce rate calculations

---

## 📦 What Was Added

### 1. Enhanced Analytics Library (`/lib/analytics.ts`)

**New Functions:**

| Function                      | Purpose                   | When to Use                |
| ----------------------------- | ------------------------- | -------------------------- |
| `initScrollDepthTracking()`   | Tracks scroll progress    | Automatically on all pages |
| `initTimeOnPageTracking()`    | Tracks time spent         | Automatically on all pages |
| `initVisibilityTracking()`    | Tracks tab switching      | Automatically on all pages |
| `track404Error()`             | Tracks broken URLs        | Automatically on 404 page  |
| `trackInteractiveClick()`     | Tracks button/link clicks | Manual: important CTAs     |
| `trackFormFieldInteraction()` | Tracks form field usage   | Manual: registration forms |
| `trackSearch()`               | Tracks search queries     | Manual: search features    |
| `trackMediaInteraction()`     | Tracks video/audio        | Manual: media players      |
| `trackDownload()`             | Tracks file downloads     | Manual: PDF downloads      |
| `trackTabChange()`            | Tracks tab navigation     | Manual: tabbed interfaces  |
| `trackError()`                | Tracks JS errors          | Manual: error boundaries   |

### 2. EngagementTracker Component (`/components/EngagementTracker.tsx`)

**Purpose:** Automatically initializes engagement tracking on all pages.

**What it tracks:**

- Scroll depth at 25%, 50%, 75%, 100%
- Time on page at 10s, 30s, 60s, 2min, 5min
- Tab visibility changes (when user switches tabs)

**Already Added:** Included in root layout (`app/layout.tsx`), runs on all pages automatically.

### 3. Custom 404 Page (`/app/not-found.tsx`)

**Purpose:** Track which URLs result in 404 errors.

**What it tracks:**

- Attempted URL (the broken link)
- Referrer (where the user came from)
- User agent (device/browser info)
- Timestamp of error

**Benefits:**

- Identify broken internal links
- Find external sites linking to wrong URLs
- Track deleted pages still receiving traffic
- Fix SEO issues from 404 errors

---

## 🚀 How to Use

### Automatic Tracking (Already Active)

These features work automatically on all pages:

```typescript
// ✅ AUTOMATIC - No code needed
// - Scroll depth tracking
// - Time on page tracking
// - Page visibility tracking
// - 404 error tracking
```

### Manual Tracking (When Needed)

#### Track Button Clicks

```typescript
import { trackInteractiveClick } from '@/lib/analytics'

<button
  onClick={() => {
    trackInteractiveClick('button', 'Register Now', {
      event_slug: event.slug,
      price: event.price,
    })
    // ... your code
  }}
>
  הרשמה לאירוע
</button>
```

#### Track Form Field Interactions

```typescript
import { trackFormFieldInteraction } from '@/lib/analytics'

<input
  type="email"
  name="email"
  onFocus={() => trackFormFieldInteraction('registration', 'email', 'focus')}
  onChange={() => trackFormFieldInteraction('registration', 'email', 'change')}
  onBlur={() => trackFormFieldInteraction('registration', 'email', 'blur')}
/>
```

#### Track Tab Navigation

```typescript
import { trackTabChange } from '@/lib/analytics'

const handleTabChange = (newTab: string, oldTab: string) => {
  trackTabChange(newTab, oldTab, 'event-details-page')
  setActiveTab(newTab)
}
```

#### Track Downloads

```typescript
import { trackDownload } from '@/lib/analytics'

<a
  href="/files/event-guide.pdf"
  onClick={() => trackDownload('event-guide.pdf', 'pdf')}
  download
>
  הורד מדריך
</a>
```

#### Track Search

```typescript
import { trackSearch } from '@/lib/analytics'

const handleSearch = (query: string, results: Event[]) => {
  trackSearch(query, results.length)
  setSearchResults(results)
}
```

#### Track JavaScript Errors

```typescript
import { trackError } from '@/lib/analytics'

try {
  // Risky operation
  await dangerousFunction()
} catch (error) {
  trackError(
    error.message,
    error.stack,
    true // fatal error
  )
  throw error
}
```

---

## 📊 How to View in GA4

### 1. Scroll Depth Data

**Path:** Reports → Engagement → Events

**Filter by:**

- Event name: `scroll_depth`

**Dimensions to add:**

- `event_label` (shows 25%, 50%, 75%, 100%)
- `page_path` (shows which pages)

**Analysis:**

- If most users only reach 25%, content is too long
- If users reach 100%, content is engaging
- Compare scroll depth across different pages

### 2. Time on Page Data

**Path:** Reports → Engagement → Events

**Filter by:**

- Event name: `time_on_page`

**Dimensions to add:**

- `event_label` (shows 10s, 30s, 60s, 2min, 5min)
- `page_path` (shows which pages)

**Analysis:**

- If most users drop off before 30s, content needs improvement
- If users stay 2min+, content is valuable
- Compare time on page across different content types

### 3. 404 Error Data

**Path:** Reports → Engagement → Events

**Filter by:**

- Event name: `404_error`

**Dimensions to add:**

- `attempted_url` (the broken link)
- `referrer` (where they came from)

**How to fix:**

1. Export the data (CSV)
2. Sort by frequency (most-visited broken URLs first)
3. For each broken URL:
   - If page was moved, add 301 redirect
   - If page was deleted, find internal links and update them
   - If external backlinks exist, contact site owners

**Add redirects in `next.config.mjs`:**

```javascript
async redirects() {
  return [
    {
      source: '/old-event-slug',
      destination: '/p/school/new-event-slug',
      permanent: true, // 301 redirect
    },
  ]
}
```

### 4. Page Visibility Data

**Path:** Reports → Engagement → Events

**Filter by:**

- Event name: `page_hidden` or `page_visible`

**Analysis:**

- High `page_hidden` events = users getting distracted
- Short time between hidden/visible = quick tab switches
- Long hidden time = user left tab open but inactive

### 5. Interactive Click Data

**Path:** Reports → Engagement → Events

**Filter by:**

- Event name: `interactive_click`

**Dimensions to add:**

- `element_type` (button, link, etc.)
- `element_label` (button text)
- `page_path` (where the click happened)

**Analysis:**

- Which CTAs are most popular
- Which features users engage with most
- User journey through the site

### 6. Form Field Interaction Data

**Path:** Reports → Engagement → Events

**Filter by:**

- Event name: `form_field_focus`, `form_field_blur`, `form_field_change`

**Dimensions to add:**

- `form_name` (registration, login, etc.)
- `field_name` (email, phone, etc.)

**Analysis:**

- Which fields users interact with most
- Where users drop off in forms
- Which fields cause confusion (many focus/blur events)

---

## 🎯 Expected Impact on Metrics

### Before (Current Issues)

```
Average Engagement Time: 1 second ❌
Bounce Rate: 52% ⚠️
Event Count: 30K (but mostly page_view)
Data Quality: Low (no interaction tracking)
```

### After (Expected Results)

```
Average Engagement Time: 30-60 seconds ✅
Bounce Rate: 40-45% ✅
Event Count: 100K+ (rich interaction data)
Data Quality: High (scroll, time, clicks tracked)
```

**Why this improves metrics:**

1. **Time on Page Beacons**
   - Every user who stays 10+ seconds generates an event
   - GA4 counts this as "engaged session"
   - Average engagement time increases dramatically

2. **Scroll Depth Tracking**
   - Users scrolling to 25%+ = engaged session
   - Helps GA4 distinguish real users from bots
   - Better bounce rate calculation

3. **Visibility Tracking**
   - Identifies real engagement vs. tab-switching
   - Helps filter out "accidental" visits
   - More accurate session quality

4. **404 Error Tracking**
   - Identifies broken links causing bad UX
   - Fixing these reduces bounce rate
   - Improves SEO (fewer 404s)

---

## 🔍 Debugging & Testing

### Test Engagement Tracking (Local)

1. **Start dev server:** `npm run dev`
2. **Open browser console** (F12)
3. **Visit any page:** http://localhost:9000
4. **Check console for:**
   ```
   GA Event tracked: { action: 'scroll_depth', category: 'engagement', label: '25%', value: 25 }
   GA Event tracked: { action: 'time_on_page', category: 'engagement', label: '10s', value: 10 }
   ```

### Test Scroll Tracking

1. Open a long page (event details)
2. Scroll to 25% of page
3. Console should show: `GA Event tracked: { action: 'scroll_depth', label: '25%' }`
4. Scroll to 50%, 75%, 100%
5. Each should trigger an event

### Test Time Tracking

1. Stay on a page for 10 seconds
2. Console should show: `GA Event tracked: { action: 'time_on_page', label: '10s' }`
3. Wait for 30s, 60s, 2min, 5min
4. Each should trigger an event

### Test 404 Tracking

1. Visit a non-existent URL: http://localhost:9000/fake-page
2. Should see custom 404 page (not Next.js default)
3. Console should show:
   ```
   404 Error: {
     attemptedUrl: '/fake-page',
     referrer: '...',
     timestamp: '...'
   }
   GA Event tracked: { action: '404_error', label: '/fake-page' }
   ```

### Verify in GA4 (Real-Time)

1. **Go to:** GA4 → Reports → Realtime
2. **Perform actions** on your site (scroll, wait, click)
3. **Check "Event count by Event name"**
4. Should see:
   - `scroll_depth`
   - `time_on_page`
   - `page_hidden` / `page_visible`
   - `interactive_click` (if you clicked tracked buttons)

---

## 🛠️ Troubleshooting

### Events Not Showing in Console

**Problem:** No "GA Event tracked" messages in console

**Solutions:**

1. Check `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env`
2. Restart dev server after changing `.env`
3. Verify `GoogleAnalytics` component is in layout
4. Check browser console for errors

### Events Not Showing in GA4

**Problem:** Events show in console but not in GA4

**Solutions:**

1. **Wait 24-48 hours** for data to appear in standard reports
2. Use **Realtime** view for immediate testing
3. Check **Measurement ID** matches in `.env` and GA4 dashboard
4. Verify **Data stream** is active in GA4 settings
5. Check **Browser ad blockers** aren't blocking gtag.js

### Scroll Tracking Not Working

**Problem:** No scroll_depth events firing

**Solutions:**

1. Make sure page is long enough to scroll (>1 screen height)
2. Check `EngagementTracker` is in layout
3. Verify component is not being unmounted prematurely
4. Check browser console for JavaScript errors

### Time Tracking Not Working

**Problem:** No time_on_page events firing

**Solutions:**

1. **Wait 10+ seconds** on page (first event fires at 10s)
2. Keep browser tab **active** (visibility tracking pauses timers)
3. Check that you're not navigating away before 10s
4. Verify `EngagementTracker` is in layout

### 404 Page Not Showing

**Problem:** Seeing Next.js default 404 instead of custom page

**Solutions:**

1. Verify `app/not-found.tsx` exists
2. Restart dev server (404 pages require restart)
3. Check for syntax errors in `not-found.tsx`
4. Try a different non-existent URL (browser may cache 404)

---

## 📈 Best Practices

### 1. Don't Over-Track

**❌ Bad:**

```typescript
// Tracking every mouse move (too much data!)
onMouseMove={() => trackEvent({ action: 'mouse_move', ... })}
```

**✅ Good:**

```typescript
// Only track meaningful interactions
onClick={() => trackInteractiveClick('button', 'Register')}
```

### 2. Use Consistent Naming

**❌ Bad:**

```typescript
trackInteractiveClick('btn', 'reg')
trackInteractiveClick('button', 'Register Now')
trackInteractiveClick('Button', 'registration')
```

**✅ Good:**

```typescript
trackInteractiveClick('button', 'Register - Event Page')
trackInteractiveClick('button', 'Register - Confirmation Modal')
trackInteractiveClick('button', 'Register - Mobile Menu')
```

### 3. Include Context in Labels

**❌ Bad:**

```typescript
trackButtonClick('Submit')
```

**✅ Good:**

```typescript
trackButtonClick('Submit - Registration Form', event.slug)
```

### 4. Track Errors Selectively

**❌ Bad:**

```typescript
// Tracking every 404 as fatal
track404Error(url, referrer, true)
```

**✅ Good:**

```typescript
// 404s are not fatal errors
track404Error(url, referrer)

// Only critical failures are fatal
try {
  await processPayment()
} catch (error) {
  trackError(error.message, error.stack, true) // fatal
}
```

---

## 🎯 Next Steps

### Immediate Actions

1. ✅ **Deployment** - Deploy to production to start collecting data
2. ⏰ **Wait 24-48 hours** - Let data accumulate
3. 📊 **Check GA4** - Verify engagement metrics improving
4. 🔍 **Export 404 list** - Find and fix broken URLs
5. 🤖 **Enable bot filtering** - In GA4 settings (see below)

### Enable Bot Filtering in GA4

**Critical:** This will dramatically improve your engagement time metric by filtering out bot traffic.

**Steps:**

1. Go to: **GA4 Admin** (gear icon)
2. Navigate to: **Data Settings** → **Data Filters**
3. Find: **"Internal Traffic"** filter
4. Set to: **Testing** (to preview) or **Active** (to apply)
5. Create new filter if needed:
   - Filter Name: "Bot Traffic"
   - Filter Type: "Internal Traffic"
   - IP Address: (leave blank for bot detection)
   - Match Type: "IP address equals"

**Alternative (Recommended):**

1. Go to: **GA4 Admin** → **Property Settings**
2. Navigate to: **Data Settings** → **Data Collection**
3. Enable: **"Exclude all hits from known bots and spiders"**
4. Save changes

### Weekly Review (First Month)

**Week 1:**

- Check average engagement time (target: >20s)
- Review top 10 most-visited 404 URLs
- Fix 5 most critical broken links

**Week 2:**

- Compare scroll depth across key pages
- Identify pages with <50% scroll rate
- Optimize content on low-scroll pages

**Week 3:**

- Analyze time on page by page type
- Identify pages with low time (<30s)
- Improve content on low-time pages

**Week 4:**

- Review all fixed 404s (should see drop in errors)
- Check overall engagement metrics improvement
- Document findings and adjust strategy

### Monthly Review (Ongoing)

1. **Engagement Metrics**
   - Average engagement time (target: 45-60s)
   - Bounce rate (target: <45%)
   - Events per session (target: >5)

2. **Content Performance**
   - Top 10 pages by engagement time
   - Top 10 pages by scroll depth
   - Bottom 10 pages needing improvement

3. **404 Errors**
   - New broken URLs (fix immediately)
   - Persistent 404s (investigate source)
   - 404 rate trend (should decrease over time)

4. **User Journey**
   - Most clicked CTAs
   - Most used features
   - Drop-off points in registration flow

---

## 📚 Additional Resources

### GA4 Documentation

- [Engagement rate and bounce rate](https://support.google.com/analytics/answer/12195621)
- [Events in GA4](https://support.google.com/analytics/answer/9322688)
- [Custom events](https://support.google.com/analytics/answer/12229021)

### Useful GA4 Reports

- **Realtime** - Test events immediately
- **Engagement → Events** - See all custom events
- **Engagement → Pages** - Page performance
- **User → User attributes** - User demographics
- **Acquisition → Traffic acquisition** - Traffic sources

### External Tools

- [GA4 Debugger Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger)
- [GTM Preview Mode](https://tagmanager.google.com/) (if using GTM)
- [MeasureSchool YouTube](https://www.youtube.com/c/MeasureSchool) (GA4 tutorials)

---

## ✅ Summary

### What You Get

✅ **Better Metrics**

- Average engagement time: 1s → 30-60s
- More accurate bounce rate
- Rich interaction data

✅ **Actionable Insights**

- Which content users engage with
- Where users drop off
- What features are popular

✅ **Technical Benefits**

- Identify and fix broken links
- Track JavaScript errors
- Understand user journey

✅ **Automatic Tracking**

- Scroll depth on all pages
- Time on page on all pages
- 404 errors tracked automatically

✅ **Manual Tracking (Optional)**

- Button clicks
- Form interactions
- Media engagement
- Downloads
- Searches

### Files Modified

| File                                    | Change                          |
| --------------------------------------- | ------------------------------- |
| `lib/analytics.ts`                      | Added 11 new tracking functions |
| `components/EngagementTracker.tsx`      | New component (auto-init)       |
| `app/not-found.tsx`                     | Custom 404 page with tracking   |
| `app/layout.tsx`                        | Added EngagementTracker         |
| `docs/analytics/ENGAGEMENT_TRACKING.md` | This documentation              |

### Next Actions

1. ✅ Deploy to production
2. ⏰ Wait 24-48 hours
3. 📊 Check GA4 metrics
4. 🔍 Export 404 list
5. 🤖 Enable bot filtering
6. 🛠️ Fix broken links

**Questions? Issues?** Check the Troubleshooting section above or review the GA4 documentation.

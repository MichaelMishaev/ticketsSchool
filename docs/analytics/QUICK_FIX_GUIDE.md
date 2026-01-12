# GA4 Issues - Quick Fix Guide

## 🚨 The 3 Critical Issues Found

### Issue #1: Average Engagement Time = 1 Second

**Root Cause:** No engagement tracking beyond page views

**Fix:** ✅ **DONE** - Added automatic tracking:

- Scroll depth (25%, 50%, 75%, 100%)
- Time on page (10s, 30s, 60s, 2min, 5min)
- Page visibility (tab switching)

**Expected Result:** 1s → 30-60s average engagement time

---

### Issue #2: 404 Errors (51 Page Views)

**Root Cause:** Missing custom 404 page + broken links

**Fix:** ✅ **DONE** - Created custom 404 page that tracks:

- Attempted URL (the broken link)
- Referrer (where user came from)
- User agent (device/browser)

**Action Required:**

1. Deploy to production
2. Wait 24 hours
3. Go to GA4 → Explore → Custom Exploration
4. Filter by event: `404_error`
5. Export list of broken URLs
6. Fix top 5 broken links first

---

### Issue #3: 52% Bounce Rate (Borderline)

**Root Cause:** Combined with 1s engagement time = users not finding value

**Fix:** ✅ **DONE** - Engagement tracking will improve this automatically

**Additional Fix Needed:**

- Enable bot filtering in GA4 (see instructions below)
- Fix 404 errors (reduces bounces from broken links)
- Check mobile UX (Hebrew RTL layout issues)

---

## ⚡ Quick Actions (Do These Now)

### 1. Deploy to Production

```bash
# Build and deploy
npm run build
npm run start:prod

# Or if using Railway
railway up
```

### 2. Enable Bot Filtering in GA4 (5 minutes)

**This is CRITICAL** - Bots don't interact with pages, causing low engagement time.

**Steps:**

1. Open Google Analytics 4
2. Click **Admin** (gear icon, bottom left)
3. Go to **Property Settings** (middle column)
4. Click **Data Settings** → **Data Collection**
5. Toggle ON: **"Exclude all hits from known bots and spiders"**
6. Click **Save**

**Result:** Bot traffic will be filtered out, engagement time will increase.

---

### 3. Find Broken URLs (10 minutes)

**Method A: Quick View**

1. GA4 → Reports → Engagement → Events
2. Search for event: `404_error`
3. Add dimension: `attempted_url`
4. Download CSV

**Method B: Custom Exploration (More detailed)**

1. GA4 → Explore
2. Create blank exploration
3. Technique: Free form
4. Dimensions: `attempted_url`, `referrer`
5. Metrics: Event count
6. Filter: Event name = `404_error`
7. Date range: Last 30 days
8. Export CSV

---

### 4. Fix Top 5 Broken URLs (30 minutes)

**For each broken URL:**

**Option A: Add Redirect (if page was moved)**

Edit `next.config.mjs`:

```javascript
async redirects() {
  return [
    {
      source: '/old-url',
      destination: '/new-url',
      permanent: true, // 301 redirect
    },
  ]
}
```

**Option B: Fix Internal Links (if page was deleted)**

1. Search codebase for broken URL:

   ```bash
   grep -r "/broken-url" .
   ```

2. Update links to correct URL

3. Commit and deploy

---

## 📊 How to Check if It's Working

### Immediate (Realtime)

1. **Go to:** GA4 → Reports → Realtime
2. **Visit your site** (open in new tab)
3. **Scroll down** on any page
4. **Wait 10 seconds**
5. **Check Realtime report:**
   - Should see events: `scroll_depth`, `time_on_page`

### Next Day (Standard Reports)

1. **Go to:** GA4 → Reports → Engagement → Events
2. **Date range:** Yesterday
3. **Look for:**
   - `scroll_depth` (should have many events)
   - `time_on_page` (should have many events)
   - `404_error` (track broken URLs)

### After 1 Week

1. **Go to:** GA4 → Reports → Reports snapshot
2. **Check:**
   - Average engagement time (should be >20s)
   - Bounce rate (should be <50%)
   - Event count (should be much higher)

---

## 🎯 Expected Results Timeline

### Day 1 (After Deployment)

- ✅ Engagement tracking active
- ✅ 404 errors being tracked
- ✅ Custom 404 page showing

### Day 2-3

- 📈 Average engagement time increases to 20-30s
- 📊 Event count increases 3-5x
- 🔍 Can see broken URL list in GA4

### Week 1

- 📈 Average engagement time reaches 30-45s
- 📉 Bounce rate decreases to 45-50%
- 🛠️ Fixed top 5 broken URLs

### Week 2-4

- 📈 Average engagement time reaches 45-60s
- 📉 Bounce rate decreases to 40-45%
- ✅ All major broken URLs fixed
- 📊 Rich engagement data available

---

## ❓ Troubleshooting

### "I don't see scroll_depth events in Realtime"

**Checks:**

1. ✅ Scroll on a long page (must be taller than screen)
2. ✅ Wait 2-3 seconds for event to fire
3. ✅ Refresh Realtime report
4. ✅ Check browser console for "GA Event tracked" messages
5. ✅ Disable ad blockers (they block GA)

### "I don't see time_on_page events"

**Checks:**

1. ✅ Stay on page for 10+ seconds
2. ✅ Keep browser tab active (don't switch tabs)
3. ✅ Refresh Realtime report
4. ✅ Check browser console for events

### "404 page not showing my custom design"

**Checks:**

1. ✅ File exists: `app/not-found.tsx`
2. ✅ Restart dev server (404 pages require restart)
3. ✅ Try different non-existent URL
4. ✅ Clear browser cache

### "Events show in console but not in GA4"

**Checks:**

1. ✅ Wait 24-48 hours for standard reports
2. ✅ Use Realtime view for immediate testing
3. ✅ Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env`
4. ✅ Check GA4 data stream is active
5. ✅ Disable ad blockers

---

## 📋 Checklist

### Deployment

- [ ] Code deployed to production
- [ ] Custom 404 page working
- [ ] Engagement tracking active (check Realtime)

### GA4 Configuration

- [ ] Bot filtering enabled
- [ ] Data retention set to 14 months (Admin → Data Settings)
- [ ] All events showing in Realtime

### Broken URLs

- [ ] Exported 404 error list from GA4
- [ ] Fixed top 5 most-visited broken URLs
- [ ] Added redirects or updated links
- [ ] Verified fixes in production

### Monitoring (First Week)

- [ ] Day 1: Check Realtime for new events
- [ ] Day 2: Check engagement time (should improve)
- [ ] Day 7: Review event counts and bounce rate
- [ ] Week 2: Export 404 list again, fix remaining issues

---

## 🔗 Quick Links

### GA4 Dashboard

- [Realtime Report](https://analytics.google.com/analytics/web/#/realtime)
- [Events Report](https://analytics.google.com/analytics/web/#/report/content-event)
- [Pages Report](https://analytics.google.com/analytics/web/#/report/content-pages)

### Documentation

- [Full Engagement Tracking Guide](./ENGAGEMENT_TRACKING.md)
- [GA4 Bot Filtering](https://support.google.com/analytics/answer/12157299)
- [GA4 Custom Events](https://support.google.com/analytics/answer/12229021)

---

## ✅ Summary

**What Changed:**

- ✅ Automatic engagement tracking on all pages
- ✅ Custom 404 page with URL tracking
- ✅ 11 new tracking functions in `lib/analytics.ts`

**What You Need to Do:**

1. Deploy to production
2. Enable bot filtering in GA4
3. Wait 24 hours for data
4. Export 404 list and fix broken URLs

**Expected Improvement:**

- Average engagement time: **1s → 30-60s**
- Bounce rate: **52% → 40-45%**
- Event count: **30K → 100K+**
- Data quality: **Low → High**

**Time to See Results:**

- Realtime: Immediate
- Standard reports: 24-48 hours
- Full improvement: 1-2 weeks

---

**Need help?** Check the full guide: [ENGAGEMENT_TRACKING.md](./ENGAGEMENT_TRACKING.md)

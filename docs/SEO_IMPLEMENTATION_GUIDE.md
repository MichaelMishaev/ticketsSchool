# SEO Implementation Guide for kartis.info

## Overview

This guide provides step-by-step instructions for implementing and maintaining SEO for kartis.info using the built-in SEO utilities.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Using SEO Utilities](#using-seo-utilities)
3. [Adding Metadata to Pages](#adding-metadata-to-pages)
4. [Structured Data Implementation](#structured-data-implementation)
5. [Sitemap Management](#sitemap-management)
6. [Best Practices](#best-practices)
7. [Testing & Validation](#testing--validation)
8. [Using the SEO Agent](#using-the-seo-agent)

## Architecture Overview

### File Structure

```
/Users/michaelmishayev/Desktop/Projects/ticketsSchool/
├── lib/
│   └── seo.ts                    # SEO utility library
├── app/
│   ├── sitemap.ts                # Dynamic sitemap generator
│   ├── page.tsx                  # Landing page with metadata
│   └── layout.tsx                # Root layout with base metadata
├── public/
│   └── robots.txt                # Search engine directives
├── .claude/
│   └── commands/
│       └── seo.md                # SEO slash command agent
└── docs/
    ├── SEO_STRATEGY.md           # Content strategy document
    └── SEO_IMPLEMENTATION_GUIDE.md # This file
```

### Core Components

1. **`/lib/seo.ts`** - Central SEO utility library
   - Metadata generation functions
   - Structured data helpers
   - SEO configuration constants

2. **`/app/sitemap.ts`** - Automatic sitemap generation
   - Static pages
   - Dynamic event pages
   - School pages

3. **`/public/robots.txt`** - Crawler directives
   - Allow/disallow rules
   - Sitemap location

4. **`/.claude/commands/seo.md`** - SEO Agent
   - Expert SEO assistance
   - Invoke with `/seo`

## Using SEO Utilities

### Import the Library

```typescript
import {
  generatePageMetadata,
  generateEventStructuredData,
  generateOrganizationStructuredData,
  generateSoftwareStructuredData,
  generateFAQStructuredData,
  generateBreadcrumbStructuredData,
  StructuredData,
  SEO_CONFIG,
} from '@/lib/seo'
```

### SEO Configuration

Edit `/lib/seo.ts` to update global SEO settings:

```typescript
export const SEO_CONFIG = {
  siteName: 'kartis.info',
  siteUrl: 'https://kartis.info',
  defaultTitle: 'kartis.info - מערכת ניהול כרטיסים לבתי ספר',
  defaultDescription: '...',
  defaultKeywords: ['ניהול כרטיסים', 'בית ספר', ...],
  locale: 'he_IL',
  twitterHandle: '@kartisinfo',
  ogImage: '/images/og-image.png',
  logo: '/images/logos/kartis-logo.png',
}
```

## Adding Metadata to Pages

### Static Pages

For static pages (like landing page), use `generatePageMetadata`:

```typescript
// app/page.tsx
import { generatePageMetadata } from '@/lib/seo'

export const metadata = generatePageMetadata({
  path: '/',
})
```

### Custom Metadata

Override defaults with custom values:

```typescript
export const metadata = generatePageMetadata({
  title: 'Custom Page Title',
  description: 'Custom description for this page',
  path: '/custom-path',
  keywords: ['custom', 'keywords', 'here'],
  image: '/images/custom-og-image.png',
})
```

### Dynamic Pages

For dynamic routes, use `generateMetadata` function:

```typescript
// app/p/[schoolSlug]/[eventSlug]/page.tsx
import { generatePageMetadata } from '@/lib/seo'
import { prisma } from '@/lib/prisma'

export async function generateMetadata({ params }) {
  const { schoolSlug, eventSlug } = params

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: { school: true },
  })

  if (!event) {
    return generatePageMetadata({
      title: 'אירוע לא נמצא',
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${event.title} - ${event.school.name}`,
    description: event.description || `הירשם לאירוע ${event.title}`,
    path: `/p/${schoolSlug}/${eventSlug}`,
    keywords: [
      event.title,
      event.school.name,
      'רישום לאירוע',
      'כרטיסים',
    ],
    type: 'article',
    publishedTime: event.createdAt.toISOString(),
    modifiedTime: event.updatedAt.toISOString(),
  })
}
```

### No-Index Pages

For admin or private pages:

```typescript
export const metadata = generatePageMetadata({
  title: 'Admin Dashboard',
  noIndex: true, // Prevents search engine indexing
})
```

## Structured Data Implementation

### Organization Schema

Add to your root layout or landing page:

```typescript
import { generateOrganizationStructuredData, StructuredData } from '@/lib/seo'

export default function Page() {
  const organizationData = generateOrganizationStructuredData()

  return (
    <>
      <StructuredData data={organizationData} />
      {/* Page content */}
    </>
  )
}
```

### Event Schema

For event pages:

```typescript
import { generateEventStructuredData, StructuredData } from '@/lib/seo'

export default function EventPage({ event }) {
  const eventSchema = generateEventStructuredData({
    id: event.slug,
    title: event.title,
    description: event.description,
    startDate: event.startAt,
    endDate: event.endAt,
    location: event.location,
    price: 0,
    currency: 'ILS',
    availableTickets: event.capacity - event.totalSpotsTaken,
    organizerName: event.school.name,
  })

  return (
    <>
      <StructuredData data={eventSchema} />
      {/* Event content */}
    </>
  )
}
```

### FAQ Schema

For pages with FAQs:

```typescript
import { generateFAQStructuredData, StructuredData } from '@/lib/seo'

const faqs = [
  {
    question: 'האם המערכת חינמית?',
    answer: 'כן! המערכת חינמית לצמיתות.',
  },
  // More FAQs...
]

export default function Page() {
  return (
    <>
      <StructuredData data={generateFAQStructuredData(faqs)} />
      {/* Page content */}
    </>
  )
}
```

### Breadcrumb Schema

For nested pages:

```typescript
import { generateBreadcrumbStructuredData, StructuredData } from '@/lib/seo'

const breadcrumbs = [
  { name: 'בית', path: '/' },
  { name: 'אירועים', path: '/events' },
  { name: event.title, path: `/p/${school.slug}/${event.slug}` },
]

export default function Page() {
  return (
    <>
      <StructuredData data={generateBreadcrumbStructuredData(breadcrumbs)} />
      {/* Page content */}
    </>
  )
}
```

### Multiple Schemas

Combine multiple schemas:

```typescript
const schemas = [
  generateOrganizationStructuredData(),
  generateEventStructuredData(event),
  generateBreadcrumbStructuredData(breadcrumbs),
]

return <StructuredData data={schemas} />
```

## Sitemap Management

### How It Works

The sitemap is automatically generated at `/app/sitemap.ts` and served at `/sitemap.xml`.

### Sitemap Structure

```typescript
{
  url: 'https://kartis.info/p/school/event',
  lastModified: new Date('2025-11-10'),
  changeFrequency: 'daily',
  priority: 0.8,
}
```

### Adding Static Pages

Edit `/app/sitemap.ts`:

```typescript
const staticPages: MetadataRoute.Sitemap = [
  {
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: `${baseUrl}/new-page`,  // Add your page here
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
]
```

### Revalidation

The sitemap revalidates every hour:

```typescript
export const revalidate = 3600 // Seconds
```

Change this value to adjust how often the sitemap updates.

## Best Practices

### 1. Meta Tags

**Title Tags**:
- Keep under 60 characters
- Include primary keyword
- Make it compelling
- Format: `{Page Title} | kartis.info`

**Meta Descriptions**:
- 150-160 characters optimal
- Include call-to-action
- Use relevant keywords naturally
- Write for humans, not robots

**Example**:
```typescript
title: 'ניהול כרטיסים לאירועי בית ספר | kartis.info'
description: 'מערכת חינמית לניהול כרטיסים ורישומים לאירועי בית ספר. התחל עכשיו ללא כרטיס אשראי ✓'
```

### 2. Keywords

- Use 5-10 relevant keywords per page
- Include Hebrew and English variations
- Don't stuff keywords
- Focus on search intent

### 3. Images

Always include alt text for SEO and accessibility:

```tsx
<Image
  src="/event-image.jpg"
  alt="תמונת אירוע בית ספר - כדורגל שכבה ז"
  width={1200}
  height={630}
/>
```

### 4. Headings

Maintain proper hierarchy:

```html
<h1>Main page title</h1>       <!-- One per page -->
  <h2>Section title</h2>         <!-- Multiple allowed -->
    <h3>Subsection title</h3>     <!-- Nested logically -->
```

### 5. Internal Linking

Link to related content:

```tsx
<Link href="/events">
  ראה את כל האירועים
</Link>
```

### 6. URL Structure

Keep URLs clean and descriptive:

✅ Good: `/p/beeri-school/purim-carnival`
❌ Bad: `/p/12345/event?id=abc123`

### 7. Mobile Optimization

- Test on mobile devices
- Ensure fast load times
- Use responsive images
- Check Core Web Vitals

## Testing & Validation

### 1. Schema Validator

Test structured data:
1. Go to [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Enter URL: `https://kartis.info`
3. Check for errors

### 2. Meta Tags Inspector

Check Open Graph tags:
1. Use [OpenGraph.xyz](https://www.opengraph.xyz/)
2. Enter your URL
3. Verify preview appears correctly

### 3. Lighthouse Audit

Run in Chrome DevTools:
```bash
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "SEO" + "Performance"
4. Click "Generate report"
```

Target scores:
- Performance: 90+
- SEO: 95+
- Accessibility: 95+

### 4. Mobile-Friendly Test

1. Go to [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
2. Enter your URL
3. Fix any issues

### 5. PageSpeed Insights

1. Visit [PageSpeed Insights](https://pagespeed.web.dev/)
2. Enter URL
3. Aim for green scores on all Core Web Vitals

## Using the SEO Agent

### Invoke the SEO Expert

Use the `/seo` slash command for SEO assistance:

```bash
/seo audit landing page
/seo create event schema for basketball game
/seo keywords research for school events
/seo fix meta tags
/seo optimize performance
```

### Common SEO Tasks

**Audit a page**:
```bash
/seo audit /admin/events
```

**Generate metadata**:
```bash
/seo meta tags for blog post about school events
```

**Create structured data**:
```bash
/seo event schema for "מכבייה בית ספרית"
```

**Keyword research**:
```bash
/seo keywords for ticket management in Hebrew
```

**Fix issues**:
```bash
/seo fix Core Web Vitals issues
```

## Common Issues & Solutions

### Issue: Pages not appearing in sitemap

**Solution**: Check that:
1. Page is not blocked in `robots.txt`
2. Page is included in `/app/sitemap.ts`
3. Database query returns the page/event

### Issue: Missing OG images in social shares

**Solution**:
1. Create OG image (1200x630px)
2. Save to `/public/images/og-image.png`
3. Update `SEO_CONFIG.ogImage` in `/lib/seo.ts`

### Issue: Duplicate meta descriptions

**Solution**: Ensure each page has unique metadata:
```typescript
// Bad - same description everywhere
export const metadata = { description: "Default" }

// Good - unique per page
export const metadata = generatePageMetadata({
  description: `Unique description for ${pageName}`
})
```

### Issue: Low performance scores

**Solution**:
1. Optimize images (use WebP, lazy loading)
2. Minimize JavaScript bundles
3. Use Next.js Image component
4. Enable compression

### Issue: Schema validation errors

**Solution**:
1. Test with [Schema Validator](https://validator.schema.org/)
2. Ensure all required fields are present
3. Use correct data types (Date, URL, etc.)

## Next Steps

1. **Set up Google Search Console**
   - Verify domain ownership
   - Submit sitemap
   - Monitor search performance

2. **Create OG Images**
   - Landing page: 1200x630px
   - Event template: Dynamic generation
   - Use Hebrew text and branding

3. **Implement Dynamic Event Metadata**
   - Add `generateMetadata` to event pages
   - Include event schema
   - Test with real events

4. **Performance Optimization**
   - Run Lighthouse audit
   - Fix Core Web Vitals issues
   - Optimize images and fonts

5. **Content Creation**
   - Start blog with SEO-optimized posts
   - Target long-tail keywords
   - Build internal linking structure

## Resources

### Documentation
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Schema.org Event](https://schema.org/Event)
- [Google Search Central](https://developers.google.com/search)

### Tools
- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics](https://analytics.google.com/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Validator](https://validator.schema.org/)

### Learning
- [SEO_STRATEGY.md](./SEO_STRATEGY.md) - Content strategy guide
- [Moz SEO Guide](https://moz.com/beginners-guide-to-seo)
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)

---

**Last Updated**: 2025-11-10
**Maintained By**: Development Team
**Questions?** Use `/seo` command or consult SEO_STRATEGY.md

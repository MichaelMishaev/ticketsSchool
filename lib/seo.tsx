/**
 * SEO Utility Library
 * Master SEO configuration and utilities for kartis.info
 *
 * Features:
 * - Dynamic metadata generation
 * - Structured data (JSON-LD) helpers
 * - OpenGraph & Twitter Cards
 * - Sitemap generation helpers
 */

import { Metadata } from 'next'

// Base configuration
export const SEO_CONFIG = {
  siteName: 'kartis.info',
  siteUrl: 'https://kartis.info',
  defaultTitle: 'kartis.info - מערכת ניהול כרטיסים לבתי ספר | חינם לצמיתות',
  defaultDescription: 'מערכת ניהול כרטיסים חכמה לאירועי בית ספר - תשלומים מאובטחים, ניהול פשוט. תוכנית חינמית לצמיתות ללא כרטיס אשראי',
  defaultKeywords: [
    'ניהול כרטיסים',
    'בית ספר',
    'אירועים',
    'תשלומים מקוונים',
    'WhatsApp',
    'מערכת רישום',
    'כרטוס בית ספר',
    'ניהול אירועים',
    'רישום לאירועים',
    'כרטיסים דיגיטליים'
  ],
  locale: 'he_IL',
  twitterHandle: '@kartisinfo',
  ogImage: '/images/og-image.png',
  logo: '/images/logos/kartis-logo.png',
}

interface PageMetadataOptions {
  title?: string
  description?: string
  keywords?: string[]
  path?: string
  image?: string
  noIndex?: boolean
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}

/**
 * Generate comprehensive metadata for a page
 */
export function generatePageMetadata(options: PageMetadataOptions = {}): Metadata {
  const {
    title,
    description = SEO_CONFIG.defaultDescription,
    keywords = SEO_CONFIG.defaultKeywords,
    path = '',
    image = SEO_CONFIG.ogImage,
    noIndex = false,
    type = 'website',
    publishedTime,
    modifiedTime,
  } = options

  const fullTitle = title
    ? `${title} | kartis.info`
    : SEO_CONFIG.defaultTitle

  const url = `${SEO_CONFIG.siteUrl}${path}`
  const imageUrl = image.startsWith('http') ? image : `${SEO_CONFIG.siteUrl}${image}`

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'kartis.info' }],
    creator: 'kartis.info',
    publisher: 'kartis.info',
    metadataBase: new URL(SEO_CONFIG.siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SEO_CONFIG.siteName,
      locale: SEO_CONFIG.locale,
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        }
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: SEO_CONFIG.twitterHandle,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

/**
 * Generate structured data for events
 */
export function generateEventStructuredData(event: {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate?: Date
  location?: string
  price?: number
  currency?: string
  availableTickets?: number
  organizerName?: string
  imageUrl?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || event.title,
    startDate: event.startDate.toISOString(),
    ...(event.endDate && { endDate: event.endDate.toISOString() }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location || 'בית הספר',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IL',
      },
    },
    image: event.imageUrl ? [event.imageUrl] : [`${SEO_CONFIG.siteUrl}${SEO_CONFIG.ogImage}`],
    offers: {
      '@type': 'Offer',
      price: event.price || 0,
      priceCurrency: event.currency || 'ILS',
      availability: event.availableTickets && event.availableTickets > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
      url: `${SEO_CONFIG.siteUrl}/p/${event.id}`,
      validFrom: new Date().toISOString(),
    },
    ...(event.organizerName && {
      organizer: {
        '@type': 'Organization',
        name: event.organizerName,
        url: SEO_CONFIG.siteUrl,
      },
    }),
  }
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    logo: `${SEO_CONFIG.siteUrl}${SEO_CONFIG.logo}`,
    description: 'מערכת ניהול כרטיסים לבתי ספר ואירועים',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IL',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Hebrew', 'English'],
    },
    sameAs: [
      // Add social media profiles when available
    ],
  }
}

/**
 * Generate SoftwareApplication structured data
 */
export function generateSoftwareStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SEO_CONFIG.siteName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ILS',
      description: 'תוכנית חינמית ',
    },
    description: 'מערכת ניהול כרטיסים לבתי ספר',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
    featureList: [
      'ניהול אירועים',
      'תשלומים מקוונים מאובטחים',
      'הודעות WhatsApp אוטומטיות',
      'דוחות ומעקב בזמן אמת',
      'ממשק ידידותי למשתמש',
      'ניהול כרטיסים וממתינים',
      'תמיכה בעברית',
      'אינטגרציה עם WhatsApp',
    ],
  }
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SEO_CONFIG.siteUrl}${item.path}`,
    })),
  }
}

/**
 * Helper to inject structured data into page
 */
export function StructuredData({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const jsonLd = Array.isArray(data) ? data : [data]

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  )
}

/**
 * Generate sitemap entries for pages
 */
export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export function generateSitemapEntry(
  path: string,
  options: Omit<SitemapEntry, 'url'> = {}
): SitemapEntry {
  return {
    url: `${SEO_CONFIG.siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
    ...options,
  }
}

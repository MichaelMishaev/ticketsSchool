import type { Metadata } from 'next'
import LandingPage from '@/components/landing/LandingPage'
import { generatePageMetadata } from '@/lib/seo'

// Generate optimized metadata using SEO utilities
export const metadata: Metadata = generatePageMetadata({
  path: '/',
})

export default function Home() {
  return (
    <>
      {/* Structured Data - Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'kartis.info',
            url: 'https://kartis.info',
            logo: 'https://kartis.info/images/logos/kartis-logo.png',
            description: 'מערכת ניהול כרטיסים לבתי ספר ואירועים - חינמית לצמיתות',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'IL',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              availableLanguage: ['Hebrew', 'English'],
            },
          }),
        }}
      />

      {/* Structured Data - SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'kartis.info',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'ILS',
              description: 'תוכנית חינמית לצמיתות',
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
          }),
        }}
      />

      {/* Structured Data - FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'האם kartis.info חינמי?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'כן! kartis.info מציעה תוכנית חינמית לצמיתות ללא צורך בכרטיס אשראי. התוכנית החינמית כוללת עד 3 אירועים ו-100 רישומים לחודש.',
                },
              },
              {
                '@type': 'Question',
                name: 'האם ישנן עמלות על תשלומים?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'התוכנית החינמית כוללת עמלה קטנה על עסקאות. תוכניות פרימיום מציעות עמלות מופחתות או ללא עמלות.',
                },
              },
              {
                '@type': 'Question',
                name: 'האם המערכת מתאימה למכשירים ניידים?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'כן! kartis.info מותאמת במלואה למכשירים ניידים, טאבלטים ומחשבים. ניתן לנהל אירועים מכל מכשיר.',
                },
              },
            ],
          }),
        }}
      />

      <LandingPage />
    </>
  )
}

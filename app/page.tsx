import type { Metadata } from 'next'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'באריֿ - מערכת ניהול כרטיסים לבתי ספר | עדכוני WhatsApp אוטומטיים',
  description: 'מערכת ניהול כרטיסים חכמה לאירועי בית ספר - תשלומים מאובטחים, הודעות WhatsApp אוטומטיות, ניהול פשוט. 14 ימי ניסיון חינם ללא כרטיס אשראי ✓',
  keywords: 'ניהול כרטיסים, בית ספר, אירועים, תשלומים מקוונים, WhatsApp, מערכת רישום, כרטוס בית ספר',
  authors: [{ name: 'באריֿ' }],
  creator: 'באריֿ',
  publisher: 'באריֿ',
  metadataBase: new URL('https://kartis.info'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'באריֿ - מערכת ניהול כרטיסים לבתי ספר',
    description: 'מערכת ניהול כרטיסים חכמה עם עדכוני WhatsApp אוטומטיים - 14 ימי ניסיון חינם',
    url: 'https://kartis.info',
    siteName: 'באריֿ',
    locale: 'he_IL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'באריֿ - מערכת ניהול כרטיסים לבתי ספר',
    description: 'מערכת ניהול כרטיסים חכמה עם עדכוני WhatsApp אוטומטיים',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

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
            name: 'באריֿ',
            url: 'https://kartis.info',
            logo: 'https://kartis.info/logo.png',
            description: 'מערכת ניהול כרטיסים לבתי ספר ואירועים',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'IL',
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
            name: 'באריֿ',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'ILS',
              description: '14 ימי ניסיון חינם',
            },
            description: 'מערכת ניהול כרטיסים לבתי ספר עם עדכוני WhatsApp',
            featureList: [
              'ניהול אירועים',
              'תשלומים מקוונים מאובטחים',
              'הודעות WhatsApp אוטומטיות',
              'דוחות ומעקב בזמן אמת',
              'ממשק ידידותי למשתמש',
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
                name: 'האם באריֿ חינמי?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'כן! באריֿ מציעה 14 ימי ניסיון חינם ללא צורך בכרטיס אשראי. התוכנית החינמית כוללת עד 3 אירועים ו-100 רישומים לחודש.',
                },
              },
              {
                '@type': 'Question',
                name: 'איך עובדות הודעות ה-WhatsApp?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'המערכת שולחת הודעות אישור אוטומטיות ב-WhatsApp למשתתפים מיד לאחר הרישום, כולל פרטי האירוע וקישור לכרטיס הדיגיטלי.',
                },
              },
              {
                '@type': 'Question',
                name: 'האם המערכת מתאימה למכשירים ניידים?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'כן! באריֿ מותאמת במלואה למכשירים ניידים, טאבלטים ומחשבים. ניתן לנהל אירועים מכל מכשיר.',
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

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'הצהרת נגישות - kartis.info',
  description: 'הצהרת נגישות לאתר kartis.info בהתאם לתקן הישראלי IS 5568 ורמת AA של WCAG 2.1',
}

export default function AccessibilityStatementPage() {
  const lastUpdated = '04/04/2026'

  return (
    <main id="main-content" dir="rtl" lang="he" className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">הצהרת נגישות</h1>
          <p className="text-gray-600 text-sm">עודכן לאחרונה: {lastUpdated}</p>
        </header>

        {/* Commitment */}
        <section aria-labelledby="commitment-heading" className="mb-8">
          <h2 id="commitment-heading" className="text-xl font-semibold text-gray-900 mb-3">
            מחויבות לנגישות
          </h2>
          <p className="text-gray-700 leading-relaxed">
            kartis.info מחויבת להנגשת שירותיה הדיגיטליים לכלל האוכלוסייה, לרבות אנשים עם מוגבלויות,
            בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, תשנ&quot;ח–1998, ותקנות הנגישות לשירות
            מתשע&quot;ג–2013. האתר עומד בתקן הישראלי IS 5568 ברמת AA.
          </p>
        </section>

        {/* Implemented Features */}
        <section aria-labelledby="features-heading" className="mb-8">
          <h2 id="features-heading" className="text-xl font-semibold text-gray-900 mb-3">
            אמצעי נגישות באתר
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>האתר בנוי בעברית עם תמיכה מלאה בכיווניות מימין לשמאל (RTL)</li>
            <li>ניווט מלא באמצעות מקלדת בכל דפי האתר</li>
            <li>תמיכה בקוראי מסך (NVDA, JAWS, VoiceOver, TalkBack)</li>
            <li>תווית ARIA לכל אלמנט אינטראקטיבי</li>
            <li>טקסט חלופי (alt) לכל התמונות</li>
            <li>ניגודיות צבעים בגובה 4.5:1 לפחות לכל הטקסטים</li>
            <li>הודעות שגיאה בעברית עם קישור לשדה הבעייתי</li>
            <li>קישור &quot;דלג לתוכן הראשי&quot; בראש כל דף</li>
            <li>גודל גופן מינימלי של 16px לטקסט גוף</li>
            <li>אין תוכן המהבהב יותר משלוש פעמים בשנייה</li>
          </ul>
        </section>

        {/* Known Limitations */}
        <section aria-labelledby="limitations-heading" className="mb-8">
          <h2 id="limitations-heading" className="text-xl font-semibold text-gray-900 mb-3">
            מגבלות ידועות
          </h2>
          <p className="text-gray-700 leading-relaxed mb-2">
            אנו עובדים ברציפות לשיפור הנגישות. מגבלות קיימות שאנו מטפלים בהן:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>חלק מהטבלאות בדפי ניהול עשויות לא לכלול כותרות מלאות — מתוכנן לתיקון</li>
            <li>תוכן שנוצר על ידי משתמשים (תיאורי אירועים) עשוי לא לעמוד בכל דרישות הנגישות</li>
          </ul>
        </section>

        {/* Contact */}
        <section aria-labelledby="contact-heading" className="mb-8 bg-gray-50 rounded-xl p-6">
          <h2 id="contact-heading" className="text-xl font-semibold text-gray-900 mb-3">
            פנייה בנושא נגישות
          </h2>
          <p className="text-gray-700 mb-4">
            נתקלתם בבעיית נגישות? אנו כאן לעזור. ניתן לפנות לרכז הנגישות שלנו:
          </p>
          <dl className="space-y-2 text-gray-700">
            <div className="flex gap-2">
              <dt className="font-medium min-w-[80px]">שם:</dt>
              <dd>רכז נגישות kartis.info</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium min-w-[80px]">דוא&quot;ל:</dt>
              <dd>
                <a
                  href="mailto:negishot@kartis.info"
                  className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  dir="ltr"
                >
                  negishot@kartis.info
                </a>
              </dd>
            </div>
          </dl>
          <p className="text-gray-600 text-sm mt-4">נשתדל לחזור אליכם בתוך 5 ימי עסקים.</p>
        </section>

        {/* Legal Basis */}
        <section aria-labelledby="legal-heading" className="mb-8">
          <h2 id="legal-heading" className="text-xl font-semibold text-gray-900 mb-3">
            בסיס חוקי
          </h2>
          <p className="text-gray-700 leading-relaxed">
            הצהרה זו מוגשת בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
            תשע&quot;ג–2013, ובהתאם לתקן הישראלי IS 5568 המבוסס על{' '}
            <span dir="ltr" lang="en">
              WCAG 2.1 AA
            </span>
            .
          </p>
        </section>

        {/* Footer nav */}
        <nav aria-label="ניווט חזרה" className="border-t border-gray-200 pt-6">
          <Link
            href="/"
            className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            ← חזרה לעמוד הבית
          </Link>
        </nav>
      </div>
    </main>
  )
}

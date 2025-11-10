import Link from 'next/link'
import { FileText, Mail, Phone } from 'lucide-react'

export const metadata = {
  title: 'תנאי שימוש | kartis.info',
  description: 'תנאי השימוש של kartis.info - מערכת ניהול אירועים לבתי ספר',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <span className="text-2xl font-black text-gray-900">kartis.info</span>
            </Link>
            <Link href="/" className="text-red-600 hover:text-red-700 font-semibold transition-colors">
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full mb-6">
            <FileText className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            תנאי שימוש
          </h1>
          <p className="text-xl text-gray-600">
            עדכון אחרון: נובמבר 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 space-y-12">
          {/* Section 1 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">1. מבוא וקבלת התנאים</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                ברוכים הבאים ל-kartis.info (להלן: &quot;השירות&quot; או &quot;המערכת&quot;). השימוש בשירות כפוף לתנאי שימוש אלה.
                אנא קראו בעיון את התנאים לפני תחילת השימוש במערכת.
              </p>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 my-4">
                <p className="text-red-900 font-semibold">
                  ⚠️ השימוש בשירות מהווה הסכמה מלאה ומוחלטת לתנאים אלה. במידה ואינכם מסכימים לתנאים, אנא הימנעו משימוש בשירות.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">2. תיאור השירות</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                kartis.info היא מערכת מקוונת לניהול אירועים המיועדת לבתי ספר ומוסדות חינוך. השירות כולל:
              </p>
              <ul className="space-y-2 text-gray-700 mr-6">
                <li>• יצירת וניהול אירועים</li>
                <li>• רישום משתתפים ומעקב אחר נרשמים</li>
                <li>• ניהול רשימות המתנה אוטומטיות</li>
                <li>• ניהול צוות ותפקידים</li>
                <li>• דוחות וניתוחים</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">3. רישום וחשבון משתמש</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                <strong>3.1 דרישות רישום:</strong> על מנת להשתמש בשירות, עליכם להירשם וליצור חשבון משתמש.
                הנכם מתחייבים לספק מידע מדויק, עדכני ומלא.
              </p>
              <p>
                <strong>3.2 אחריות לחשבון:</strong> הנכם אחראים באופן בלעדי לשמירה על סודיות פרטי ההתחברות שלכם
                ולכל פעולה המתבצעת באמצעות חשבונכם.
              </p>
              <p>
                <strong>3.3 התראה על שימוש לא מורשה:</strong> עליכם להודיע לנו ללא דיחוי על כל שימוש
                לא מורשה או חשד לפריצה לחשבונכם.
              </p>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 my-4">
                <p className="text-yellow-900">
                  💡 <strong>מומלץ:</strong> השתמשו בסיסמה חזקה ומורכבת, ואל תשתפו את פרטי ההתחברות שלכם עם אחרים.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">4. שימוש מותר ואסור</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <div className="bg-green-50 rounded-xl p-6 my-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">✅ שימושים מותרים:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• ניהול אירועים למוסד החינוכי שלכם</li>
                  <li>• רישום משתתפים וניהול רשימות נרשמים</li>
                  <li>• תקשורת עם הורים, תלמידים וצוות</li>
                  <li>• יצירת דוחות, ניתוחים ויצוא נתונים</li>
                </ul>
              </div>

              <div className="bg-red-50 rounded-xl p-6 my-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">❌ שימושים אסורים בהחלט:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• שימוש למטרות בלתי חוקיות, לא מוסריות או בניגוד להוראות כל דין</li>
                  <li>• הפצת תוכן פוגעני, גזעני, מעליב או מטעה</li>
                  <li>• ניסיון לפרוץ למערכת, לפגוע באבטחתה או להתחזות למשתמשים אחרים</li>
                  <li>• העתקה, שכפול או הנדסה לאחור של קוד המקור, עיצוב או תוכן המערכת</li>
                  <li>• שימוש במערכת לצורך שליחת דואר זבל (SPAM) או פרסומות לא רצויות</li>
                  <li>• ניסיון לגשת למידע, נתונים או חשבונות של מוסדות חינוכיים אחרים</li>
                </ul>
              </div>

              <p className="font-semibold text-red-900 mt-4">
                הפרה של תנאים אלה עלולה להוביל להשעיית חשבונכם או סגירתו באופן מיידי וללא הודעה מוקדמת.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">5. בעלות וזכויות יוצרים</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                <strong>5.1 בעלות על המערכת:</strong> כל הזכויות במערכת kartis.info, לרבות קוד המקור,
                עיצוב גרפי, תוכן, מותג וסימני מסחר, הן בבעלותנו הבלעדית של kartis.info.
              </p>
              <p>
                <strong>5.2 התוכן שלכם:</strong> הנכם שומרים על הבעלות המלאה על כל התוכן שאתם מעלים למערכת
                (פרטי אירועים, רישומים, מידע על משתתפים וכיוצא באלה). הנכם מעניקים לנו רישיון מוגבל להשתמש בתוכן זה אך ורק לצורך אספקת השירות.
              </p>
              <p>
                <strong>5.3 אחריות לתוכן:</strong> הנכם אחראים באופן מלא ובלעדי לכל תוכן שאתם מפרסמים במערכת, ומתחייבים
                כי אין בתוכן זה הפרה של זכויות של גורמים אחרים.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">6. בידוד נתונים</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                <p className="text-blue-900 font-semibold mb-4">
                  🔒 <strong>חשוב מאוד:</strong> כל בית ספר פועל בסביבה מבודדת לחלוטין.
                </p>
                <ul className="space-y-2 text-blue-800">
                  <li>• כל בית ספר רואה רק את הנתונים שלו</li>
                  <li>• אין שיתוף מידע בין מוסדות שונים</li>
                  <li>• נתונים מוצפנים ומאובטחים</li>
                  <li>• גישה מוגבלת למנהלים מורשים בלבד</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">7. זמינות השירות</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                <strong>7.1 מאמצים לזמינות:</strong> אנו עושים כל שביכולתנו לשמור על זמינות השירות 24/7,
                אך איננו מתחייבים לזמינות מוחלטת.
              </p>
              <p>
                <strong>7.2 תחזוקה:</strong> אנו שומרים לעצמנו את הזכות להפסיק זמנית את השירות לצורכי
                תחזוקה, שדרוגים ושיפורים.
              </p>
              <p>
                <strong>7.3 שינויים בשירות:</strong> אנו עשויים לשנות, להוסיף או להסיר תכונות מהשירות
                בכל עת, ללא הודעה מוקדמת.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">8. הגבלת אחריות</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                <strong>8.1 &quot;כמות שהוא&quot;:</strong> השירות מסופק &quot;כמות שהוא&quot; (&quot;AS IS&quot;) ללא אחריות
                מכל סוג.
              </p>
              <p>
                <strong>8.2 אחריות מוגבלת:</strong> אנו לא אחראים לכל נזק ישיר, עקיף, מקרי או תוצאתי
                הנובע משימוש או אי-שימוש בשירות.
              </p>
              <p>
                <strong>8.3 אובדן מידע:</strong> למרות שאנו מבצעים גיבויים קבועים, אנו ממליצים לגבות
                את הנתונים שלך באופן עצמאי.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">9. סיום השימוש בשירות</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                <strong>9.1 סיום על ידכם:</strong> הנכם רשאים להפסיק את השימוש בשירות בכל עת על ידי
                מחיקת חשבונכם או הפסקת השימוש במערכת.
              </p>
              <p>
                <strong>9.2 סיום על ידינו:</strong> אנו שומרים לעצמנו את הזכות להשעות, להקפיא או לסגור חשבון
                בכל מקרה של הפרת תנאי שימוש אלה, שימוש לרעה או פעילות חשודה.
              </p>
              <p>
                <strong>9.3 השלכות הסיום:</strong> עם סיום החשבון, הגישה שלכם למערכת תופסק באופן מיידי, והנתונים
                עשויים להימחק בהתאם למדיניות השמירה והגיבוי שלנו.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">10. שינויים בתנאי השימוש</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                אנו שומרים לעצמנו את הזכות לעדכן ולשנות תנאי שימוש אלה מעת לעת. שינויים משמעותיים יפורסמו באתר,
                ותוכלו לעיין בגרסה המעודכנת ביותר תמיד דרך הקישור בתחתית הדף.
              </p>
              <p className="font-semibold text-blue-900">
                המשך השימוש בשירות לאחר פרסום שינויים מהווה הסכמה מצדכם לתנאי השימוש המעודכנים.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">11. דין וסמכות שיפוט</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                תנאי שימוש אלה כפופים לדיני מדינת ישראל. סכסוך כלשהו הנובע מתנאים אלה יידון
                בבתי המשפט המוסמכים בישראל בלבד.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section className="border-t-2 border-gray-200 pt-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">12. יצירת קשר</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                לשאלות, הבהרות או בעיות הקשורות לתנאי השימוש, אנא צרו איתנו קשר באמצעים הבאים:
              </p>

              <div className="grid md:grid-cols-2 gap-6 my-8">
                <a
                  href="https://wa.me/972555020829"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors border-2 border-green-200"
                >
                  <Phone className="w-8 h-8 text-green-600" />
                  <div className="text-right">
                    <div className="font-bold text-gray-900">וואטסאפ</div>
                    <div className="text-green-700 font-mono">055-502-0829</div>
                  </div>
                </a>

                <a
                  href="mailto:support@kartis.info"
                  className="flex items-center gap-4 p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border-2 border-blue-200"
                >
                  <Mail className="w-8 h-8 text-blue-600" />
                  <div className="text-right">
                    <div className="font-bold text-gray-900">דוא״ל</div>
                    <div className="text-blue-700">support@kartis.info</div>
                  </div>
                </a>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 my-6 text-center">
                <p className="text-gray-700 mb-4">
                  <strong>קראתם והבנתם את תנאי השימוש?</strong>
                </p>
                <p className="text-gray-600">
                  השימוש בשירות מהווה הסכמה מלאה ומפורשת לתנאים אלה. אם יש לכם שאלות או הבהרות, אנו זמינים לסייע.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 kartis.info • כל הזכויות שמורות</p>
          <div className="flex gap-6 justify-center mt-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              מדיניות פרטיות
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              תנאי שימוש
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

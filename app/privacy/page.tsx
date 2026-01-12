import Link from 'next/link'
import { Shield, Mail, Phone } from 'lucide-react'

export const metadata = {
  title: 'מדיניות פרטיות | kartis.info',
  description: 'מדיניות הפרטיות של kartis.info - מערכת ניהול אירועים לבתי ספר',
}

export default function PrivacyPage() {
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
          <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-full mb-6">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-4">
            מדיניות פרטיות
          </h1>
          <p className="text-xl text-gray-600">
            עדכון אחרון: נובמבר 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 space-y-12">
          {/* Section 1 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">1. כללי</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                ברוכים הבאים ל-kartis.info. אנו מתחייבים להגן על פרטיותכם ולשמור על המידע האישי שלכם.
                מדיניות פרטיות זו מפרטת כיצד אנו אוספים, משתמשים, משתפים ומגנים על המידע שלכם.
              </p>
              <p>
                השימוש בשירותי kartis.info מהווה הסכמה מלאה למדיניות פרטיות זו. במידה ואינכם מסכימים למדיניות זו,
                אנא הימנעו משימוש בשירותים שלנו.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">2. איסוף מידע</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>אנו אוספים מידע במספר דרכים:</p>

              <div className="bg-blue-50 rounded-xl p-6 my-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">מידע שמשתמשים מספקים:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• שם מלא, כתובת דוא״ל ומספר טלפון</li>
                  <li>• שם בית הספר או מוסד החינוך</li>
                  <li>• פרטי אירועים, רישומים ומשתתפים</li>
                  <li>• כל מידע אחר שתבחרו לספק במסגרת השימוש במערכת</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-xl p-6 my-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">מידע שנאסף אוטומטית:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• כתובת IP ופרטי מכשיר</li>
                  <li>• סוג דפדפן ומערכת הפעלה</li>
                  <li>• עמודים שביקרת בהם ומשך השהייה</li>
                  <li>• עוגיות (Cookies) ומזהים דומים</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">3. שימוש במידע</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>אנו משתמשים במידע שלכם למטרות הבאות:</p>
              <ul className="space-y-3 text-gray-700 mr-6">
                <li>• <strong>מתן השירות ושיפורו:</strong> ניהול אירועים, רישומים, רשימות המתנה וכלל התכונות במערכת</li>
                <li>• <strong>תקשורת עם משתמשים:</strong> שליחת התראות, עדכונים חשובים ומתן תמיכה טכנית</li>
                <li>• <strong>אבטחת מידע:</strong> זיהוי והגנה מפני פעילות חשודה, ניסיונות הונאה או שימוש לרעה</li>
                <li>• <strong>שיפור וייעול המערכת:</strong> ניתוח דפוסי שימוש לצורך שיפור חוויית המשתמש</li>
                <li>• <strong>עמידה בדרישות חוק:</strong> מילוי חובות חוקיות, רגולטוריות ודרישות רשויות מוסמכות</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">4. שיתוף מידע</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                <strong>אנו לא מוכרים את המידע שלכם לגורמים חיצוניים.</strong> אנו עשויים לשתף מידע אך ורק במקרים הבאים:
              </p>
              <ul className="space-y-3 text-gray-700 mr-6">
                <li>• <strong>ספקי שירות:</strong> ספקים המסייעים לנו בתפעול המערכת (שירותי אחסון, תשלומים ותשתיות טכנולוגיות)</li>
                <li>• <strong>דרישות חוק:</strong> במקרים בהם נדרש על פי דין, צו שיפוטי או דרישה מרשות מוסמכת</li>
                <li>• <strong>בתוך המוסד החינוכי:</strong> מידע משותף עם מנהלי וצוות המוסד החינוכי שלכם בלבד, בהתאם להרשאות שהוגדרו</li>
              </ul>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 my-4">
                <p className="text-yellow-900 font-semibold">
                  ⚠️ חשוב לציין: כל מוסד חינוכי רואה ומנהל אך ורק את המידע השייך לו. אין שיתוף מידע בין מוסדות שונים בשום מקרה.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">5. אבטחת מידע</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>אנו נוקטים באמצעי אבטחה מתקדמים ועדכניים להגנה מרבית על המידע שלכם:</p>
              <ul className="space-y-3 text-gray-700 mr-6">
                <li>• <strong>הצפנה:</strong> כל התקשורת מוצפנת באמצעות פרוטוכול SSL/TLS מתקדם</li>
                <li>• <strong>אחסון מאובטח:</strong> מאגרי הנתונים מוצפנים, מאובטחים ומנוטרים באופן רציף</li>
                <li>• <strong>גישה מוגבלת:</strong> הגישה למידע מוגבלת לעובדים מורשים בלבד על בסיס צורך לדעת</li>
                <li>• <strong>ניטור אבטחה:</strong> מעקב וניטור מתמיד אחר פעילות חשודה וניסיונות חדירה</li>
                <li>• <strong>גיבויים:</strong> גיבויים אוטומטיים וקבועים למניעת אובדן מידע</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">6. זכויות המשתמשים</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>מוקנות לכם זכויות חוקיות ביחס למידע האישי שלכם:</p>

              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-2">🔍 זכות עיון</h4>
                  <p className="text-gray-600">לקבל גישה ולצפות במידע שאנו מחזיקים עליכם</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-2">✏️ זכות תיקון</h4>
                  <p className="text-gray-600">לבקש תיקון מידע שגוי, לא מדויק או לא מעודכן</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-2">🗑️ זכות מחיקה</h4>
                  <p className="text-gray-600">לבקש מחיקת המידע האישי שלכם מהמערכת</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-2">📤 זכות הניידות</h4>
                  <p className="text-gray-600">לקבל עותק של המידע שלכם בפורמט נגיש</p>
                </div>
              </div>

              <p>
                להפעלת זכויותיכם, אנא צרו קשר באמצעות פרטי ההתקשרות המפורטים בסעיף &quot;יצירת קשר&quot; למטה.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">7. עוגיות (Cookies)</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                אנו משתמשים בעוגיות (Cookies) על מנת לשפר את חוויית השימוש שלכם. עוגיות הן קבצי טקסט קטנים
                הנשמרים במכשיר שלכם ומאפשרים לנו:
              </p>
              <ul className="space-y-2 text-gray-700 mr-6">
                <li>• לזכור את העדפותיכם, הגדרותיכם והתאמותיכם האישיות</li>
                <li>• לשמור על ההתחברות שלכם למערכת</li>
                <li>• לנתח דפוסי שימוש ולשפר את השירות והמערכת</li>
              </ul>
              <p className="mt-4">
                ניתן לחסום או למחוק עוגיות באמצעות הגדרות הדפדפן שלכם. יודגש כי חסימת עוגיות עלולה להגביל את הפונקציונליות והשימושיות של המערכת.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">8. שינויים במדיניות הפרטיות</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                אנו שומרים לעצמנו את הזכות לעדכן ולשנות מדיניות פרטיות זו מעת לעת. שינויים משמעותיים יפורסמו באתר,
                ותוכלו לעיין בגרסה המעודכנת תמיד דרך הקישור למדיניות פרטיות בתחתית הדף.
              </p>
              <p className="font-semibold text-blue-900">
                המשך השימוש בשירות לאחר פרסום שינויים במדיניות הפרטיות מהווה הסכמה מצדכם למדיניות המעודכנת.
              </p>
            </div>
          </section>

          {/* Section 9 - DPO */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">9. קצין הגנת המידע</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                בהתאם לתיקון 13 לחוק הגנת הפרטיות, התשמ״א-1981 (בתוקף מ-14 באוגוסט 2025), מינינו קצין הגנת מידע אשר אחראי על כל הנושאים הקשורים להגנת פרטיות ומידע אישי.
              </p>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-8 my-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">פרטי קצין הגנת המידע</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-6 h-6 text-purple-600" />
                    <div>
                      <div className="font-semibold text-gray-900">דוא״ל:</div>
                      <a href="mailto:privacy@ticketcap.co.il" className="text-purple-700 hover:text-purple-900 font-mono">
                        privacy@ticketcap.co.il
                      </a>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-4">
                    ניתן לפנות לקצין הגנת המידע בכל נושא הקשור להגנת פרטיות, ניהול מידע אישי, הפעלת זכויות על פי החוק, או דיווח על חשש לאירוע אבטחת מידע.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 my-4">
                <p className="text-yellow-900 font-semibold text-center">
                  ⚖️ עודכן בהתאם לתיקון 13 לחוק הגנת הפרטיות (התשמ״א-1981) - בתוקף מ-14 באוגוסט 2025
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="border-t-2 border-gray-200 pt-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">10. יצירת קשר</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                לשאלות, הבהרות או בקשות הקשורות למדיניות הפרטיות, אנא צרו איתנו קשר באמצעים הבאים:
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

              <p className="text-gray-600 text-center mt-8">
                אנו מחויבים להגן על פרטיותכם ונשמח לסייע ולענות על כל שאלה.
              </p>
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
        </div>
      </footer>
    </div>
  )
}

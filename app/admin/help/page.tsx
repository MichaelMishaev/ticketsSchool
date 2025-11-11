'use client'

import { Calendar, Users, MapPin, Clock, Star, Gift, CheckCircle, AlertCircle, Plus, Settings, Edit3, FileText, Shield, Hash, MessageCircle, List, Zap } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 border-2 border-green-300">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ⚽ המדריך המלא לניהול משחקי כדורגל ⚽
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            ברוכים הבאים! המערכת שלנו נבנתה במיוחד למשחקי כדורגל, אבל אפשר להשתמש בה לכל סוג אירוע!
          </p>
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <CheckCircle className="w-5 h-5 ml-2" />
            <span className="font-medium">קל, מהיר ומקצועי - בלי לדעת טכנולוגיה!</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center">
          <Star className="w-6 h-6 ml-2" />
          מה זה אירוע? למה זה טוב בשבילי?
        </h2>
        <div className="text-gray-700 text-lg leading-relaxed">
          <p className="mb-4">
            ⚽ <strong>אירוע</strong> זה כל פעילות שאתם רוצים לארגן - בעיקר משחקי כדורגל!
          </p>
          <p className="mb-4">
            <strong>דוגמאות למה תשתמשו במערכת:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 mr-6">
            <li>⚽ <strong>משחק כדורגל</strong> - 11 נגד 11, 7 נגד 7, או כל גודל קבוצה</li>
            <li>🏆 <strong>טורניר</strong> - מספר קבוצות משחקות אחת נגד השנייה</li>
            <li>🎓 <strong>אימון קבוצתי</strong> - אימון לקבוצה עם מספר מוגבל של שחקנים</li>
            <li>🏃 <strong>מבחני כושר</strong> - מבחנים לשחקנים חדשים</li>
            <li>🎉 <strong>אירועים אחרים</strong> - יום הולדת, מסיבה, טיול, כל דבר!</li>
          </ul>
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-bold text-green-800">💡 למה זה נוח?</p>
            <p className="text-green-700 mt-2">
              במקום לשלוח הודעות וואטסאפ ולספור ידנית מי מגיע - כל ההרשמות במקום אחד!
              אתם רואים בזמן אמת כמה שחקנים נרשמו, מי הם, ומה המספר שלהם.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Basic Event Details */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
          <Gift className="w-6 h-6 ml-2" />
          חלק 1: פרטי האירוע הבסיסיים
        </h2>

        <div className="space-y-6">
          <div className="border-r-4 border-purple-400 pr-4 bg-purple-50 p-4 rounded">
            <h3 className="text-xl font-bold text-purple-700 mb-3 flex items-center">
              <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">1</span>
              📝 כותרת האירוע *
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              <span className="text-red-500 font-bold">*חובה!</span> בחרו שם ברור ומושך למשחק! זה מה שהשחקנים יראו ראשון!
            </p>
            <div className="bg-white p-3 rounded border">
              <strong className="text-gray-900">דוגמאות למשחקי כדורגל:</strong><br />
              <span className="text-gray-900">⚽ משחק ידידות - נוער נגד מבוגרים</span><br />
              <span className="text-gray-900">⚽ כיתה ו' נגד כיתה ז' - גמר הגביע</span><br />
              <span className="text-gray-900">⚽ אימון קבוצתי - הכנה למשחק חשוב</span><br />
              <span className="text-gray-900">⚽ טורניר ליגת הכיתות - שלב א'</span><br />
              <span className="text-gray-900">🎂 חגיגת יום הולדת במגרש (לכל סוג אירוע!)</span>
            </div>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <strong className="text-gray-900">💡 טיפ חשוב:</strong> <span className="text-gray-900">תנו שם שמסביר מה קורה! למשל: "משחק ידידות" פחות טוב מ"משחק ידידות - קבוצת הבית נגד קבוצת האורחים"</span>
            </div>
          </div>

          <div className="border-r-4 border-blue-400 pr-4 bg-blue-50 p-4 rounded">
            <h3 className="text-xl font-bold text-blue-700 mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">2</span>
              📖 תיאור האירוע
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              ספרו לשחקנים מה יהיה במשחק! איזה סוג משחק? מה צריך להביא? מה חשוב לדעת?
            </p>
            <div className="bg-white p-3 rounded border">
              <strong className="text-gray-900">דוגמה למשחק כדורגל:</strong><br />
              <span className="text-gray-900">⚽ משחק ידידות 11 נגד 11 במגרש העירוני</span><br />
              <span className="text-gray-900">🥅 הביאו: נעלי ספורט, בקבוק מים, מדים אם יש</span><br />
              <span className="text-gray-900">⏰ נפתח את המגרש בשעה 16:00, מתחילים לשחק 16:30, סיום בשעה 18:00</span><br />
              <span className="text-gray-900">📌 חובה להגיע בזמן! אם מאחרים - תתקשרו</span>
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <strong className="text-gray-900">💡 מה חשוב לכתוב:</strong>
              <ul className="list-disc list-inside mr-4 mt-2 space-y-1 text-gray-700">
                <li>איזה סוג משחק (11 נגד 11, 7 נגד 7, אימון וכו')</li>
                <li>מה להביא (נעליים, מים, ציוד מיוחד)</li>
                <li>שעות מדויקות (פתיחה, התחלה, סיום)</li>
                <li>הוראות חשובות (להגיע בזמן, להתקשר אם מאחרים)</li>
              </ul>
            </div>
          </div>

          <div className="border-r-4 border-green-400 pr-4 bg-green-50 p-4 rounded">
            <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
              <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">3</span>
              🎮 סוג המשחק/אירוע
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              איזה סוג אירוע זה? זה עוזר לאנשים להבין מה לצפות ואיך להתכונן!
            </p>
            <div className="bg-white p-3 rounded border">
              <strong className="text-gray-900">האפשרויות שלכם:</strong><br />
              <span className="text-gray-900">⚽ כדורגל - למשחקי כדורגל</span><br />
              <span className="text-gray-900">🏀 כדורסל - למשחקי כדורסל</span><br />
              <span className="text-gray-900">🏐 כדורעף - למשחקי כדורעף</span><br />
              <span className="text-gray-900">🎈 אחר - למסיבות, טיולים, יום הולדת וכל הדברים הכיפיים האחרים!</span>
            </div>
          </div>

          <div className="border-r-4 border-orange-400 pr-4 bg-orange-50 p-4 rounded">
            <h3 className="text-xl font-bold text-orange-700 mb-3 flex items-center">
              <span className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">4</span>
              📍 מיקום האירוע
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              ספרו איפה המשחק יתקיים! תנו כתובת מדויקת כדי שהשחקנים יוכלו להגיע בקלות!
            </p>
            <div className="bg-white p-3 rounded border">
              <strong className="text-gray-900">דוגמאות למגרשי כדורגל:</strong><br />
              <span className="text-gray-900">⚽ מגרש כדורגל עירוני, שדרות ירושלים 50, תל אביב</span><br />
              <span className="text-gray-900">⚽ מגרש כדורגל בבית הספר "אורט", רחוב הרצל 15, רמת גן</span><br />
              <span className="text-gray-900">⚽ מתחם ספורט "אלפא", מגרש 3, רחוב הספורט 20, חולון</span><br />
              <span className="text-gray-900">⚽ מגרש השכונה - ליד הפארק המרכזי, רחוב הדקל 8</span>
            </div>
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
              <strong className="text-gray-900">💡 טיפ חשוב:</strong> <span className="text-gray-900">תוסיפו פרטים כמו "ליד התחנה המרכזית" או "יש חניה ליד המגרש" - זה עוזר לאנשים למצוא את המקום!</span>
            </div>
          </div>

          <div className="border-r-4 border-red-400 pr-4 bg-red-50 p-4 rounded">
            <h3 className="text-xl font-bold text-red-700 mb-3 flex items-center">
              <span className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">5</span>
              🕐 תאריך ושעת התחלה *
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              <span className="text-red-500 font-bold">*חובה!</span> מתי האירוע מתחיל? בחרו תאריך ושעה שנוחים לכולם!
            </p>
            <div className="bg-white p-3 rounded border">
              <strong className="text-gray-900">איך לבחור:</strong><br />
              <span className="text-gray-900">📅 לחצו על השדה ותראו לוח שנה</span><br />
              <span className="text-gray-900">🕐 בחרו תאריך ואז שעה</span><br />
              <span className="text-gray-900">💡 טיפ: אל תתחילו מוקדם מדי (לא לפני 15:00) או מאוחר מדי (לא אחרי 19:00)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Quantity Settings */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-teal-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-teal-600 mb-6 flex items-center">
          <Hash className="w-6 h-6 ml-2" />
          חלק 2: הגדרות כמות - כמה חברים?
        </h2>

        <div className="space-y-6">
          <div className="border-r-4 border-teal-400 pr-4 bg-teal-50 p-4 rounded">
            <h3 className="text-xl font-bold text-teal-700 mb-3 flex items-center">
              <span className="bg-teal-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">6</span>
              👥 מספר מקומות כולל *
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              <span className="text-red-500 font-bold">*חובה!</span> כמה שחקנים בסך הכל יכולים להשתתף במשחק?
            </p>
            <div className="bg-white p-3 rounded border">
              <strong className="text-gray-900">דוגמאות למשחקי כדורגל:</strong><br />
              <span className="text-gray-900">⚽ משחק 11 נגד 11: 22 שחקנים (11 בכל קבוצה)</span><br />
              <span className="text-gray-900">⚽ משחק 11 נגד 11 עם ספסל: 30 שחקנים (15 בכל קבוצה)</span><br />
              <span className="text-gray-900">⚽ משחק 7 נגד 7: 14 שחקנים (7 בכל קבוצה)</span><br />
              <span className="text-gray-900">⚽ אימון קבוצתי: 25 שחקנים (תלוי בגודל המגרש)</span><br />
              <span className="text-gray-900">⚽ טורניר: 50-100 שחקנים (תלוי במספר הקבוצות)</span>
            </div>
            <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded">
              <strong className="text-gray-900">💡 איך לחשב:</strong>
              <ul className="list-disc list-inside mr-4 mt-2 space-y-1 text-gray-700">
                <li>לכל קבוצה צריך מספר שחקנים מסוים (11, 7, 5 וכו')</li>
                <li>תוסיפו מקומות לשחקני ספסל (בדרך כלל 3-5 בכל קבוצה)</li>
                <li>אם יש שופטים או מאמנים - תחשבו גם אותם!</li>
                <li>עדיף להוסיף כמה מקומות נוספים למקרה של ביטולים</li>
              </ul>
            </div>
          </div>

          <div className="border-r-4 border-cyan-400 pr-4 bg-cyan-50 p-4 rounded">
            <h3 className="text-xl font-bold text-cyan-700 mb-3 flex items-center">
              <span className="bg-cyan-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">7</span>
              🎯 מקסימום מקומות לנרשם *
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              <span className="text-red-500 font-bold">*חובה!</span> כמה מקומות כל אדם יכול לקחת כשהוא נרשם?
            </p>
            <div className="bg-white p-3 rounded border">
              <strong className="text-gray-900">למשחקי כדורגל - בדרך כלל 1:</strong><br />
              <span className="text-gray-900">⚽ משחק רגיל: 1 מקום (כל שחקן נרשם לעצמו)</span><br />
              <span className="text-gray-900">👨‍👦 משחק משפחות: 2-4 מקומות (הורה + ילדים)</span><br />
              <span className="text-gray-900">👥 טורניר קבוצות: 5-11 מקומות (מאמן רושם את כל הקבוצה)</span><br />
              <span className="text-gray-900">⚠️ <strong>המלצה:</strong> למשחקים רגילים - תשאירו על 1! זה הכי פשוט ונוח</span>
            </div>
            <div className="mt-3 p-3 bg-cyan-50 border border-cyan-200 rounded">
              <strong className="text-gray-900">💡 למה זה חשוב:</strong>
              <p className="text-gray-700 mt-2">
                אם תשימו 1 מקום לאדם - כל שחקן נרשם בנפרד ואתם רואים בדיוק מי מגיע.
                אם תשימו יותר - אדם אחד יכול לרשום כמה שחקנים (נוח למאמנים שרושמים את הקבוצה).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2.5: Waitlist Explanation */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-yellow-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-yellow-600 mb-6 flex items-center">
          <Clock className="w-6 h-6 ml-2" />
          רשימת המתנה - מה קורה כשהמקומות נגמרים?
        </h2>

        <div className="space-y-6">
          <div className="border-r-4 border-yellow-400 pr-4 bg-yellow-50 p-4 rounded">
            <h3 className="text-xl font-bold text-yellow-700 mb-3 flex items-center">
              <span className="bg-yellow-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">⏰</span>
              🤔 מה זה רשימת המתנה?
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              רשימת המתנה זה כמו תור! כשהמקומות נגמרים, ילדים שעוד רוצים להגיע נכנסים לרשימת המתנה.
            </p>
            <div className="bg-white p-3 rounded border">
              <strong className="text-gray-900">איך זה עובד? דוגמה:</strong><br />
              <span className="text-gray-900">🎉 יש מסיבה עם 20 מקומות</span><br />
              <span className="text-gray-900">👥 20 ילדים ראשונים נרשמו - המקומות מלאים!</span><br />
              <span className="text-gray-900">😢 ילד ה-21 רוצה להגיע - הוא נכנס לרשימת המתנה</span><br />
              <span className="text-gray-900">📞 אם מישהו מבטל, הילד ברשימת המתנה יקבל הודעה!</span>
            </div>
          </div>

          <div className="border-r-4 border-orange-400 pr-4 bg-orange-50 p-4 rounded">
            <h3 className="text-xl font-bold text-orange-700 mb-3 flex items-center">
              <span className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">🔄</span>
              🎯 איך הרשימת המתנה עוזרת?
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              רשימת המתנה מאוד חשובה! היא עוזרת לכולם!
            </p>
            <div className="bg-white p-3 rounded border space-y-2">
              <div className="text-gray-900">✅ <strong>לילדים:</strong> יש להם תקווה להיכנס לאירוע גם אם זה מלא</div>
              <div className="text-gray-900">✅ <strong>לכם (המארגנים):</strong> האירוע תמיד יהיה מלא, גם אם מישהו מבטל</div>
              <div className="text-gray-900">✅ <strong>לכולם:</strong> אף אחד לא מפסיד - כל מקום פנוי מתמלא מיד!</div>
            </div>
          </div>

          <div className="border-r-4 border-red-400 pr-4 bg-red-50 p-4 rounded">
            <h3 className="text-xl font-bold text-red-700 mb-3 flex items-center">
              <span className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">🚀</span>
              📱 מה קורה ברשימת המתנה?
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              הנה בדיוק מה קורה כשילד נכנס לרשימת המתנה:
            </p>
            <div className="bg-white p-3 rounded border">
              <strong className="text-gray-900">התהליך המלא:</strong><br />
              <span className="text-gray-900">1️⃣ <strong>הרשמה:</strong> הילד נרשם אבל אין מקום - הוא נכנס לרשימת המתנה</span><br />
              <span className="text-gray-900">2️⃣ <strong>הודעה:</strong> הילד מקבל הודעה "נרשמת לרשימת המתנה! נעדכן אותך אם יתפנה מקום"</span><br />
              <span className="text-gray-900">3️⃣ <strong>המתנה:</strong> הילד ברשימת המתנה בסדר מסוים (מי שנרשם קודם, יכנס קודם)</span><br />
              <span className="text-gray-900">4️⃣ <strong>מקום פנוי:</strong> אם מישהו מבטל, הילד הראשון ברשימה מקבל הודעה</span><br />
              <span className="text-gray-900">5️⃣ <strong>כניסה:</strong> הילד עובר אוטומטית לרשימת המשתתפים!</span>
            </div>
          </div>

          <div className="border-r-4 border-green-400 pr-4 bg-green-50 p-4 rounded">
            <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
              <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">💡</span>
              🎈 טיפים לרשימת המתנה
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              איך להשתמש ברשימת המתנה בצורה הכי חכמה:
            </p>
            <div className="bg-white p-3 rounded border space-y-2">
              <div className="text-gray-900">🎯 <strong>תכניסו יותר מקומות מההתחלה:</strong> עדיף 25 מקומות מ-20, כי תמיד יש ביטולים</div>
              <div className="text-gray-900">📢 <strong>ספרו לכולם על הרשימה:</strong> "גם אם מלא, הירשמו! יש רשימת המתנה!"</div>
              <div className="text-gray-900">⏰ <strong>עקבו אחרי הרשימה:</strong> בלוח הבקרה תוכלו לראות כמה ברשימת המתנה</div>
              <div className="text-gray-900">📞 <strong>עדכנו את ההורים:</strong> אפשר לשלוח הודעה לכל מי שברשימת המתנה</div>
            </div>
          </div>

          <div className="border-r-4 border-purple-400 pr-4 bg-purple-50 p-4 rounded">
            <h3 className="text-xl font-bold text-purple-700 mb-3 flex items-center">
              <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">🔍</span>
              👀 איפה אתם רואים את רשימת המתנה?
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              בלוח הבקרה שלכם יש כל המידע על רשימת המתנה:
            </p>
            <div className="bg-white p-3 rounded border space-y-2">
              <div className="text-gray-900">📊 <strong>במסך הראשי:</strong> תראו כמה אנשים ברשימת המתנה</div>
              <div className="text-gray-900">📋 <strong>בעמוד האירוע:</strong> רשימה מלאה של כל מי שמחכה</div>
              <div className="text-gray-900">🔔 <strong>התראות:</strong> תקבלו הודעה כשמישהו נכנס לרשימת המתנה</div>
              <div className="text-gray-900">📈 <strong>סטטיסטיקות:</strong> תוכלו לראות כמה אנשים ברשימה לכל אירוע</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Registration Form Fields */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-indigo-600 mb-6 flex items-center">
          <Edit3 className="w-6 h-6 ml-2" />
          חלק 3: שדות הטופס - מה לשאול את המשתתפים?
        </h2>

        <div className="space-y-6">
          <div className="border-r-4 border-indigo-400 pr-4 bg-indigo-50 p-4 rounded">
            <h3 className="text-xl font-bold text-indigo-700 mb-3 flex items-center">
              <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">8</span>
              📋 שדות ברירת מחדל (תמיד יהיו!)
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              אלה השדות שתמיד יהיו בטופס ההרשמה. אתם לא יכולים למחוק אותם!
            </p>
            <div className="bg-white p-3 rounded border space-y-2">
              <div className="text-gray-900">📝 <strong>שם מלא</strong> - כדי לדעת מי נרשם</div>
              <div className="text-gray-900">📞 <strong>טלפון</strong> - כדי ליצור קשר אם יש בעיה</div>
              <div className="text-gray-900">🎒 <strong>כיתה</strong> - כדי לדעת באיזה גיל הילד (לא חובה למלא)</div>
            </div>
          </div>

          <div className="border-r-4 border-purple-400 pr-4 bg-purple-50 p-4 rounded">
            <h3 className="text-xl font-bold text-purple-700 mb-3 flex items-center">
              <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">9</span>
              ➕ שדות מותאמים אישית - תוסיפו מה שאתם רוצים!
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              אתם יכולים להוסיף שדות נוספים לפי הצורך שלכם! יש 4 סוגים:
            </p>
            <div className="bg-white p-3 rounded border space-y-3">
              <div className="border-b pb-2">
                <strong>📝 טקסט</strong> - למילות חופשיות<br />
                <span className="text-sm text-gray-600">דוגמה: "הערות מיוחדות", "איך הילד אוהב שקוראים לו"</span>
              </div>
              <div className="border-b pb-2">
                <strong>🔢 מספר</strong> - לכמויות ומספרים<br />
                <span className="text-sm text-gray-600">דוגמה: "גיל", "כמה חברים מביא", "מספר נעל"</span>
              </div>
              <div className="border-b pb-2">
                <strong>📋 רשימה נפתחת</strong> - לבחירה מכמה אפשרויות<br />
                <span className="text-sm text-gray-600">דוגמה: "מה אוהב לאכול: פיצה, המבורגר, פלאפל"</span>
              </div>
              <div>
                <strong>☑️ תיבת סימון</strong> - לשאלות כן/לא<br />
                <span className="text-sm text-gray-600">דוגמה: "צמחוני?", "יש אלרגיות?", "צריך הסעה?"</span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <strong className="text-gray-900">💡 טיפ חשוב:</strong> <span className="text-gray-900">אתם יכולים לסמן כל שדה כ"חובה" - אז הילד חייב למלא אותו!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Terms and Conditions */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-amber-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-amber-600 mb-6 flex items-center">
          <Shield className="w-6 h-6 ml-2" />
          חלק 4: תנאים והגבלות - חוקי האירוע
        </h2>

        <div className="space-y-6">
          <div className="border-r-4 border-amber-400 pr-4 bg-amber-50 p-4 rounded">
            <h3 className="text-xl font-bold text-amber-700 mb-3 flex items-center">
              <span className="bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">10</span>
              📜 תנאי השתתפות
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              כאן אתם כותבים את כל החוקים וההגבלות של האירוע!
            </p>
            <div className="bg-white p-3 rounded border">
              <strong>דוגמאות לתנאים:</strong><br />
              • גילאים 8-12 בלבד 👶<br />
              • חובה להביא נעלי ספורט ⚽<br />
              • אסור להביא חטיפים מבית (נספק אוכל) 🍕<br />
              • הורה חייב לחתום על הסכמה 📝<br />
              • אסור לצאת מהבניין בלי הודעה 🏢<br />
              • מי שמפריע יצטרך לעזוב ⚠️
            </div>
          </div>

          <div className="border-r-4 border-orange-400 pr-4 bg-orange-50 p-4 rounded">
            <h3 className="text-xl font-bold text-orange-700 mb-3 flex items-center">
              <span className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">11</span>
              ✅ דרוש אישור תנאי השתתפות
            </h3>
            <p className="text-gray-700 text-lg mb-3">
              אם תסמנו את התיבה הזו, כל ילד שנרשם יצטרך לסמן "אני מסכים לתנאים"!
            </p>
            <div className="bg-white p-3 rounded border">
              <strong>מתי לסמן:</strong><br />
              ✅ לטיולים (צריך הסכמה של הורים)<br />
              ✅ לפעילויות עם סיכון (ספורט, בריכה)<br />
              ✅ לאירועים עם תשלום<br />
              ❌ למסיבות רגילות בבית (לא חובה)
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Completion Message */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-green-600 mb-6 flex items-center">
          <MessageCircle className="w-6 h-6 ml-2" />
          חלק 5: הודעה לנרשמים - מה יראו אחרי ההרשמה?
        </h2>

        <div className="border-r-4 border-green-400 pr-4 bg-green-50 p-4 rounded">
          <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
            <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">12</span>
            💌 הודעה לאחר השלמת הרשמה
          </h3>
          <p className="text-gray-700 text-lg mb-3">
            אחרי שילד נרשם בהצלחה, הוא יראה הודעה מיוחדת! אתם יכולים לכתוב מה שאתם רוצים!
          </p>
          <div className="bg-white p-3 rounded border">
            <strong className="text-gray-900">דוגמאות להודעות למשחקי כדורגל:</strong><br />
            <span className="text-gray-900">⚽ "מעולה! נרשמת בהצלחה למשחק! תזכור להביא נעלי ספורט, בקבוק מים ומדים. נתראה במגרש!"</span><br />
            <span className="text-gray-900">⚽ "כל הכבוד! אתה במשחק! נתחיל בשעה 16:30 - הגיע 15 דקות קודם להתארגנות!"</span><br />
            <span className="text-gray-900">⚽ "ברכות! אתה חלק מהקבוצה! המאמן יצור איתך קשר בקרוב עם פרטים נוספים."</span><br />
            <span className="text-gray-900">⚽ "נרשמת בהצלחה! אם אתה לא יכול להגיע - תודיע לנו 24 שעות מראש כדי שנוכל לתת את המקום למישהו אחר."</span>
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <strong className="text-gray-900">💡 אם לא תכתבו כלום:</strong> <span className="text-gray-900">הילד יראה הודעת ברירת מחדל פשוטה "נרשמת בהצלחה!"</span>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 border-2 border-green-300">
        <h2 className="text-2xl font-bold text-green-600 mb-4 flex items-center">
          <Zap className="w-6 h-6 ml-2" />
          💡 טיפים חשובים למשחק כדורגל מושלם
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-gray-700">
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-xl ml-3">⚽</span>
              <p><strong>שמות ברורים:</strong> במקום "משחק", כתבו "משחק כדורגל 11 נגד 11 - גמר הליגה"!</p>
            </div>
            <div className="flex items-start">
              <span className="text-xl ml-3">📍</span>
              <p><strong>מיקום מדויק:</strong> תנו כתובת מלאה + הנחיות (למשל: "ליד החנייה, מגרש 3")</p>
            </div>
            <div className="flex items-start">
              <span className="text-xl ml-3">🎯</span>
              <p><strong>מספר שחקנים:</strong> תמיד תוסיפו כמה מקומות נוספים למקרה של ביטולים!</p>
            </div>
            <div className="flex items-start">
              <span className="text-xl ml-3">📞</span>
              <p><strong>פרטי קשר:</strong> תוסיפו את הטלפון שלכם בתיאור - למקרה שמישהו מאבד!</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-xl ml-3">⏰</span>
              <p><strong>זמנים הגיוניים:</strong> משחקים בדרך כלל 16:00-18:00 (אחרי בית הספר)</p>
            </div>
            <div className="flex items-start">
              <span className="text-xl ml-3">👕</span>
              <p><strong>מה להביא:</strong> ציינו בתיאור - נעליים, מים, מדים, מגיני שוקיים</p>
            </div>
            <div className="flex items-start">
              <span className="text-xl ml-3">📋</span>
              <p><strong>רשימת המתנה:</strong> תמיד אפשרו רשימת המתנה! אנשים מבטלים והיא תתמלא</p>
            </div>
            <div className="flex items-start">
              <span className="text-xl ml-3">💌</span>
              <p><strong>הודעת סיום:</strong> תזכירו בהודעה מה להביא ומתי להגיע!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 text-center border-2 border-green-300">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          🚀 מוכנים ליצור את המשחק הבא?
        </h2>
        <p className="text-gray-700 text-lg mb-6">
          עכשיו שאתם יודעים הכל - זה הזמן ליצור את משחק הכדורגל הבא שלכם! זה לוקח רק 2-3 דקות!
        </p>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-blue-700 transition text-lg shadow-lg"
        >
          <Plus className="w-6 h-6 ml-2" />
          ליצור משחק כדורגל עכשיו!
        </Link>
        <p className="text-sm text-gray-600 mt-4">
          עם המדריך שלמדתם, המשחק שלכם יהיה מאורגן ומקצועי! ⚽🌟
        </p>
        <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
          <p className="text-green-700 font-medium">
            💡 <strong>זכרו:</strong> המערכת נבנתה במיוחד למשחקי כדורגל, אבל אפשר להשתמש בה לכל סוג אירוע - טיולים, מסיבות, אימונים, וכל דבר אחר!
          </p>
        </div>
      </div>
    </div>
  )
}
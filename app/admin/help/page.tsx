'use client'

import { Calendar, Users, MapPin, Clock, Star, Gift, CheckCircle, AlertCircle, Plus, Settings, Edit3, FileText, Shield, Hash, MessageCircle, List, Zap, Heart, Trophy } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 mb-8 border-2 border-green-300">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ⚽ ברוכים הבאים ל־Kartis.info
          </h1>
          <h2 className="text-2xl font-semibold text-green-600 mb-6">
            מערכת חכמה לניהול הרשמות לאירועים עם מקומות מוגבלים
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            המערכת נבנתה במיוחד למשחקי כדורגל, אבל מתאימה <strong>לכל סוג אירוע</strong>: טיולים, מסיבות, אימונים, סדנאות, טורנירים ועוד.
          </p>
          <div className="inline-flex items-center bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-medium">
            <CheckCircle className="w-6 h-6 ml-2" />
            <span>פשוט. מהיר. בעברית. בלי טפסים מסובכים ובלי לספור ידנית מי מגיע!</span>
          </div>
        </div>
      </div>

      {/* למה להשתמש במערכת */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center">
          <Star className="w-6 h-6 ml-2" />
          💡 למה להשתמש במערכת?
        </h2>
        <div className="text-gray-700 text-lg leading-relaxed">
          <p className="mb-4">
            אם אי פעם ניסיתם לארגן משחק או אירוע בקבוצת וואטסאפ, אתם יודעים כמה זה בלגן:
          </p>
          <ul className="list-disc list-inside space-y-2 mr-6 mb-4">
            <li>עשרות הודעות של "אני בא", "תשמור לי מקום", "אפשר שניים?"</li>
            <li>אף אחד לא יודע כמה נרשמו באמת</li>
            <li>חלק נרשמים פעמיים, אחרים שוכחים</li>
            <li>ובסוף… יש או יותר מדי אנשים או פחות מדי!</li>
          </ul>
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <p className="font-bold text-green-800 mb-3">עם Kartis.info, הכל קורה אוטומטית:</p>
            <div className="space-y-2 text-green-700">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 ml-2 mt-1 flex-shrink-0" />
                <span>המערכת סופרת לבד כמה נרשמו</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 ml-2 mt-1 flex-shrink-0" />
                <span>היא עוצרת הרשמות כשהמקומות נגמרים</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 ml-2 mt-1 flex-shrink-0" />
                <span>יוצרת רשימת המתנה מסודרת</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 ml-2 mt-1 flex-shrink-0" />
                <span>ושומרת את כל הנתונים שלכם במקום אחד</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* איך זה עובד */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-purple-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-purple-600 mb-6 flex items-center">
          <Settings className="w-6 h-6 ml-2" />
          ⚙️ איך זה עובד?
        </h2>

        {/* למארגן */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center">
            <Users className="w-5 h-5 ml-2" />
            👨‍💼 למארגן
          </h3>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 flex-shrink-0 text-sm font-bold">1</span>
                <span className="mr-2">נרשמים למערכת (חינם לגמרי)</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 flex-shrink-0 text-sm font-bold">2</span>
                <span className="mr-2">יוצרים אירוע חדש<br/>📝 שם, תאריך, שעה, מיקום, כמות מקומות וכו'</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 flex-shrink-0 text-sm font-bold">3</span>
                <span className="mr-2">משתפים את הקישור בקבוצת וואטסאפ או עם המשתתפים</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 flex-shrink-0 text-sm font-bold">4</span>
                <span className="mr-2">רואים בזמן אמת מי נרשם, כמה מקומות נשארו ומי ברשימת המתנה</span>
              </li>
              <li className="flex items-start">
                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 flex-shrink-0 text-sm font-bold">5</span>
                <span className="mr-2">אפשר לערוך, למחוק, לייצא לאקסל או לשלוח הודעות לכל המשתתפים</span>
              </li>
            </ol>
          </div>
        </div>

        {/* למשתתפים */}
        <div>
          <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
            <Star className="w-5 h-5 ml-2" />
            ⚽ למשתתפים
          </h3>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 flex-shrink-0 text-sm font-bold">1</span>
                <span className="mr-2">לוחצים על הקישור שקיבלו</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 flex-shrink-0 text-sm font-bold">2</span>
                <span className="mr-2">רואים כמה מקומות נשארו</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 flex-shrink-0 text-sm font-bold">3</span>
                <span className="mr-2">ממלאים פרטים קצרים ונרשמים</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 flex-shrink-0 text-sm font-bold">4</span>
                <span className="mr-2">מקבלים אישור הרשמה עם קוד אישי</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 flex-shrink-0 text-sm font-bold">5</span>
                <span className="mr-2">אם אין מקום – נכנסים אוטומטית לרשימת המתנה ומקבלים עדכון כשמתפנה מקום</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* למי זה מתאים */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-green-600 mb-6 flex items-center">
          <Heart className="w-6 h-6 ml-2" />
          🎯 למי זה מתאים?
        </h2>
        <p className="text-gray-700 text-lg mb-6">
          Kartis.info מתאימה לכל מי שמארגן אירועים עם כמות משתתפים מוגבלת:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ספורט */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <h3 className="text-xl font-bold text-blue-700 mb-3 flex items-center">
              <Trophy className="w-5 h-5 ml-2" />
              ⚽ ספורט
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 ml-2">•</span>
                <span>משחקי כדורגל (11×11, 7×7, אימונים)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 ml-2">•</span>
                <span>טורנירים וימי ספורט</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 ml-2">•</span>
                <span>מבחני קבלה ושיעורי ניסיון</span>
              </li>
            </ul>
          </div>

          {/* בתי ספר */}
          <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
            <h3 className="text-xl font-bold text-purple-700 mb-3 flex items-center">
              <FileText className="w-5 h-5 ml-2" />
              🏫 בתי ספר
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-600 ml-2">•</span>
                <span>הצגות, טיולים וימי גיבוש</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 ml-2">•</span>
                <span>פעילויות כיתה או שכבה</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 ml-2">•</span>
                <span>הרשמות לתחרויות</span>
              </li>
            </ul>
          </div>

          {/* קהילה */}
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
              <Users className="w-5 h-5 ml-2" />
              🏘️ קהילה ומתנ"סים
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 ml-2">•</span>
                <span>סדנאות, הרצאות ופעילויות קיץ</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 ml-2">•</span>
                <span>חוגים עם מספר משתתפים קבוע</span>
              </li>
            </ul>
          </div>

          {/* אירועים פרטיים */}
          <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
            <h3 className="text-xl font-bold text-orange-700 mb-3 flex items-center">
              <Gift className="w-5 h-5 ml-2" />
              🎉 אירועים פרטיים
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-orange-600 ml-2">•</span>
                <span>מסיבות יום הולדת</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 ml-2">•</span>
                <span>טיולים משפחתיים</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-600 ml-2">•</span>
                <span>אירועי חברה</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* למה זה נוח */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-indigo-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-indigo-600 mb-6 flex items-center">
          <Zap className="w-6 h-6 ml-2" />
          📋 למה זה נוח?
        </h2>
        <div className="space-y-3 text-gray-700 text-lg">
          <div className="flex items-start bg-indigo-50 p-3 rounded-lg">
            <span className="text-2xl ml-3">📱</span>
            <span>עובד מצוין בנייד, בטאבלט ובמחשב</span>
          </div>
          <div className="flex items-start bg-indigo-50 p-3 rounded-lg">
            <span className="text-2xl ml-3">💾</span>
            <span>הכל נשמר באופן מסודר ואפשר לייצא לקובץ</span>
          </div>
          <div className="flex items-start bg-indigo-50 p-3 rounded-lg">
            <span className="text-2xl ml-3">🔔</span>
            <span>אפשר לשלוח הודעות אוטומטיות למשתתפים</span>
          </div>
          <div className="flex items-start bg-indigo-50 p-3 rounded-lg">
            <span className="text-2xl ml-3">⏳</span>
            <span>ניהול רשימת המתנה חכמה</span>
          </div>
          <div className="flex items-start bg-indigo-50 p-3 rounded-lg">
            <span className="text-2xl ml-3">🧠</span>
            <span>ממשק פשוט וברור — גם למי שלא מבין בטכנולוגיה</span>
          </div>
        </div>
      </div>

      {/* סיכום */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 mb-8 border-2 border-green-300">
        <h2 className="text-2xl font-bold text-green-600 mb-4 flex items-center justify-center">
          <Star className="w-6 h-6 ml-2" />
          ✨ סיכום
        </h2>
        <div className="text-center mb-6">
          <p className="text-xl text-gray-800 font-semibold mb-4">
            Kartis.info עושה לכם סדר:
          </p>
          <div className="bg-white p-6 rounded-lg border-2 border-green-300 inline-block">
            <p className="text-lg text-gray-700">
              משתפים קישור ← אנשים נרשמים ← המערכת מגבילה אוטומטית ← ואתם רואים הכל בזמן אמת.
            </p>
          </div>
        </div>
        <p className="text-lg text-gray-700 text-center mb-6">
          לא משנה אם זה משחק כדורגל, סדנה, או יום הולדת —<br/>
          <strong className="text-green-700">תוך שתי דקות יש לכם אירוע מאורגן, מקצועי וללא כאב ראש!</strong>
        </p>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/admin/events/new"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-blue-700 transition text-lg shadow-lg"
          >
            <Plus className="w-6 h-6 ml-2" />
            ליצור אירוע עכשיו!
          </Link>
          <p className="text-sm text-gray-600 mt-4">
            תוך דקות ספורות תוכלו לשתף את האירוע שלכם עם כולם! 🌟
          </p>
        </div>
      </div>

      {/* הערת שוליים */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
        <p className="text-blue-800 font-medium">
          💡 צריכים עזרה? יש שאלות? צרו איתנו קשר ונשמח לעזור!
        </p>
      </div>
    </div>
  )
}

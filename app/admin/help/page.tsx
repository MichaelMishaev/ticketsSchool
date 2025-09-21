'use client'

import { Calendar, Users, MapPin, Clock, Star, Gift, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 איך ליצור אירוע חדש? 🎉
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            ברוכים הבאים! כאן תלמדו איך ליצור אירועים מדליקים בקלות!
          </p>
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <CheckCircle className="w-5 h-5 ml-2" />
            <span className="font-medium">זה קל וכיף!</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border-2 border-purple-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-purple-600 mb-4 flex items-center">
          <Star className="w-6 h-6 ml-2" />
          מה זה אירוע?
        </h2>
        <div className="text-gray-700 text-lg leading-relaxed">
          <p className="mb-4">
            🎮 <strong>אירוע</strong> זה כמו מסיבה, משחק או פעילות שאנחנו רוצים לעשות!
          </p>
          <p className="mb-4">
            למשל: יום הולדת 🎂, משחק כדורגל ⚽, מסיבת פיג'מות 🥳, או טיול 🚌
          </p>
          <p>
            כשאנחנו יוצרים אירוע, אנחנו אומרים לכולם מתי זה יהיה, איפה, וכמה אנשים יכולים להגיע!
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
          <Gift className="w-6 h-6 ml-2" />
          מדריך צעד אחר צעד
        </h2>

        <div className="space-y-6">
          <div className="border-r-4 border-purple-400 pr-4 bg-purple-50 p-4 rounded">
            <h3 className="text-xl font-bold text-purple-700 mb-3 flex items-center">
              <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">1</span>
              📝 שם האירוע
            </h3>
            <p className="text-gray-700 text-lg">
              בחרו שם מגניב לאירוע שלכם! למשל: "מסיבת יום הולדת של שרה" או "משחק כדורגל בפארק"
            </p>
            <div className="mt-3 bg-white p-3 rounded border">
              <strong>דוגמה:</strong> 🎉 מסיבת פיצה וחברים 🍕
            </div>
          </div>

          <div className="border-r-4 border-blue-400 pr-4 bg-blue-50 p-4 rounded">
            <h3 className="text-xl font-bold text-blue-700 mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">2</span>
              📖 תיאור האירוע
            </h3>
            <p className="text-gray-700 text-lg">
              ספרו לחברים מה יהיה באירוע! מה תעשו? מה צריך להביא? מה יהיה כיף?
            </p>
            <div className="mt-3 bg-white p-3 rounded border">
              <strong>דוגמה:</strong> ניכין פיצה ביחד, נשחק משחקים ונצפה בסרט מצחיק! תביאו בגדים נוחים 😊
            </div>
          </div>

          <div className="border-r-4 border-green-400 pr-4 bg-green-50 p-4 rounded">
            <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
              <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">3</span>
              🎮 סוג המשחק
            </h3>
            <p className="text-gray-700 text-lg">
              איזה סוג אירוע זה? כדורגל? מסיבה? טיול? זה עוזר לאנשים להבין מה לצפות!
            </p>
            <div className="mt-3 bg-white p-3 rounded border">
              <strong>דוגמאות:</strong> מסיבה 🎉 | ספורט ⚽ | יום הולדת 🎂 | טיול 🚌
            </div>
          </div>

          <div className="border-r-4 border-orange-400 pr-4 bg-orange-50 p-4 rounded">
            <h3 className="text-xl font-bold text-orange-700 mb-3 flex items-center">
              <span className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">4</span>
              📍 איפה זה יהיה?
            </h3>
            <p className="text-gray-700 text-lg">
              ספרו איפה האירוע יקרה! הכתובת המלאה כדי שכולם יוכלו להגיע!
            </p>
            <div className="mt-3 bg-white p-3 rounded border">
              <strong>דוגמה:</strong> פארק הילדים ברחוב הרצל 15, תל אביב 🏞️
            </div>
          </div>

          <div className="border-r-4 border-red-400 pr-4 bg-red-50 p-4 rounded">
            <h3 className="text-xl font-bold text-red-700 mb-3 flex items-center">
              <span className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">5</span>
              🕐 מתי זה מתחיל ונגמר?
            </h3>
            <p className="text-gray-700 text-lg">
              בחרו תאריך ושעה! מתי האירוע מתחיל ומתי הוא נגמר?
            </p>
            <div className="mt-3 bg-white p-3 rounded border">
              <strong>דוגמה:</strong> יום שישי 15/3/2024 בשעה 16:00 עד 18:00 ⏰
            </div>
          </div>

          <div className="border-r-4 border-teal-400 pr-4 bg-teal-50 p-4 rounded">
            <h3 className="text-xl font-bold text-teal-700 mb-3 flex items-center">
              <span className="bg-teal-600 text-white rounded-full w-8 h-8 flex items-center justify-center ml-3 text-sm font-bold">6</span>
              👥 כמה חברים יכולים להגיע?
            </h3>
            <p className="text-gray-700 text-lg">
              כמה מקומות יש באירוע? אם זה מסיבה בבית, אולי 20 ילדים. אם זה במגרש כדורגל, אולי 22!
            </p>
            <div className="mt-3 bg-white p-3 rounded border">
              <strong>דוגמה:</strong> 25 ילדים (כולל אתכם!) 👫👬👭
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 mb-8 border-2 border-yellow-300">
        <h2 className="text-2xl font-bold text-orange-600 mb-4 flex items-center">
          <AlertCircle className="w-6 h-6 ml-2" />
          💡 טיפים חשובים
        </h2>
        <div className="space-y-3 text-gray-700">
          <div className="flex items-start">
            <span className="text-xl ml-3">✨</span>
            <p><strong>תנו שמות מגניבים:</strong> במקום "אירוע", קראו לו "מסיבת הפיצה הגדולה"!</p>
          </div>
          <div className="flex items-start">
            <span className="text-xl ml-3">📝</span>
            <p><strong>תהיו ברורים:</strong> כתבו בדיוק איפה ומתי, כדי שאף אחד לא יתבלבל!</p>
          </div>
          <div className="flex items-start">
            <span className="text-xl ml-3">🎯</span>
            <p><strong>חשבו על המקום:</strong> כמה ילדים באמת נכנסים? עדיף קצת פחות מאשר צפוף!</p>
          </div>
          <div className="flex items-start">
            <span className="text-xl ml-3">⏰</span>
            <p><strong>זמנים הגיוניים:</strong> לא להתחיל מוקדם מדי או מאוחר מדי!</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          🚀 מוכנים ליצור אירוע?
        </h2>
        <p className="text-gray-700 text-lg mb-6">
          עכשיו שאתם יודעים הכל, בואו ניצור אירוע מדליק!
        </p>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition text-lg shadow-lg"
        >
          <Plus className="w-5 h-5 ml-2" />
          ליצור אירוע חדש עכשיו!
        </Link>
      </div>
    </div>
  )
}
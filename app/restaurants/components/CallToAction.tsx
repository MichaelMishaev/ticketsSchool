'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          יש לך מסעדה? הצטרף אלינו עכשיו!
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          נהל את ההזמנות שלך בקלות, הגדל את התפוסה והגע ללקוחות חדשים
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/admin/events/new-restaurant"
            className="group px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center gap-2 min-w-[200px] justify-center"
          >
            הוסף מסעדה
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/admin/signup"
            className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300 min-w-[200px]"
          >
            הרשמה למערכת
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-right">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="text-3xl font-bold mb-2">✓</div>
            <h3 className="font-bold mb-2">ניהול פשוט</h3>
            <p className="text-blue-100 text-sm">
              ממשק קל לשימוש לניהול כל ההזמנות שלך
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="text-3xl font-bold mb-2">✓</div>
            <h3 className="font-bold mb-2">יותר לקוחות</h3>
            <p className="text-blue-100 text-sm">
              חשיפה לאלפי משתמשים שמחפשים מסעדה
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="text-3xl font-bold mb-2">✓</div>
            <h3 className="font-bold mb-2">תמיכה מלאה</h3>
            <p className="text-blue-100 text-sm">
              צוות התמיכה שלנו זמין לעזור בכל שלב
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

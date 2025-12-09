'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  UtensilsCrossed,
  Calendar,
  Users,
  CheckCircle,
  ArrowLeft,
  Clock,
  Shield,
  Star,
  Zap,
  TrendingUp,
  BarChart3,
  Phone,
  MessageCircle,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export default function RestaurantsLandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                kartis.info
              </span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Link
                href="/"
                className="px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors min-h-[44px] flex items-center justify-center"
              >
                חזרה לדף הבית
              </Link>
              <Link
                href="/admin/signup"
                className="px-5 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:from-purple-700 hover:to-purple-800 hover:shadow-lg transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center"
              >
                התחילו עכשיו
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 sm:px-5 py-2.5 rounded-full shadow-lg border border-purple-100">
              <UtensilsCrossed className="w-5 h-5 text-purple-600" />
              <span className="text-xs sm:text-sm font-bold text-gray-900">מערכת הזמנת מקומות מתקדמת</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-tight text-gray-900">
              ניהול הזמנות מקומות
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                למסעדות ומקומות בילוי
              </span>
            </h1>

            {/* Value Proposition */}
            <p className="text-base sm:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto font-medium">
              מערכת חכמה לניהול הזמנות במסעדות, בתי קפה, בארים ואירועים.
              <br />
              לקוחות מזמינים מקום ישיבה, ואתם מנהלים הכל אוטומטית.
            </p>

            {/* Hero Images Showcase */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto pt-6">
              <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white group">
                <Image
                  src="/restaurants/hero-1.jpg"
                  alt="מסעדה מודרנית"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white group">
                <Image
                  src="/restaurants/hero-2.jpg"
                  alt="בית קפה אלגנטי"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white sm:col-span-2 lg:col-span-1 group">
                <Image
                  src="/restaurants/hero-3.jpg"
                  alt="בר טרנדי"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8">
              <Link
                href="/admin/events/new-restaurant"
                className="px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 hover:shadow-xl transition-all max-w-[80%] sm:max-w-none flex items-center gap-2 shadow-lg"
              >
                <span className="text-2xl">🍽️</span>
                <span>פתחו מערכת הזמנות</span>
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link
                href="/admin/signup"
                className="px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl font-bold text-purple-700 bg-white border-2 border-purple-300 rounded-xl hover:border-purple-400 hover:shadow-xl transition-all max-w-[80%] sm:max-w-none"
              >
                הרשמה חינמית
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-8 justify-center items-center pt-8 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">התקנה תוך 5 דקות</span>
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">ללא כרטיס אשראי</span>
              </span>
              <span className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">תמיכה בעברית 24/7</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works for Restaurants */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black mb-6 text-gray-900">
              איך זה עובד? <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">פשוט מאוד</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">4 צעדים ואתם מוכנים לקבל הזמנות</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                icon: <Calendar className="w-10 h-10" />,
                title: 'יצירת אירוע',
                desc: 'הגדירו את פרטי האירוע - תאריך, שעה ומיקום המסעדה',
                color: 'from-purple-500 to-purple-600',
              },
              {
                step: '2',
                icon: <UtensilsCrossed className="w-10 h-10" />,
                title: 'הגדרת שולחנות',
                desc: 'הוסיפו שולחנות עם קיבולת ומינימום הזמנה לכל שולחן',
                color: 'from-purple-600 to-pink-600',
              },
              {
                step: '3',
                icon: <Users className="w-10 h-10" />,
                title: 'שיתוף קישור',
                desc: 'קבלו קישור ייחודי לשיתוף עם הלקוחות שלכם',
                color: 'from-pink-600 to-red-600',
              },
              {
                step: '4',
                icon: <Zap className="w-10 h-10" />,
                title: 'ניהול אוטומטי',
                desc: 'המערכת מנהלת הכל - הזמנות, רשימת המתנה והודעות',
                color: 'from-red-600 to-red-700',
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-3xl p-8 text-center hover:shadow-2xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-xl`}>
                    {item.step}
                  </div>
                  <div className="flex justify-center mb-4 text-purple-600">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurant-Specific Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-black mb-6">
              <span className="text-gray-900">תכונות מתקדמות</span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">לניהול הזמנות מקומות</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <UtensilsCrossed className="w-10 h-10" />,
                title: 'ניהול מקומות ישיבה גמיש',
                description: 'הגדירו מספר מקום, קיבולת, מינימום הזמנה וסדר תפיסה. שליטה מלאה על הסידור במקום',
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-50',
                image: '/restaurants/italian-restaurant.jpg',
              },
              {
                icon: <Users className="w-10 h-10" />,
                title: 'רשימת המתנה אוטומטית',
                description: 'כשכל השולחנות תפוסים, לקוחות נכנסים אוטומטית לרשימת המתנה. המערכת מנהלת את ההמתנה בצורה חכמה',
                color: 'from-pink-500 to-pink-600',
                bgColor: 'bg-pink-50',
                image: '/restaurants/japanese-restaurant.jpg',
              },
              {
                icon: <Phone className="w-10 h-10" />,
                title: 'שדות מידע מותאמים',
                description: 'אספו את המידע שאתם צריכים: טלפון, כמות סועדים, העדפות תפריט, אלרגיות ועוד. בניית טופס מותאם אישית',
                color: 'from-purple-600 to-purple-700',
                bgColor: 'bg-purple-50',
                image: '/restaurants/french-bistro.jpg',
              },
              {
                icon: <BarChart3 className="w-10 h-10" />,
                title: 'דוחות ומעקב בזמן אמת',
                description: 'ראו בזמן אמת כמה שולחנות תפוסים, מי הזמין, מי ממתין. ניהול מלא ושליטה מקיפה',
                color: 'from-red-500 to-red-600',
                bgColor: 'bg-red-50',
                image: '/restaurants/steakhouse.jpg',
              },
              {
                icon: <MessageCircle className="w-10 h-10" />,
                title: 'התראות ואישורים אוטומטיים',
                description: 'לקוחות מקבלים אישור הזמנה עם קוד ייחודי. אפשרות לשלוח תזכורות לפני האירוע',
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-50',
                image: '/restaurants/mediterranean-cafe.jpg',
              },
              {
                icon: <Shield className="w-10 h-10" />,
                title: 'מדיניות ביטול חכמה',
                description: 'הגדירו מדיניות ביטול עם זמן מינימלי, אפשרות לדרוש סיבת ביטול, ושחרור שולחנות אוטומטי',
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50',
                image: '/restaurants/asian-fusion.jpg',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`${feature.bgColor} border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300`}
              >
                {/* Feature Image */}
                <div className="relative h-48 w-full">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                </div>

                {/* Feature Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-gray-900 text-right">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-right">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Reservations Work - Detailed Explanation */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black mb-6">
              <span className="text-gray-900">איך מערכת ההזמנות</span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">עובדת בפועל?</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              הבנת המערכת תעזור לכם לנצל אותה בצורה המיטבית
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* What are Tables */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">מה זה שולחנות?</h3>
                  <p className="text-gray-600">יחידות הזמנה נפרדות במסעדה</p>
                </div>
              </div>

              <div className="space-y-4 text-right">
                <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                  <p className="font-bold text-purple-900 mb-2">🪑 כל שולחן כולל:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>מספר שולחן</strong> - למשל "שולחן 1", "שולחן VIP"</li>
                    <li>• <strong>קיבולת</strong> - כמה אנשים יכולים לשבת (2, 4, 6, 8...)</li>
                    <li>• <strong>מינימום הזמנה</strong> - סכום מינימלי בש"ח (אופציונלי)</li>
                    <li>• <strong>סדר תפיסה</strong> - באיזה סדר השולחנות מוצגים ללקוחות</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                  <p className="font-bold text-green-900 mb-2">✅ היתרון:</p>
                  <p className="text-gray-700">
                    לקוחות רואים בדיוק איזה שולחנות פנויים וכמה אנשים יכולים לשבת.
                    זה יותר ברור ומקצועי מאשר "נשארו 10 מקומות".
                  </p>
                </div>
              </div>
            </div>

            {/* How Customers Book */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-pink-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">איך לקוחות מזמינים?</h3>
                  <p className="text-gray-600">תהליך פשוט ונוח בנייד</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-700 font-bold flex-shrink-0">1</div>
                  <p className="text-gray-700">לקוח נכנס לקישור ההזמנה שלכם</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-700 font-bold flex-shrink-0">2</div>
                  <p className="text-gray-700">רואה רשימה של שולחנות פנויים עם קיבולת</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-700 font-bold flex-shrink-0">3</div>
                  <p className="text-gray-700">בוחר שולחן מתאים (לפי גודל החבורה)</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-700 font-bold flex-shrink-0">4</div>
                  <p className="text-gray-700">ממלא פרטים (טלפון, כמות סועדים, העדפות)</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-700 font-bold flex-shrink-0">5</div>
                  <p className="text-gray-700">לוחץ "אישור" ומקבל קוד הזמנה ייחודי</p>
                </div>

                <div className="bg-pink-50 rounded-xl p-4 border-2 border-pink-200 mt-4">
                  <p className="text-pink-900 font-bold mb-1">⚡ תהליך מהיר!</p>
                  <p className="text-gray-700 text-sm">
                    ממוצע של 30 שניות להזמנה. הכל ברור, פשוט ועובד מכל טלפון.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tables vs Capacity Comparison */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border-2 border-indigo-200">
            <h3 className="text-2xl sm:text-3xl font-black text-center mb-8 text-gray-900">
              מערכת שולחנות 🆚 מערכת קיבולת רגילה
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Regular Capacity System */}
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-300">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">📊</div>
                  <h4 className="text-xl font-bold text-gray-900">מערכת קיבולת רגילה</h4>
                  <p className="text-sm text-gray-600">טובה לאירועים כמו הרצאות</p>
                </div>

                <div className="space-y-3 text-right">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">❌</span>
                    <p className="text-gray-700 text-sm">לקוח רואה רק "נשארו 20 מקומות"</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">❌</span>
                    <p className="text-gray-700 text-sm">אין אפשרות לבחור מיקום מסוים</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">❌</span>
                    <p className="text-gray-700 text-sm">לא מתאים למסעדות עם שולחנות שונים</p>
                  </div>
                </div>
              </div>

              {/* Table-Based System */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-300 shadow-lg">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🪑</div>
                  <h4 className="text-xl font-bold text-purple-900">מערכת שולחנות חכמה</h4>
                  <p className="text-sm text-purple-700">מושלמת למסעדות ובתי קפה</p>
                </div>

                <div className="space-y-3 text-right">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    <p className="text-gray-700 text-sm">לקוח רואה "שולחן 1 (4 מקומות) - פנוי"</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    <p className="text-gray-700 text-sm">יכול לבחור שולחן מתאים לגודל החבורה</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    <p className="text-gray-700 text-sm">שליטה מלאה על קיבולת ומינימום הזמנה</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✅</span>
                    <p className="text-gray-700 text-sm">ניהול מקצועי עם רשימת המתנה אוטומטית</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-World Example */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-2xl p-8 sm:p-12 border-2 border-purple-200">
            <div className="text-center space-y-6">
              <div className="text-5xl mb-4">🍽️</div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
                דוגמה מהחיים האמיתיים
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                מסעדה עם 10 שולחנות. כל שולחן מכיל 4 סועדים.
                <br />
                מינימום הזמנה: 200 ש"ח לשולחן.
              </p>

              <div className="bg-white rounded-2xl p-6 border-2 border-purple-300">
                <h3 className="text-xl font-bold mb-4 text-purple-900">מה קורה במערכת?</h3>
                <div className="space-y-3 text-right">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">לקוח מזמין שולחן דרך הקישור → בוחר שולחן פנוי ומאשר</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">השולחן מסומן כתפוס אוטומטית + קוד אישור ייחודי נשלח ללקוח</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">כשכל 10 השולחנות תפוסים → לקוחות נוספים נכנסים לרשימת המתנה</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">אם לקוח מבטל → אתם יכולים לקדם מרשימת ההמתנה בלחיצה</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6 border-2 border-green-300">
                <p className="text-lg font-bold text-green-900 mb-2">התוצאה?</p>
                <p className="text-gray-700">
                  אין בלגן, אין הזמנות כפולות, אין לקוחות מאוכזבים.
                  <br />
                  רק ניהול מקצועי, נוח ואוטומטי!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Contact */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-12 border border-green-200">
            <div className="text-center mb-8">
              <MessageCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
                יש שאלות?
              </h2>
              <p className="text-lg text-gray-700">
                דברו איתנו ישירות בוואטסאפ - נשמח לעזור!
              </p>
            </div>

            <a
              href="https://wa.me/972555020829"
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-md mx-auto"
            >
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl hover:shadow-green-500/50 transition-all hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-xl">שלחו הודעה</div>
                    <div className="text-green-50 text-lg font-mono">055-502-0829</div>
                  </div>
                </div>
                <ArrowLeft className="w-8 h-8 text-white" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl sm:text-6xl font-black mb-8">
            מוכנים להתחיל?
          </h2>
          <p className="text-xl sm:text-2xl mb-12 opacity-95">
            הצטרפו לעסקים שכבר מנהלים הזמנות מקומות בצורה מקצועית עם kartis.info
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/admin/events/new-restaurant"
              className="px-10 py-5 text-xl font-bold text-purple-700 bg-white rounded-2xl hover:bg-gray-50 transition-all shadow-2xl hover:scale-110 flex items-center gap-3"
            >
              <span className="text-2xl">🍽️</span>
              <span>פתחו מערכת הזמנות</span>
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Link
              href="/admin/signup"
              className="px-10 py-5 text-xl font-bold text-white bg-white/10 backdrop-blur-sm border-2 border-white rounded-2xl hover:bg-white/20 transition-all"
            >
              הרשמה חינמית
            </Link>
          </div>

          <p className="mt-8 text-lg opacity-90">
            ללא כרטיס אשראי • התחילו תוך 5 דקות • תמיכה בעברית 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Ticket className="w-8 h-8 text-red-400" />
            <span className="text-2xl font-black">kartis.info - הזמנת שולחנות</span>
          </div>
          <p className="text-gray-400 mb-6">
            מערכת ניהול הזמנות מקומות ישיבה למסעדות, בתי קפה, בארים ואירועים
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              דף הבית
            </Link>
            <Link href="/admin/signup" className="text-gray-400 hover:text-white transition-colors">
              הרשמה
            </Link>
            <Link href="/admin/events/new-restaurant" className="text-gray-400 hover:text-white transition-colors">
              צור אירוע
            </Link>
            <a href="https://wa.me/972555020829" className="text-gray-400 hover:text-white transition-colors">
              צור קשר
            </a>
          </div>
          <p className="text-gray-500 mt-8">© 2025 kartis.info • כל הזכויות שמורות</p>
        </div>
      </footer>

      {/* Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Ticket,
  Zap,
  Shield,
  Users,
  Calendar,
  CheckCircle,
  BarChart3,
  Lock,
  Star,
  ArrowLeft,
  Download,
  Clock,
  Target,
  TrendingUp,
  Globe,
  Phone,
  MessageCircle,
  Mail,
  Trophy
} from 'lucide-react'
import UseCaseCarousel from './UseCaseCarousel'
import UseCaseTabs from './UseCaseTabs'

export default function LandingPage() {
  const [statsAnimated, setStatsAnimated] = useState(false)

  useEffect(() => {
    setStatsAnimated(true)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Ultra-Modern Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">kartis.info</span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Link
                href="/admin/login"
                className="px-3 sm:px-5 py-2.5 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
              >
                התחבר
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Ultra Eye-Catching */}
      <section className="pt-20 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center space-y-8">
            {/* Eye-Catching Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 sm:px-5 py-2.5 rounded-full shadow-lg border border-red-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs sm:text-sm font-bold text-gray-900">מערכת ניהול אירועים מקצועית</span>
            </div>

            {/* Massive Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black leading-tight text-gray-900">
              נהלו אירועים – פשוט, חכם ומדויק
            </h1>

            {/* Compelling Value Proposition */}
            <p className="text-base sm:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto font-medium">
              מערכת ניהול אירועים מלאה עם רישום מקוון, מגבלת מקומות, רשימת המתנה חכמה וניהול משתתפים בזמן אמת.
              כל מה שצריך כדי לארגן כל אירוע – במקום אחד.
            </p>

            {/* Use Case Carousel - Show Versatility */}
            <div className="pt-8">
              <UseCaseCarousel autoPlayInterval={3000} pauseOnHover={true} />
            </div>

            {/* Powerful CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link
                href="/admin/login"
                className="px-8 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-xl transition-all max-w-[80%] sm:max-w-none"
              >
                כניסה למערכת
              </Link>
            </div>

            {/* Trust Indicators with Icons */}
            <div className="flex flex-wrap gap-8 justify-center items-center pt-8 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="font-semibold">התקנה תוך 3 דקות</span>
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-semibold">100% מאובטח</span>
              </span>
              <span className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                <span className="font-semibold">תמיכה בעברית מלאה</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Banner - Attention Grabber */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-purple-200 p-6 sm:p-8 lg:p-10">
            <div className="text-center space-y-4 sm:space-y-5">
              {/* Hook */}
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-3xl sm:text-4xl">🎟️</span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900">
                  דוגמה: יש לכם 40 כרטיסים.......
                </h2>
              </div>

              {/* Pain Points */}
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 leading-relaxed font-medium">
                לא רוצים לריב, לספור, או לענות למאות הודעות?
              </p>

              {/* Solution Flow */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 sm:p-6 border border-purple-200">
                <p className="text-base sm:text-lg text-gray-800 leading-relaxed mb-3">
                  פשוט יוצרים אירוע ב־<span className="font-bold text-red-600">Kartis.info</span>, מגדירים את התנאים,<br className="hidden sm:block" />
                  והמערכת יוצרת לכם קישור הרשמה אוטומטי.
                </p>
                <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-lg sm:text-xl">
                  <span className="text-2xl">🔗</span>
                  <span>שולחים את הקישור – וזהו!</span>
                </div>
              </div>

              {/* Benefit */}
              <div className="bg-green-50 rounded-xl p-5 sm:p-6 border-2 border-green-300">
                <p className="text-base sm:text-lg text-gray-800 leading-relaxed mb-3">
                  ה־40 הראשונים יקבלו כרטיס,<br className="hidden sm:block" />
                  והשאר נכנסים אוטומטית לרשימת המתנה מסודרת.
                </p>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm sm:text-base font-bold text-green-800">
                  <span>בלי בלגן</span>
                  <span>בלי לחץ</span>
                  <span>בלי לריב</span>
                </div>
                <p className="mt-3 text-lg sm:text-xl font-black text-green-900">
                  רק סדר ונוחות.
                </p>
              </div>

              {/* CTA */}
              <Link
                href="/admin/login"
                className="inline-block px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 mt-2"
              >
                נסו עכשיו חינם
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features - Clean & Powerful */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-6">
              <span className="text-gray-900">כל מה שאתם צריכים</span>
              <br />
              <span className="bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">במקום אחד</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
              תכונות מתקדמות לכל סוג של ארגון או קבוצה
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="w-10 h-10" />,
                title: 'יצירת אירועים מהירה',
                description: 'צרו אירוע מלא תוך 3 דקות עם כל הפרטים: תאריך, מיקום, הגבלת משתתפים ושדות מותאמים אישית',
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50',
              },
              {
                icon: <Zap className="w-10 h-10" />,
                title: 'רשימת המתנה אוטומטית',
                description: 'כשהאירוע מתמלא, המערכת מעבירה משתתפים אוטומטית לרשימת המתנה ומנהלת אותם בצורה חכמה',
                color: 'from-yellow-500 to-orange-600',
                bgColor: 'bg-orange-50',
              },
              {
                icon: <Users className="w-10 h-10" />,
                title: 'ניהול צוות מתקדם',
                description: 'הזמינו עמיתים עם הרשאות שונות: מנהל מלא, עורך או צופה בלבד. שיתוף פעולה קל ובטוח',
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-50',
              },
              {
                icon: <BarChart3 className="w-10 h-10" />,
                title: 'דוחות בזמן אמת',
                description: 'לוח בקרה מלא עם מעקב אחר אירועים פעילים, נרשמים, רשימת המתנה ושיעורי תפוסה',
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-50',
              },
              {
                icon: <Download className="w-10 h-10" />,
                title: 'יצוא נתונים מיידי',
                description: 'הורידו את כל רשימת המשתתפים לקובץ CSV עם כל השדות המותאמים בלחיצת כפתור',
                color: 'from-pink-500 to-pink-600',
                bgColor: 'bg-pink-50',
              },
              {
                icon: <Lock className="w-10 h-10" />,
                title: 'אבטחה מקסימלית',
                description: 'בידוד מוחלט בין ארגונים, הצפנת נתונים מלאה והרשאות מדויקות לכל משתמש',
                color: 'from-red-500 to-red-600',
                bgColor: 'bg-red-50',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`${feature.bgColor} border border-gray-200 rounded-3xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300 group`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 text-right">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-right">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Visual Steps */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-6 text-gray-900">
              התחילו תוך <span className="text-red-600">3 דקות</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-600">פשוט, מהיר וללא סיבוכים</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-1 bg-gradient-to-r from-red-500 via-purple-500 to-red-500"></div>

            {[
              {
                step: '01',
                title: 'הרשמה מהירה',
                desc: 'צרו חשבון עם אימייל או Google תוך 30 שניות',
                icon: <Users className="w-12 h-12" />,
                color: 'from-red-500 to-red-600'
              },
              {
                step: '02',
                title: 'יצירת אירוע',
                desc: 'מלאו פרטים בסיסיים והגדירו את כל השדות שאתם צריכים',
                icon: <Calendar className="w-12 h-12" />,
                color: 'from-purple-500 to-purple-600'
              },
              {
                step: '03',
                title: 'קבלו רישומים',
                desc: 'שתפו קישור והתחילו לקבל רישומים עם ניהול אוטומטי מלא',
                icon: <Zap className="w-12 h-12" />,
                color: 'from-red-500 to-red-600'
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 text-center hover:shadow-2xl hover:border-red-300 transition-all duration-300 hover:-translate-y-2">
                  <div className={`w-20 h-20 bg-gradient-to-br ${item.color} text-white rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-xl relative z-10`}>
                    {item.step}
                  </div>
                  <div className="flex justify-center mb-4 text-gray-400">{item.icon}</div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Start - SUPER SIMPLE FOR NON-TECHNICAL USERS */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-gray-900">
              איך להתחיל? פשוט מאוד!
            </h2>
            <p className="text-lg sm:text-2xl text-gray-600">
              3 צעדים פשוטים וגמרנו
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-8 lg:p-12 border-2 border-gray-100">
            <div className="space-y-8 sm:space-y-10">
              {/* Step 1 */}
              <div className="flex gap-3 sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 text-gray-900">לחצו על "כניסה למערכת"</h3>
                  <p className="text-sm sm:text-lg lg:text-xl text-gray-700 leading-relaxed">
                    זה הכפתור הלבן למעלה בעמוד. אפשר גם ללחוץ
                    <Link href="/admin/login" className="inline-block text-red-600 font-bold underline mx-1 sm:mx-2">
                      כאן
                    </Link>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-4">
                <div className="flex gap-3 sm:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-lg">
                      2
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 text-gray-900">תירשמו</h3>
                    <p className="text-sm sm:text-lg lg:text-xl text-gray-700 leading-relaxed">
                      המערכת תבקש מכם להירשם. אפשר להירשם עם:
                    </p>
                  </div>
                </div>

                {/* Signup Options - Full Width */}
                <div className="bg-green-50 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4 w-full flex flex-col items-center">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-xl font-bold text-gray-900">חשבון גוגל (הכי מהיר!)</span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-center text-gray-400 text-sm sm:text-base font-medium">או</div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-xl font-bold text-gray-900">אימייל וסיסמה</span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-4">
                <div className="flex gap-3 sm:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-lg">
                      ✓
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 text-gray-900">זהו! אתם בפנים</h3>
                    <p className="text-sm sm:text-lg lg:text-xl text-gray-700 leading-relaxed">
                      המערכת תבקש מכם לתת שם לארגון שלכם, ואז תוכלו להתחיל ליצור אירועים.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6 w-full text-center">
                  <p className="text-sm sm:text-lg text-blue-900 font-semibold">
                    💡 לא צריך להבין בטכנולוגיה! המערכת פשוטה ואינטואיטיבית.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 pt-8 border-t-2 border-gray-100 text-center">
              <Link
                href="/admin/login"
                className="inline-block px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 max-w-[80%] sm:max-w-none"
              >
                התחילו עכשיו
              </Link>
              <p className="mt-4 text-sm sm:text-base text-gray-600">
                לוקח 2 דקות ⏱️
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-6 text-gray-900">שאלות נפוצות</h2>
            <p className="text-base sm:text-xl text-gray-600">כל מה שרציתם לדעת על המערכת</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'כמה זמן לוקח להתחיל לעבוד עם המערכת?',
                a: 'ההרשמה לוקחת פחות מדקה, ותוכלו ליצור את האירוע הראשון שלכם תוך 3-5 דקות. הממשק אינטואיטיבי ולא דורש הדרכה.',
              },
              {
                q: 'האם המערכת מתאימה למכשירים ניידים?',
                a: 'בהחלט! המערכת מותאמת במלואה לטלפונים ניידים, טאבלטים ומחשבים. ניתן לנהל אירועים מכל מכשיר בכל מקום.',
              },
              {
                q: 'האם המידע של הארגון שלי מאובטח?',
                a: 'כן. כל ארגון רואה רק את המידע שלו בלבד. אנחנו משתמשים בהצפנה מתקדמת ובידוד מוחלט של נתונים.',
              },
              {
                q: 'האם יש תמיכה טכנית?',
                a: 'כמובן! אנחנו זמינים 24/7 בוואטסאפ, מייל וטלפון. התמיכה בעברית ומהירה.',
              },
              {
                q: 'מה קורה כשהאירוע מתמלא?',
                a: 'המערכת מעבירה אוטומטית משתתפים לרשימת המתנה ומנהלת אותם בצורה חכמה. כשמשתחרר מקום, אתם יכולים לקדם מרשימת ההמתנה בלחיצה.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 text-right hover:border-red-300 hover:shadow-lg transition-all">
                <h3 className="text-xl font-bold mb-3 flex items-center justify-end gap-3 text-gray-900">
                  <span>{faq.q}</span>
                  <CheckCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}

            {/* Tabbed Use Cases - Progressive Disclosure */}
            <div className="mt-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-4xl font-black mb-4 bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
                  למי זה מתאים?
                </h3>
                <p className="text-base sm:text-xl text-gray-700 font-medium max-w-3xl mx-auto">
                  מערכת הרישום מושלמת לכל ארגון, קבוצה או אדם שמארגן אירועים עם מספר משתתפים מוגבל
                </p>
              </div>

              <UseCaseTabs />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us - WhatsApp */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-10 w-72 h-72 bg-green-300 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-300 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-16 border border-green-200/50">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-xl animate-bounce-slow">
                <MessageCircle className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                צריכים עזרה?
              </h2>
              <p className="text-lg sm:text-2xl text-gray-700 font-medium">
                דברו איתנו ישירות בוואטסאפ!
              </p>
            </div>

            {/* WhatsApp Button */}
            <a
              href="https://wa.me/972555020829"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group block max-w-md mx-auto"
            >
              {/* Glow Effect on Hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>

              {/* Main Button */}
              <div className="relative flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-green-500/50 transition-all duration-300 transform group-hover:scale-105">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-25"></div>
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-sm sm:text-base lg:text-xl mb-1">
                      שלחו הודעה בוואטסאפ
                    </div>
                    <div className="flex items-center justify-end gap-2 text-green-50">
                      <span className="text-xs sm:text-sm lg:text-lg font-mono">055-502-0829</span>
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8 text-white group-hover:-translate-x-2 transition-transform duration-300" />
              </div>
            </a>

            {/* Features/Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">מענה מהיר</h3>
                <p className="text-gray-600">תשובות תוך דקות</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">תמיכה אישית</h3>
                <p className="text-gray-600">נענה לכל שאלה</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">תמיכה בעברית</h3>
                <p className="text-gray-600">שירות מקצועי ואדיב</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Super Strong */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-500 via-red-600 to-purple-600 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black mb-8 leading-tight">
            מוכנים להתחיל?
          </h2>
          <p className="text-lg sm:text-2xl lg:text-3xl mb-12 opacity-95 font-medium leading-relaxed">
            הצטרפו לארגונים שכבר מנהלים אירועים בצורה מקצועית
          </p>

          {/* Features Grid in CTA */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            {[
              { icon: <Users />, text: 'צוות עבודה משותף' },
              { icon: <BarChart3 />, text: 'דוחות בזמן אמת' },
              { icon: <Download />, text: 'יצוא נתונים מיידי' },
              { icon: <Zap />, text: 'רשימת המתנה חכמה' },
              { icon: <Shield />, text: 'אבטחה מקסימלית' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-center gap-3 text-white/90">
                <span className="text-lg font-semibold">{item.text}</span>
                <div className="w-5 h-5">{item.icon}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full">
            <Link
              href="/admin/signup"
              className="group px-8 sm:px-10 py-3 sm:py-5 text-base sm:text-lg font-bold text-red-600 bg-white rounded-2xl hover:bg-gray-50 transition-all shadow-2xl hover:scale-110 flex items-center gap-3 max-w-[80%] sm:max-w-none"
            >
              <span>צור חשבון עכשיו</span>
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-2 transition-transform" />
            </Link>
            <Link
              href="/admin/login"
              className="px-8 sm:px-10 py-3 sm:py-5 text-base sm:text-lg font-bold text-white bg-white/10 backdrop-blur-sm border-2 border-white rounded-2xl hover:bg-white/20 transition-all max-w-[80%] sm:max-w-none"
            >
              כניסה למערכת
            </Link>
          </div>

          <p className="mt-8 text-lg opacity-90">
            התחילו תוך דקות • תמיכה בעברית 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 text-right mb-12">
            <div>
              <div className="flex items-center gap-3 justify-end mb-6">
                <span className="text-2xl font-black">kartis.info</span>
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                מערכת ניהול אירועים מתקדמת לכל סוג של ארגון וקבוצה
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">מוצר</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/admin/signup" className="inline-block py-2 hover:text-white transition-colors font-medium">התחל עכשיו</Link></li>
                <li><Link href="/#features" className="inline-block py-2 hover:text-white transition-colors font-medium">תכונות</Link></li>
                <li><Link href="/#how-it-works" className="inline-block py-2 hover:text-white transition-colors font-medium">איך זה עובד</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">תמיכה</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/#faq" className="inline-block py-2 hover:text-white transition-colors font-medium">שאלות נפוצות</Link></li>
                <li><Link href="/admin/help" className="inline-block py-2 hover:text-white transition-colors font-medium">מרכז עזרה</Link></li>
                <li><a href="mailto:support@kartis.info" className="inline-block py-2 hover:text-white transition-colors font-medium">צור קשר</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">משפטי</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="inline-block py-2 hover:text-white transition-colors font-medium">מדיניות פרטיות</Link></li>
                <li><Link href="/terms" className="inline-block py-2 hover:text-white transition-colors font-medium">תנאי שימוש</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">© 2025 kartis.info • כל הזכויות שמורות</p>
          </div>
        </div>
      </footer>

      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
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

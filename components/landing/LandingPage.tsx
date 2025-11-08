'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Ticket,
  MessageCircle,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Calendar,
  CreditCard,
  CheckCircle,
  Smartphone,
  BarChart3,
  Lock,
  ArrowLeft,
  Sparkles,
  Star
} from 'lucide-react'

export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false)

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-gray-900 overflow-x-hidden">
      {/* Floating Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Ticket className="w-8 h-8 text-[#FF6B6B]" />
              <span className="text-2xl font-bold">kartis.info</span>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                התחבר
              </Link>
              <Link
                href="/admin/signup"
                className="px-6 py-2 text-sm font-medium text-white bg-[#FF6B6B] rounded-full hover:bg-[#ff5252] transition-all shadow-lg hover:shadow-xl"
              >
                התחל בחינם
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Maximalist Collage Style */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#FF6B6B]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-8 text-right">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-200">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">מעל 100+ בתי ספר כבר משתמשים</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight">
                ניהול כרטיסים
                <br />
                <span className="text-[#FF6B6B]">חכם ופשוט</span>
                <br />
                לבית הספר שלך
              </h1>

              <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed">
                מערכת ניהול אירועים חכמה - רישום מהיר למקומות מוגבלים, ניהול פשוט של כרטיסים חינמיים
              </p>

              <div className="flex flex-wrap gap-4 justify-end">
                <Link
                  href="/admin/signup"
                  className="group px-8 py-4 text-lg font-bold text-white bg-black rounded-full hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  התחל בחינם עכשיו
                </Link>
                <Link
                  href="/admin/login"
                  className="px-8 py-4 text-lg font-bold text-black bg-white rounded-full hover:bg-gray-50 transition-all shadow-lg border-2 border-black"
                >
                  יש לי חשבון
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 justify-end text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>ללא כרטיס אשראי</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>התקנה תוך 5 דקות</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>תמיכה בעברית</span>
                </div>
              </div>
            </div>

            {/* Right Column - Feature Cards Collage */}
            <div className="relative h-[600px]">
              {/* Card 1 - Top Left */}
              <div className="absolute top-0 left-0 w-56 bg-white p-6 rounded-2xl shadow-2xl border-4 border-black rotate-[-5deg] hover:rotate-0 transition-transform hover:z-10">
                <MessageCircle className="w-12 h-12 text-green-600 mb-3" />
                <h3 className="text-lg font-bold mb-2 text-right">WhatsApp אוטומטי</h3>
                <p className="text-sm text-gray-600 text-right">הודעות אישור מיידיות</p>
              </div>

              {/* Card 2 - Top Right */}
              <div className="absolute top-20 right-0 w-60 bg-[#FF6B6B] text-white p-6 rounded-2xl shadow-2xl rotate-[8deg] hover:rotate-0 transition-transform hover:z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-bold">בקרוב</span>
                  <CreditCard className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-right">תשלומים מאובטחים</h3>
                <p className="text-sm text-white/90 text-right">אשראי וביט בקליק</p>
              </div>

              {/* Card 3 - Middle Left */}
              <div className="absolute top-40 left-10 w-64 bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 rounded-2xl shadow-2xl rotate-[-3deg] hover:rotate-0 transition-transform hover:z-10">
                <BarChart3 className="w-12 h-12 mb-3" />
                <h3 className="text-lg font-bold mb-2 text-right">דוחות בזמן אמת</h3>
                <p className="text-sm text-white/90 text-right">מעקב מלא אחרי המכירות</p>
              </div>

              {/* Card 4 - Bottom Right */}
              <div className="absolute bottom-20 right-10 w-56 bg-yellow-400 p-6 rounded-2xl shadow-2xl border-4 border-black rotate-[5deg] hover:rotate-0 transition-transform hover:z-10">
                <Smartphone className="w-12 h-12 text-black mb-3" />
                <h3 className="text-lg font-bold mb-2 text-right">נייד בעיקר</h3>
                <p className="text-sm text-gray-800 text-right">עובד מכל מכשיר</p>
              </div>

              {/* Card 5 - Bottom Left */}
              <div className="absolute bottom-0 left-0 w-60 bg-black text-white p-6 rounded-2xl shadow-2xl rotate-[-8deg] hover:rotate-0 transition-transform hover:z-10">
                <Shield className="w-12 h-12 text-green-400 mb-3" />
                <h3 className="text-lg font-bold mb-2 text-right">מאובטח 100%</h3>
                <p className="text-sm text-gray-300 text-right">הצפנה מלאה של נתונים</p>
              </div>

              {/* Center Badge */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-4 border-[#FF6B6B] rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-2xl z-20 hover:scale-110 transition-transform">
                <span className="text-4xl font-black text-[#FF6B6B]">14</span>
                <span className="text-sm font-bold">ימים חינם</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Case Highlight */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50 border-y-4 border-blue-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-blue-500">
            <h3 className="text-3xl font-black mb-4">מושלם לכרטיסים חינמיים עם מקומות מוגבלים</h3>
            <p className="text-xl text-gray-700 mb-6">
              יש לכם 40 כרטיסים לאירוע ו-600 תלמידים? המערכת שלנו מבטיחה שמי שנרשם <strong>ראשון - מקבל</strong>
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-right">
              <div className="bg-green-50 p-4 rounded-xl border-2 border-green-500">
                <CheckCircle className="w-8 h-8 text-green-600 mb-2 mr-auto" />
                <h4 className="font-bold mb-1">ללא בלבול</h4>
                <p className="text-sm text-gray-600">רק מי שהספיק יקבל כרטיס</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-500">
                <Zap className="w-8 h-8 text-blue-600 mb-2 mr-auto" />
                <h4 className="font-bold mb-1">מהיר וצודק</h4>
                <p className="text-sm text-gray-600">מנגנון אמין למניעת הרשמה כפולה</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-500">
                <Users className="w-8 h-8 text-purple-600 mb-2 mr-auto" />
                <h4 className="font-bold mb-1">רשימת המתנה אוטומטית</h4>
                <p className="text-sm text-gray-600">מעקב אחרי מי שלא הספיק</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-white border-y-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-[#FF6B6B]">100+</div>
              <div className="text-sm text-gray-600 mt-2">בתי ספר משתמשים</div>
            </div>
            <div>
              <div className="text-4xl font-black text-blue-600">5,000+</div>
              <div className="text-sm text-gray-600 mt-2">אירועים נוצרו</div>
            </div>
            <div>
              <div className="text-4xl font-black text-green-600">50K+</div>
              <div className="text-sm text-gray-600 mt-2">כרטיסים נמכרו</div>
            </div>
            <div>
              <div className="text-4xl font-black text-yellow-600">4.9★</div>
              <div className="text-sm text-gray-600 mt-2">דירוג ממוצע</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Maximalist Layout */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16">
            למה בתי ספר בוחרים <span className="text-[#FF6B6B]">kartis.info</span>?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <MessageCircle className="w-8 h-8" />,
                title: 'WhatsApp אוטומטי',
                description: 'הודעות אישור מיידיות למשתתפים עם כל הפרטים',
                color: 'bg-green-100 border-green-500 text-green-700',
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: 'ניהול אירועים קל',
                description: 'צור אירוע תוך 2 דקות - ממשק פשוט ואינטואיטיבי',
                color: 'bg-blue-100 border-blue-500 text-blue-700',
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: 'תשלומים מאובטחים',
                description: 'אשראי, PayPal, ביט - כל אפשרויות התשלום במקום אחד',
                color: 'bg-purple-100 border-purple-500 text-purple-700',
                badge: 'בקרוב',
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: 'דוחות מפורטים',
                description: 'מעקב בזמן אמת אחרי מכירות ורווחיות',
                color: 'bg-orange-100 border-orange-500 text-orange-700',
              },
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: 'מותאם לנייד',
                description: 'עובד מושלם על כל מכשיר - טלפון, טאבלט או מחשב',
                color: 'bg-pink-100 border-pink-500 text-pink-700',
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'אבטחה מלאה',
                description: 'הצפנת נתונים, GDPR compliant, גיבויים אוטומטיים',
                color: 'bg-red-100 border-red-500 text-red-700',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`${feature.color} border-4 rounded-2xl p-6 hover:scale-105 transition-transform shadow-lg hover:shadow-2xl text-right relative`}
              >
                <div className="flex justify-between items-start mb-4">
                  {feature.badge && (
                    <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-bold">
                      {feature.badge}
                    </span>
                  )}
                  <div className={!feature.badge ? 'mr-auto' : ''}>{feature.icon}</div>
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-sm opacity-90">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16">
            איך זה <span className="text-[#FF6B6B]">עובד</span>?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Arrow 1 */}
            <div className="hidden md:block absolute top-1/3 left-[35%] w-24 h-1 bg-gray-300 z-0" />
            {/* Arrow 2 */}
            <div className="hidden md:block absolute top-1/3 right-[35%] w-24 h-1 bg-gray-300 z-0" />

            {[
              { step: '1', title: 'הרשמה בקליק', desc: 'צור חשבון חינם תוך 30 שניות', icon: <Users className="w-12 h-12" /> },
              { step: '2', title: 'יצירת אירוע', desc: 'הוסף פרטי אירוע ומחירים', icon: <Calendar className="w-12 h-12" /> },
              { step: '3', title: 'שתף וקבל תשלומים', desc: 'שלח קישור ותתחיל למכור', icon: <Zap className="w-12 h-12" /> },
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 bg-[#F5F3EF] border-4 border-black rounded-2xl p-8 text-center hover:scale-105 transition-transform shadow-xl">
                <div className="w-16 h-16 bg-[#FF6B6B] text-white rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4">
                  {item.step}
                </div>
                <div className="flex justify-center mb-4 text-black">{item.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#FF6B6B] to-[#ff5252] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-6">התחל בחינם היום!</h2>
          <p className="text-2xl mb-8 opacity-90">
            חינם לגמרי • ללא כרטיס אשראי • עד 100 רישומים
          </p>

          <div className="bg-white text-gray-900 rounded-3xl p-8 shadow-2xl border-4 border-black max-w-md mx-auto mb-8">
            <div className="text-6xl font-black mb-2">₪0</div>
            <div className="text-xl mb-6">תוכנית חינמית לצמיתות</div>
            <ul className="space-y-3 text-right mb-6">
              <li className="flex items-center gap-2 justify-end">
                <span>עד 3 אירועים</span>
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              </li>
              <li className="flex items-center gap-2 justify-end">
                <span>100 רישומים לחודש</span>
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              </li>
              <li className="flex items-center gap-2 justify-end">
                <span>הודעות WhatsApp</span>
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              </li>
              <li className="flex items-center gap-2 justify-end">
                <span>תמיכה 24/7</span>
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              </li>
            </ul>
          </div>

          <Link
            href="/admin/signup"
            className="inline-block px-12 py-5 text-xl font-bold text-[#FF6B6B] bg-white rounded-full hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
          >
            התחל עכשיו - חינם לגמרי
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16">שאלות נפוצות</h2>

          <div className="space-y-6">
            {[
              {
                q: 'האם kartis.info חינמי?',
                a: 'כן! kartis.info מציעה תוכנית חינמית לצמיתות ללא צורך בכרטיס אשראי. התוכנית החינמית כוללת עד 3 אירועים ו-100 רישומים לחודש.',
              },
              {
                q: 'האם ניתן לגבות תשלום עבור כרטיסים?',
                a: 'כרגע המערכת מתמחה בניהול כרטיסים חינמיים עם מקומות מוגבלים (מי שנרשם ראשון מקבל). אפשרות תשלום תתווסף בקרוב.',
              },
              {
                q: 'האם המערכת מתאימה למכשירים ניידים?',
                a: 'כן! kartis.info מותאמת במלואה למכשירים ניידים, טאבלטים ומחשבים. ניתן לנהל אירועים מכל מכשיר.',
              },
              {
                q: 'מה קורה אחרי תקופת הניסיון?',
                a: 'תוכל להמשיך עם תוכנית חינמית מוגבלת, או לשדרג לתוכנית פרו עם אירועים ללא הגבלה.',
              },
              {
                q: 'האם יש תמיכה טכנית?',
                a: 'כן! אנחנו זמינים 24/7 בוואטסאפ, מייל וטלפון. תמיכה בעברית כמובן.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-[#F5F3EF] border-2 border-gray-300 rounded-xl p-6 text-right hover:border-[#FF6B6B] transition-colors">
                <h3 className="text-xl font-bold mb-3 flex items-center justify-end gap-2">
                  <span>{faq.q}</span>
                  <CheckCircle className="w-6 h-6 text-[#FF6B6B]" />
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#FF6B6B] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl sm:text-6xl font-black mb-6">מוכנים להתחיל?</h2>
          <p className="text-2xl mb-12 opacity-90">הצטרפו ל-100+ בתי ספר שכבר משתמשים ב-kartis.info</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/signup"
              className="px-12 py-5 text-xl font-bold text-black bg-white rounded-full hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
            >
              התחל בחינם עכשיו
            </Link>
            <Link
              href="/admin/login"
              className="px-12 py-5 text-xl font-bold text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-black transition-all"
            >
              התחבר לחשבון
            </Link>
          </div>

          <p className="mt-8 text-sm opacity-75">
            ללא כרטיס אשראי • ביטול בכל עת • תמיכה בעברית 24/7
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-4 border-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-right">
            <div>
              <div className="flex items-center gap-2 justify-end mb-4">
                <span className="text-2xl font-bold">kartis.info</span>
                <Ticket className="w-8 h-8 text-[#FF6B6B]" />
              </div>
              <p className="text-sm text-gray-600">
                מערכת ניהול כרטיסים מתקדמת לבתי ספר ומוסדות חינוך
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">מוצר</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/admin/signup" className="hover:text-[#FF6B6B]">התחל בחינם</Link></li>
                <li><Link href="/#features" className="hover:text-[#FF6B6B]">תכונות</Link></li>
                <li><Link href="/#pricing" className="hover:text-[#FF6B6B]">מחירים</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">תמיכה</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/#faq" className="hover:text-[#FF6B6B]">שאלות נפוצות</Link></li>
                <li><Link href="/admin/help" className="hover:text-[#FF6B6B]">מרכז עזרה</Link></li>
                <li><a href="mailto:support@kartis.info" className="hover:text-[#FF6B6B]">צור קשר</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">משפטי</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/privacy" className="hover:text-[#FF6B6B]">מדיניות פרטיות</Link></li>
                <li><Link href="/terms" className="hover:text-[#FF6B6B]">תנאי שימוש</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>© 2025 kartis.info • כל הזכויות שמורות</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

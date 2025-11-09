'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Floating Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Ticket className="w-8 h-8 text-red-500" />
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
                className="px-6 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
              >
                התחל בחינם
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - WORLD-CLASS REDESIGN */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-purple-50 opacity-60" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-5 gap-16 items-center">

            {/* Left: Content (3 columns) - FOCUSED & CLEAN */}
            <div className="lg:col-span-3 space-y-8 text-right">
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-gray-700">מעל 100+ בתי ספר כבר משתמשים</span>
              </div>

              {/* Headline - POWERFUL & CLEAR */}
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
                מלאו אירועים תוך דקות,
                <br />
                <span className="text-red-600">לא שעות</span>
              </h1>

              {/* Subtext - VALUE PROPOSITION */}
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                מערכת ניהול אירועים שמשתמשים בה 100+ בתי ספר.
                רישום מהיר למקומות מוגבלים, ניהול פשוט, תוצאות מיידיות.
              </p>

              {/* Single Primary CTA - CONVERSION FOCUSED */}
              <div className="flex gap-4 justify-end">
                <Link
                  href="/admin/signup"
                  className="px-8 py-4 text-lg font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  התחל בחינם עכשיו
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 justify-end text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  ללא כרטיס אשראי
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  התקנה תוך 5 דקות
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  תמיכה בעברית
                </span>
              </div>
            </div>

            {/* Right: Clean Visual (2 columns) - SIMPLIFIED */}
            <div className="lg:col-span-2">
              <div className="relative">
                {/* Hero Illustration - Placeholder */}
                <div className="relative w-full aspect-video mb-8 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-red-100 via-purple-100 to-blue-100 flex items-center justify-center">
                  <Calendar className="w-32 h-32 text-red-500 opacity-30" />
                </div>

                {/* Modern card stack visualization */}
                <div className="relative space-y-4">
                  {/* Card 1 - WhatsApp */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 transform hover:-translate-y-1 transition-transform relative">
                    <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-full border border-orange-200">
                      בקרוב
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 flex-shrink-0 bg-green-100 rounded-xl flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex-1 text-right">
                        <h3 className="font-semibold text-gray-900">WhatsApp אוטומטי</h3>
                        <p className="text-sm text-gray-600">הודעות אישור מיידיות</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 - Analytics */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 transform hover:-translate-y-1 transition-transform">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 flex-shrink-0 bg-blue-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1 text-right">
                        <h3 className="font-semibold text-gray-900">דוחות בזמן אמת</h3>
                        <p className="text-sm text-gray-600">מעקב מלא אחרי המכירות</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 - Security */}
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 transform hover:-translate-y-1 transition-transform">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 flex-shrink-0 bg-red-100 rounded-xl flex items-center justify-center">
                        <Lock className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="flex-1 text-right">
                        <h3 className="font-semibold text-gray-900">מאובטח 100%</h3>
                        <p className="text-sm text-gray-600">הצפנה מלאה של נתונים</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent rounded-3xl blur-3xl -z-10" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Use Case Highlight */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
            <h3 className="text-3xl font-bold mb-4 text-gray-900">ניהול חכם למקומות מוגבלים</h3>
            <p className="text-xl text-gray-700 mb-6">
              הפתרון המושלם לאירועים עם ביקוש גבוה - חלוקה הוגנת של כרטיסים לפי סדר הגעה
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-right">
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 mb-2 mr-auto" />
                <h4 className="font-semibold mb-1 text-gray-900">ללא בלבול</h4>
                <p className="text-sm text-gray-600">רק מי שהספיק יקבל כרטיס</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <Zap className="w-8 h-8 text-blue-600 mb-2 mr-auto" />
                <h4 className="font-semibold mb-1 text-gray-900">מהיר וצודק</h4>
                <p className="text-sm text-gray-600">מנגנון אמין למניעת הרשמה כפולה</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <Users className="w-8 h-8 text-purple-600 mb-2 mr-auto" />
                <h4 className="font-semibold mb-1 text-gray-900">רשימת המתנה אוטומטית</h4>
                <p className="text-sm text-gray-600">מעקב אחרי מי שלא הספיק</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-red-600">100+</div>
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

      {/* Features Grid - SIMPLIFIED */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-gray-900">
            למה בתי ספר בוחרים <span className="text-red-600">kartis.info</span>?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageCircle className="w-8 h-8" />,
                title: 'WhatsApp אוטומטי',
                description: 'הודעות אישור מיידיות למשתתפים עם כל הפרטים',
                color: 'bg-green-50 border-green-200 text-green-700',
                iconBg: 'bg-green-100',
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: 'ניהול אירועים קל',
                description: 'צור אירוע תוך 2 דקות - ממשק פשוט ואינטואיטיבי',
                color: 'bg-blue-50 border-blue-200 text-blue-700',
                iconBg: 'bg-blue-100',
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: 'תשלומים מאובטחים',
                description: 'אשראי, PayPal, ביט - כל אפשרויות התשלום במקום אחד',
                color: 'bg-purple-50 border-purple-200 text-purple-700',
                iconBg: 'bg-purple-100',
                badge: 'בקרוב',
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: 'דוחות מפורטים',
                description: 'מעקב בזמן אמת אחרי מכירות ורווחיות',
                color: 'bg-orange-50 border-orange-200 text-orange-700',
                iconBg: 'bg-orange-100',
              },
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: 'מותאם לנייד',
                description: 'עובד מושלם על כל מכשיר - טלפון, טאבלט או מחשב',
                color: 'bg-pink-50 border-pink-200 text-pink-700',
                iconBg: 'bg-pink-100',
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'אבטחה מלאה',
                description: 'הצפנת נתונים, GDPR compliant, גיבויים אוטומטיים',
                color: 'bg-red-50 border-red-200 text-red-700',
                iconBg: 'bg-red-100',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`${feature.color} border rounded-2xl p-6 hover:shadow-lg transition-all text-right relative`}
              >
                <div className="flex justify-between items-start mb-4">
                  {feature.badge && (
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full font-semibold">
                      {feature.badge}
                    </span>
                  )}
                  <div className={`${feature.iconBg} p-3 rounded-xl ${!feature.badge ? 'mr-auto' : ''}`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm opacity-90">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-gray-900">
            איך זה <span className="text-red-600">עובד</span>?
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', title: 'הרשמה בקליק', desc: 'צור חשבון חינם תוך 30 שניות', icon: <Users className="w-12 h-12" /> },
              { step: '2', title: 'יצירת אירוע', desc: 'הוסף פרטי אירוע ומחירים', icon: <Calendar className="w-12 h-12" /> },
              { step: '3', title: 'שתף וקבל תשלומים', desc: 'שלח קישור ותתחיל למכור', icon: <Zap className="w-12 h-12" /> },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center hover:shadow-lg transition-all">
                <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4">
                  {item.step}
                </div>
                <div className="flex justify-center mb-4 text-gray-900">{item.icon}</div>
                <h3 className="text-2xl font-semibold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - WORLD-CLASS SOCIAL PROOF */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-gray-900">
              מה <span className="text-red-600">אומרים עלינו</span>?
            </h2>
            <p className="text-xl text-gray-600">
              בתי ספר שכבר משתמשים ב-kartis.info משתפים את החוויה שלהם
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'רונית כהן',
                role: 'מנהלת בית ספר',
                school: 'בית ספר אלון תל אביב',
                quote: 'kartis.info חסכה לנו שעות של עבודה ידנית. מערכת פשוטה ויעילה שהורים אוהבים.',
                photo: '/images/testimonials/ronit-cohen.png',
                rating: 5
              },
              {
                name: 'דוד לוי',
                role: 'רכז אירועים',
                school: 'תיכון הרצליה',
                quote: 'לראשונה הצלחנו למלא אירוע תוך דקות, לא שעות. המערכת פשוט עובדת.',
                photo: '/images/testimonials/david-levi.png',
                rating: 5
              },
              {
                name: 'מיכל אברהם',
                role: 'מורה ומארגנת אירועים',
                school: 'בית ספר גן רווה ירושלים',
                quote: 'הממשק הכי אינטואיטיבי שעבדתי איתו. התמיכה הטכנית פשוט מעולה.',
                photo: '/images/testimonials/michal-avraham.png',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-right hover:shadow-lg hover:border-red-300 transition-all"
              >
                {/* Rating Stars */}
                <div className="flex justify-end gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 text-lg leading-relaxed mb-6 italic">
                  "{testimonial.quote}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-4 justify-end">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-gray-500">{testimonial.school}</div>
                  </div>
                  <div className="w-16 h-16 rounded-full border-2 border-red-500 flex-shrink-0 bg-gradient-to-br from-red-400 to-purple-400 flex items-center justify-center text-white font-bold text-2xl">
                    {testimonial.name.charAt(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section - SIMPLIFIED */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-2 text-gray-900">
            מעל <span className="text-red-600">100 בתי ספר</span> בוטחים ב-kartis.info
          </h3>
          <p className="text-gray-600 mb-8">מוסדות חינוך מובילים ברחבי הארץ</p>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {[
              'בית ספר אלון', 'תיכון הרצליה', 'בית ספר גן רווה',
              'תיכון רמת אביב', 'בית ספר הדר', 'תיכון מקיף חדרה',
              'בית ספר נורדאו', 'תיכון ברנר', 'בית ספר ביאליק',
              'תיכון אלון תבור', 'בית ספר רוגוזין', 'תיכון יבנה'
            ].map((school, i) => (
              <div
                key={i}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-red-500 hover:shadow-md transition-all"
              >
                {school}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-500 to-red-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">התחל בחינם היום!</h2>
          <p className="text-2xl mb-8 opacity-90">
            חינם לגמרי • ללא כרטיס אשראי • עד 100 רישומים
          </p>

          <div className="bg-white text-gray-900 rounded-3xl p-8 shadow-2xl max-w-md mx-auto mb-8">
            <div className="text-6xl font-black mb-2 text-red-600">₪0</div>
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
            className="inline-block px-12 py-5 text-xl font-semibold text-red-600 bg-white rounded-lg hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
          >
            התחל עכשיו - חינם לגמרי
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16 text-gray-900">שאלות נפוצות</h2>

          <div className="space-y-6">
            {[
              {
                q: 'האם kartis.info חינמי?',
                a: 'כן! kartis.info מציעה תוכנית חינמית לצמיתות ללא צורך בכרטיס אשראי. התוכנית החינמית כוללת עד 3 אירועים ו-100 רישומים לחודש.',
              },
              {
                q: 'האם ניתן לגבות תשלום עבור כרטיסים?',
                a: 'המערכת תומכת בכרטיסים חינמיים עם ניהול מקומות מוגבלים. אפשרות גבייה בתשלום תתווסף בקרוב.',
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
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-right hover:border-red-500 hover:shadow-md transition-all">
                <h3 className="text-xl font-semibold mb-3 flex items-center justify-end gap-2 text-gray-900">
                  <span>{faq.q}</span>
                  <CheckCircle className="w-6 h-6 text-red-600" />
                </h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl sm:text-6xl font-bold mb-6">מוכנים להתחיל?</h2>
          <p className="text-2xl mb-12 opacity-90">הצטרפו ל-100+ בתי ספר שכבר משתמשים ב-kartis.info</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/signup"
              className="px-12 py-5 text-xl font-semibold text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
            >
              התחל בחינם עכשיו
            </Link>
            <Link
              href="/admin/login"
              className="px-12 py-5 text-xl font-semibold text-white bg-transparent border-2 border-white rounded-lg hover:bg-white hover:text-gray-900 transition-all"
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
      <footer className="bg-white border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-right">
            <div>
              <div className="flex items-center gap-2 justify-end mb-4">
                <span className="text-2xl font-bold">kartis.info</span>
                <Ticket className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm text-gray-600">
                מערכת ניהול כרטיסים מתקדמת לבתי ספר ומוסדות חינוך
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-gray-900">מוצר</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/admin/signup" className="hover:text-red-600 transition-colors">התחל בחינם</Link></li>
                <li><Link href="/#features" className="hover:text-red-600 transition-colors">תכונות</Link></li>
                <li><Link href="/#pricing" className="hover:text-red-600 transition-colors">מחירים</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-gray-900">תמיכה</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/#faq" className="hover:text-red-600 transition-colors">שאלות נפוצות</Link></li>
                <li><Link href="/admin/help" className="hover:text-red-600 transition-colors">מרכז עזרה</Link></li>
                <li><a href="mailto:support@kartis.info" className="hover:text-red-600 transition-colors">צור קשר</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-gray-900">משפטי</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/privacy" className="hover:text-red-600 transition-colors">מדיניות פרטיות</Link></li>
                <li><Link href="/terms" className="hover:text-red-600 transition-colors">תנאי שימוש</Link></li>
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

'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Ticket,
  Zap,
  Users,
  BarChart3,
  CheckCircle,
  Calendar,
  MessageCircle,
  Menu,
  X,
} from 'lucide-react'
import UseCaseTabs from './UseCaseTabs'

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/70 glass-nav shadow-ambient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-md">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-headline font-bold text-gray-900">kartis.info</span>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#features" className="hover:text-gray-900 transition-colors">
                תכונות
              </a>
              <a href="#how-it-works" className="hover:text-gray-900 transition-colors">
                איך זה עובד
              </a>
              <a href="#faq" className="hover:text-gray-900 transition-colors">
                שאלות נפוצות
              </a>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin/login"
                className="hidden md:flex px-5 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                כניסה
              </Link>
              <Link
                href="/admin/signup"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md min-h-[44px] flex items-center"
              >
                הרשמה חינם
              </Link>
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="תפריט"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile nav dropdown */}
          {mobileNavOpen && (
            <div className="md:hidden pb-4 flex flex-col gap-2 text-sm font-medium">
              <a
                href="#features"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 min-h-[44px] flex items-center"
              >
                תכונות
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 min-h-[44px] flex items-center"
              >
                איך זה עובד
              </a>
              <a
                href="#faq"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 min-h-[44px] flex items-center"
              >
                שאלות נפוצות
              </a>
              <Link
                href="/admin/login"
                className="px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 min-h-[44px] flex items-center"
              >
                כניסה למערכת
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-[#f8f9ff] pt-36 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text column (first = right side in RTL) */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-ambient text-sm font-semibold text-red-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                מערכת ניהול אירועים לבתי ספר ומועדונים
              </div>

              {/* H1 */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-black leading-tight text-gray-900">
                נהלו אירועים –{' '}
                <span className="bg-gradient-to-l from-red-600 to-red-500 bg-clip-text text-transparent">
                  פשוט, חכם ומדויק
                </span>
              </h1>

              {/* Body */}
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-lg">
                רישום מקוון, הגבלת מקומות, רשימת המתנה חכמה וניהול משתתפים בזמן אמת. כל מה שצריך כדי
                לארגן כל אירוע – במקום אחד.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/admin/signup"
                  className="px-8 py-4 text-base font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md min-h-[52px] flex items-center justify-center"
                >
                  התחילו עכשיו בחינם
                </Link>
                <Link
                  href="/admin/login"
                  className="px-8 py-4 text-base font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-xl shadow-ambient transition-all min-h-[52px] flex items-center justify-center"
                >
                  כניסה למערכת
                </Link>
              </div>

              {/* Trust chips */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {['התקנה תוך 3 דקות', '100% מאובטח', 'תמיכה בעברית מלאה'].map((chip) => (
                  <span key={chip} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="font-medium">{chip}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Image column (second = left side in RTL) */}
            <div className="relative hidden lg:block">
              {/* Decorative glow blobs */}
              <div className="absolute -top-16 -end-16 w-72 h-72 bg-red-100/60 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -start-8 w-48 h-48 bg-red-200/40 rounded-full blur-2xl" />

              {/* Photo */}
              <div className="relative rounded-3xl overflow-hidden -rotate-2 shadow-[0_24px_64px_rgba(11,28,48,0.12)]">
                <Image
                  src="/images/hero/hero-event.jpg"
                  alt="אירוע ספורט בית ספרי"
                  width={640}
                  height={480}
                  priority
                  className="w-full h-auto object-cover"
                />
                {/* Fallback gradient shown if image not yet generated */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-red-200 -z-10" />
              </div>

              {/* Glassmorphic stat card overlay */}
              <div className="absolute bottom-6 start-6 bg-white/25 glass-nav rounded-2xl border border-white/30 shadow-[0_8px_24px_rgba(11,28,48,0.12)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-headline font-black text-gray-900">342</p>
                    <p className="text-xs text-gray-600 font-medium">משתתפים רשומים</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-[#f1f5f9] py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-headline font-black text-gray-900 mb-4">
              כל מה שאתם צריכים
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              תכונות מתקדמות לכל סוג של ארגון או קבוצה
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="w-7 h-7" />,
                title: 'הרשמה מהירה',
                description:
                  'צרו אירוע מלא תוך 3 דקות עם תאריך, מיקום, הגבלת משתתפים ושדות מותאמים אישית.',
                bullets: ['דף רישום מוכן מיידית', 'שלחו קישור לכל מקום', 'שדות גמישים לכל צורך'],
              },
              {
                icon: <Zap className="w-7 h-7" />,
                title: 'רשימת המתנה אוטומטית',
                description:
                  'כשהאירוע מתמלא, המערכת מעבירה משתתפים לרשימת המתנה ומנהלת אותם בצורה חכמה.',
                bullets: ['ניהול אוטומטי ללא מאמץ', 'עדכון מיידי לנרשמים', 'אפס בלגן וריבים'],
              },
              {
                icon: <BarChart3 className="w-7 h-7" />,
                title: 'דוחות בזמן אמת',
                description:
                  'לוח בקרה מלא עם מעקב אחר אירועים פעילים, נרשמים, רשימת המתנה ושיעורי תפוסה.',
                bullets: ['סטטיסטיקות חיות', 'יצוא לקובץ CSV', "צ'ק-אין עם ברקוד"],
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl shadow-ambient hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 p-8"
              >
                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-headline font-bold text-gray-900 mb-3 text-right">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-right mb-5">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-headline font-black text-gray-900 mb-4">
              התחילו תוך <span className="text-red-600">3 דקות</span>
            </h2>
            <p className="text-lg text-gray-500">פשוט, מהיר וללא סיבוכים</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-12 inset-x-[16%] h-0.5 bg-gradient-to-r from-red-200 via-red-400 to-red-200" />

            {[
              {
                step: '01',
                icon: <Users className="w-8 h-8 text-gray-400" />,
                title: 'הרשמה מהירה',
                desc: 'צרו חשבון עם אימייל או Google תוך 30 שניות.',
              },
              {
                step: '02',
                icon: <Calendar className="w-8 h-8 text-gray-400" />,
                title: 'יצירת אירוע',
                desc: 'מלאו פרטים בסיסיים והגדירו את כל השדות שאתם צריכים.',
              },
              {
                step: '03',
                icon: <Zap className="w-8 h-8 text-gray-400" />,
                title: 'קבלו רישומים',
                desc: 'שתפו קישור והתחילו לקבל רישומים עם ניהול אוטומטי מלא.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-[#f8f9ff] rounded-2xl shadow-ambient p-8 text-center"
              >
                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center text-lg font-headline font-black mx-auto mb-6 relative z-10 shadow-md">
                  {item.step}
                </div>
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-xl font-headline font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ + Use Case Tabs ── */}
      <section id="faq" className="bg-[#f1f5f9] py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-headline font-black text-gray-900 mb-4">
              שאלות נפוצות
            </h2>
          </div>

          <div className="space-y-4 mb-20">
            {[
              {
                q: 'כמה זה עולה?',
                a: 'המערכת חינמית לגמרי לשימוש בסיסי. תוכניות מתקדמות זמינות לארגונים עם נפח גבוה של אירועים.',
              },
              {
                q: 'כמה זמן לוקח להקים אירוע?',
                a: 'פחות מ-3 דקות. ממלאים שם, תאריך ומספר מקסימלי של משתתפים — והקישור מוכן לשיתוף.',
              },
              {
                q: 'מה קורה כשהאירוע מלא?',
                a: 'כל נרשם נוסף נכנס אוטומטית לרשימת המתנה ממוספרת. אם מישהו מבטל — הבא בתור מקבל מקום אוטומטית.',
              },
              {
                q: 'האם אפשר לאסוף תשלום?',
                a: 'כן. מערכת התשלומים משולבת עם YaadPay ומאפשרת גביה מקוונת כחלק מתהליך ההרשמה.',
              },
              {
                q: 'האם הנתונים מאובטחים?',
                a: 'בהחלט. כל הנתונים מוצפנים (AES-256-GCM), ויש בידוד מוחלט בין ארגונים שונים במערכת.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl shadow-ambient p-6">
                <h3 className="text-base font-bold text-gray-900 mb-2 text-right">{q}</h3>
                <p className="text-gray-500 leading-relaxed text-right">{a}</p>
              </div>
            ))}
          </div>

          {/* Use Case Tabs */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-headline font-black text-gray-900 mb-2">
              למי זה מתאים?
            </h2>
            <p className="text-gray-500">כל ארגון שמנהל אירועים עם מגבלת מקומות</p>
          </div>
          <UseCaseTabs />
        </div>
      </section>

      {/* ── WhatsApp ── */}
      <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#f0fdf4] rounded-3xl shadow-ambient p-10 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-headline font-black text-gray-900 mb-3">
              שתפו בוואטסאפ בשניות
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              קישור ההרשמה שלכם נראה מקצועי בכל ערוץ — וואטסאפ, SMS, אימייל או פייסבוק.
            </p>
            <a
              href="https://wa.me/?text=%D7%94%D7%A6%D7%98%D7%A8%D7%A4%D7%95%20%D7%9C%D7%90%D7%99%D7%A8%D7%95%D7%A2%20%D7%A9%D7%9C%D7%A0%D7%95"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-md min-h-[52px]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              שלחו קישור בוואטסאפ
            </a>

            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              {['ניתן לשיתוף בכל ערוץ', 'דף נראה מקצועי תמיד', 'ללא אפליקציה להורדה'].map(
                (chip) => (
                  <div
                    key={chip}
                    className="bg-white rounded-xl shadow-ambient py-3 px-4 text-sm font-medium text-gray-700"
                  >
                    {chip}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-[#f1f5f9] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-red-600 to-red-700 rounded-3xl p-10 sm:p-16 shadow-[0_24px_64px_rgba(220,38,38,0.25)] overflow-hidden text-center">
            {/* Static glow highlights */}
            <div className="absolute -top-16 -end-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -start-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <h2 className="relative text-3xl sm:text-5xl font-headline font-black text-white mb-4 leading-tight">
              מוכנים להתחיל?
            </h2>
            <p className="relative text-red-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              הצטרפו לאלפי מארגנים שכבר מנהלים אירועים בצורה חכמה יותר עם kartis.info
            </p>
            <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin/signup"
                className="px-10 py-4 text-base font-bold text-red-700 bg-white hover:bg-red-50 rounded-xl transition-colors shadow-lg min-h-[52px] flex items-center justify-center"
              >
                התחילו עכשיו – חינם לגמרי
              </Link>
              <Link
                href="/admin/login"
                className="px-10 py-4 text-base font-bold text-white bg-white/15 hover:bg-white/25 rounded-xl transition-colors min-h-[52px] flex items-center justify-center"
              >
                כניסה למערכת
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-md">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-headline font-bold text-white">kartis.info</span>
              </div>
              <p className="text-sm leading-relaxed">
                מערכת ניהול אירועים לבתי ספר, מועדוני ספורט וארגונים קהילתיים בישראל.
              </p>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">מוצר</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    תכונות
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    איך זה עובד
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    שאלות נפוצות
                  </a>
                </li>
              </ul>
            </div>

            {/* Account */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">חשבון</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/admin/signup" className="hover:text-white transition-colors">
                    הרשמה
                  </Link>
                </li>
                <li>
                  <Link href="/admin/login" className="hover:text-white transition-colors">
                    כניסה למערכת
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold text-sm">צור קשר</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:info@kartis.info" className="hover:text-white transition-colors">
                    info@kartis.info
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p>© {new Date().getFullYear()} kartis.info — כל הזכויות שמורות</p>
            <p className="text-gray-600">Made in Israel 🇮🇱</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

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
  ArrowRight,
  Download,
  Clock,
  Target,
  TrendingUp,
  Globe
} from 'lucide-react'

export default function LandingPage() {
  const [statsAnimated, setStatsAnimated] = useState(false)

  useEffect(() => {
    setStatsAnimated(true)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Ultra-Modern Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">kartis.info</span>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/login"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                התחבר
              </Link>
              <Link
                href="/admin/signup"
                className="group px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
              >
                <span>התחל עכשיו</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Ultra Eye-Catching */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center space-y-8">
            {/* Eye-Catching Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-lg border border-red-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-sm font-bold text-gray-900">מערכת הניהול המובילה לבתי ספר</span>
            </div>

            {/* Massive Headline */}
            <h1 className="text-6xl lg:text-8xl font-black leading-tight">
              <span className="block text-gray-900">נהלו אירועים</span>
              <span className="block bg-gradient-to-r from-red-600 via-red-500 to-purple-600 bg-clip-text text-transparent">
                בקלות מוחלטת
              </span>
            </h1>

            {/* Compelling Value Proposition */}
            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto font-medium">
              מערכת ניהול אירועים מלאה עם רישום מקוון, רשימת המתנה אוטומטית,
              ניהול צוות וניתוח נתונים בזמן אמת. הכל במקום אחד.
            </p>

            {/* Powerful CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link
                href="/admin/signup"
                className="group px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-2xl hover:from-red-600 hover:to-red-700 transition-all shadow-2xl hover:shadow-red-200 hover:scale-105 flex items-center gap-3"
              >
                <span>צור חשבון עכשיו</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link
                href="/admin/login"
                className="px-10 py-5 text-lg font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-xl transition-all"
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

      {/* Live Stats Section - Eye-Catching Numbers */}
      <section className="py-16 bg-gradient-to-r from-red-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: '1,200+', label: 'רישומים לאירועים', icon: <Users className="w-8 h-8" /> },
              { number: '250+', label: 'אירועים פעילים', icon: <Calendar className="w-8 h-8" /> },
              { number: '50+', label: 'בתי ספר משתמשים', icon: <Star className="w-8 h-8" /> },
              { number: '98%', label: 'שביעות רצון', icon: <TrendingUp className="w-8 h-8" /> },
            ].map((stat, idx) => (
              <div key={idx} className="transform hover:scale-105 transition-transform">
                <div className="flex justify-center mb-3 opacity-80">
                  {stat.icon}
                </div>
                <div className={`text-5xl font-black mb-2 transition-all duration-1000 ${statsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  {stat.number}
                </div>
                <div className="text-red-100 font-medium text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features - Clean & Powerful */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-black mb-6">
              <span className="text-gray-900">כל מה שאתם צריכים</span>
              <br />
              <span className="bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">במקום אחד</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              תכונות מתקדמות שנבנו במיוחד עבור בתי ספר ומוסדות חינוך
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
                description: 'בידוד מוחלט בין בתי ספר, הצפנת נתונים מלאה והרשאות מדויקות לכל משתמש',
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
            <h2 className="text-5xl lg:text-6xl font-black mb-6 text-gray-900">
              התחילו תוך <span className="text-red-600">3 דקות</span>
            </h2>
            <p className="text-xl text-gray-600">פשוט, מהיר וללא סיבוכים</p>
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

      {/* How Schools Can Add Themselves - CLEAR INSTRUCTIONS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6 text-gray-900">
              איך הבית ספר שלך יכול להצטרף?
            </h2>
            <p className="text-2xl text-gray-600">
              כל בית ספר יכול להירשם ולהתחיל להשתמש במערכת תוך 5 דקות
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 border-2 border-gray-100">
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">לחצו על &quot;התחל עכשיו&quot;</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    מכל עמוד באתר, לחצו על הכפתור הכתום &quot;התחל עכשיו&quot; או על &quot;הרשמה&quot; בתפריט העליון.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                    2
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">צרו חשבון אישי</h3>
                  <p className="text-lg text-gray-600 leading-relaxed mb-3">
                    בחרו אחת משתי האפשרויות:
                  </p>
                  <ul className="space-y-2 text-lg text-gray-600">
                    <li className="flex items-center justify-end gap-2">
                      <span>הרשמה מהירה עם חשבון Google</span>
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </li>
                    <li className="flex items-center justify-end gap-2">
                      <span>הרשמה עם כתובת אימייל וסיסמה</span>
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">הוסיפו את בית הספר שלכם</h3>
                  <p className="text-lg text-gray-600 leading-relaxed mb-4">
                    לאחר ההרשמה, תתבקשו למלא את פרטי בית הספר:
                  </p>
                  <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">לדוגמה:</span>
                      <span className="font-semibold text-gray-900">שדה</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                      <span className="font-mono text-sm text-gray-500">baery.kartis.info</span>
                      <span className="font-semibold text-gray-900">שם בית הספר: &quot;בית ספר בארי&quot; →</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                      <span className="font-mono text-sm text-gray-500">demo-school.kartis.info</span>
                      <span className="font-semibold text-gray-900">שם בית הספר: &quot;Demo School&quot; →</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                    💡 <strong>טיפ:</strong> הקישור יהיה ייחודי לבית הספר שלכם ויכיל אותיות באנגלית בלבד (ללא רווחים או תווים מיוחדים).
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                    ✓
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">התחילו לעבוד!</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    זהו! בית הספר שלכם נוסף למערכת. עכשיו תוכלו:
                  </p>
                  <ul className="mt-4 space-y-2 text-lg text-gray-600">
                    <li className="flex items-center justify-end gap-2">
                      <span>ליצור אירועים חדשים</span>
                      <Calendar className="w-5 h-5 text-red-600 flex-shrink-0" />
                    </li>
                    <li className="flex items-center justify-end gap-2">
                      <span>להזמין חברי צוות נוספים</span>
                      <Users className="w-5 h-5 text-red-600 flex-shrink-0" />
                    </li>
                    <li className="flex items-center justify-end gap-2">
                      <span>לנהל רישומים ורשימות המתנה</span>
                      <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 pt-8 border-t-2 border-gray-100 text-center">
              <Link
                href="/admin/signup"
                className="inline-block px-12 py-5 text-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                הוסיפו את בית הספר שלכם עכשיו
              </Link>
              <p className="mt-4 text-gray-500">
                ההרשמה לוקחת פחות מ-3 דקות
              </p>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-8 bg-blue-100 border-2 border-blue-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  💡
                </div>
              </div>
              <div className="flex-1 text-right">
                <h4 className="font-bold text-blue-900 mb-2">חשוב לדעת:</h4>
                <ul className="space-y-2 text-blue-800">
                  <li>• כל בית ספר מקבל סביבה נפרדת ומאובטחת</li>
                  <li>• אתם שולטים במלואי על הנתונים שלכם</li>
                  <li>• אפשר להוסיף מספר מנהלים לאותו בית ספר</li>
                  <li>• בתי ספר שונים לא רואים את הנתונים אחד של השני</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-black mb-6">
              <span className="text-gray-900">מה אומרים</span>
              <span className="bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent"> המשתמשים</span>
            </h2>
            <p className="text-xl text-gray-600">בתי ספר שכבר משתמשים במערכת משתפים את החוויה</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'רונית כהן',
                role: 'מנהלת בית ספר',
                school: 'בית ספר אלון תל אביב',
                quote: 'kartis.info חסכה לנו שעות של עבודה ידנית. המערכת פשוטה, מהירה והורים אוהבים אותה.',
                rating: 5
              },
              {
                name: 'דוד לוי',
                role: 'רכז אירועים',
                school: 'תיכון הרצליה',
                quote: 'לראשונה הצלחנו למלא אירוע תוך דקות במקום שעות. רשימת ההמתנה האוטומטית פשוט גאונית.',
                rating: 5
              },
              {
                name: 'מיכל אברהם',
                role: 'מורה ומארגנת',
                school: 'בית ספר גן רווה',
                quote: 'הממשק הכי אינטואיטיבי שעבדתי איתו. התמיכה הטכנית מהירה ומקצועית.',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-3xl p-8 text-right hover:shadow-2xl hover:border-red-300 transition-all duration-300 hover:-translate-y-2"
              >
                {/* Rating Stars */}
                <div className="flex justify-end gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 text-lg leading-relaxed mb-8 font-medium">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4 justify-end">
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-gray-500">{testimonial.school}</div>
                  </div>
                  <div className="w-16 h-16 rounded-full border-3 border-red-500 flex-shrink-0 bg-gradient-to-br from-red-400 to-purple-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Logos */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-2 text-gray-900">
            מוסדות חינוך <span className="text-red-600">בוטחים בנו</span>
          </h3>
          <p className="text-gray-600 mb-10">מערכת אמינה ומאובטחת המשמשת בתי ספר ברחבי הארץ</p>

          <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
            {[
              'בית ספר אלון', 'תיכון הרצליה', 'בית ספר גן רווה',
              'תיכון רמת אביב', 'בית ספר הדר', 'תיכון מקיף חדרה',
              'בית ספר נורדאו', 'תיכון ברנר', 'בית ספר ביאליק',
              'תיכון אלון תבור', 'בית ספר רוגוזין', 'תיכון יבנה'
            ].map((school, i) => (
              <div
                key={i}
                className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-red-500 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                {school}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl lg:text-6xl font-black mb-6 text-gray-900">שאלות נפוצות</h2>
            <p className="text-xl text-gray-600">כל מה שרציתם לדעת על המערכת</p>
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
                q: 'האם המידע של בית הספר שלי מאובטח?',
                a: 'כן. כל בית ספר רואה רק את המידע שלו בלבד. אנחנו משתמשים בהצפנה מתקדמת ובידוד מוחלט של נתונים.',
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
          <h2 className="text-5xl lg:text-7xl font-black mb-8 leading-tight">
            מוכנים להתחיל?
          </h2>
          <p className="text-2xl lg:text-3xl mb-12 opacity-95 font-medium leading-relaxed">
            הצטרפו לבתי הספר שכבר מנהלים אירועים בצורה מקצועית
          </p>

          {/* Features Grid in CTA */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            {[
              { icon: <Calendar />, text: 'אירועים ללא הגבלה' },
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

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/admin/signup"
              className="group px-12 py-6 text-xl font-black text-red-600 bg-white rounded-2xl hover:bg-gray-50 transition-all shadow-2xl hover:scale-110 flex items-center gap-3"
            >
              <span>צור חשבון עכשיו</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link
              href="/admin/login"
              className="px-12 py-6 text-xl font-black text-white bg-white/10 backdrop-blur-sm border-2 border-white rounded-2xl hover:bg-white/20 transition-all"
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
                מערכת ניהול אירועים מתקדמת לבתי ספר ומוסדות חינוך
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">מוצר</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/admin/signup" className="hover:text-white transition-colors font-medium">התחל עכשיו</Link></li>
                <li><Link href="/#features" className="hover:text-white transition-colors font-medium">תכונות</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-white transition-colors font-medium">איך זה עובד</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">תמיכה</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/#faq" className="hover:text-white transition-colors font-medium">שאלות נפוצות</Link></li>
                <li><Link href="/admin/help" className="hover:text-white transition-colors font-medium">מרכז עזרה</Link></li>
                <li><a href="mailto:support@kartis.info" className="hover:text-white transition-colors font-medium">צור קשר</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-lg">משפטי</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors font-medium">מדיניות פרטיות</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors font-medium">תנאי שימוש</Link></li>
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

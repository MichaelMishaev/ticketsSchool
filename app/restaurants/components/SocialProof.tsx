'use client'

import { Users, Calendar, Star, TrendingUp } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '50,000+',
    label: 'משתמשים פעילים'
  },
  {
    icon: Calendar,
    value: '120,000+',
    label: 'הזמנות השנה'
  },
  {
    icon: Star,
    value: '4.9',
    label: 'דירוג ממוצע'
  },
  {
    icon: TrendingUp,
    value: '300+',
    label: 'מסעדות שותפות'
  }
]

const testimonials = [
  {
    id: 1,
    name: 'שרה כהן',
    role: 'לקוחה קבועה',
    content: 'המערכת הכי נוחה להזמנת שולחנות! פשוט, מהיר ואמין. משתמשת בה כבר שנה ותמיד מרוצה.',
    rating: 5,
    image: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: 2,
    name: 'דוד לוי',
    role: 'בעל מסעדה',
    content: 'הפלטפורמה שינתה לנו את ניהול ההזמנות. חסכנו המון זמן והלקוחות מרוצים מהשירות.',
    rating: 5,
    image: 'https://i.pravatar.cc/150?img=12'
  },
  {
    id: 3,
    name: 'מיכל אברהם',
    role: 'חובבת אוכל',
    content: 'גיליתי מסעדות חדשות ומדהימות דרך הפלטפורמה. ממליצה בחום!',
    rating: 5,
    image: 'https://i.pravatar.cc/150?img=5'
  }
]

export default function SocialProof() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <stat.icon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            מה הלקוחות שלנו אומרים
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            אלפי לקוחות מרוצים משתמשים בנו מדי יום
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

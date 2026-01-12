'use client'

import Image from 'next/image'

const cuisines = [
  {
    id: 1,
    name: 'איטלקי',
    count: 45,
    image: '/restaurants/cuisine-italian.jpg'
  },
  {
    id: 2,
    name: 'יפני',
    count: 32,
    image: '/restaurants/cuisine-japanese.jpg'
  },
  {
    id: 3,
    name: 'ים תיכוני',
    count: 56,
    image: '/restaurants/cuisine-mediterranean.jpg'
  },
  {
    id: 4,
    name: 'צרפתי',
    count: 28,
    image: '/restaurants/cuisine-french.jpg'
  },
  {
    id: 5,
    name: 'בשרים',
    count: 38,
    image: '/restaurants/cuisine-steakhouse.jpg'
  },
  {
    id: 6,
    name: 'אסייתי',
    count: 41,
    image: '/restaurants/cuisine-asian.jpg'
  }
]

export default function CuisineCategories() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            חפש לפי סגנון מטבח
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            מגוון רחב של סגנונות מטבח מכל העולם
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {cuisines.map((cuisine) => (
            <div
              key={cuisine.id}
              className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              {/* Background Image */}
              <Image
                src={cuisine.image}
                alt={cuisine.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 right-0 left-0 p-4 text-white">
                <h3 className="text-xl font-bold mb-1">{cuisine.name}</h3>
                <p className="text-sm text-white/90">{cuisine.count} מסעדות</p>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

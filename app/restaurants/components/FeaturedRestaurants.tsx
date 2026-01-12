'use client'

import Image from 'next/image'
import { Star, MapPin, DollarSign } from 'lucide-react'

const restaurants = [
  {
    id: 1,
    name: 'טראטוריה רומנה',
    cuisine: 'איטלקי',
    location: 'תל אביב',
    rating: 4.8,
    reviews: 342,
    priceLevel: 3,
    image: '/restaurants/italian-restaurant.jpg',
    description: 'מטבח איטלקי אותנטי בלב העיר'
  },
  {
    id: 2,
    name: 'סושי בר טוקיו',
    cuisine: 'יפני',
    location: 'הרצליה',
    rating: 4.9,
    reviews: 521,
    priceLevel: 4,
    image: '/restaurants/japanese-restaurant.jpg',
    description: 'סושי פרימיום ומנות יפניות מובחרות'
  },
  {
    id: 3,
    name: 'ביסטרו פריז',
    cuisine: 'צרפתי',
    location: 'ירושלים',
    rating: 4.7,
    reviews: 289,
    priceLevel: 4,
    image: '/restaurants/french-bistro.jpg',
    description: 'חוויה קולינרית צרפתית אלגנטית'
  },
  {
    id: 4,
    name: 'סטייקהאוס פריים',
    cuisine: 'בשרים',
    location: 'תל אביב',
    rating: 4.6,
    reviews: 445,
    priceLevel: 4,
    image: '/restaurants/steakhouse.jpg',
    description: 'בשר איכותי בהכנה מושלמת'
  },
  {
    id: 5,
    name: 'קפה ים תיכוני',
    cuisine: 'ים תיכוני',
    location: 'חיפה',
    rating: 4.5,
    reviews: 198,
    priceLevel: 2,
    image: '/restaurants/mediterranean-cafe.jpg',
    description: 'מטבח ים תיכוני טרי ובריא'
  },
  {
    id: 6,
    name: 'אסיה פיוז\'ן',
    cuisine: 'אסייתי',
    location: 'תל אביב',
    rating: 4.8,
    reviews: 376,
    priceLevel: 3,
    image: '/restaurants/asian-fusion.jpg',
    description: 'מטבח אסייתי מודרני ויצירתי'
  }
]

export default function FeaturedRestaurants() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            מסעדות מומלצות
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            גלו את המסעדות המובילות והפופולריות ביותר בישראל
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={restaurant.image}
                  alt={restaurant.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badge */}
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-900 shadow-lg">
                  {restaurant.cuisine}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {restaurant.name}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {restaurant.description}
                </p>

                {/* Info Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-gray-900">{restaurant.rating}</span>
                    <span className="text-gray-500 text-sm">({restaurant.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    {Array.from({ length: restaurant.priceLevel }).map((_, i) => (
                      <DollarSign key={i} className="w-4 h-4" />
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{restaurant.location}</span>
                </div>

                {/* CTA */}
                <button className="w-full mt-4 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-500/50">
                  הזמן שולחן
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors focus:ring-4 focus:ring-gray-500/50 shadow-lg">
            צפה בכל המסעדות
          </button>
        </div>
      </div>
    </section>
  )
}

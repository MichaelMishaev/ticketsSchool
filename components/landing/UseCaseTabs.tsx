'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Target, School, Users, Briefcase, Star, Globe, Heart } from 'lucide-react'

interface UseCase {
  title: string
  examples: string[]
}

interface Category {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
  bgColor: string
  useCases: UseCase[]
}

const categories: Category[] = [
  {
    id: 'sport',
    icon: <Target className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'ספורט',
    description: 'אירועי ספורט ופעילות גופנית',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    useCases: [
      { title: 'משחקי כדורגל, כדורסל, כדורעף', examples: [] },
      { title: 'אימונים קבוצתיים עם מספר משתתפים מוגבל', examples: [] },
      { title: 'טורנירים וימי ספורט', examples: [] },
      { title: 'מבחני כושר או ימי מיון לשחקנים', examples: [] },
    ],
  },
  {
    id: 'schools',
    icon: <School className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'בתי ספר',
    description: 'אירועים ופעילויות חינוכיות',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    useCases: [
      { title: 'טיולים שנתיים וימי כיף', examples: [] },
      { title: 'הצגות וסדנאות', examples: [] },
      { title: 'ימי הורים או מפגשי ועד כיתה', examples: [] },
      { title: 'תחרויות ותחרויות ספורט בית-ספריות', examples: [] },
    ],
  },
  {
    id: 'community',
    icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'קהילה ומתנ"סים',
    description: 'פעילויות קהילתיות וחברתיות',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    useCases: [
      { title: 'חוגים והרצאות', examples: [] },
      { title: 'סדנאות קיץ ופעילויות חופשה', examples: [] },
      { title: 'מסיבות שכונה או ירידי קהילה', examples: [] },
      { title: 'שיעורים קבועים עם מגבלת משתתפים', examples: [] },
    ],
  },
  {
    id: 'business',
    icon: <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'עסקים וארגונים',
    description: 'אירועים עסקיים ומקצועיים',
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50',
    useCases: [
      { title: 'הדרכות או ימי עיון', examples: [] },
      { title: 'מפגשי צוות וחברה', examples: [] },
      { title: 'ימי גיבוש לעובדים', examples: [] },
      { title: 'ימי ראיונות או מבחנים פנימיים', examples: [] },
    ],
  },
  {
    id: 'private',
    icon: <Star className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'אירועים פרטיים',
    description: 'חגיגות ומפגשים אישיים',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    useCases: [
      { title: 'ימי הולדת ומסיבות', examples: [] },
      { title: 'טיולים משפחתיים', examples: [] },
      { title: 'ארוחות חג, שבת או מפגש חברים', examples: [] },
      { title: 'מפגשי קבוצות תחביב (אופניים, ריצה, צילום)', examples: [] },
    ],
  },
  {
    id: 'online',
    icon: <Globe className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'אונליין',
    description: 'אירועים וירטואליים מרחוק',
    color: 'from-indigo-500 to-blue-600',
    bgColor: 'bg-indigo-50',
    useCases: [
      { title: 'וובינרים עם מספר משתתפים מוגבל', examples: [] },
      { title: 'שיעורים פרטיים או קבוצתיים בזום', examples: [] },
      { title: 'הרצאות אונליין וסדנאות למידה', examples: [] },
    ],
  },
  {
    id: 'health',
    icon: <Heart className="w-5 h-5 sm:w-6 sm:h-6" />,
    title: 'בריאות וחברה',
    description: 'אירועי בריאות ורווחה',
    color: 'from-red-500 to-pink-600',
    bgColor: 'bg-red-50',
    useCases: [
      { title: 'בדיקות או חיסונים בקהילה', examples: [] },
      { title: 'ימי תרומות דם', examples: [] },
      { title: 'הרצאות בריאות ורווחה', examples: [] },
      { title: 'אירועי התנדבות', examples: [] },
    ],
  },
]

export default function UseCaseTabs() {
  const [activeTab, setActiveTab] = useState('sport')

  const activeCategory = categories.find((cat) => cat.id === activeTab) || categories[0]

  return (
    <div className="w-full">
      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 justify-center">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id)}
            className={`
              flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base
              transition-all duration-300
              ${
                activeTab === category.id
                  ? `bg-gradient-to-r ${category.color} text-white shadow-lg scale-105`
                  : `${category.bgColor} text-gray-700 hover:shadow-ambient`
              }
            `}
          >
            {category.icon}
            <span className="hidden sm:inline">{category.title}</span>
          </button>
        ))}
      </div>

      {/* Tab Content with Animation */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${activeCategory.bgColor} rounded-3xl shadow-ambient p-6 sm:p-10`}
      >
        {/* Category Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${activeCategory.color} rounded-2xl flex items-center justify-center text-white shadow-xl`}
            >
              {activeCategory.icon}
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900">
              {activeCategory.title}
            </h3>
          </div>
          <p className="text-base sm:text-xl text-gray-600 font-medium">
            {activeCategory.description}
          </p>
        </div>

        {/* Use Cases List */}
        <div className="grid sm:grid-cols-2 gap-4">
          {activeCategory.useCases.map((useCase, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-4 hover:bg-white hover:shadow-md transition-all"
            >
              <div
                className={`w-2 h-2 rounded-full bg-gradient-to-br ${activeCategory.color} mt-2 flex-shrink-0`}
              />
              <p className="text-gray-800 font-medium text-right leading-relaxed">
                {useCase.title}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-sm sm:text-base text-gray-600 bg-white/60 backdrop-blur-sm rounded-xl p-4 inline-block">
            💡 <strong>כל אירוע עם הרשמה מוגבלת</strong> - המערכת מתאימה לכל סוג אירוע!
          </p>
        </div>
      </motion.div>
    </div>
  )
}

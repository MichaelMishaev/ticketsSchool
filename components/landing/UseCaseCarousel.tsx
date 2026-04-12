'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Trophy,
  Users,
  BarChart3,
  Star,
  Calendar,
  Zap,
  TrendingUp
} from 'lucide-react'

export interface UseCase {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  bgColor: string
}

const useCases: UseCase[] = [
  {
    icon: <Target className="w-8 h-8 sm:w-10 sm:h-10" />,
    title: 'משחקי כדורגל',
    description: '11v11, 7v7, או כל גודל קבוצה',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />,
    title: 'טורנירים',
    description: 'ניהול תחרויות עם קבוצות מרובות',
    color: 'from-yellow-500 to-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10" />,
    title: 'אימונים וכושר',
    description: 'מבחני כושר ואימוני קבוצה',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: <Star className="w-8 h-8 sm:w-10 sm:h-10" />,
    title: 'מסיבות וחגיגות',
    description: 'ימי הולדת ואירועים חברתיים',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
  },
  {
    icon: <Calendar className="w-8 h-8 sm:w-10 sm:h-10" />,
    title: 'טיולים ונסיעות',
    description: 'טיולי ספורט וטיולי כיתה',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: <Users className="w-8 h-8 sm:w-10 sm:h-10" />,
    title: 'סדנאות ואירועים',
    description: 'כל סוג אירוע עם הרשמה מוגבלת',
    color: 'from-indigo-500 to-blue-600',
    bgColor: 'bg-indigo-50',
  },
  {
    icon: <Zap className="w-8 h-8 sm:w-10 sm:h-10" />,
    title: 'ספורט אחר',
    description: 'כדורסל, כדורעף, טניס וכל ענף ספורט',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
  },
]

interface UseCaseCarouselProps {
  autoPlayInterval?: number
  pauseOnHover?: boolean
}

export default function UseCaseCarousel({
  autoPlayInterval = 3000,
  pauseOnHover = true
}: UseCaseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % useCases.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isPaused, autoPlayInterval])

  const currentUseCase = useCases[currentIndex]

  return (
    <div
      className="relative w-full max-w-4xl mx-auto"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="flex flex-col items-center justify-center gap-4 py-8"
        >
          {/* Icon */}
          <motion.div
            className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${currentUseCase.color} rounded-2xl sm:rounded-3xl flex items-center justify-center text-white shadow-xl`}
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            {currentUseCase.icon}
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-2xl sm:text-4xl font-bold text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {currentUseCase.title}
          </motion.h3>

          {/* Description */}
          <motion.p
            className="text-base sm:text-xl text-gray-600 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {currentUseCase.description}
          </motion.p>

          {/* Indicator Dots */}
          <div className="flex gap-2 mt-4">
            {useCases.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'bg-red-600 w-6 sm:w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to use case ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Subtitle - Always Visible */}
      <div className="text-center mt-2">
        <p className="text-sm sm:text-base text-gray-500 font-medium">
          מתאימה לכל סוג אירוע עם הרשמה מוגבלת
        </p>
      </div>
    </div>
  )
}

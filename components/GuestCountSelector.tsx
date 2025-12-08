'use client'

import { Minus, Plus } from 'lucide-react'

interface GuestCountSelectorProps {
  value: number
  onChange: (count: number) => void
  min?: number
  max?: number
  label?: string
}

export default function GuestCountSelector({
  value,
  onChange,
  min = 1,
  max = 12,
  label = 'כמה אורחים?'
}: GuestCountSelectorProps) {
  const increment = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const decrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  return (
    <div className="space-y-3" dir="rtl">
      {label && (
        <label className="block text-sm font-medium text-gray-900">
          {label}
        </label>
      )}

      <div className="flex items-center justify-center gap-4">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className={`
            flex items-center justify-center
            w-12 h-12 sm:w-14 sm:h-14
            rounded-full border-2
            transition-all duration-200
            ${
              value <= min
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-white border-blue-500 text-blue-600 hover:bg-blue-50 active:bg-blue-100'
            }
          `}
          aria-label="הפחת מספר אורחים"
        >
          <Minus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Count Display */}
        <div className="flex flex-col items-center justify-center min-w-[100px]">
          <div className="text-4xl sm:text-5xl font-bold text-gray-900">
            {value}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {value === 1 ? 'אורח' : 'אורחים'}
          </div>
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className={`
            flex items-center justify-center
            w-12 h-12 sm:w-14 sm:h-14
            rounded-full border-2
            transition-all duration-200
            ${
              value >= max
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-white border-blue-500 text-blue-600 hover:bg-blue-50 active:bg-100'
            }
          `}
          aria-label="הוסף אורח"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Range Info */}
      <div className="text-center text-xs text-gray-500">
        {min} - {max} אורחים
      </div>
    </div>
  )
}

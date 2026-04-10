'use client'

import { Minus, Plus } from 'lucide-react'

interface GuestCountSelectorProps {
  value: number
  onChange: (count: number) => void
  min?: number
  max?: number
  label?: string
  colorScheme?: 'blue' | 'amber'
}

export default function GuestCountSelector({
  value,
  onChange,
  min = 1,
  max = 12,
  label = 'כמה אורחים?',
  colorScheme = 'blue',
}: GuestCountSelectorProps) {
  const activeClass =
    colorScheme === 'amber'
      ? 'bg-white border-amber-500 text-amber-700 hover:bg-amber-50 active:bg-amber-100'
      : 'bg-white border-blue-500 text-blue-600 hover:bg-blue-50 active:bg-blue-100'

  const labelClass = colorScheme === 'amber' ? 'text-gray-700' : 'text-gray-900'

  const countClass = colorScheme === 'amber' ? 'text-gray-900' : 'text-gray-900'

  const subClass = colorScheme === 'amber' ? 'text-gray-600' : 'text-gray-600'

  const rangeClass = colorScheme === 'amber' ? 'text-gray-500' : 'text-gray-500'
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

  const groupId = `guest-count-${label?.replace(/\s+/g, '-') ?? 'selector'}`

  return (
    <div className="space-y-3" dir="rtl">
      {label && (
        <label id={`${groupId}-label`} className={`block text-sm font-medium ${labelClass}`}>
          {label}
        </label>
      )}

      <div
        role="group"
        aria-labelledby={label ? `${groupId}-label` : undefined}
        className="flex items-center justify-center gap-4"
      >
        {/* Decrement Button */}
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          aria-label={`הפחת ${label ?? 'כמות'}`}
          aria-disabled={value <= min}
          className={`
            flex items-center justify-center
            w-12 h-12 sm:w-14 sm:h-14
            rounded-full border-2
            transition-all duration-200
            ${
              value <= min
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                : activeClass
            }
          `}
        >
          <Minus className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        </button>

        {/* Count Display — spinbutton pattern for screen readers */}
        <div
          role="spinbutton"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-label={label ?? 'כמות'}
          aria-live="polite"
          aria-atomic="true"
          tabIndex={0}
          className="flex flex-col items-center justify-center min-w-[100px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              increment()
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              decrement()
            }
          }}
        >
          <div className={`text-4xl sm:text-5xl font-bold ${countClass}`} aria-hidden="true">
            {value}
          </div>
          <div className={`text-sm mt-1 ${subClass}`} aria-hidden="true">
            {value === 1 ? 'אורח' : 'אורחים'}
          </div>
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          aria-label={`הוסף ${label ?? 'כמות'}`}
          aria-disabled={value >= max}
          className={`
            flex items-center justify-center
            w-12 h-12 sm:w-14 sm:h-14
            rounded-full border-2
            transition-all duration-200
            ${
              value >= max
                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                : activeClass
            }
          `}
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        </button>
      </div>

      {/* Range Info */}
      <div className={`text-center text-xs ${rangeClass}`} aria-hidden="true">
        {min} - {max} אורחים
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, AlertCircle } from 'lucide-react'

interface DateTimePickerProps {
  value: string // ISO datetime string
  onChange: (value: string) => void
  label: string
  required?: boolean
  error?: string
  minDate?: string
  /** If true, validates that the datetime is not in the past. Default: true for new events */
  preventPastDateTime?: boolean
}

export default function DateTimePicker({
  value,
  onChange,
  label,
  required = false,
  error,
  minDate,
  preventPastDateTime = true,
}: DateTimePickerProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  // Parse ISO string to separate date and time
  useEffect(() => {
    if (value) {
      try {
        const dt = new Date(value)
        const dateStr = dt.toISOString().split('T')[0]
        const timeStr = dt.toTimeString().slice(0, 5)
        setDate(dateStr)
        setTime(timeStr)
      } catch {
        // Invalid date
      }
    }
  }, [value])

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date()
    return now.toTimeString().slice(0, 5)
  }

  // Check if selected date is today
  const isToday = date === getTodayDate()

  // Check if the combined datetime is in the past
  const isPastDateTime = useMemo(() => {
    if (!preventPastDateTime || !date || !time) return false
    const selectedDateTime = new Date(`${date}T${time}`)
    const now = new Date()
    return selectedDateTime < now
  }, [date, time, preventPastDateTime])

  // Check if a time preset is in the past (only relevant when date is today)
  const isTimeInPast = (timeValue: string) => {
    if (!preventPastDateTime || !isToday) return false
    const currentTime = getCurrentTime()
    return timeValue < currentTime
  }

  // Combine date and time and call onChange
  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    const todayDate = getTodayDate()
    const currentTime = getCurrentTime()

    if (newDate && time) {
      // If changing to today and current time is in the past, adjust to current time
      if (preventPastDateTime && newDate === todayDate && time < currentTime) {
        // Round up to next hour
        const now = new Date()
        const nextHour = new Date(now)
        nextHour.setHours(now.getHours() + 1, 0, 0, 0)
        const nextHourTime = nextHour.toTimeString().slice(0, 5)
        setTime(nextHourTime)
        const combined = `${newDate}T${nextHourTime}`
        onChange(combined)
      } else {
        const combined = `${newDate}T${time}`
        onChange(combined)
      }
    } else if (newDate) {
      // Default time selection based on whether it's today
      let defaultTime = '10:00'
      if (preventPastDateTime && newDate === todayDate && currentTime >= '10:00') {
        // Round up to next hour
        const now = new Date()
        const nextHour = new Date(now)
        nextHour.setHours(now.getHours() + 1, 0, 0, 0)
        defaultTime = nextHour.toTimeString().slice(0, 5)
      }
      setTime(defaultTime)
      const combined = `${newDate}T${defaultTime}`
      onChange(combined)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    if (date && newTime) {
      const combined = `${date}T${newTime}`
      onChange(combined)
    }
  }

  // Common time presets
  const timePresets = [
    { label: '08:00', value: '08:00' },
    { label: '10:00', value: '10:00' },
    { label: '12:00', value: '12:00' },
    { label: '14:00', value: '14:00' },
    { label: '16:00', value: '16:00' },
    { label: '18:00', value: '18:00' },
    { label: '20:00', value: '20:00' },
  ]

  // Computed error: show past datetime error if no other error is set
  const displayError = error || (isPastDateTime ? 'לא ניתן לבחור תאריך ושעה שעברו' : '')

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Date Input */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">תאריך</label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              min={minDate || getTodayDate()}
              className={`
                w-full px-4 py-3 pr-11 border-2 rounded-lg text-base
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                hover:border-gray-400 transition-all
                ${displayError ? 'border-red-500' : 'border-gray-300'}
              `}
              style={{
                colorScheme: 'light',
              }}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Time Input */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">שעה{isToday && preventPastDateTime && <span className="text-amber-600 mr-1">(מ-{getCurrentTime()})</span>}</label>
          <div className="relative">
            <input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className={`
                w-full px-4 py-3 pr-11 border-2 rounded-lg text-base
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                hover:border-gray-400 transition-all
                ${displayError ? 'border-red-500' : 'border-gray-300'}
              `}
              style={{
                colorScheme: 'light',
              }}
            />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Time Presets */}
      {date && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-600 flex items-center">שעות נפוצות:</span>
          {timePresets.map((preset) => {
            const isPast = isTimeInPast(preset.value)
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => !isPast && handleTimeChange(preset.value)}
                disabled={isPast}
                className={`
                  px-3 py-1 text-xs rounded-md border transition-all
                  ${isPast
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through'
                    : time === preset.value
                      ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                  }
                `}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Preview */}
      {date && time && (
        <div className={`rounded-lg p-3 text-sm ${
          isPastDateTime
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <div className="flex items-center gap-2">
            {isPastDateTime ? <AlertCircle className="w-4 h-4 text-red-600" /> : <Calendar className="w-4 h-4" />}
            <span className="font-medium">
              {new Date(`${date}T${time}`).toLocaleDateString('he-IL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className={isPastDateTime ? 'text-red-400' : 'text-green-600'}>•</span>
            <Clock className="w-4 h-4" />
            <span className="font-medium">{time}</span>
            {isPastDateTime && <span className="text-red-600 font-medium">(עבר)</span>}
          </div>
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {displayError}
        </p>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'

interface DateTimePickerProps {
  value: string // ISO datetime string
  onChange: (value: string) => void
  label: string
  required?: boolean
  error?: string
  minDate?: string
}

export default function DateTimePicker({
  value,
  onChange,
  label,
  required = false,
  error,
  minDate,
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

  // Combine date and time and call onChange
  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    if (newDate && time) {
      const combined = `${newDate}T${time}`
      onChange(combined)
    } else if (newDate) {
      // Default to 10:00 if no time set
      const combined = `${newDate}T10:00`
      setTime('10:00')
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

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
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
                ${error ? 'border-red-500' : 'border-gray-300'}
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
          <label className="block text-xs text-gray-600 mb-1">שעה</label>
          <div className="relative">
            <input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className={`
                w-full px-4 py-3 pr-11 border-2 rounded-lg text-base
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                hover:border-gray-400 transition-all
                ${error ? 'border-red-500' : 'border-gray-300'}
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
          {timePresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleTimeChange(preset.value)}
              className={`
                px-3 py-1 text-xs rounded-md border transition-all
                ${
                  time === preset.value
                    ? 'bg-blue-100 border-blue-500 text-blue-700 font-medium'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                }
              `}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Preview */}
      {date && time && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">
              {new Date(`${date}T${time}`).toLocaleDateString('he-IL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="text-green-600">•</span>
            <Clock className="w-4 h-4" />
            <span className="font-medium">{time}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  )
}

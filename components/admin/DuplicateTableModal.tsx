'use client'

import { useState } from 'react'
import { X, Copy } from 'lucide-react'

interface DuplicateTableModalProps {
  show: boolean
  table: {
    id: string
    tableNumber: string
    capacity: number
    minOrder: number
  } | null
  onClose: () => void
  onConfirm: (tableId: string, count: number) => Promise<void>
}

export default function DuplicateTableModal({
  show,
  table,
  onClose,
  onConfirm
}: DuplicateTableModalProps) {
  const [countInput, setCountInput] = useState('1')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!show || !table) return null

  // Parse count for validation and display
  const count = parseInt(countInput) || 0

  const handleSubmit = async () => {
    if (count < 1 || count > 100) {
      alert('כמות חייבת להיות בין 1 ל-100')
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(table.id, count)
      setCountInput('1') // Reset
      onClose()
    } catch (error) {
      console.error('Error duplicating table:', error)
      // Error is handled in parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle input change - allow empty or valid numbers
  const handleCountChange = (value: string) => {
    // Allow empty string for deletion
    if (value === '') {
      setCountInput('')
      return
    }

    // Only allow numbers
    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      // Clamp between 1 and 100
      const clampedValue = Math.max(1, Math.min(100, numValue))
      setCountInput(String(clampedValue))
    }
  }

  // Handle blur - ensure valid value
  const handleBlur = () => {
    if (countInput === '' || count < 1) {
      setCountInput('1')
    }
  }

  // Auto-select text on focus for easy replacement
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  // Extract number from table name for preview
  const tableNumberMatch = table.tableNumber.match(/\d+/)
  const baseNumber = tableNumberMatch ? parseInt(tableNumberMatch[0], 10) : 1

  // Generate preview of new table names
  const previewNames = []
  for (let i = 1; i <= Math.min(count, 3); i++) {
    const newNumber = baseNumber + i
    const newName = table.tableNumber.replace(/\d+/, String(newNumber)) || `שולחן ${newNumber}`
    previewNames.push(newName)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Copy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">שכפול שולחן</h2>
                <p className="text-sm text-gray-600">שולחן {table.tableNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={isSubmitting}
              aria-label="סגור"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Source Table Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">שולחן מקור:</span>
                <span>{table.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">קיבולת:</span>
                <span>{table.capacity} {table.capacity === 1 ? 'אורח' : 'אורחים'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">מינימום:</span>
                <span>{table.minOrder} {table.minOrder === 1 ? 'אורח' : 'אורחים'}</span>
              </div>
            </div>
          </div>

          {/* Count Input */}
          <div>
            <label htmlFor="count" className="block text-sm font-medium text-gray-900 mb-2">
              כמה שולחנות ליצור?
            </label>
            <input
              id="count"
              type="number"
              min={1}
              max={100}
              value={countInput}
              onChange={(e) => handleCountChange(e.target.value)}
              onBlur={handleBlur}
              onFocus={handleFocus}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100 text-lg font-medium text-center"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              מקסימום 100 שולחנות
            </p>
          </div>

          {/* Preview */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-900 mb-2">
              תצוגה מקדימה:
            </div>
            <div className="space-y-1.5">
              {previewNames.map((name, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-purple-800">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  <span>{name} - {table.capacity} {table.capacity === 1 ? 'אורח' : 'אורחים'}</span>
                </div>
              ))}
              {count > 3 && (
                <div className="text-xs text-purple-600 font-medium mr-4">
                  + עוד {count - 3} {count - 3 === 1 ? 'שולחן' : 'שולחנות'}
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200">
              <div className="text-xs text-purple-700 space-y-1">
                <div className="flex justify-between">
                  <span>סה"כ שולחנות חדשים:</span>
                  <span className="font-bold">{count}</span>
                </div>
                <div className="flex justify-between">
                  <span>קיבולת נוספת:</span>
                  <span className="font-bold">{count * table.capacity} מקומות</span>
                </div>
              </div>
            </div>
          </div>

          {/* Naming Pattern Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">💡</span>
              <div className="flex-1 text-xs text-blue-800">
                <p className="font-medium mb-1">שיטת מספור אוטומטית</p>
                <p>השולחנות יקבלו מספור המשך אוטומטי מהשולחן האחרון באירוע</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-5">
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || count < 1}
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>יוצר {count} {count === 1 ? 'שולחן' : 'שולחנות'}...</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>צור {count} {count === 1 ? 'שולחן' : 'שולחנות'} ✨</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

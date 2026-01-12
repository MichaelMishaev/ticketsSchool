'use client'

import { useState } from 'react'
import { X, Edit3 } from 'lucide-react'

interface BulkEditModalProps {
  show: boolean
  selectedCount: number
  onClose: () => void
  onConfirm: (updates: {
    capacity?: number
    minOrder?: number
    status?: 'AVAILABLE' | 'INACTIVE'
  }) => Promise<void>
}

export default function BulkEditModal({
  show,
  selectedCount,
  onClose,
  onConfirm
}: BulkEditModalProps) {
  const [capacity, setCapacity] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [status, setStatus] = useState<'' | 'AVAILABLE' | 'INACTIVE'>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!show) return null

  const handleSubmit = async () => {
    const updates: any = {}

    if (capacity) {
      const cap = parseInt(capacity)
      if (isNaN(cap) || cap < 1) {
        alert('קיבולת חייבת להיות מספר חיובי')
        return
      }
      updates.capacity = cap
    }

    if (minOrder) {
      const min = parseInt(minOrder)
      if (isNaN(min) || min < 1) {
        alert('מינימום חייב להיות מספר חיובי')
        return
      }
      updates.minOrder = min
    }

    if (status) {
      updates.status = status
    }

    if (Object.keys(updates).length === 0) {
      alert('נא לבחור לפחות שדה אחד לעדכון')
      return
    }

    // Validate minOrder <= capacity if both are being updated
    if (updates.capacity && updates.minOrder && updates.minOrder > updates.capacity) {
      alert('מינימום אורחים לא יכול להיות גבוה מהקיבולת')
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm(updates)
      // Reset form
      setCapacity('')
      setMinOrder('')
      setStatus('')
      onClose()
    } catch (error) {
      console.error('Error bulk editing:', error)
    } finally {
      setIsSubmitting(false)
    }
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
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">עריכה מרובה</h2>
                <p className="text-sm text-gray-600">{selectedCount} שולחנות נבחרו</p>
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
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="bulk-capacity" className="block text-sm font-medium text-gray-900 mb-2">
              קיבולת (מקסימום אורחים)
            </label>
            <input
              id="bulk-capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="השאר ריק לא לשנות"
              disabled={isSubmitting}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="bulk-minOrder" className="block text-sm font-medium text-gray-900 mb-2">
              מינימום אורחים
            </label>
            <input
              id="bulk-minOrder"
              type="number"
              min={1}
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="השאר ריק לא לשנות"
              disabled={isSubmitting}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="bulk-status" className="block text-sm font-medium text-gray-900 mb-2">
              סטטוס
            </label>
            <select
              id="bulk-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
            >
              <option value="">השאר ריק לא לשנות</option>
              <option value="AVAILABLE">פנוי</option>
              <option value="INACTIVE">רזרבה (מוחזק)</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">💡</span>
              <div className="flex-1 text-xs text-blue-800">
                <p className="font-medium">רק השדות שמולאו יעודכנו. שדות ריקים לא ישונו.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-5">
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>מעדכן {selectedCount} שולחנות...</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>עדכן {selectedCount} שולחנות</span>
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

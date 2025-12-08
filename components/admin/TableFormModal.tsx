'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, Check } from 'lucide-react'

export interface TableFormData {
  tableNumber: string
  capacity: number
  minOrder: number
}

interface TableFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (table: TableFormData) => void
  initialData?: Partial<TableFormData>
  mode: 'create' | 'edit'
  existingTableNumbers?: string[]
}

export default function TableFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  existingTableNumbers = []
}: TableFormModalProps) {
  const [formData, setFormData] = useState<TableFormData>({
    tableNumber: '',
    capacity: 4,
    minOrder: 2
  })

  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        tableNumber: initialData?.tableNumber || '',
        capacity: initialData?.capacity || 4,
        minOrder: initialData?.minOrder || 2
      })
      setErrors([])
      setIsSubmitting(false)
    }
  }, [isOpen, initialData])

  const validate = (): boolean => {
    const newErrors: string[] = []

    if (!formData.tableNumber.trim()) {
      newErrors.push('מספר שולחן חובה')
    } else if (
      mode === 'create' &&
      existingTableNumbers.includes(formData.tableNumber.trim())
    ) {
      newErrors.push('מספר שולחן כבר קיים')
    }

    if (formData.capacity < 1) {
      newErrors.push('קיבולת חייבת להיות לפחות 1')
    }

    if (formData.minOrder < 1) {
      newErrors.push('מינימום אורחים חייב להיות לפחות 1')
    }

    if (formData.minOrder > formData.capacity) {
      newErrors.push('מינימום אורחים לא יכול להיות גדול מהקיבולת')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    onSubmit(formData)
    setIsSubmitting(false)
    onClose()
  }

  const handleChange = (field: keyof TableFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'create' ? 'הוסף שולחן חדש' : 'ערוך שולחן'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="סגור"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Table Number */}
            <div>
              <label
                htmlFor="tableNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                מספר שולחן <span className="text-red-500">*</span>
              </label>
              <input
                id="tableNumber"
                type="text"
                value={formData.tableNumber}
                onChange={(e) => handleChange('tableNumber', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-400 transition-all
                  text-gray-900 bg-white"
                placeholder='לדוגמה: "1", "פטיו-3", "חלון"'
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                מזהה ייחודי לשולחן (יכול להיות מספר או תיאור)
              </p>
            </div>

            {/* Capacity */}
            <div>
              <label
                htmlFor="capacity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                קיבולת מקסימלית <span className="text-red-500">*</span>
              </label>
              <input
                id="capacity"
                type="number"
                min="1"
                max="50"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-400 transition-all
                  text-gray-900 bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                כמה אורחים יכולים לשבת בשולחן (מקסימום)
              </p>
            </div>

            {/* Min Order */}
            <div>
              <label
                htmlFor="minOrder"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                מינימום אורחים <span className="text-red-500">*</span>
              </label>
              <input
                id="minOrder"
                type="number"
                min="1"
                max={formData.capacity}
                value={formData.minOrder}
                onChange={(e) => handleChange('minOrder', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-400 transition-all
                  text-gray-900 bg-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                מספר מינימלי של אורחים הנדרש להזמנת השולחן
              </p>
            </div>

            {/* Preview */}
            {formData.tableNumber && formData.capacity >= formData.minOrder && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <div className="font-semibold mb-1">תצוגה מקדימה:</div>
                    <div>
                      שולחן {formData.tableNumber} - עד {formData.capacity} אורחים (מינימום: {formData.minOrder})
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg
                  hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg
                  hover:bg-blue-700 active:bg-blue-800 transition-colors
                  disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'שומר...' : mode === 'create' ? 'הוסף שולחן' : 'שמור שינויים'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

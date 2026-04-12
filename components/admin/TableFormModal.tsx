'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, Check } from 'lucide-react'

export interface TableFormData {
  tableNumber: string
  capacity: number
  minOrder: number
  count?: number  // Number of tables to create (for bulk creation)
}

interface TableFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (table: TableFormData) => void
  initialData?: Partial<TableFormData>
  mode: 'create' | 'edit'
  existingTableNumbers?: string[]
  groupEditCount?: number  // If set, editing multiple tables at once
}

export default function TableFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  existingTableNumbers = [],
  groupEditCount
}: TableFormModalProps) {
  const [formData, setFormData] = useState<TableFormData>({
    tableNumber: '',
    capacity: 4,
    minOrder: 2,
    count: 1
  })

  // String inputs for better UX
  const [capacityInput, setCapacityInput] = useState('4')
  const [minOrderInput, setMinOrderInput] = useState('2')
  const [countInput, setCountInput] = useState('1')

  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      const capacity = initialData?.capacity || 4
      const minOrder = initialData?.minOrder || 2
      const count = mode === 'create' ? 1 : (groupEditCount ? groupEditCount : undefined)

      setFormData({
        tableNumber: initialData?.tableNumber || '',
        capacity,
        minOrder,
        count
      })
      setCapacityInput(String(capacity))
      setMinOrderInput(String(minOrder))

      // Set count input for create mode or group edit
      if (mode === 'create') {
        setCountInput('1')
      } else if (groupEditCount) {
        setCountInput(String(groupEditCount))
      }

      setErrors([])
      setIsSubmitting(false)
    }
  }, [isOpen, initialData, mode, groupEditCount])

  const validate = (): boolean => {
    const newErrors: string[] = []

    // Skip table number validation when editing group
    if (!groupEditCount) {
      if (!formData.tableNumber.trim()) {
        newErrors.push('שם שולחן חובה')
      } else if (
        mode === 'create' &&
        existingTableNumbers.includes(formData.tableNumber.trim())
      ) {
        newErrors.push('שם שולחן כבר קיים')
      }
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

    // Validate count based on mode
    if (mode === 'create' && formData.count && (formData.count < 1 || formData.count > 100)) {
      newErrors.push('כמות שולחנות חייבת להיות בין 1 ל-100')
    }
    if (groupEditCount && formData.count !== undefined && (formData.count < 1 || formData.count > 100)) {
      newErrors.push('כמות שולחנות חייבת להיות בין 1 ל-100')
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

  // Handle capacity input change
  const handleCapacityChange = (value: string) => {
    if (value === '') {
      setCapacityInput('')
      return
    }

    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(1, Math.min(50, numValue))
      setCapacityInput(String(clampedValue))
      setFormData(prev => ({ ...prev, capacity: clampedValue }))
    }

    if (errors.length > 0) {
      setErrors([])
    }
  }

  // Handle min order input change
  const handleMinOrderChange = (value: string) => {
    if (value === '') {
      setMinOrderInput('')
      return
    }

    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(1, Math.min(formData.capacity, numValue))
      setMinOrderInput(String(clampedValue))
      setFormData(prev => ({ ...prev, minOrder: clampedValue }))
    }

    if (errors.length > 0) {
      setErrors([])
    }
  }

  // Handle blur - ensure valid values
  const handleCapacityBlur = () => {
    if (capacityInput === '' || formData.capacity < 1) {
      setCapacityInput('1')
      setFormData(prev => ({ ...prev, capacity: 1 }))
    }
  }

  const handleMinOrderBlur = () => {
    if (minOrderInput === '' || formData.minOrder < 1) {
      setMinOrderInput('1')
      setFormData(prev => ({ ...prev, minOrder: 1 }))
    }
  }

  // Handle count input change
  const handleCountChange = (value: string) => {
    if (value === '') {
      setCountInput('')
      return
    }

    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(1, Math.min(100, numValue))
      setCountInput(String(clampedValue))
      setFormData(prev => ({ ...prev, count: clampedValue }))
    }

    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleCountBlur = () => {
    if (countInput === '' || (formData.count !== undefined && formData.count < 1)) {
      setCountInput('1')
      setFormData(prev => ({ ...prev, count: 1 }))
    }
  }

  // Auto-select text on focus for easy replacement
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {mode === 'create'
                  ? 'הוסף שולחן חדש'
                  : groupEditCount
                    ? `ערוך ${groupEditCount} שולחנות`
                    : 'ערוך שולחן'}
              </h2>
              {groupEditCount && (
                <p className="text-xs text-gray-600 mt-1">
                  שינויים יחולו על כל {groupEditCount} השולחנות
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="סגור"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form - Scrollable content */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
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

            {/* Table Number - Hidden when editing group */}
            {!groupEditCount && (
              <div>
                <label
                  htmlFor="tableNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  שם שולחן <span className="text-red-500">*</span>
                </label>
                <input
                  id="tableNumber"
                  type="text"
                  value={formData.tableNumber}
                  onChange={(e) => handleChange('tableNumber', e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg
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
            )}

            {/* Count (for create mode or group edit) */}
            {(mode === 'create' || groupEditCount) && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 sm:p-4">
                <label
                  htmlFor="count"
                  className="block text-sm font-medium text-purple-900 mb-2"
                >
                  {groupEditCount ? 'סה״כ שולחנות בקבוצה ✨' : 'כמה שולחנות דומים ליצור? ✨'}
                </label>
                <input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  value={countInput}
                  onChange={(e) => handleCountChange(e.target.value)}
                  onBlur={handleCountBlur}
                  onFocus={handleFocus}
                  className="w-full px-4 py-2.5 sm:py-3 border-2 border-purple-300 rounded-lg
                    focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                    hover:border-purple-400 transition-all
                    text-gray-900 bg-white text-center text-lg font-bold"
                />
                <p className="text-xs text-purple-700 mt-2">
                  {groupEditCount ? (
                    (() => {
                      const currentCount = groupEditCount
                      const newCount = formData.count || currentCount
                      const diff = newCount - currentCount

                      if (diff === 0) {
                        return (
                          <>
                            <span className="font-medium">כרגע: {currentCount} שולחנות</span>
                            <span className="block mt-1">לא ישתנה מספר השולחנות</span>
                          </>
                        )
                      } else if (diff > 0) {
                        return (
                          <>
                            <span className="font-medium">כרגע: {currentCount} שולחנות</span>
                            <span className="block mt-1 text-green-700">✅ יווספו {diff} שולחנות</span>
                            <span className="font-medium block mt-1">
                              (סה״כ: {newCount} שולחנות, {newCount * formData.capacity} מקומות)
                            </span>
                          </>
                        )
                      } else {
                        return (
                          <>
                            <span className="font-medium">כרגע: {currentCount} שולחנות</span>
                            <span className="block mt-1 text-red-700">🗑️ יימחקו {Math.abs(diff)} שולחנות</span>
                            <span className="font-medium block mt-1">
                              (ישארו: {newCount} שולחנות, {newCount * formData.capacity} מקומות)
                            </span>
                          </>
                        )
                      }
                    })()
                  ) : (
                    formData.count === 1 ? (
                      'ייווצר שולחן אחד'
                    ) : (
                      <>
                        יווצרו {formData.count} שולחנות עם מספור אוטומטי
                        <span className="font-medium block mt-1">
                          (סה״כ קיבולת: {(formData.count || 1) * formData.capacity} מקומות)
                        </span>
                      </>
                    )
                  )}
                </p>
              </div>
            )}

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
                value={capacityInput}
                onChange={(e) => handleCapacityChange(e.target.value)}
                onBlur={handleCapacityBlur}
                onFocus={handleFocus}
                className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg
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
                value={minOrderInput}
                onChange={(e) => handleMinOrderChange(e.target.value)}
                onBlur={handleMinOrderBlur}
                onFocus={handleFocus}
                className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-green-800">
                    <div className="font-semibold mb-1">תצוגה מקדימה:</div>
                    {mode === 'create' && formData.count && formData.count > 1 ? (
                      <div className="space-y-1">
                        <div>• שולחן {formData.tableNumber} - עד {formData.capacity} אורחים (מינימום: {formData.minOrder})</div>
                        {formData.count > 2 && (
                          <div>• שולחן {parseInt(formData.tableNumber) + 1 || `${formData.tableNumber}-2`} - עד {formData.capacity} אורחים</div>
                        )}
                        {formData.count > 3 && (
                          <div className="text-xs">... + עוד {formData.count - 2} שולחנות</div>
                        )}
                        <div className="font-bold mt-2 pt-2 border-t border-green-300">
                          סה״כ: {formData.count} שולחנות, {(formData.count || 1) * formData.capacity} מקומות
                        </div>
                      </div>
                    ) : (
                      <div>
                        שולחן {formData.tableNumber} - עד {formData.capacity} אורחים (מינימום: {formData.minOrder})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Actions - Sticky footer */}
            <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-lg flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg
                  hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-blue-600 text-white font-medium rounded-lg
                  hover:bg-blue-700 active:bg-blue-800 transition-colors
                  disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isSubmitting
                  ? 'שומר...'
                  : mode === 'create'
                    ? formData.count && formData.count > 1
                      ? `צור ${formData.count} שולחנות ✨`
                      : 'הוסף שולחן'
                    : 'שמור שינויים'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'

interface SaveTemplateModalProps {
  show: boolean
  tableCount: number
  onClose: () => void
  onSave: (name: string, description: string) => Promise<void>
}

export default function SaveTemplateModal({
  show,
  tableCount,
  onClose,
  onSave
}: SaveTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (!show) return null

  const handleSave = async () => {
    if (!name.trim()) {
      alert('נא להזין שם לתבנית')
      return
    }

    setIsSaving(true)
    try {
      await onSave(name.trim(), description.trim())
      // Reset form
      setName('')
      setDescription('')
      onClose()
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setIsSaving(false)
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
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Save className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">שמירת תבנית</h2>
                <p className="text-sm text-gray-600">{tableCount} שולחנות יישמרו</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={isSaving}
              aria-label="סגור"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="template-name" className="block text-sm font-medium text-gray-900 mb-2">
              שם התבנית <span className="text-red-500">*</span>
            </label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='למשל: "חתונה 200 אורחים" או "גאלה 40 שולחנות"'
              disabled={isSaving}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="template-description" className="block text-sm font-medium text-gray-900 mb-2">
              תיאור (אופציונלי)
            </label>
            <textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של התבנית"
              rows={3}
              disabled={isSaving}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100 resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">💡</span>
              <div className="flex-1 text-xs text-blue-800">
                <p className="font-medium mb-1">התבנית תשמר את:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>קיבולת כל שולחן</li>
                  <li>מינימום אורחים לשולחן</li>
                  <li>כמות השולחנות</li>
                  <li>תבנית המספור</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-5">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>שומר תבנית...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>שמור תבנית</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
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

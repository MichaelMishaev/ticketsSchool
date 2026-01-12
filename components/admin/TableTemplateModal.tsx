'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Globe, Lock, Trash2 } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  config: any[]
  timesUsed: number
  createdAt: string
}

interface TableTemplateModalProps {
  show: boolean
  onClose: () => void
  onSelect: (templateId: string) => Promise<void>
  onSaveAsTemplate: () => void
}

export default function TableTemplateModal({
  show,
  onClose,
  onSelect,
  onSaveAsTemplate
}: TableTemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    if (show) {
      fetchTemplates()
    }
  }, [show])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (templateId: string) => {
    setSelecting(templateId)
    try {
      await onSelect(templateId)
      onClose()
    } catch (error) {
      console.error('Failed to apply template:', error)
    } finally {
      setSelecting(null)
    }
  }

  const handleDelete = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('האם למחוק תבנית זו?')) return

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
      } else {
        alert('שגיאה במחיקת תבנית')
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('שגיאה במחיקת תבנית')
    }
  }

  const calculateTableCount = (config: any[]) => {
    return config.reduce((sum, item) => sum + (item.count || 0), 0)
  }

  const calculateCapacity = (config: any[]) => {
    return config.reduce((sum, item) => sum + ((item.count || 0) * (item.capacity || 0)), 0)
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-5 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">תבניות שולחנות</h2>
                <p className="text-sm text-gray-600">בחר תבנית מוכנה או שמור את השולחנות הנוכחיים</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="סגור"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">אין תבניות זמינות</h3>
              <p className="text-gray-600 mb-4">צור תבנית ראשונה על ידי שמירת השולחנות הנוכחיים</p>
              <button
                onClick={() => {
                  onClose()
                  onSaveAsTemplate()
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>שמור כתבנית</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => {
                const tableCount = calculateTableCount(template.config)
                const capacity = calculateCapacity(template.config)
                const isSelecting = selecting === template.id

                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template.id)}
                    disabled={isSelecting}
                    className="w-full text-right p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 truncate">{template.name}</h3>
                          {template.isPublic ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex-shrink-0">
                              <Globe className="w-3 h-3" />
                              <span>ציבורי</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full flex-shrink-0">
                              <Lock className="w-3 h-3" />
                              <span>פרטי</span>
                            </span>
                          )}
                        </div>

                        {template.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{template.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>📋 {tableCount} שולחנות</span>
                          <span>👥 {capacity} מקומות</span>
                          <span>🔢 נוצל {template.timesUsed} פעמים</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!template.isPublic && (
                          <button
                            onClick={(e) => handleDelete(template.id, e)}
                            className="p-2 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="מחק תבנית"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}

                        {isSelecting ? (
                          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                            <div className="w-2 h-2 bg-purple-600 rounded-full group-hover:bg-white"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-5 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose()
                onSaveAsTemplate()
              }}
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>שמור שולחנות נוכחיים כתבנית</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

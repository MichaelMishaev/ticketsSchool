'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { FieldSchema, FieldType } from '@/types'

interface FieldBuilderProps {
  fields: FieldSchema[]
  onChange: (fields: FieldSchema[]) => void
}

const defaultFields: FieldSchema[] = [
  { id: 'name', name: 'name', label: 'שם מלא', type: 'text', required: true },
  { id: 'phone', name: 'phone', label: 'טלפון', type: 'text', required: true },
]

export default function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState<Partial<FieldSchema>>({
    label: '',
    type: 'text',
    required: false,
  })

  const addField = () => {
    if (!newField.label) return

    const field: FieldSchema = {
      id: `field_${Date.now()}`,
      name: `field_${Date.now()}`,
      label: newField.label,
      type: newField.type as FieldType,
      required: newField.required || false,
      options: newField.options,
    }

    onChange([...fields, field])
    setNewField({ label: '', type: 'text', required: false })
    setShowAddField(false)
  }

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<FieldSchema>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const isDefaultField = (id: string) => {
    return ['name', 'phone'].includes(id)
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-medium text-gray-900">שדות הטופס</h3>

      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="w-4 h-4 text-gray-400 hidden sm:block" />
              <div className="flex-1">
                <span className="font-medium">{field.label}</span>
                {field.required && (
                  <span className="mr-1 text-red-500">*</span>
                )}
                <span className="mr-2 text-sm text-gray-500">({field.type})</span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2">
              {!isDefaultField(field.id) ? (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="rounded"
                    />
                    חובה
                  </label>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-sm text-gray-500">שדה ברירת מחדל</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddField ? (
        <div className="p-4 bg-white border rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תווית השדה
            </label>
            <input
              type="text"
              value={newField.label || ''}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="לדוגמה: הערות"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סוג השדה
            </label>
            <select
              value={newField.type}
              onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="text">טקסט</option>
              <option value="number">מספר</option>
              <option value="dropdown">רשימה נפתחת</option>
              <option value="checkbox">תיבת סימון</option>
            </select>
          </div>

          {newField.type === 'dropdown' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אפשרויות (הפרד בפסיק)
              </label>
              <input
                type="text"
                onChange={(e) => setNewField({ ...newField, options: e.target.value.split(',').map(o => o.trim()) })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="אופציה 1, אופציה 2, אופציה 3"
              />
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newField.required}
              onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
              className="rounded"
            />
            שדה חובה
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addField}
              disabled={!newField.label}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              הוסף שדה
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddField(false)
                setNewField({ label: '', type: 'text', required: false })
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddField(true)}
          className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600"
        >
          <Plus className="w-4 h-4" />
          הוסף שדה מותאם אישית
        </button>
      )}
    </div>
  )
}

export { defaultFields }
'use client'

import { useState } from 'react'
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  Hash,
  ChevronDown,
  CheckSquare,
  Lock,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { FieldSchema, FieldType } from '@/types'

interface FieldBuilderProps {
  fields: FieldSchema[]
  onChange: (fields: FieldSchema[]) => void
}

// Default required fields for events (name and phone are mandatory for contact)
export const defaultFields: FieldSchema[] = [
  {
    id: 'name',
    name: 'name',
    label: 'שם מלא',
    type: 'text',
    required: true,
    placeholder: 'שם פרטי ומשפחה',
  },
  {
    id: 'phone',
    name: 'phone',
    label: 'טלפון',
    type: 'text',
    required: true,
    placeholder: '05X-XXX-XXXX',
  },
]

// Field type icons and colors
const fieldTypeConfig = {
  text: { icon: Type, color: 'text-blue-600', bg: 'bg-blue-50', label: 'טקסט' },
  number: { icon: Hash, color: 'text-green-600', bg: 'bg-green-50', label: 'מספר' },
  dropdown: { icon: ChevronDown, color: 'text-purple-600', bg: 'bg-purple-50', label: 'רשימה' },
  checkbox: { icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-50', label: 'סימון' },
}

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
      placeholder: newField.placeholder,
    }

    onChange([...fields, field])
    setNewField({ label: '', type: 'text', required: false, placeholder: '' })
    setShowAddField(false)
  }

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<FieldSchema>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const isDefaultField = (id: string) => {
    return ['name', 'phone'].includes(id)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">שדות הטופס</h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            הגדר אילו פרטים תרצה לאסוף מהמשתתפים
          </p>
        </div>
        <div className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold whitespace-nowrap self-start">
          {fields.length} {fields.length === 1 ? 'שדה' : 'שדות'}
        </div>
      </div>

      {/* Fields List */}
      <div className="space-y-3">
        {/* ══════════════════════════════════════════════════════════════
            DEFAULT FIELDS - שם מלא + טלפון
            Read-only system fields, each shown as a distinct card
        ══════════════════════════════════════════════════════════════ */}
        {fields
          .filter((f) => isDefaultField(f.id))
          .map((field, index) => {
            const config = fieldTypeConfig[field.type as keyof typeof fieldTypeConfig]
            const Icon = config?.icon || Type
            return (
              <div
                key={field.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/70 to-blue-50/50"
              >
                {/* Field number indicator */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-200 text-purple-700 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </div>

                {/* Field type icon */}
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${config?.bg || 'bg-gray-50'}`}>
                  <Icon className={`w-4 h-4 ${config?.color || 'text-gray-600'}`} />
                </div>

                {/* Field label */}
                <span className="font-semibold text-sm text-gray-800 flex-1">{field.label}</span>

                {/* Required badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full whitespace-nowrap">
                  חובה
                </span>

                {/* Locked badge */}
                <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 font-medium px-2 py-0.5 bg-purple-100 rounded-full border border-purple-200 flex-shrink-0">
                  <Lock className="w-3 h-3" />
                  <span>מערכת</span>
                </span>
              </div>
            )
          })}

        {/* ══════════════════════════════════════════════════════════════
            CUSTOM FIELDS - user-created, fully editable
        ══════════════════════════════════════════════════════════════ */}
        {fields
          .filter((f) => !isDefaultField(f.id))
          .map((field, index) => {
            const config = fieldTypeConfig[field.type as keyof typeof fieldTypeConfig]
            const Icon = config?.icon || Type

            return (
              <div
                key={field.id}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="p-3 sm:p-4">
                  {/* Mobile: Vertical Layout, Desktop: Horizontal */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Top Row: Icon + Title + Badges */}
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      {/* Drag Handle - Hidden on mobile */}
                      <div className="hidden sm:block mt-1">
                        <GripVertical className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
                      </div>

                      {/* Field Icon */}
                      <div
                        className={`p-2.5 sm:p-2 rounded-lg flex-shrink-0 ${config?.bg || 'bg-gray-50'}`}
                      >
                        <Icon
                          className={`w-5 h-5 sm:w-5 sm:h-5 ${config?.color || 'text-gray-600'}`}
                        />
                      </div>

                      {/* Field Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap mb-2">
                          <h4 className="font-bold text-base sm:text-base text-gray-900 leading-tight">
                            {field.label}
                          </h4>

                          {field.required && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold whitespace-nowrap">
                              חובה
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            {config?.label || field.type}
                          </span>
                          {field.placeholder && (
                            <span className="text-gray-500 text-xs truncate max-w-[200px]">
                              · {field.placeholder}
                            </span>
                          )}
                          {field.options && field.options.length > 0 && (
                            <span className="text-gray-500 text-xs">
                              · {field.options.length} אפשרויות
                            </span>
                          )}
                        </div>

                        {/* Options preview for dropdown */}
                        {field.type === 'dropdown' && field.options && field.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {field.options.slice(0, 3).map((option, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                              >
                                {option}
                              </span>
                            ))}
                            {field.options.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-medium">
                                +{field.options.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions - Full width on mobile, inline on desktop */}
                    <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 sm:border-0">
                      <label className="flex items-center gap-2 text-sm cursor-pointer group/checkbox flex-1 sm:flex-initial">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-semibold sm:font-normal group-hover/checkbox:text-gray-900">
                          חובה
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="p-2.5 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                        title="מחק שדה"
                      >
                        <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* Add Field Section */}
      {showAddField ? (
        <div className="relative rounded-xl sm:rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 shadow-lg">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg">
              <Sparkles className="w-5 h-5 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <h4 className="font-bold text-base sm:text-lg text-gray-900">הוסף שדה מותאם אישית</h4>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Label Input */}
            <div>
              <label className="block text-sm sm:text-sm font-bold text-gray-900 mb-1">
                שם השדה שיוצג למשתמשים <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-2 font-medium">
                זה הטקסט שיופיע מעל תיבת הקלט (למשל: "הערות מיוחדות")
              </p>
              <input
                type="text"
                value={newField.label || ''}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                className="w-full px-4 py-3.5 sm:py-3 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900 bg-white"
                placeholder='לדוגמה: "הערות מיוחדות"'
                autoFocus
              />
            </div>

            {/* Field Type */}
            <div>
              <label className="block text-sm sm:text-sm font-bold text-gray-900 mb-1">
                סוג השדה
              </label>
              <p className="text-xs text-gray-600 mb-2 font-medium">בחר את סוג הקלט המתאים</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-2">
                {Object.entries(fieldTypeConfig).map(([type, config]) => {
                  const Icon = config.icon
                  const isSelected = newField.type === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewField({ ...newField, type: type as FieldType })}
                      className={`
                        flex items-center justify-center gap-2 px-3 sm:px-4 py-3.5 sm:py-3 rounded-lg border-2 transition-all active:scale-95
                        ${
                          isSelected
                            ? `${config.bg} border-blue-400 ring-2 ring-blue-200`
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon
                        className={`w-5 h-5 sm:w-5 sm:h-5 ${isSelected ? config.color : 'text-gray-400'}`}
                      />
                      <span
                        className={`font-bold sm:font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}
                      >
                        {config.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dropdown Options */}
            {newField.type === 'dropdown' && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1">
                  רשימת האפשרויות שהמשתמש יוכל לבחור מהן <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  כתוב כל אפשרות והפרד בפסיק (,) - לדוגמה: בשר, דג, צמחוני, טבעוני
                </p>
                <input
                  type="text"
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      options: e.target.value
                        .split(',')
                        .map((o) => o.trim())
                        .filter((o) => o),
                    })
                  }
                  className="w-full px-4 py-3.5 sm:py-3 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-900 bg-white"
                  placeholder="בשר, דג, צמחוני, טבעוני"
                />
                <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-green-900 mb-1">טיפ:</p>
                      <p className="text-xs text-green-800 font-medium">
                        הפרד כל אפשרות בפסיק. לדוגמה:{' '}
                        <span className="font-bold">אופציה 1, אופציה 2, אופציה 3</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Required Checkbox */}
            <label className="flex items-start gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-all active:scale-[0.98]">
              <input
                type="checkbox"
                checked={newField.required || false}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                className="w-5 h-5 sm:w-5 sm:h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="font-bold text-base sm:text-sm text-gray-900">שדה חובה</span>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  המשתתפים חייבים למלא שדה זה
                </p>
              </div>
            </label>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={addField}
                disabled={
                  !newField.label ||
                  (newField.type === 'dropdown' &&
                    (!newField.options || newField.options.length === 0))
                }
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 sm:py-3.5 bg-blue-600 text-white font-bold text-base sm:text-base rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>הוסף שדה</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddField(false)
                  setNewField({ label: '', type: 'text', required: false, placeholder: '' })
                }}
                className="px-6 py-4 sm:py-3.5 bg-white text-gray-700 font-bold text-base sm:text-base rounded-lg hover:bg-gray-50 border-2 border-gray-200 transition-all active:scale-95"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddField(true)}
          className="w-full flex items-center justify-center gap-3 px-6 py-5 sm:py-4 border-2 border-dashed border-gray-300 rounded-xl sm:rounded-2xl hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-bold sm:font-semibold transition-all group active:scale-[0.98]"
        >
          <div className="p-2.5 sm:p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
            <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
          </div>
          <span className="text-base sm:text-base">הוסף שדה מותאם אישית</span>
        </button>
      )}

      {/* Info Box */}
      {fields.length === 2 && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <AlertCircle className="w-5 h-5 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 leading-relaxed">
            <p className="font-bold mb-1">💡 טיפ:</p>
            <p>
              הוסף שדות נוספים כמו "הערות תזונתיות", "העדפות ישיבה" או "אירוע מיוחד" לאסוף מידע
              רלוונטי מהלקוחות
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useToast } from '@/components/Toast'
import StepWizard from '@/components/StepWizard'
import DateTimePicker from '@/components/DateTimePicker'
import TableFormModal, { TableFormData } from '@/components/admin/TableFormModal'
import TableCard from '@/components/admin/TableCard'
import FieldBuilder, { defaultFields } from '@/components/field-builder'
import { FieldSchema } from '@/types'
import {
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Clock,
  UtensilsCrossed,
  Ban,
  FormInput,
  Users,
} from 'lucide-react'

interface TableDataWithId extends TableFormData {
  tempId: string
  order: number
}

export default function NewRestaurantEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const { addToast, ToastContainer } = useToast()

  // Step 1 & 2 data (Basic Info + DateTime)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startAt: '',
    endAt: '',
  })

  // Step 3 data (Tables)
  const [tables, setTables] = useState<TableDataWithId[]>([])
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<TableDataWithId | null>(null)
  const [editingGroup, setEditingGroup] = useState<TableDataWithId[] | null>(null)

  // Step 4 data (Registration Fields)
  const [fieldsSchema, setFieldsSchema] = useState<FieldSchema[]>(defaultFields)

  // Step 5 data (Cancellation)
  const [allowCancellation, setAllowCancellation] = useState(true)
  const [deadlineHours, setDeadlineHours] = useState(2)
  const [deadlineHoursInput, setDeadlineHoursInput] = useState('2')
  const [requireReason, setRequireReason] = useState(false)

  const steps = [
    { id: 'details', title: 'פרטים', description: 'מידע בסיסי' },
    { id: 'timing', title: 'תזמון', description: 'תאריכים ושעות' },
    { id: 'tables', title: 'שולחנות', description: 'ניהול שולחנות' },
    { id: 'fields', title: 'שדות רישום', description: 'מידע מהלקוחות' },
    { id: 'cancellation', title: 'ביטולים', description: 'מדיניות ביטול' },
  ]

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle deadline hours input change
  const handleDeadlineHoursChange = (value: string) => {
    if (value === '') {
      setDeadlineHoursInput('')
      return
    }

    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(72, numValue))
      setDeadlineHoursInput(String(clampedValue))
      setDeadlineHours(clampedValue)
    }
  }

  // Handle blur - ensure valid value
  const handleDeadlineHoursBlur = () => {
    if (deadlineHoursInput === '') {
      setDeadlineHoursInput('0')
      setDeadlineHours(0)
    }
  }

  // Auto-select text on focus for easy replacement
  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Details
        return formData.title.length >= 3
      case 1: // Timing
        return formData.startAt !== ''
      case 2: // Tables
        return tables.length >= 1
      case 3: // Registration Fields
        // Ensure phone and name fields are present
        const hasPhone = fieldsSchema.some(f => f.name === 'phone' && f.required)
        const hasName = fieldsSchema.some(f => f.name === 'name' && f.required)
        return hasPhone && hasName
      case 4: // Cancellation
        return true // Optional settings
      default:
        return true
    }
  }

  const nextStep = () => {
    if (currentStep >= steps.length - 1) return

    if (validateStep(currentStep)) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep))
      setCurrentStep((prev) => prev + 1)
    } else {
      // Provide specific error messages based on step
      switch (currentStep) {
        case 0: // Details
          if (formData.title.length < 3) {
            addToast('שם האירוע חייב להכיל לפחות 3 תווים', 'error')
          } else {
            addToast('אנא מלא את כל השדות החובה', 'error')
          }
          break
        case 1: // Timing
          addToast('אנא בחר תאריך ושעת התחלה', 'error')
          break
        case 2: // Tables
          addToast('אנא הוסף לפחות שולחן אחד', 'error')
          break
        case 3: // Registration Fields
          addToast('חובה לכלול שדות "שם מלא" ו"טלפון" כשדות חובה', 'error')
          break
        default:
          addToast('אנא השלם את כל השדות הנדרשים', 'error')
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Table management functions
  const handleAddTable = (tableData: TableFormData) => {
    const count = tableData.count || 1

    // Single table creation
    if (count === 1) {
      const newTable: TableDataWithId = {
        ...tableData,
        tempId: `temp-${Date.now()}`,
        order: tables.length + 1,
      }
      setTables((prev) => [...prev, newTable])
      setIsTableModalOpen(false)
      addToast('שולחן נוסף בהצלחה', 'success', 2000)
      return
    }

    // Bulk creation (count > 1)
    // Smart auto-increment naming
    const tableNumberMatch = tableData.tableNumber.match(/\d+/)
    const baseNumber = tableNumberMatch ? parseInt(tableNumberMatch[0], 10) : 1
    const prefix = tableNumberMatch
      ? tableData.tableNumber.substring(0, tableNumberMatch.index)
      : tableData.tableNumber
    const suffix = tableNumberMatch
      ? tableData.tableNumber.substring(tableNumberMatch.index! + tableNumberMatch[0].length)
      : ''

    // Get existing numbers to find the highest
    const existingNumbers = tables
      .map(t => {
        const match = t.tableNumber.match(/\d+/)
        return match ? parseInt(match[0], 10) : 0
      })
      .filter(n => n > 0)

    const maxExistingNumber = existingNumbers.length > 0
      ? Math.max(...existingNumbers)
      : baseNumber - 1

    // Create multiple tables
    const newTables: TableDataWithId[] = []
    for (let i = 0; i < count; i++) {
      const newNumber = maxExistingNumber + i + 1
      const newTableNumber = `${prefix}${newNumber}${suffix}`

      newTables.push({
        tableNumber: newTableNumber,
        capacity: tableData.capacity,
        minOrder: tableData.minOrder,
        tempId: `temp-${Date.now()}-${i}`,
        order: tables.length + i + 1,
      })
    }

    setTables((prev) => [...prev, ...newTables])
    setIsTableModalOpen(false)

    const totalCapacity = newTables.reduce((sum, t) => sum + t.capacity, 0)
    addToast(`✨ נוצרו ${count} שולחנות בהצלחה! סה"כ ${totalCapacity} מקומות`, 'success', 3000)
  }

  const handleEditTable = (tableData: TableFormData) => {
    // Editing a group of tables
    if (editingGroup) {
      const currentCount = editingGroup.length
      const newCount = tableData.count || currentCount
      const diff = newCount - currentCount

      const groupTempIds = editingGroup.map(t => t.tempId)

      // Update existing tables in the group
      setTables((prev) => {
        let updated = prev.map((t) =>
          groupTempIds.includes(t.tempId)
            ? { ...t, capacity: tableData.capacity, minOrder: tableData.minOrder }
            : t
        )

        // If reducing count, remove tables from the end of the group
        if (diff < 0) {
          const tablesToRemove = Math.abs(diff)
          const tablesToKeep = editingGroup.slice(0, currentCount - tablesToRemove)
          const keepTempIds = tablesToKeep.map(t => t.tempId)

          updated = updated.filter(t => !groupTempIds.includes(t.tempId) || keepTempIds.includes(t.tempId))
        }

        // If increasing count, add new tables
        if (diff > 0) {
          // Find the last table in the group to determine naming pattern
          const lastTable = editingGroup[editingGroup.length - 1]
          const tableNumberMatch = lastTable.tableNumber.match(/\d+/)
          const baseNumber = tableNumberMatch ? parseInt(tableNumberMatch[0], 10) : 0
          const prefix = tableNumberMatch
            ? lastTable.tableNumber.substring(0, tableNumberMatch.index)
            : lastTable.tableNumber
          const suffix = tableNumberMatch
            ? lastTable.tableNumber.substring(tableNumberMatch.index! + tableNumberMatch[0].length)
            : ''

          // Get all existing numbers to find the highest
          const existingNumbers = updated
            .map(t => {
              const match = t.tableNumber.match(/\d+/)
              return match ? parseInt(match[0], 10) : 0
            })
            .filter(n => n > 0)

          const maxExistingNumber = existingNumbers.length > 0
            ? Math.max(...existingNumbers)
            : baseNumber

          // Create new tables
          const newTables: TableDataWithId[] = []
          for (let i = 0; i < diff; i++) {
            const newNumber = maxExistingNumber + i + 1
            const newTableNumber = `${prefix}${newNumber}${suffix}`

            newTables.push({
              tableNumber: newTableNumber,
              capacity: tableData.capacity,
              minOrder: tableData.minOrder,
              tempId: `temp-${Date.now()}-${i}`,
              order: updated.length + i + 1,
            })
          }

          updated = [...updated, ...newTables]
        }

        return updated
      })

      setEditingGroup(null)

      // Show appropriate success message
      if (diff > 0) {
        addToast(
          `✨ ${currentCount} שולחנות עודכנו + ${diff} שולחנות נוספו!`,
          'success',
          3000
        )
      } else if (diff < 0) {
        addToast(
          `🗑️ ${Math.abs(diff)} שולחנות נמחקו, ${newCount} שולחנות עודכנו`,
          'info',
          3000
        )
      } else {
        addToast(`${currentCount} שולחנות עודכנו בהצלחה`, 'success', 2000)
      }
      return
    }

    // Editing a single table
    if (!editingTable) return

    setTables((prev) =>
      prev.map((t) =>
        t.tempId === editingTable.tempId
          ? { ...t, ...tableData }
          : t
      )
    )
    setEditingTable(null)
    addToast('שולחן עודכן בהצלחה', 'success', 2000)
  }

  const handleDeleteTable = (tempId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את השולחן?')) {
      setTables((prev) => prev.filter((t) => t.tempId !== tempId))
      addToast('שולחן נמחק', 'info', 2000)
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newTables = [...tables]
    ;[newTables[index - 1], newTables[index]] = [newTables[index], newTables[index - 1]]
    setTables(newTables)
  }

  const handleMoveDown = (index: number) => {
    if (index === tables.length - 1) return
    const newTables = [...tables]
    ;[newTables[index], newTables[index + 1]] = [newTables[index + 1], newTables[index]]
    setTables(newTables)
  }

  const openEditModal = (table: TableDataWithId) => {
    setEditingTable(table)
  }

  // Group consecutive similar tables
  const groupTables = () => {
    const groups: Array<{
      tables: TableDataWithId[]
      isGroup: boolean
      firstTable: TableDataWithId
      count: number
      totalCapacity: number
    }> = []

    let currentGroup: TableDataWithId[] = []

    tables.forEach((table, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(table)
        return
      }

      const lastTable = currentGroup[currentGroup.length - 1]
      const canGroup =
        table.capacity === lastTable.capacity &&
        table.minOrder === lastTable.minOrder &&
        currentGroup.length < 100 // Max group size

      if (canGroup) {
        currentGroup.push(table)
      } else {
        // Finish current group
        groups.push({
          tables: currentGroup,
          isGroup: currentGroup.length > 1,
          firstTable: currentGroup[0],
          count: currentGroup.length,
          totalCapacity: currentGroup.reduce((sum, t) => sum + t.capacity, 0)
        })
        currentGroup = [table]
      }
    })

    // Add last group
    if (currentGroup.length > 0) {
      groups.push({
        tables: currentGroup,
        isGroup: currentGroup.length > 1,
        firstTable: currentGroup[0],
        count: currentGroup.length,
        totalCapacity: currentGroup.reduce((sum, t) => sum + t.capacity, 0)
      })
    }

    return groups
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      addToast('אנא בדוק את כל השדות', 'error')
      return
    }

    setIsLoading(true)

    try {
      // 1. Create the event
      const eventResponse = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          eventType: 'TABLE_BASED',
          allowCancellation,
          cancellationDeadlineHours: deadlineHours,
          requireCancellationReason: requireReason,
          capacity: 0, // Not used for table-based, but required by schema
          maxSpotsPerPerson: 1, // Not used for table-based
          fieldsSchema: fieldsSchema, // Custom registration fields with required phone + name
        }),
      })

      if (!eventResponse.ok) {
        const errorData = await eventResponse.json()
        console.error('Event creation failed:', errorData)
        throw new Error(errorData.error || `Failed to create event: ${eventResponse.status}`)
      }

      const event = await eventResponse.json()

      // 2. Create all tables
      await Promise.all(
        tables.map((table, index) =>
          fetch(`/api/events/${event.id}/tables`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tableNumber: table.tableNumber,
              capacity: table.capacity,
              minOrder: table.minOrder,
              tableOrder: index + 1,
            }),
          })
        )
      )

      addToast('אירוע עם מקומות ישיבה נוצר בהצלחה!', 'success', 3000)

      // 3. Redirect to event details
      router.push(`/admin/events/${event.id}`)
    } catch (error) {
      console.error('Error creating restaurant event:', error)
      addToast('שגיאה ביצירת האירוע', 'error')
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="step-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">פרטי האירוע</h2>
              </div>

              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם האירוע <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg
                    focus:ring-2 text-gray-900 bg-white
                    ${formData.title.length > 0 && formData.title.length < 3
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                    }`}
                  placeholder="ארוחת ערב, אירוח מיוחד..."
                  required
                />
                {formData.title.length > 0 && formData.title.length < 3 && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    שם האירוע חייב להכיל לפחות 3 תווים (כרגע: {formData.title.length})
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תיאור
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                    text-gray-900 bg-white"
                  rows={5}
                  placeholder="תאר את האירוע..."
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מיקום
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-lg
                      focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                      text-gray-900 bg-white"
                    placeholder="כתובת המסעדה..."
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 1:
        return (
          <motion.div
            key="step-timing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">תזמון האירוע</h2>
              </div>

              <div className="mb-6">
                <DateTimePicker
                  value={formData.startAt}
                  onChange={(value) => handleChange('startAt', value)}
                  label="תאריך ושעת התחלה"
                  required
                />
              </div>

              <div>
                <DateTimePicker
                  value={formData.endAt || ''}
                  onChange={(value) => handleChange('endAt', value)}
                  label="תאריך ושעת סיום (אופציונלי)"
                  minDate={formData.startAt ? formData.startAt.split('T')[0] : undefined}
                />
              </div>
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            key="step-tables"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <UtensilsCrossed className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">ניהול שולחנות</h2>
              </div>

              {tables.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg mb-2">טרם הוספת שולחנות</p>
                  <p className="text-sm">לחץ על "הוסף שולחן" להתחלה</p>
                </div>
              )}

              {/* Summary Statistics - Show when 6+ tables */}
              {tables.length >= 6 && (() => {
                // Check if all tables are identical
                const allIdentical = tables.every(t =>
                  t.capacity === tables[0].capacity &&
                  t.minOrder === tables[0].minOrder
                )

                // Calculate range for variety
                const capacities = tables.map(t => t.capacity)
                const minOrders = tables.map(t => t.minOrder)
                const minCapacity = Math.min(...capacities)
                const maxCapacity = Math.max(...capacities)
                const minMinOrder = Math.min(...minOrders)
                const maxMinOrder = Math.max(...minOrders)

                return (
                  <div className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{tables.length} שולחנות</div>
                        <div className="text-sm text-gray-600">סה״כ {tables.reduce((sum, t) => sum + t.capacity, 0)} מקומות</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded-lg p-3 border border-purple-100">
                        <div className="text-gray-600 mb-1">
                          {allIdentical ? 'קיבולת כל שולחן' : 'טווח קיבולת'}
                        </div>
                        <div className="text-xl font-bold text-purple-600">
                          {allIdentical ? tables[0].capacity : `${minCapacity}-${maxCapacity}`}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-purple-100">
                        <div className="text-gray-600 mb-1">
                          {allIdentical ? 'מינימום כל שולחן' : 'טווח מינימום'}
                        </div>
                        <div className="text-xl font-bold text-purple-600">
                          {allIdentical ? tables[0].minOrder : `${minMinOrder}-${maxMinOrder}`}
                        </div>
                      </div>
                    </div>
                    {allIdentical && (
                      <div className="mt-3 text-center text-xs text-gray-600 bg-white rounded-lg py-2 border border-purple-100">
                        ✨ כל השולחנות זהים
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Table Cards - Grouped view */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {/* Add Table Card - Always visible */}
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="border-2 border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 rounded-lg p-6 transition-all flex flex-col items-center justify-center min-h-[250px] group"
                  dir="rtl"
                >
                  <div className="w-16 h-16 bg-purple-600 group-hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors mb-4">
                    <span className="text-4xl text-white font-bold">+</span>
                  </div>
                  <div className="text-lg font-bold text-purple-900 group-hover:text-purple-950 transition-colors">
                    הוסף שולחן
                  </div>
                  <div className="text-sm text-purple-700 mt-2 text-center">
                    לחץ ליצירת שולחן חדש
                  </div>
                </button>

                {groupTables().map((group, groupIndex) => {
                  if (group.isGroup) {
                    // Grouped card for multiple similar tables
                    const firstTable = group.tables[0]
                    const lastTable = group.tables[group.tables.length - 1]

                    return (
                      <div
                        key={`group-${groupIndex}`}
                        className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
                        dir="rtl"
                      >
                        {/* Header with group count badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                              {group.count}
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {firstTable.tableNumber} - {lastTable.tableNumber}
                            </div>
                          </div>
                          <div className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-medium">
                            פנוי
                          </div>
                        </div>

                        {/* Per-table capacity */}
                        <div className="bg-white rounded-lg p-4 mb-3 border border-purple-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-600 mb-1">קיבולת שולחן</div>
                              <div className="text-2xl font-bold text-purple-600">
                                {firstTable.capacity}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600 mb-1">מינימום</div>
                              <div className="text-2xl font-bold text-blue-600">
                                {firstTable.minOrder}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Total capacity for group */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 mb-3 border-2 border-green-200">
                          <div className="text-xs text-green-800 font-medium mb-2 text-center">
                            📊 סה״כ קבוצה ({group.count} שולחנות)
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-2 text-center border border-green-100">
                              <div className="text-xs text-gray-600 mb-1">מקסימום</div>
                              <div className="text-xl font-bold text-green-600">
                                {group.count * firstTable.capacity}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-2 text-center border border-green-100">
                              <div className="text-xs text-gray-600 mb-1">מינימום</div>
                              <div className="text-xl font-bold text-orange-600">
                                {group.count * firstTable.minOrder}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions - Edit/Delete group */}
                        <div className="mt-4 pt-4 border-t border-purple-200">
                          <div className="text-xs text-gray-600 text-center mb-3">
                            💡 {group.count} שולחנות זהים
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Delete all tables in the group
                                if (confirm(`האם למחוק ${group.count} שולחנות זהים?`)) {
                                  setTables(prev => prev.filter(t => !group.tables.some(gt => gt.tempId === t.tempId)))
                                  addToast(`${group.count} שולחנות נמחקו`, 'info', 2000)
                                }
                              }}
                              className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors border border-red-200"
                            >
                              🗑️ מחק הכל
                            </button>
                            <button
                              onClick={() => {
                                // Edit entire group - set editingGroup to all tables in this group
                                setEditingGroup(group.tables)
                                setEditingTable(firstTable) // Use first table as template
                              }}
                              className="flex-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-colors border border-purple-200"
                            >
                              ✏️ ערוך קבוצה
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  } else {
                    // Single table card
                    const table = group.firstTable
                    const index = tables.findIndex(t => t.tempId === table.tempId)

                    return (
                      <TableCard
                        key={table.tempId}
                        table={{
                          id: table.tempId,
                          tableNumber: table.tableNumber,
                          capacity: table.capacity,
                          minOrder: table.minOrder,
                          status: 'AVAILABLE',
                        }}
                        onEdit={() => openEditModal(table)}
                        onDelete={() => handleDeleteTable(table.tempId)}
                        onMoveUp={index > 0 ? () => handleMoveUp(index) : undefined}
                        onMoveDown={index < tables.length - 1 ? () => handleMoveDown(index) : undefined}
                      />
                    )
                  }
                })}
              </div>

              {tables.length === 0 && (
                <div className="mt-4 flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>חובה להוסיף לפחות שולחן אחד</span>
                </div>
              )}
            </div>

            <TableFormModal
              isOpen={isTableModalOpen || !!editingTable || !!editingGroup}
              onClose={() => {
                setIsTableModalOpen(false)
                setEditingTable(null)
                setEditingGroup(null)
              }}
              onSubmit={editingTable || editingGroup ? handleEditTable : handleAddTable}
              initialData={editingTable || undefined}
              mode={editingTable || editingGroup ? 'edit' : 'create'}
              existingTableNumbers={tables.map((t) => t.tableNumber)}
              groupEditCount={editingGroup?.length}
            />
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            key="step-fields"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <FormInput className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">שדות רישום</h2>
              </div>

              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-900">
                  <strong>חובה:</strong> שדות "שם מלא" ו"טלפון" נדרשים לצורך יצירת קשר עם הלקוחות.
                  ניתן להוסיף שדות נוספים לפי הצורך.
                </p>
              </div>

              <FieldBuilder
                fields={fieldsSchema}
                onChange={setFieldsSchema}
              />
            </div>
          </motion.div>
        )

      case 4:
        return (
          <motion.div
            key="step-cancellation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <Ban className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">מדיניות ביטול</h2>
              </div>

              <div className="space-y-6">
                {/* Allow Cancellation */}
                <div className="flex items-start gap-3">
                  <input
                    id="allowCancellation"
                    type="checkbox"
                    checked={allowCancellation}
                    onChange={(e) => setAllowCancellation(e.target.checked)}
                    className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded
                      focus:ring-purple-500"
                  />
                  <label htmlFor="allowCancellation" className="flex-1 cursor-pointer">
                    <span className="block font-medium text-gray-900">
                      אפשר ללקוחות לבטל הזמנות
                    </span>
                    <span className="block text-sm text-gray-600 mt-1">
                      לקוחות יוכלו לבטל את ההזמנה באמצעות קישור ייחודי
                    </span>
                  </label>
                </div>

                {/* Cancellation Deadline */}
                {allowCancellation && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        זמן ביטול מינימלי (שעות לפני האירוע)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="72"
                        value={deadlineHoursInput}
                        onChange={(e) => handleDeadlineHoursChange(e.target.value)}
                        onBlur={handleDeadlineHoursBlur}
                        onFocus={handleNumberFocus}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                          focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                          text-gray-900 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        לקוחות לא יוכלו לבטל פחות מ-{deadlineHours} שעות לפני האירוע
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        id="requireReason"
                        type="checkbox"
                        checked={requireReason}
                        onChange={(e) => setRequireReason(e.target.checked)}
                        className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded
                          focus:ring-purple-500"
                      />
                      <label htmlFor="requireReason" className="flex-1 cursor-pointer">
                        <span className="block font-medium text-gray-900">
                          חייב סיבת ביטול
                        </span>
                        <span className="block text-sm text-gray-600 mt-1">
                          לקוחות יתבקשו לציין סיבה לביטול ההזמנה
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <ToastContainer />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <UtensilsCrossed className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">צור אירוע עם מקומות ישיבה</h1>
          </div>
          <p className="text-gray-600">
            הוסף אירוע חדש עם ניהול מקומות ישיבה והזמנות
          </p>
        </div>

        {/* Wizard Steps */}
        <div className="mb-8">
          <StepWizard
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={(index) => {
              if (completedSteps.has(index) || index === currentStep) {
                setCurrentStep(index)
              }
            }}
          />
        </div>

        {/* Step Content */}
        <div className="mb-8">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="flex gap-4">
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg
                hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              <span>חזור</span>
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg
                hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>הבא</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !validateStep(currentStep)}
              className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg
                hover:bg-purple-700 active:bg-purple-800 transition-colors
                disabled:bg-gray-400 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>יוצר אירוע...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  <span>צור אירוע</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

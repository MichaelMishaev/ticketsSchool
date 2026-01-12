'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TableCard from './TableCard'
import DuplicateTableModal from './DuplicateTableModal'
import TableTemplateModal from './TableTemplateModal'
import SaveTemplateModal from './SaveTemplateModal'
import BulkEditModal from './BulkEditModal'
import { X, Plus, Sparkles, Edit3, Trash2, CheckSquare, Users } from 'lucide-react'
import Link from 'next/link'

interface Table {
  id: string
  tableNumber: string
  capacity: number
  minOrder: number
  status: 'AVAILABLE' | 'RESERVED' | 'INACTIVE'
  hasWaitlistMatch: boolean
  reservation?: {
    id: string
    confirmationCode: string
    guestsCount: number | null
    phoneNumber: string | null
    data: any
  } | null
}

interface TableBoardClientProps {
  tables: Table[]
  eventId: string
}

export default function TableBoardClient({ tables, eventId }: TableBoardClientProps) {
  const router = useRouter()
  const [cancelModal, setCancelModal] = useState<{ show: boolean; registrationId: string | null }>({
    show: false,
    registrationId: null
  })
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [togglingHold, setTogglingHold] = useState(false)
  const [duplicateModal, setDuplicateModal] = useState<{
    show: boolean
    table: Table | null
  }>({
    show: false,
    table: null
  })
  const [templateModal, setTemplateModal] = useState(false)
  const [saveTemplateModal, setSaveTemplateModal] = useState(false)
  const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(new Set())
  const [bulkEditModal, setBulkEditModal] = useState(false)
  const [isBulkSelectionMode, setIsBulkSelectionMode] = useState(false)
  const [showGroupedView, setShowGroupedView] = useState(true)

  const handleToggleHold = async (tableId: string) => {
    setTogglingHold(true)

    try {
      const table = tables.find((t) => t.id === tableId)
      if (!table) return

      const newStatus = table.status === 'INACTIVE' ? 'AVAILABLE' : 'INACTIVE'

      const response = await fetch(`/api/events/${eventId}/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        router.refresh() // Refresh server component data
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        alert(error.error || 'שגיאה בעדכון סטטוס שולחן')
      }
    } catch (error) {
      console.error('Error toggling hold:', error)
      alert('שגיאה בעדכון סטטוס שולחן')
    } finally {
      setTogglingHold(false)
    }
  }

  const handleDuplicateTable = async (tableId: string, count: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/tables/${tableId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ count })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✨ נוצרו ${data.count} שולחנות בהצלחה!`)
        router.refresh() // Refresh server component data
      } else {
        const error = await response.json()
        console.error('API Error:', error)

        if (response.status === 401) {
          alert('הפג תוקף ההתחברות. אנא התחבר מחדש.')
          window.location.href = '/admin/login'
          return
        }

        alert(error.error || 'שגיאה בשכפול שולחן')
      }
    } catch (error) {
      console.error('Error duplicating table:', error)
      alert('שגיאה בשכפול שולחן')
      throw error
    }
  }

  const handleApplyTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/tables/from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ templateId })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✨ נוצרו ${data.count} שולחנות מתבנית "${data.template.name}"!`)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'שגיאה ביצירת שולחנות מתבנית')
      }
    } catch (error) {
      console.error('Error applying template:', error)
      alert('שגיאה ביצירת שולחנות מתבנית')
      throw error
    }
  }

  const handleSaveAsTemplate = async (name: string, description: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/tables/save-as-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, description })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ תבנית "${data.template.name}" נשמרה בהצלחה!`)
      } else {
        const error = await response.json()
        alert(error.error || 'שגיאה בשמירת תבנית')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('שגיאה בשמירת תבנית')
      throw error
    }
  }

  const handleTableSelection = (tableId: string, selected: boolean) => {
    setSelectedTableIds(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(tableId)
      } else {
        newSet.delete(tableId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const availableTableIds = tables
      .filter(t => t.status !== 'RESERVED')
      .map(t => t.id)
    setSelectedTableIds(new Set(availableTableIds))
  }

  const handleDeselectAll = () => {
    setSelectedTableIds(new Set())
  }

  const handleBulkEdit = async (updates: any) => {
    try {
      const response = await fetch(`/api/events/${eventId}/tables/bulk-edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ tableIds: Array.from(selectedTableIds), updates })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ עודכנו ${data.count} שולחנות בהצלחה!`)
        handleDeselectAll()
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'שגיאה בעדכון שולחנות')
      }
    } catch (error) {
      console.error('Error bulk editing:', error)
      alert('שגיאה בעדכון שולחנות')
      throw error
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`האם למחוק ${selectedTableIds.size} שולחנות?`)) return

    try {
      const response = await fetch(`/api/events/${eventId}/tables/bulk-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ tableIds: Array.from(selectedTableIds) })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ נמחקו ${data.count} שולחנות בהצלחה!`)
        handleDeselectAll()
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'שגיאה במחיקת שולחנות')
      }
    } catch (error) {
      console.error('Error bulk deleting:', error)
      alert('שגיאה במחיקת שולחנות')
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId)
    if (!table) return

    if (!confirm(`האם למחוק שולחן ${table.tableNumber}?`)) return

    try {
      const response = await fetch(`/api/events/${eventId}/tables/bulk-delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ tableIds: [tableId] })
      })

      if (response.ok) {
        alert(`✅ שולחן ${table.tableNumber} נמחק בהצלחה!`)
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.error || 'שגיאה במחיקת שולחן')
      }
    } catch (error) {
      console.error('Error deleting table:', error)
      alert('שגיאה במחיקת שולחן')
    }
  }

  const handleCancelReservation = async () => {
    if (!cancelModal.registrationId) return

    setCancelling(true)

    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${cancelModal.registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Explicitly include cookies
        body: JSON.stringify({
          status: 'WAITLIST', // Move to waitlist instead of cancelling
          cancellationReason: cancelReason.trim() || undefined,
          moveToWaitlist: true, // Flag to indicate this was removed from table
          removedFromTable: true // Add metadata to registration
        })
      })

      if (response.ok) {
        setCancelModal({ show: false, registrationId: null })
        setCancelReason('')
        router.refresh() // Refresh server component data
      } else {
        const error = await response.json()
        console.error('API Error:', error)

        // If unauthorized, redirect to login
        if (response.status === 401) {
          alert('הפג תוקף ההתחברות. אנא התחבר מחדש.')
          window.location.href = '/admin/login'
          return
        }

        alert(error.error || 'שגיאה בהעברה לרשימת המתנה')
      }
    } catch (error) {
      console.error('Error moving to waitlist:', error)
      alert('שגיאה בהעברה לרשימת המתנה')
    } finally {
      setCancelling(false)
    }
  }

  // Group consecutive similar AVAILABLE tables
  const groupTables = () => {
    if (!showGroupedView) {
      return tables.map(table => ({
        tables: [table],
        isGroup: false,
        firstTable: table,
        count: 1,
        totalCapacity: table.capacity,
        totalMinOrder: table.minOrder
      }))
    }

    const groups: Array<{
      tables: Table[]
      isGroup: boolean
      firstTable: Table
      count: number
      totalCapacity: number
      totalMinOrder: number
    }> = []

    let currentGroup: Table[] = []

    tables.forEach((table) => {
      if (currentGroup.length === 0) {
        currentGroup.push(table)
        return
      }

      const lastTable = currentGroup[currentGroup.length - 1]
      const canGroup =
        table.status === 'AVAILABLE' &&
        lastTable.status === 'AVAILABLE' &&
        table.capacity === lastTable.capacity &&
        table.minOrder === lastTable.minOrder &&
        !table.reservation &&
        !lastTable.reservation &&
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
          totalCapacity: currentGroup.reduce((sum, t) => sum + t.capacity, 0),
          totalMinOrder: currentGroup.reduce((sum, t) => sum + t.minOrder, 0)
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
        totalCapacity: currentGroup.reduce((sum, t) => sum + t.capacity, 0),
        totalMinOrder: currentGroup.reduce((sum, t) => sum + t.minOrder, 0)
      })
    }

    return groups
  }

  return (
    <>
      {/* View Mode Toggles */}
      {tables.length > 0 && (
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsBulkSelectionMode(!isBulkSelectionMode)
                if (isBulkSelectionMode) handleDeselectAll()
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isBulkSelectionMode ? 'בטל בחירה מרובה' : 'בחירה מרובה'}</span>
            </button>

            <button
              onClick={() => setShowGroupedView(!showGroupedView)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                showGroupedView
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{showGroupedView ? 'תצוגה מקובצת' : 'תצוגה רגילה'}</span>
            </button>
          </div>

          {isBulkSelectionMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 hover:bg-blue-50 rounded"
              >
                בחר הכל
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 hover:bg-gray-100 rounded"
              >
                בטל בחירה
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedTableIds.size > 0 && (
        <div className="mb-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            <span className="font-medium">{selectedTableIds.size} שולחנות נבחרו</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>ערוך</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>מחק</span>
            </button>
            <button
              onClick={handleDeselectAll}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>בטל</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groupTables().map((group, groupIndex) => {
          if (group.isGroup) {
            // Grouped card for multiple identical AVAILABLE tables
            const firstTable = group.firstTable
            const lastTable = group.tables[group.tables.length - 1]

            return (
              <div
                key={`group-${groupIndex}`}
                className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
                dir="rtl"
              >
                {/* Header */}
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
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border-2 border-green-200">
                  <div className="text-xs text-green-800 font-medium mb-2 text-center">
                    📊 סה״כ קבוצה ({group.count} שולחנות)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-2 text-center border border-green-100">
                      <div className="text-xs text-gray-600 mb-1">מקסימום</div>
                      <div className="text-xl font-bold text-green-600">
                        {group.totalCapacity}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-green-100">
                      <div className="text-xs text-gray-600 mb-1">מינימום</div>
                      <div className="text-xl font-bold text-orange-600">
                        {group.totalMinOrder}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          } else {
            // Single table card - normal rendering
            const table = group.firstTable

            return (
              <TableCard
                key={table.id}
                table={table}
                hasWaitlistMatch={table.hasWaitlistMatch}
                isSelected={selectedTableIds.has(table.id)}
                onSelect={isBulkSelectionMode ? handleTableSelection : undefined}
                onDelete={() => handleDeleteTable(table.id)}
                onDuplicate={(tableId) => {
                  const selectedTable = tables.find(t => t.id === tableId)
                  if (selectedTable) {
                    setDuplicateModal({ show: true, table: selectedTable })
                  }
                }}
                onCancel={(reservationId) => {
                  setCancelModal({ show: true, registrationId: reservationId })
                }}
                onToggleHold={handleToggleHold}
                readOnly={false}
              />
            )
          }
        })}

        {/* Add Table Card */}
        <Link
          href={`/admin/events/${eventId}/edit`}
          className="border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 rounded-lg p-6 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px] group"
          dir="rtl"
        >
          <div className="w-12 h-12 bg-blue-500 group-hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-900 group-hover:text-blue-950 transition-colors">
              הוסף שולחן
            </div>
            <div className="text-sm text-blue-700 mt-1">
              לחץ להוספת שולחן חדש
            </div>
          </div>
        </Link>

        {/* Template Card */}
        <button
          onClick={() => setTemplateModal(true)}
          className="border-2 border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 rounded-lg p-6 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px] group"
          dir="rtl"
        >
          <div className="w-12 h-12 bg-purple-500 group-hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-900 group-hover:text-purple-950 transition-colors">
              תבניות מוכנות
            </div>
            <div className="text-sm text-purple-700 mt-1">
              יצירה מהירה מתבנית קיימת
            </div>
          </div>
        </button>
      </div>

      {tables.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setSaveTemplateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>שמור שולחנות נוכחיים כתבנית</span>
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">ביטול הזמנת שולחן</h2>
              <button
                onClick={() => {
                  setCancelModal({ show: false, registrationId: null })
                  setCancelReason('')
                }}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={cancelling}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-700 mb-4">
              האם להסיר הזמנה זו משולחן זה? האורחים יועברו לרשימת ההמתנה והשולחן ישוחרר.
            </p>

            <div className="mb-4">
              <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">
                סיבת ביטול (אופציונלי)
              </label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                disabled={cancelling}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100"
                placeholder="למשל: נרשם ביקש לבטל בטלפון"
              />
              <p className="text-xs text-gray-500 mt-1">
                הסיבה תישמר לצורך רישום ומעקב
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelReservation}
                disabled={cancelling}
                className="flex-1 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'מעביר לרשימת המתנה...' : 'העבר לרשימת המתנה'}
              </button>
              <button
                onClick={() => {
                  setCancelModal({ show: false, registrationId: null })
                  setCancelReason('')
                }}
                disabled={cancelling}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Modal */}
      <DuplicateTableModal
        show={duplicateModal.show}
        table={duplicateModal.table}
        onClose={() => setDuplicateModal({ show: false, table: null })}
        onConfirm={handleDuplicateTable}
      />

      {/* Template Modal */}
      <TableTemplateModal
        show={templateModal}
        onClose={() => setTemplateModal(false)}
        onSelect={handleApplyTemplate}
        onSaveAsTemplate={() => {
          setTemplateModal(false)
          setSaveTemplateModal(true)
        }}
      />

      {/* Save Template Modal */}
      <SaveTemplateModal
        show={saveTemplateModal}
        tableCount={tables.length}
        onClose={() => setSaveTemplateModal(false)}
        onSave={handleSaveAsTemplate}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        show={bulkEditModal}
        selectedCount={selectedTableIds.size}
        onClose={() => setBulkEditModal(false)}
        onConfirm={handleBulkEdit}
      />
    </>
  )
}

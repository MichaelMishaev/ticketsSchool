'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus, Save } from 'lucide-react'
import TableFormModal, { TableFormData } from '@/components/admin/TableFormModal'
import TableCard from '@/components/admin/TableCard'

interface Table {
  id: string
  tableNumber: string
  capacity: number
  minOrder: number
  status: 'AVAILABLE' | 'RESERVED' | 'INACTIVE'
  tableOrder: number
  reservation?: {
    id: string
    confirmationCode: string
    guestsCount: number | null
    phoneNumber: string | null
    data: Record<string, unknown>
  } | null
}

interface EditEventClientProps {
  eventId: string
  eventTitle: string
  initialTables: Table[]
}

export default function EditEventClient({
  eventId,
  eventTitle,
  initialTables,
}: EditEventClientProps) {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Add new table
  const handleAddTable = async (formData: TableFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add table')
      }

      // Handle both single table and multiple tables responses
      if (data.tables && Array.isArray(data.tables)) {
        // Multiple tables created (bulk creation)
        setTables((prev) => [...prev, ...data.tables])
        const totalCapacity = data.tables.reduce((sum: number, t: Table) => sum + t.capacity, 0)
        setSuccessMessage(`✨ נוצרו ${data.count} שולחנות בהצלחה! סה"כ ${totalCapacity} מקומות`)
      } else if (data.table) {
        // Single table created
        setTables((prev) => [...prev, data.table])
        setSuccessMessage('שולחן נוסף בהצלחה')
      }

      // Close modal after successful creation
      closeModal()

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Edit existing table
  const handleEditTable = async (formData: TableFormData) => {
    if (!editingTable) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/tables/${editingTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update table')
      }

      // Update local state
      setTables((prev) =>
        prev.map((t) => (t.id === editingTable.id ? data.table : t))
      )
      setSuccessMessage('שולחן עודכן בהצלחה')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
      setEditingTable(null)
    }
  }

  // Delete table
  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק שולחן זה?')) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/tables/${tableId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete table')
      }

      // Remove from local state
      setTables((prev) => prev.filter((t) => t.id !== tableId))
      setSuccessMessage('שולחן נמחק בהצלחה')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle hold/reserve status
  const handleToggleHold = async (tableId: string) => {
    const table = tables.find((t) => t.id === tableId)
    if (!table) return

    const newStatus = table.status === 'INACTIVE' ? 'AVAILABLE' : 'INACTIVE'

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update table status')
      }

      // Update local state
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
      )

      const message = newStatus === 'INACTIVE' ? 'שולחן סומן כרזרבה' : 'שולחן שוחרר'
      setSuccessMessage(message)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Open edit modal
  const openEditModal = (table: Table) => {
    setEditingTable(table)
    setIsModalOpen(true)
  }

  // Open add modal
  const openAddModal = () => {
    setEditingTable(null)
    setIsModalOpen(true)
  }

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTable(null)
  }

  // Handle modal submit
  const handleModalSubmit = (formData: TableFormData) => {
    if (editingTable) {
      handleEditTable(formData)
    } else {
      handleAddTable(formData)
    }
  }

  // Get existing table numbers (for validation)
  const existingTableNumbers = editingTable
    ? tables.filter((t) => t.id !== editingTable.id).map((t) => t.tableNumber)
    : tables.map((t) => t.tableNumber)

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/events/${eventId}`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 mb-4 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all shadow-sm font-medium"
          >
            <ArrowRight className="w-5 h-5" />
            <span>חזרה לאירוע</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                עריכת שולחנות
              </h1>
              <p className="text-gray-600 mt-1">{eventTitle}</p>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>הוסף שולחן</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-xs mt-2"
            >
              סגור
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">אין שולחנות באירוע זה</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>הוסף שולחן ראשון</span>
            </button>
          </div>
        ) : (
          <>
            {/* Summary Statistics - Show when 6+ tables */}
            {tables.length >= 6 && (
              <div className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Save className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{tables.length} שולחנות</div>
                    <div className="text-sm text-gray-600">סה״כ {tables.reduce((sum, t) => sum + t.capacity, 0)} מקומות</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-gray-600 mb-1">קיבולת ממוצעת</div>
                    <div className="text-xl font-bold text-blue-600">
                      {(tables.reduce((sum, t) => sum + t.capacity, 0) / tables.length).toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-gray-600 mb-1">מינימום ממוצע</div>
                    <div className="text-xl font-bold text-blue-600">
                      {(tables.reduce((sum, t) => sum + t.minOrder, 0) / tables.length).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Table Cards - Show max 6, then summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.slice(0, 6).map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onEdit={() => openEditModal(table)}
                  onDelete={() => handleDeleteTable(table.id)}
                  onToggleHold={handleToggleHold}
                />
              ))}

              {/* "And X more" card */}
              {tables.length > 6 && (
                <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
                  <div className="text-5xl font-bold text-gray-400 mb-2">+{tables.length - 6}</div>
                  <div className="text-gray-600 text-center">
                    שולחנות נוספים
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {tables.slice(6).map(t => t.tableNumber).slice(0, 3).join(', ')}
                    {tables.length > 9 && '...'}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Table Form Modal */}
        <TableFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          initialData={
            editingTable
              ? {
                  tableNumber: editingTable.tableNumber,
                  capacity: editingTable.capacity,
                  minOrder: editingTable.minOrder,
                }
              : undefined
          }
          mode={editingTable ? 'edit' : 'create'}
          existingTableNumbers={existingTableNumbers}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-700">מעדכן...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

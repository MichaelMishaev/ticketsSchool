'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus, Save, CreditCard } from 'lucide-react'
import TableFormModal, { TableFormData } from '@/components/admin/TableFormModal'
import TableCard from '@/components/admin/TableCard'
import type { TableRegistration } from '@/components/admin/table-helpers'

interface Table {
  id: string
  tableNumber: string
  capacity: number
  minOrder: number
  status: 'AVAILABLE' | 'RESERVED' | 'INACTIVE'
  tableOrder: number
  // Sharing-aware: N CONFIRMED registrations may share this table.
  registrations: TableRegistration[]
}

// Pricing model for table events. FIXED_PRICE charges per reservation;
// PER_GUEST multiplies by guestsCount at payment time.
type PricingModel = 'FREE' | 'FIXED_PRICE' | 'PER_GUEST'

interface InitialPayment {
  paymentRequired: boolean
  pricingModel: PricingModel
  priceAmount: number | null
}

interface EditEventClientProps {
  eventId: string
  eventTitle: string
  initialTables: Table[]
  initialPayment: InitialPayment
}

export default function EditEventClient({
  eventId,
  eventTitle,
  initialTables,
  initialPayment,
}: EditEventClientProps) {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // ─── Payment settings state ──────────────────────────────────────────────
  // Keep a local copy of the last saved value so the "dirty" check can
  // disable the Save button when nothing changed. We intentionally do NOT
  // bundle payment saves into the table CRUD handlers — it's a separate
  // PATCH to /api/events/[id] so admins can save payment independently.
  const [paymentRequired, setPaymentRequired] = useState(initialPayment.paymentRequired)
  const [pricingModel, setPricingModel] = useState<'PER_GUEST' | 'FIXED_PRICE'>(
    initialPayment.pricingModel === 'FIXED_PRICE' ? 'FIXED_PRICE' : 'PER_GUEST'
  )
  const [priceAmount, setPriceAmount] = useState<number | undefined>(
    initialPayment.priceAmount ?? undefined
  )
  const [priceInput, setPriceInput] = useState(
    initialPayment.priceAmount != null ? initialPayment.priceAmount.toFixed(2) : ''
  )
  const [savedPayment, setSavedPayment] = useState<InitialPayment>(initialPayment)
  const [isSavingPayment, setIsSavingPayment] = useState(false)

  // Dirty check — enables the Save button only when something actually changed.
  const paymentIsDirty =
    paymentRequired !== savedPayment.paymentRequired ||
    (paymentRequired &&
      (pricingModel !==
        (savedPayment.pricingModel === 'FIXED_PRICE' ? 'FIXED_PRICE' : 'PER_GUEST') ||
        (priceAmount ?? null) !== savedPayment.priceAmount))

  const paymentIsValid = !paymentRequired || (priceAmount !== undefined && priceAmount > 0)

  const handleSavePayment = async () => {
    if (!paymentIsValid) {
      setError('יש להזין מחיר תקין גדול מ-0')
      return
    }
    setIsSavingPayment(true)
    setError(null)

    try {
      const body = {
        paymentRequired,
        // TABLE_BASED currently only supports UPFRONT when charging, else OPTIONAL/FREE
        paymentTiming: paymentRequired ? 'UPFRONT' : 'OPTIONAL',
        pricingModel: paymentRequired ? pricingModel : 'FREE',
        priceAmount: paymentRequired ? priceAmount : null,
      }
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save payment settings')
      }
      setSavedPayment({
        paymentRequired,
        pricingModel: paymentRequired ? pricingModel : 'FREE',
        priceAmount: paymentRequired ? (priceAmount ?? null) : null,
      })
      setSuccessMessage('הגדרות התשלום נשמרו בהצלחה')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSavingPayment(false)
    }
  }

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
      setTables((prev) => prev.map((t) => (t.id === editingTable.id ? data.table : t)))
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
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t)))

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
              <h1 className="text-2xl font-bold text-gray-900">עריכת שולחנות</h1>
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

        {/* Payment Settings Card */}
        <div className="mb-6 bg-white shadow rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">הגדרות תשלום</h2>
            </div>
            <button
              onClick={handleSavePayment}
              disabled={!paymentIsDirty || !paymentIsValid || isSavingPayment}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSavingPayment ? 'שומר...' : 'שמור תשלום'}
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            כאשר התשלום מופעל, המזמינים יופנו ל-HYP לתשלום לפני ששולחן משובץ. אם אין שולחן פנוי,
            ההזמנה תועבר לרשימת המתנה עם תשלום בוצע.
          </p>

          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                checked={!paymentRequired}
                onChange={() => setPaymentRequired(false)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm text-gray-900">חינם (ללא תשלום)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                checked={paymentRequired}
                onChange={() => setPaymentRequired(true)}
                className="w-4 h-4 text-purple-600"
              />
              <span className="text-sm text-gray-900">תשלום מראש (UPFRONT)</span>
            </label>
          </div>

          {paymentRequired && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">מודל תמחור</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPricingModel('PER_GUEST')}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      pricingModel === 'PER_GUEST'
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    מחיר לאורח
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingModel('FIXED_PRICE')}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      pricingModel === 'FIXED_PRICE'
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    מחיר קבוע להזמנה
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="editPriceAmount"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  מחיר {pricingModel === 'PER_GUEST' ? 'לאורח' : 'להזמנה'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    ₪
                  </span>
                  <input
                    id="editPriceAmount"
                    type="text"
                    inputMode="decimal"
                    value={priceInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, '')
                      setPriceInput(raw)
                      const num = parseFloat(raw)
                      if (!isNaN(num)) {
                        const clamped = Math.max(0, Math.min(100000, num))
                        setPriceAmount(clamped || undefined)
                      } else if (raw === '') {
                        setPriceAmount(undefined)
                      }
                    }}
                    onBlur={() => {
                      if (priceInput !== '' && priceAmount !== undefined) {
                        setPriceInput(priceAmount.toFixed(2))
                      }
                    }}
                    className="w-full pl-4 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white text-sm"
                    placeholder="0.00"
                  />
                </div>
                {priceAmount !== undefined && priceAmount > 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    מחיר מוצג: <span className="font-bold">₪{priceAmount.toFixed(2)}</span>
                    {pricingModel === 'PER_GUEST' && ' לאורח'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

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
                    <div className="text-sm text-gray-600">
                      סה״כ {tables.reduce((sum, t) => sum + t.capacity, 0)} מקומות
                    </div>
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
                  <div className="text-gray-600 text-center">שולחנות נוספים</div>
                  <div className="text-sm text-gray-500 mt-2">
                    {tables
                      .slice(6)
                      .map((t) => t.tableNumber)
                      .slice(0, 3)
                      .join(', ')}
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

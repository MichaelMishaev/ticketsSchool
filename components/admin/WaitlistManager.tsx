'use client'

import { useState } from 'react'
import { ListOrdered, Users, Phone, Hash, Calendar, CheckCircle, XCircle, Ban, AlertTriangle } from 'lucide-react'

interface WaitlistEntry {
  id: string
  confirmationCode: string
  guestsCount: number | null
  phoneNumber: string | null
  waitlistPriority: number | null
  data: any
  createdAt: Date
  matchingTables: Array<{
    id: string
    tableNumber: string
    capacity: number
    minOrder: number
  }>
  bestTable: {
    id: string
    tableNumber: string
    capacity: number
  } | null
  hasMatch: boolean
}

interface WaitlistManagerProps {
  eventId: string
  waitlist: WaitlistEntry[]
  onAssign?: () => void
}

export default function WaitlistManager({ eventId, waitlist, onAssign }: WaitlistManagerProps) {
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [confirmationModal, setConfirmationModal] = useState<{
    show: boolean
    tableId: string
    tableName: string
    guestCount: number
    minOrder: number
  } | null>(null)
  const [notRecommendedModal, setNotRecommendedModal] = useState<{
    show: boolean
    tableId: string
    tableName: string
    recommendedTableName: string
  } | null>(null)

  const handleCancelWaitlist = async (entryId: string) => {
    const reason = prompt('סיבת ביטול (אופציונלי):')
    if (reason === null) return // User clicked cancel

    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancellationReason: reason.trim() || undefined
        })
      })

      if (response.ok) {
        setSuccess('✓ ההרשמה בוטלה בהצלחה')
        setTimeout(() => {
          if (onAssign) {
            onAssign()
          } else {
            window.location.reload()
          }
        }, 1500)
      } else {
        const error = await response.json()
        setError(error.error || 'שגיאה בביטול ההרשמה')
      }
    } catch (err: any) {
      console.error('Cancel error:', err)
      setError('שגיאה בביטול ההרשמה')
    }
  }

  const handleAssignToTable = async (tableId: string, forceOverride = false, forceNotRecommended = false) => {
    if (!selectedEntry) return

    // Find the selected table to check its minimum order
    const selectedTable = selectedEntry.matchingTables.find(t => t.id === tableId)
    if (!selectedTable) return

    const guestCount = selectedEntry.guestsCount || 0

    // Check if this is NOT the recommended table and user hasn't confirmed yet
    const isRecommended = selectedEntry.bestTable?.id === tableId
    const hasRecommendation = selectedEntry.bestTable !== null

    // Show warning if:
    // 1. User selected a table that is NOT the recommended one, OR
    // 2. There is NO recommendation (bestTable is null) but there ARE available tables
    //    (this means the table is reserved for higher-priority entries)
    if (!forceNotRecommended && !forceOverride) {
      if (!isRecommended && hasRecommendation) {
        // Case 1: User selected non-recommended table when there IS a recommendation
        setNotRecommendedModal({
          show: true,
          tableId,
          tableName: selectedTable.tableNumber,
          recommendedTableName: selectedEntry.bestTable!.tableNumber
        })
        return
      } else if (!hasRecommendation && selectedEntry.matchingTables.length > 0) {
        // Case 2: No recommendation but tables are available (reserved for others)
        setNotRecommendedModal({
          show: true,
          tableId,
          tableName: selectedTable.tableNumber,
          recommendedTableName: '' // Will show different message
        })
        return
      }
    }

    // Check if guest count is below minimum and user hasn't confirmed yet
    if (guestCount < selectedTable.minOrder && !forceOverride) {
      // Show custom confirmation modal
      setConfirmationModal({
        show: true,
        tableId,
        tableName: selectedTable.tableNumber,
        guestCount,
        minOrder: selectedTable.minOrder
      })
      return
    }

    // Proceed with assignment
    await performAssignment(tableId, guestCount < selectedTable.minOrder)
  }

  const performAssignment = async (tableId: string, needsForce: boolean) => {
    if (!selectedEntry) return

    setAssigning(true)
    setError(null)
    setSuccess(null)
    setConfirmationModal(null)
    setNotRecommendedModal(null)

    try {
      const response = await fetch(
        `/api/events/${eventId}/waitlist/${selectedEntry.id}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId,
            force: needsForce
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign table')
      }

      setSuccess(`✓ שובץ לשולחן ${data.table.tableNumber}`)
      setSelectedEntry(null)

      // Reload page after 1.5 seconds to show updated state
      setTimeout(() => {
        if (onAssign) {
          onAssign()
        } else {
          window.location.reload()
        }
      }, 1500)
    } catch (err: any) {
      console.error('Assignment error:', err)
      setError(err.message || 'שגיאה בשיבוץ לשולחן')
    } finally {
      setAssigning(false)
    }
  }

  if (waitlist.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <ListOrdered className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">אין רשימת המתנה</h3>
        <p className="text-gray-600">כל השולחנות פנויים או כל ההזמנות אושרו</p>
      </div>
    )
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-medium">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Waitlist Entries */}
      <div className="space-y-3">
        {waitlist.map((entry) => (
          <div
            key={entry.id}
            className="relative overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
          >
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-transparent to-transparent pointer-events-none" />

            <div className="relative p-4">
              <div className="flex items-start gap-3 mb-3">
                {/* Priority Badge - Modernized */}
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 text-amber-700 font-bold rounded-xl text-sm flex-shrink-0 shadow-sm">
                  <div className="text-center">
                    <div className="text-[10px] leading-none text-amber-600">#</div>
                    <div className="text-base leading-none">{entry.waitlistPriority}</div>
                  </div>
                </div>

                {/* Guest Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-semibold text-gray-900 text-base truncate">
                      {(entry.data as any)?.name || 'לא צוין שם'}
                    </div>
                    {(entry.data as any)?.removedFromTable && (
                      <span className="flex-shrink-0 text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold border border-red-200">
                        הוסר משולחן
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {entry.guestsCount} {entry.guestsCount === 1 ? 'אורח' : 'אורחים'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{entry.confirmationCode}</span>
                    </div>
                    {entry.phoneNumber && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span dir="ltr" className="truncate">{entry.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Matching Tables Info + Action */}
              {entry.hasMatch ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-gray-100">
                  <div className="flex-1 bg-amber-50 rounded-lg px-3 py-2">
                    <div className="text-xs text-amber-700 font-medium mb-1">
                      ✨ {entry.matchingTables.length} שולחנות זמינים
                    </div>
                    {entry.bestTable && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-amber-600">מומלץ:</span>
                        <span className="text-sm font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                          #{entry.bestTable.tableNumber}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelWaitlist(entry.id)
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="בטל הרשמה"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-[0.98] transition-all font-medium text-sm whitespace-nowrap min-h-[40px]"
                    >
                      שבץ לשולחן
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
                    <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>אין שולחנות פנויים ({entry.guestsCount} מקומות נדרשים)</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCancelWaitlist(entry.id)
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="בטל הרשמה"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Table Selection Modal - Modernized */}
      {selectedEntry && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => {
            setSelectedEntry(null)
            setError(null)
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden p-6 border-b border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <h3 className="text-lg font-bold text-gray-900">
                  בחר שולחן עבור {(selectedEntry.data as any)?.name}
                </h3>
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {selectedEntry.guestsCount} אורחים
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {selectedEntry.matchingTables.length === 0 ? (
                <p className="text-center text-gray-500 py-12 text-sm">אין שולחנות פנויים מתאימים</p>
              ) : (
                selectedEntry.matchingTables.map((table) => {
                  const guestCount = selectedEntry.guestsCount || 0
                  const isBelowMinimum = guestCount < table.minOrder

                  return (
                    <button
                      key={table.id}
                      onClick={() => handleAssignToTable(table.id)}
                      disabled={assigning}
                      className={`w-full text-right p-4 border rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${
                        isBelowMinimum
                          ? 'border-amber-300 bg-amber-50/30 hover:border-amber-500 hover:bg-amber-50'
                          : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1 group-hover:text-purple-900 transition-colors flex items-center gap-2">
                            <span>שולחן {table.tableNumber}</span>
                            {isBelowMinimum && (
                              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                                ⚠️ מתחת למינימום
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            {table.capacity} מקומות · מינימום: {table.minOrder}
                          </div>
                        </div>
                        {table.id === selectedEntry.bestTable?.id && (
                          <span className="text-[10px] bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-2.5 py-1 rounded-full font-bold border border-amber-200">
                            מומלץ ✨
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => {
                  setSelectedEntry(null)
                  setError(null)
                }}
                disabled={assigning}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50 font-medium text-sm min-h-[44px]"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Not Recommended Table Modal */}
      {notRecommendedModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200"
          onClick={() => setNotRecommendedModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Warning Icon */}
            <div className="relative overflow-hidden p-6 border-b border-orange-100">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/50 to-transparent pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center border border-orange-200 shadow-sm">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    שולחן לא מומלץ
                  </h3>
                  <p className="text-sm text-orange-800 font-medium">
                    בחרת שולחן שאינו מומלץ לאורחים אלו
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Warning Message */}
              <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4">
                {notRecommendedModal.recommendedTableName ? (
                  // Case 1: There is a recommended table, but user chose a different one
                  <>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      השולחן המומלץ לאורחים אלו הוא{' '}
                      <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                        #{notRecommendedModal.recommendedTableName}
                      </span>
                      {' '}(התאמה אופטימלית).
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      בחרת את שולחן{' '}
                      <span className="font-bold text-gray-900">
                        #{notRecommendedModal.tableName}
                      </span>
                      {' '}שאינו האופציה הטובה ביותר.
                    </p>
                  </>
                ) : (
                  // Case 2: No recommendation (table reserved for higher-priority entries)
                  <>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">
                      ⚠️ שולחן זה מיועד לאורחים בעדיפות גבוהה יותר
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      שולחן{' '}
                      <span className="font-bold text-gray-900">
                        #{notRecommendedModal.tableName}
                      </span>
                      {' '}מתאים יותר לאורחים אחרים ברשימת ההמתנה שלפניהם בתור.
                    </p>
                    <p className="text-sm text-amber-800 mt-2 bg-amber-50 p-2 rounded">
                      💡 מומלץ להמתין עד שאורחים בעדיפות גבוהה יותר ישובצו תחילה.
                    </p>
                  </>
                )}
              </div>

              {/* Confirmation Question */}
              <p className="text-sm font-medium text-gray-700 text-center pt-2">
                האם אתה בטוח שברצונך לשבץ לשולחן זה?
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button
                onClick={() => setNotRecommendedModal(null)}
                disabled={assigning}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50 font-medium text-sm min-h-[48px] shadow-sm hover:shadow"
              >
                חזור אחורה
              </button>
              <button
                onClick={() => handleAssignToTable(notRecommendedModal.tableId, false, true)}
                disabled={assigning}
                className="flex-1 px-4 py-3 bg-gradient-to-br from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 active:scale-[0.98] transition-all disabled:opacity-50 font-bold text-sm min-h-[48px] shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400"
              >
                {assigning ? 'משבץ...' : 'אישור ושיבוץ בכל זאת'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Below Minimum Assignment */}
      {confirmationModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200"
          onClick={() => setConfirmationModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Warning Icon */}
            <div className="relative overflow-hidden p-6 border-b border-amber-100">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50/50 to-transparent pointer-events-none" />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl flex items-center justify-center border border-amber-200 shadow-sm">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    שיבוץ מתחת למינימום
                  </h3>
                  <p className="text-sm text-amber-800 font-medium">
                    יש לאשר את השיבוץ
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Warning Message */}
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-gray-800 leading-relaxed">
                  כמות האורחים{' '}
                  <span className="font-bold text-amber-900">
                    ({confirmationModal.guestCount})
                  </span>{' '}
                  נמוכה ממינימום השולחן{' '}
                  <span className="font-bold text-amber-900">
                    ({confirmationModal.minOrder})
                  </span>.
                </p>
              </div>

              {/* Table Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-700">
                    {confirmationModal.tableName}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium">שולחן נבחר</p>
                  <p className="text-sm font-semibold text-gray-900">
                    שולחן מספר {confirmationModal.tableName}
                  </p>
                </div>
              </div>

              {/* Confirmation Question */}
              <p className="text-sm font-medium text-gray-700 text-center pt-2">
                האם אתה בטוח שברצונך לשבץ לשולחן זה?
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button
                onClick={() => setConfirmationModal(null)}
                disabled={assigning}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50 font-medium text-sm min-h-[48px] shadow-sm hover:shadow"
              >
                ביטול
              </button>
              <button
                onClick={() => performAssignment(confirmationModal.tableId, true)}
                disabled={assigning}
                className="flex-1 px-4 py-3 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 active:scale-[0.98] transition-all disabled:opacity-50 font-bold text-sm min-h-[48px] shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400"
              >
                {assigning ? 'משבץ...' : 'אישור ושיבוץ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

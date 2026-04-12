'use client'

import { Edit2, Trash2, ChevronUp, ChevronDown, Users, UserCheck, Ban, Copy, ArrowLeft, Plus } from 'lucide-react'
import { tableOccupiedSpots, tableRemainingSpots, type TableRegistration } from './table-helpers'

interface TableCardProps {
  table: {
    id: string
    tableNumber: string
    capacity: number
    minOrder: number
    status: 'AVAILABLE' | 'RESERVED' | 'INACTIVE'
    registrations: TableRegistration[]
  }
  hasWaitlistMatch?: boolean
  isSelected?: boolean
  onSelect?: (tableId: string, selected: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: (tableId: string) => void
  onCancel?: (reservationId: string) => void
  onToggleHold?: (tableId: string) => void
  onSwitchToWaitlist?: () => void
  onAddRegistration?: () => void
  onAddToTable?: (tableId: string) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  readOnly?: boolean
}

export default function TableCard({
  table,
  hasWaitlistMatch = false,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onCancel,
  onToggleHold,
  onSwitchToWaitlist,
  onAddRegistration,
  onAddToTable,
  onMoveUp,
  onMoveDown,
  readOnly = false
}: TableCardProps) {
  const occupied = tableOccupiedSpots(table)
  const remaining = tableRemainingSpots(table)
  // Status configuration
  const statusConfig = {
    RESERVED: {
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-700',
      icon: '🔴',
      label: 'תפוס'
    },
    AVAILABLE: hasWaitlistMatch
      ? {
          color: 'amber',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-500',
          textColor: 'text-amber-700',
          icon: '🟡',
          label: 'פנוי - יש התאמה'
        }
      : {
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500',
          textColor: 'text-green-700',
          icon: '🟢',
          label: 'פנוי'
        },
    INACTIVE: {
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-400',
      textColor: 'text-orange-700',
      icon: '🟠',
      label: 'רזרבה (מוחזק)'
    }
  }

  const status = statusConfig[table.status]

  return (
    <div
      className={`
        ${status.bgColor} ${status.borderColor}
        border-2 rounded-lg p-4 transition-all relative
        ${table.status === 'INACTIVE' ? 'opacity-60' : ''}
        ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
      `}
      dir="rtl"
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(table.id, e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">
            שולחן {table.tableNumber}
          </h3>
          <div className={`text-sm font-medium ${status.textColor} flex items-center gap-1 mt-1`}>
            <span>{status.icon}</span>
            <span>{status.label}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="flex gap-1" dir="ltr">
            {onDuplicate && (
              <button
                onClick={() => onDuplicate(table.id)}
                className="p-2 hover:bg-white rounded transition-colors"
                aria-label="שכפל שולחן"
                title="שכפל"
              >
                <Copy className="w-4 h-4 text-purple-600" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-white rounded transition-colors"
                aria-label="ערוך שולחן"
                title="ערוך"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            )}
            {onDelete && table.registrations.length === 0 && (
              <button
                onClick={onDelete}
                className="p-2 hover:bg-white rounded transition-colors"
                aria-label="מחק שולחן"
                title="מחק"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Capacity Info */}
      <div className="mb-3 space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Users className="w-4 h-4" />
          <span>
            עד {table.capacity} {table.capacity === 1 ? 'אורח' : 'אורחים'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <UserCheck className="w-4 h-4" />
          <span>
            מינימום: {table.minOrder} {table.minOrder === 1 ? 'אורח' : 'אורחים'}
          </span>
        </div>
      </div>

      {/* Toggle Hold/Reserve Button (for AVAILABLE or INACTIVE tables without actual reservations) */}
      {!readOnly && onToggleHold && table.status !== 'RESERVED' && table.registrations.length === 0 && (
        <button
          onClick={() => onToggleHold(table.id)}
          className={`w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            table.status === 'INACTIVE'
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          {table.status === 'INACTIVE' ? (
            <>
              <Users className="w-4 h-4" />
              <span>שחרר שולחן</span>
            </>
          ) : (
            <>
              <Ban className="w-4 h-4" />
              <span>סמן כרזרבה</span>
            </>
          )}
        </button>
      )}

      {/* Registrations — supports multiple per table (sharing model) */}
      {table.registrations.length > 0 && (
        <div className="space-y-2 mb-3">
          {table.registrations.length > 1 && (
            <div className="text-xs font-medium text-gray-600 px-1">
              {table.registrations.length} הזמנות / {occupied} אורחים
            </div>
          )}
          {table.registrations.map((reg) => (
            <div key={reg.id} className="bg-white rounded-md p-3 text-sm space-y-1">
              {(reg.data as any)?.name && (
                <div className="font-semibold text-gray-900">{(reg.data as any).name}</div>
              )}
              <div className="text-xs text-gray-500">קוד: {reg.confirmationCode}</div>
              {reg.guestsCount != null && (
                <div className="text-gray-700">אורחים: {reg.guestsCount}</div>
              )}
              {reg.phoneNumber && (
                <div className="text-gray-600">טלפון: {reg.phoneNumber}</div>
              )}
              {!readOnly && onCancel && (
                <button
                  onClick={() => onCancel(reg.id)}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <Ban className="w-4 h-4" />
                  <span>הסר מהשולחן</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add registration button — shown when table has remaining capacity */}
      {!readOnly && onAddRegistration && table.status !== 'INACTIVE' && remaining > 0 && (
        <button
          onClick={onAddRegistration}
          className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>הוסף הזמנה</span>
        </button>
      )}
      {/* onAddToTable button — alternative handler via tableId */}
      {!readOnly && onAddToTable && !onAddRegistration && table.status !== 'INACTIVE' && (
        <button
          onClick={() => onAddToTable(table.id)}
          className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>הוסף הזמנה</span>
        </button>
      )}

      {/* Waitlist Match Badge — clickable when handler available */}
      {hasWaitlistMatch && table.status === 'AVAILABLE' && (
        onSwitchToWaitlist ? (
          <button
            onClick={onSwitchToWaitlist}
            className="w-full mb-3 group flex items-center justify-between gap-2 px-3 py-2.5 bg-amber-100 hover:bg-amber-200 active:scale-[0.98] border border-amber-300 hover:border-amber-400 rounded-md text-xs text-amber-800 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1"
            aria-label="עבור לרשימת המתנה לשיבוץ"
          >
            <div className="flex items-center gap-1.5">
              <span>✨</span>
              <span className="font-medium">יש אורחים ברשימת המתנה שמתאימים</span>
            </div>
            <ArrowLeft className="w-3.5 h-3.5 flex-shrink-0 opacity-60 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all duration-150" />
          </button>
        ) : (
          <div className="bg-amber-100 border border-amber-300 rounded-md p-2 text-xs text-amber-800 mb-3">
            <div className="flex items-center gap-1">
              <span>✨</span>
              <span className="font-medium">יש אורחים ברשימת המתנה שמתאימים לשולחן זה</span>
            </div>
          </div>
        )
      )}

      {/* Reorder Buttons */}
      {!readOnly && (onMoveUp || onMoveDown) && (
        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-200" dir="ltr">
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
              aria-label="הזז למעלה"
            >
              <ChevronUp className="w-4 h-4" />
              <span>למעלה</span>
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
              aria-label="הזז למטה"
            >
              <ChevronDown className="w-4 h-4" />
              <span>למטה</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
